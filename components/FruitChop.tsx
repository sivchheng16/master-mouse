import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface Fruit {
    id: number;
    emoji: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    scale: number;
    chopped: boolean;
    type: string;
    isBomb?: boolean;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    emoji: string;
    life: number;
    rotation: number;
}

interface BladePoint {
    x: number;
    y: number;
    timestamp: number;
}

const FRUIT_TYPES = [
    { emoji: '🥭', pieces: ['🟡', '🟠'] },
    { emoji: '🍍', pieces: ['🟡', '🟤'] },
    { emoji: '🍉', pieces: ['🔴', '🟢'] },
    { emoji: '🍌', pieces: ['🟡', '⬜'] },
    { emoji: '🥥', pieces: ['🟤', '⬜'] },
    { emoji: '🍑', pieces: ['🟠', '🟡'] },
    { emoji: '🍎', pieces: ['🔴', '⚪'] },
    { emoji: '🥝', pieces: ['🥝', '🟤'] },
];

export const FruitChop: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 10 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;

    // Game State
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [bladePath, setBladePath] = useState<BladePoint[]>([]);
    const [score, setScore] = useState(0);
    const [missed, setMissed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [combo, setCombo] = useState(0);
    const [bombExploded, setBombExploded] = useState(false);
    // Removed cursorPos state, now using ref for performance

    // Refs
    const frameRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const boardRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null); // Direct DOM cursor access

    const targetScore = count + (round - 1) * 5;

    // Reset round
    const initRound = () => {
        setFruits([]);
        setParticles([]);
        setBladePath([]);
        setScore(0);
        scoreRef.current = 0;
        setMissed(0);
        setCombo(0);
        lastSpawnRef.current = Date.now();
    };

    useEffect(() => {
        if (!showLevelUp) initRound();
    }, [round, showLevelUp]);

    // Game Loop
    // Game Loop
    useEffect(() => {
        if (showLevelUp || bombExploded) return;

        const updateGame = () => {
            const now = Date.now();

            // Spawn Logic
            if (now - lastSpawnRef.current > (2500 - round * 400) && scoreRef.current < targetScore) {
                spawnFruit();
                lastSpawnRef.current = now;
            }

            // Update Fruits
            setFruits(prev => {
                const nextFruits = [];
                for (const fruit of prev) {
                    // Slower physics
                    fruit.x += fruit.vx;
                    fruit.y += fruit.vy;
                    fruit.vy += 0.08;
                    fruit.rotation += fruit.rotationSpeed;

                    // Remove if out of bounds (below board)
                    if (fruit.y > 110) {
                        if (!fruit.chopped && fruit.vy > 0) {
                            setMissed(m => m + 1);
                            setCombo(0);
                        }
                    } else {
                        nextFruits.push(fruit);
                    }
                }
                return nextFruits;
            });

            // Update Particles (Slower fall)
            setParticles(prev => prev
                .map(p => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    vy: p.vy + 0.1,
                    rotation: p.rotation + p.vx * 2,
                    life: p.life - 0.01
                }))
                .filter(p => p.life > 0)
            );

            // Update Blade Trail
            setBladePath(prev => prev.filter(p => now - p.timestamp < 300));

            checkCollisions();

            if (scoreRef.current >= targetScore) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 500);
                }
                return; // Stop loop
            }

            frameRef.current = requestAnimationFrame(updateGame);
        };

        frameRef.current = requestAnimationFrame(updateGame);
        return () => cancelAnimationFrame(frameRef.current);
    }, [round, showLevelUp, targetScore]);

    const spawnFruit = () => {
        // 20% Chance for Bomb
        const isBomb = Math.random() < 0.2;

        let type, emoji, pieces;

        if (isBomb) {
            emoji = '💣';
            pieces = ['💥', '💨'];
            type = { emoji: '💣', pieces }; // Mock type structure
        } else {
            type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
            emoji = type.emoji;
            pieces = type.pieces;
        }

        const startX = 20 + Math.random() * 60;
        const startY = 100; // Bottom of board
        const dirX = startX < 50 ? (0.1 + Math.random() * 0.2) : -(0.1 + Math.random() * 0.2);
        const vy = -(3.2 + Math.random() * 1.0);

        const newFruit: Fruit = {
            id: Date.now() + Math.random(),
            emoji: emoji,
            x: startX,
            y: startY,
            vx: dirX,
            vy,
            rotation: 0,
            rotationSpeed: (Math.random() * 4 - 2),
            scale: isBomb ? 1.2 : (0.8 + Math.random() * 0.4),
            chopped: false,
            type: JSON.stringify(pieces),
            isBomb
        };
        setFruits(prev => [...prev, newFruit]);

        const audio = new Audio('/sounds/throw.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => { });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate relative coordinates 0-100%
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        setBladePath(prev => [...prev, { x, y, timestamp: Date.now() }]);

        // Direct DOM update for zero-lag cursor
        if (cursorRef.current) {
            cursorRef.current.style.left = `${x}%`;
            cursorRef.current.style.top = `${y}%`;
            cursorRef.current.style.opacity = '1';
        }
    };

    const checkCollisions = () => {
        setBladePath(path => {
            if (path.length < 2) return path;
            const lastPoint = path[path.length - 1];

            let gameOverTriggered = false;

            setFruits(currentFruits => {
                let hasChop = false;
                const nextFruits = currentFruits.map(fruit => {
                    if (fruit.chopped || gameOverTriggered) return fruit;

                    const dx = lastPoint.x - fruit.x;
                    const dy = lastPoint.y - fruit.y;
                    const ratio = (boardRef.current?.offsetHeight || 1) / (boardRef.current?.offsetWidth || 1);
                    const distance = Math.sqrt(dx * dx + dy * dy * ratio);

                    if (distance < (fruit.isBomb ? 8 : 5)) {
                        if (fruit.isBomb) {
                            gameOverTriggered = true;
                            return { ...fruit, chopped: true };
                        }

                        hasChop = true;
                        createChopEffect(fruit);
                        return { ...fruit, chopped: true };
                    }
                    return fruit;
                });

                if (gameOverTriggered) {
                    handleBombHit();
                    return [];
                }

                if (hasChop) {
                    audioService.playPop();
                    setScore(s => {
                        const newScore = s + 1;
                        scoreRef.current = newScore;
                        return newScore;
                    });
                    setCombo(c => c + 1);
                }

                return nextFruits.filter(f => !f.chopped);
            });

            return path;
        });
    };

    const handleBombHit = () => {
        audioService.playPop(); // Ideally replace with explosion sound
        setBombExploded(true);

        // Visual Shake
        if (boardRef.current) {
            boardRef.current.animate([
                { transform: 'translate(0, 0)' },
                { transform: 'translate(-10px, 10px)' },
                { transform: 'translate(10px, -10px)' },
                { transform: 'translate(0, 0)' }
            ], { duration: 500 });
        }

        // Wait 5 seconds before resetting
        setTimeout(() => {
            setBombExploded(false);
            initRound();
        }, 5000);
    };

    const createChopEffect = (fruit: Fruit) => {
        const pieces = JSON.parse(fruit.type);
        const newParticles: Particle[] = [
            {
                id: Date.now() + 1,
                x: fruit.x,
                y: fruit.y,
                vx: -0.5 - Math.random() * 0.5,
                vy: -0.5,
                emoji: pieces[0] || '❓',
                life: 1,
                rotation: fruit.rotation
            },
            {
                id: Date.now() + 2,
                x: fruit.x,
                y: fruit.y,
                vx: 0.5 + Math.random() * 0.5,
                vy: -0.5,
                emoji: pieces[1] || '❓',
                life: 1,
                rotation: fruit.rotation
            }
        ];

        for (let i = 0; i < 3; i++) {
            newParticles.push({
                id: Date.now() + 10 + i,
                x: fruit.x,
                y: fruit.y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                emoji: '💧',
                life: 0.6,
                rotation: Math.random() * 360
            });
        }

        setParticles(prev => [...prev, ...newParticles]);
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => {
            setShowLevelUp(false);
            setRound(r => r + 1);
        }, 2000);
    };

    const getBladePathString = () => {
        if (bladePath.length < 2) return '';
        return `M ${bladePath.map(p => `${p.x},${p.y}`).join(' L ')}`;
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden select-none cursor-none">
            {/* FULL SCREEN BACKGROUND DECORATION (Optional) */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50 pointer-events-none" />

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="អូសកាត់ផ្លែឈើ! 🔪"
                score={score}
                goal={targetScore}
            />

            {/* --- GAME BOARD CONTAINER --- */}
            <div
                ref={boardRef}
                className="relative w-[90%] h-[80%] rounded-[3rem] border-8 border-gray-700 shadow-2xl overflow-hidden cursor-none touch-none"
                style={{
                    background: 'linear-gradient(to top, #111827, #1f2937)', // Black/Gray gradient
                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                }}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
            >
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Fruits */}
                {fruits.map(fruit => (
                    <div
                        key={fruit.id}
                        className="absolute text-7xl drop-shadow-2xl pointer-events-none z-10"
                        style={{
                            left: `${fruit.x}%`,
                            top: `${fruit.y}%`,
                            transform: `translate(-50%, -50%) rotate(${fruit.rotation}deg) scale(${fruit.scale})`,
                            transition: 'transform 0.1s linear'
                        }}
                    >
                        {fruit.emoji}
                    </div>
                ))}

                {/* Particles */}
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute pointer-events-none z-20"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                            opacity: p.life,
                            fontSize: p.emoji === '💧' ? '2rem' : '4rem'
                        }}
                    >
                        {p.emoji}
                    </div>
                ))}

                {/* Blade Trail - Enhanced "Energy Blade" */}
                {bladePath.length > 1 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Outer Glow (Cyan) - Thicker and softer */}
                        <path
                            d={getBladePathString()}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ opacity: 0.8, filter: 'blur(6px)' }}
                        />

                        {/* Middle Glow (Cyan) - Sharper */}
                        <path
                            d={getBladePathString()}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Inner Core (White) - Sharp */}
                        <path
                            d={getBladePathString()}
                            fill="none"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}

                {/* Blade Tip Spark - Sharp Glowing Dot */}
                <div
                    ref={cursorRef}
                    className="absolute pointer-events-none z-50 w-3 h-3 bg-white rounded-full mix-blend-screen"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 10px 4px #22d3ee, 0 0 20px 10px rgba(6, 182, 212, 0.5)',
                        opacity: 0,
                        transition: 'opacity 0.1s',
                        willChange: 'left, top'
                    }}
                />

                {/* Combo Text */}
                {combo > 1 && (
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-6xl font-black text-yellow-400 animate-bounce drop-shadow-lg z-40 transform -rotate-12 border-text">
                        {combo} COMBO!
                    </div>
                )}
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-400 text-center">
                        <h2 className="title-font text-6xl text-amber-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-2xl font-black text-gray-800">ល្អណាស់! 🗡️</p>
                    </div>
                </div>
            )}

            {/* Bomb Explosion Overlay */}
            {bombExploded && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm z-[100] animate-in fade-in duration-300">
                    <div className="text-center transform scale-150">
                        <div className="text-[150px] animate-bounce">💥</div>
                        <h2 className="title-font text-6xl text-white mt-4 drop-shadow-lg animate-pulse">ប្រយ័ត្នគ្រាប់បែក!</h2>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && score >= targetScore && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-gray-900 p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-400 text-center text-white">
                        <h2 className="title-font text-6xl text-yellow-400 animate-bounce mb-6">ជ័យជំនះ! 🏆</h2>
                        <div className="flex justify-center gap-4 text-6xl">
                            <span className="animate-pulse">🥭</span>
                            <span className="animate-bounce">🗡️</span>
                            <span className="animate-pulse">🍉</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .border-text {
                    text-shadow: 
                        2px 2px 0 #000,
                        -2px -2px 0 #000,
                        2px -2px 0 #000,
                        -2px 2px 0 #000;
                }
            `}</style>
        </div>
    );
};
