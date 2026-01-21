import React, { useState, useEffect, useRef, useMemo } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface PalmFruit {
    y: number;
    collected: boolean;
    id: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    emoji: string;
}

export const PalmClimb: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [climberY, setClimberY] = useState(85); // 0-100% (85 is bottom)
    const [fruits, setFruits] = useState<PalmFruit[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [collected, setCollected] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    // Animation State
    const [climbingDirection, setClimbingDirection] = useState<0 | 1 | -1>(0);
    const climbTimeoutRef = useRef<NodeJS.Timeout>();
    const containerRef = useRef<HTMLDivElement>(null);

    const numFruits = 3 + round;

    // --- CURVE LOGIC ---
    // Calculates X offset (0-100%) based on Y position (0-100%)
    // Returns the center X of the trunk.
    const getTrunkX = (yPct: number) => {
        // Curve Formula: Gentle 'S' or 'C' lean
        // Normalize y: 0 (top) to 1 (bottom)
        const y = yPct / 100;
        // Reduced amplitude for a taller, more elegant look
        // Curve: 50 + sin(y * PI) * 5 - (1-y) * 10;
        return 50 + Math.sin(y * Math.PI) * 5 - (1 - y) * 10;
    };

    const TREE_TOP_Y = 18; // Top of the trunk (18% down) to clear HUD

    useEffect(() => {
        if (!showLevelUp) {
            setClimberY(85);
            setCollected(0);
            setParticles([]);
            const newFruits: PalmFruit[] = Array.from({ length: numFruits }).map((_, i) => {
                // Distribute fruits from TREE_TOP_Y + padding down to 75%
                const availableHeight = 75 - (TREE_TOP_Y + 5);
                const y = (TREE_TOP_Y + 5) + (i * (availableHeight / numFruits));
                return {
                    id: i,
                    y: y,
                    collected: false,
                };
            });
            setFruits(newFruits);
        }
    }, [round, showLevelUp, numFruits]);

    // Particle Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                vy: p.vy + 0.5,
                life: p.life - 0.05
            })).filter(p => p.life > 0));
        }, 30);
        return () => clearInterval(interval);
    }, []);

    const spawnParticles = (x: number, y: number) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 8; i++) {
            newParticles.push({
                id: Date.now() + i,
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 - 1,
                life: 1.0,
                emoji: ['✨', '🥥', '💧', '⭐'][Math.floor(Math.random() * 4)]
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
    };

    const handleScroll = (e: React.WheelEvent) => {
        e.preventDefault();

        const newDir = e.deltaY < 0 ? 1 : -1;
        setClimbingDirection(newDir);

        if (climbTimeoutRef.current) clearTimeout(climbTimeoutRef.current);
        climbTimeoutRef.current = setTimeout(() => setClimbingDirection(0), 100);

        const moveAmount = e.deltaY * 0.05;
        // Limit climber to TREE_TOP_Y
        const newY = Math.max(TREE_TOP_Y, Math.min(85, climberY + moveAmount));
        setClimberY(newY);

        // Check collisions
        fruits.forEach((fruit) => {
            if (!fruit.collected && Math.abs(climberY - fruit.y) < 5) {
                audioService.playPop();
                spawnParticles(getTrunkX(fruit.y), fruit.y);

                setFruits(prev => prev.map(f => f.id === fruit.id ? { ...f, collected: true } : f));

                const newCollected = collected + 1;
                setCollected(newCollected);

                if (newCollected === numFruits) {
                    if (round < totalRounds) {
                        handleRoundComplete();
                    } else {
                        setTimeout(() => { audioService.playSuccess(); onComplete(); }, 800);
                    }
                }
            }
        });
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => { setShowLevelUp(false); setRound(r => r + 1); }, 2000);
    };

    // Generate Path String for SVG Trunk
    const generateTrunkPath = () => {
        let path = "";
        const steps = 40;
        const startStep = Math.floor((TREE_TOP_Y / 100) * steps); // Start drawing from TREE_TOP_Y

        // Right Side
        for (let i = startStep; i <= steps; i++) {
            const yPct = (i / steps) * 100; // 0 to 100
            const x = getTrunkX(yPct);
            // THINNER TRUNK: 4% base + up to 3% taper -> much slender
            const width = 4 + (yPct / 100) * 3;
            const xRight = x + width / 2;
            const yCoord = yPct;

            if (i === startStep) path += `M ${xRight} ${yCoord} `;
            else path += `L ${xRight} ${yCoord} `;
        }
        // Left Side
        for (let i = steps; i >= startStep; i--) {
            const yPct = (i / steps) * 100;
            const x = getTrunkX(yPct);
            const width = 4 + (yPct / 100) * 3;
            const xLeft = x - width / 2;
            path += `L ${xLeft} ${yPct} `;
        }
        path += "Z";
        return path;
    };

    // Decoration: Clouds
    const clouds = useMemo(() => [
        { top: '10%', scale: 1.5, duration: '25s', delay: '0s' },
        { top: '30%', scale: 1.0, duration: '35s', delay: '-10s' },
        { top: '15%', scale: 0.8, duration: '40s', delay: '-5s' },
    ], []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none font-sans"
            onWheel={handleScroll}
        >
            {/* 1. Sky Background - Premium Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-300 via-sky-100 to-amber-50" />

            {/* 2. Clouds */}
            {clouds.map((cloud, i) => (
                <div
                    key={i}
                    className="absolute opacity-80"
                    style={{
                        top: cloud.top,
                        transform: `scale(${cloud.scale})`,
                        animation: `float-cloud ${cloud.duration} linear infinite`,
                        animationDelay: cloud.delay
                    }}
                >
                    <div className="h-12 w-32 bg-white/80 rounded-full relative blur-[2px]">
                        <div className="absolute -top-6 left-4 w-12 h-12 bg-white/80 rounded-full" />
                        <div className="absolute -top-8 left-12 w-16 h-16 bg-white/80 rounded-full" />
                    </div>
                </div>
            ))}

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="រមូរដើម្បីឡើង! 🥥"
                score={collected}
                goal={numFruits}
            />

            {/* 3. Ocean/Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-teal-500/10 blur-xl" />
                {/* Sand - Softer Color */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full fill-[#f3e5ab]">
                    <path d="M0,80 Q30,65 60,80 T100,75 V100 H0 Z" />
                </svg>
            </div>

            {/* 4. The TRUNK (SVG) - Lighter & Cleaner */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        {/* Texture Pattern - Softer */}
                        <pattern id="bark" title="Bark" width="4" height="4" patternUnits="userSpaceOnUse">
                            <rect width="4" height="4" fill="#a8a29e" /> {/* Stone-400 Base */}
                            <path d="M0 2 H4 M 2 0 V 4" stroke="#78716c15" strokeWidth="0.5" opacity="0.3" /> {/* Stone-500 Texture */}
                        </pattern>
                        <filter id="trunk-shade">
                            <feGaussianBlur stdDeviation="1" in="SourceAlpha" result="blur" />
                            <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.5" specularExponent="20" lightingColor="#ffffff" result="specOut">
                                <fePointLight x="0" y="0" z="200" />
                            </feSpecularLighting>
                            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                        </filter>
                    </defs>

                    {/* Shadow Layer */}
                    <path d={generateTrunkPath()} fill="black" opacity="0.1" transform="translate(3,0)" />

                    {/* Main Trunk */}
                    <path d={generateTrunkPath()} fill="url(#bark)" stroke="#57534e" strokeWidth="0.5" />

                    {/* Ridge Lines - Subtle */}
                    {Array.from({ length: 40 }).map((_, i) => {
                        const y = i * 2.5;
                        if (y < TREE_TOP_Y) return null;
                        const x = getTrunkX(y);
                        return <path key={i} d={`M ${x - 2} ${y} Q ${x} ${y + 1} ${x + 2} ${y}`} stroke="rgba(0,0,0,0.15)" strokeWidth="0.2" fill="none" />
                    })}
                </svg>
            </div>

            {/* 5. Fruits (Attached to Trunk Curve - Adjusted for Emoji) */}
            {fruits.map((fruit) => {
                const x = getTrunkX(fruit.y);
                const sideOffset = fruit.id % 2 === 0 ? -2 : 2;

                return (
                    <div
                        key={fruit.id}
                        className={`absolute z-20 transition-all duration-300 ${fruit.collected ? 'opacity-0 scale-0' : 'animate-pulse-slow'}`}
                        style={{
                            left: `${x + sideOffset}%`,
                            top: `${fruit.y}%`,
                            transform: 'translate(-50%, -50%)',
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
                        }}
                    >
                        <div className="text-3xl md:text-4xl contrast-125">🥥</div>
                    </div>
                );
            })}

            {/* 6. Climber (Follows Trunk Curve) */}
            <div
                className="absolute z-30 transition-all duration-100 ease-out will-change-top"
                style={{
                    top: `${climberY}%`,
                    left: `${getTrunkX(climberY)}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className={`text-5xl md:text-6xl transition-transform duration-200 
                    ${climbingDirection !== 0 ? 'scale-x-90 scale-y-110' : 'scale-100'}
                `} style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.6))' }}>
                    🧗
                </div>
            </div>

            {/* 7. Canopy (Coconut Feather Leaves) */}
            <div
                className="absolute w-[380px] h-[380px] pointer-events-none z-2 flex justify-center items-center"
                style={{
                    left: `${getTrunkX(TREE_TOP_Y)}%`,
                    top: `${TREE_TOP_Y - 15}%`,
                    transform: 'translateX(-50%)'
                }}
            >
                {/* FEATHER LEAF SVG DEFINITION */}
                <svg className="hidden">
                    <symbol id="feather-leaf" viewBox="0 0 100 200" preserveAspectRatio="none">
                        <path d="M50 200 Q50 100 0 50" stroke="#1f2937ff" strokeWidth="2" fill="none" opacity="0.3" />
                        <path d="M50 200 Q50 100 100 50" stroke="#1f2937" strokeWidth="2" fill="none" opacity="0.3" />
                        <path d="M50 200 Q45 150 10 50 L50 0 L90 50 Q55 150 50 200 Z" fill="currentColor" />
                    </symbol>
                </svg>

                <div className="relative w-full h-full animate-sway-slow origin-center">
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full z-10" />

                    {/* Lower Drooping Leaves */}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                        <div
                            key={`drop-${i}`}
                            className="absolute top-1/2 left-1/2 w-16 h-48 text-[#334d2b]"
                            style={{
                                transform: `translate(-50%, 0) rotate(${deg}deg) rotateX(40deg)`,
                                transformOrigin: 'top center',
                            }}
                        >
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <path d="M50 0 Q60 50 10 90 L50 100 L90 90 Q40 50 50 0" fill="currentColor" />
                            </svg>
                        </div>
                    ))}

                    {/* Main Spreading Leaves */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const deg = i * 30;
                        return (
                            <div
                                key={`main-${i}`}
                                className="absolute top-1/2 left-1/2 w-20 h-56 text-[#4a7a38]"
                                style={{
                                    transform: `translate(-50%, -10px) rotate(${deg + 15}deg)`,
                                    transformOrigin: 'top center',
                                }}
                            >
                                <svg className="w-full h-full" viewBox="0 0 100 200" preserveAspectRatio="none">
                                    <path d="M50 0 C 60 40, 90 120, 90 180 L 50 200 L 10 180 C 10 120, 40 40, 50 0 Z" fill="currentColor" />
                                    <path d="M50 0 L 50 200" stroke="#2d4a22" strokeWidth="1" />
                                </svg>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div
                className="absolute w-[380px] h-[380px] pointer-events-none z-31 flex justify-center items-center"
                style={{
                    left: `${getTrunkX(TREE_TOP_Y)}%`,
                    top: `${TREE_TOP_Y - 15}%`,
                    transform: 'translateX(-50%)'
                }}
            >
                {/* FEATHER LEAF SVG DEFINITION */}
                <svg className="hidden">
                    <symbol id="feather-leaf" viewBox="0 0 100 200" preserveAspectRatio="none">
                        <path d="M50 200 Q50 100 0 50" stroke="#1f2937ff" strokeWidth="2" fill="none" opacity="0.3" />
                        <path d="M50 200 Q50 100 100 50" stroke="#1f2937" strokeWidth="2" fill="none" opacity="0.3" />
                        <path d="M50 200 Q45 150 10 50 L50 0 L90 50 Q55 150 50 200 Z" fill="currentColor" />
                    </symbol>
                </svg>

                <div className="relative w-full h-full animate-sway-slow origin-center">
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full z-10" />

                    {/* Lower Drooping Leaves */}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                        <div
                            key={`drop-${i}`}
                            className="absolute top-1/2 left-1/2 w-16 h-48 text-[#334d2b]"
                            style={{
                                transform: `translate(-50%, 0) rotate(${deg}deg) rotateX(40deg)`,
                                transformOrigin: 'top center',
                            }}
                        >
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <path d="M50 0 Q60 50 10 90 L50 100 L90 90 Q40 50 50 0" fill="currentColor" />
                            </svg>
                        </div>
                    ))}

                    {/* Main Spreading Leaves */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const deg = i * 30;
                        return (
                            <div
                                key={`main-${i}`}
                                className="absolute top-1/2 left-1/2 w-20 h-56 text-[#4a7a38]"
                                style={{
                                    transform: `translate(-50%, -10px) rotate(${deg + 15}deg)`,
                                    transformOrigin: 'top center',
                                }}
                            >
                                <svg className="w-full h-full" viewBox="0 0 100 200" preserveAspectRatio="none">
                                    <path d="M50 0 C 60 40, 90 120, 90 180 L 50 200 L 10 180 C 10 120, 40 40, 50 0 Z" fill="currentColor" />
                                    <path d="M50 0 L 50 200" stroke="#2d4a22" strokeWidth="1" />
                                </svg>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute z-40 pointer-events-none text-2xl"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: `translate(-50%, -50%)`,
                        opacity: p.life
                    }}
                >
                    {p.emoji}
                </div>
            ))}

            {/* Level Up UI */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-green-500 text-center transform scale-110">
                        <h2 className="title-font text-6xl text-green-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                    </div>
                </div>
            )}

            {/* Game Complete UI */}
            {collected >= numFruits && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-400 text-center">
                        <h2 className="title-font text-6xl text-yellow-500 animate-bounce mb-6">ជោគជ័យ! 🎉</h2>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes float-cloud {
                    from { left: -20%; }
                    to { left: 120%; }
                }
                @keyframes sway-slow {
                    0%, 100% { transform: rotate(-2deg); }
                    50% { transform: rotate(2deg); }
                }
                .animate-sway-slow {
                    animation: sway-slow 5s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};
