
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

interface Position {
    x: number;
    y: number;
}

// Grid Size
const GRID_SIZE = 20;
const CELL_SIZE = 25; // Adjusted for better visibility

// Level Config
const LEVELS = [
    { id: 1, speed: 200, target: 5, name: 'កម្រិត ១: ចាប់ផ្តើម' },
    { id: 2, speed: 150, target: 10, name: 'កម្រិត ២: លឿនជាងមុន' },
    { id: 3, speed: 100, target: 15, name: 'កម្រិត ៣: កំពូលអ្នកលេង' },
];

export const SnakeGame: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete }) => {
    // Game State
    const [level, setLevel] = useState(1);
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Position>({ x: 5, y: 5 });
    const [direction, setDirection] = useState<Position>({ x: 1, y: 0 }); // Moving Right initially
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'gameover' | 'level_complete' | 'won'>('playing');

    // Refs for mutable state in the loop
    const directionRef = useRef<Position>({ x: 1, y: 0 });
    const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLevelConfig = LEVELS[level - 1];

    // --- GAME LOGIC ---

    const spawnFood = useCallback((currentSnake: Position[]) => {
        let newFood: Position;
        let isCollision;
        do {
            isCollision = false;
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            // Check if food spawns on snake
            for (const segment of currentSnake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    isCollision = true;
                    break;
                }
            }
        } while (isCollision);
        setFood(newFood);
    }, []);

    const resetLevel = useCallback((lvl: number) => {
        setSnake([{ x: 10, y: 10 }]);
        snakeRef.current = [{ x: 10, y: 10 }];
        setDirection({ x: 1, y: 0 });
        directionRef.current = { x: 1, y: 0 };
        setScore(0);
        setGameState('playing');
        spawnFood([{ x: 10, y: 10 }]);
    }, [spawnFood]);

    const gameOver = () => {
        setGameState('gameover');
        audioService.playError();
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };

    const handleWin = () => {
        setGameState('won');
        audioService.playSuccess();
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        setTimeout(onComplete, 2000);
    };

    const handleLevelComplete = useCallback(() => {
        setGameState('level_complete');
        audioService.playSuccess();
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);

        setTimeout(() => {
            if (level < LEVELS.length) {
                setLevel(l => l + 1);
            } else {
                handleWin();
            }
        }, 2000);
    }, [level]);

    // Use Effect for handling level changes state after timeout
    useEffect(() => {
        if (gameState === 'level_complete') {
            const timer = setTimeout(() => {
                if (level <= LEVELS.length && gameState !== 'won') {
                    resetLevel(level);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [level, gameState, resetLevel]);


    const moveSnake = useCallback(() => {
        if (gameState !== 'playing') return;

        const head = snakeRef.current[0];
        const newHead = {
            x: head.x + directionRef.current.x,
            y: head.y + directionRef.current.y
        };

        // 1. Check Wall Collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            gameOver();
            return;
        }

        // 2. Check Self Collision
        for (const segment of snakeRef.current) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                gameOver();
                return;
            }
        }

        // 3. Move
        const newSnake = [newHead, ...snakeRef.current];

        // 4. Check Food
        if (newHead.x === food.x && newHead.y === food.y) {
            audioService.playPop();
            const newScore = score + 1;
            setScore(newScore);

            if (newScore >= currentLevelConfig.target) {
                handleLevelComplete();
                return; // Stop processing grid logic
            }

            spawnFood(newSnake);
            // Don't pop the tail, so it grows
        } else {
            newSnake.pop(); // Remove tail
        }

        snakeRef.current = newSnake;
        setSnake(newSnake);
    }, [food, score, currentLevelConfig, gameState, handleLevelComplete, spawnFood]);

    // --- GAME LOOP ---
    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = setInterval(moveSnake, currentLevelConfig.speed);
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameState, level, moveSnake, currentLevelConfig.speed]);


    // --- MOUSE CONTROL ---
    const handleMouseMove = (e: React.MouseEvent) => {
        if (gameState !== 'playing' || !containerRef.current) return;

        // Get Grid Center relative to viewport
        // Ideally we want direction relative to the SNAKE HEAD
        // But for standard grid snake, usually 4 directions.
        // Let's implement relative to snake head for intuitive "follow" feel.

        const rect = containerRef.current.getBoundingClientRect();

        // Calculate Grid rendering offsets (centering the grid in the div)
        // The grid is GRID_SIZE * CELL_SIZE px wide/high
        const gridPixelSize = GRID_SIZE * CELL_SIZE;
        const offsetX = (rect.width - gridPixelSize) / 2;
        const offsetY = (rect.height - gridPixelSize) / 2;

        // Snake Head Screen Position
        const head = snake[0];
        const headScreenX = rect.left + offsetX + (head.x * CELL_SIZE) + (CELL_SIZE / 2);
        const headScreenY = rect.top + offsetY + (head.y * CELL_SIZE) + (CELL_SIZE / 2);

        const dx = e.clientX - headScreenX;
        const dy = e.clientY - headScreenY;

        // Determine dominant axis
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal
            const newDirX = dx > 0 ? 1 : -1;
            // Prevent 180 degree turns
            if (directionRef.current.x !== -newDirX) {
                directionRef.current = { x: newDirX, y: 0 };
            }
        } else {
            // Vertical
            const newDirY = dy > 0 ? 1 : -1;
            if (directionRef.current.y !== -newDirY) {
                directionRef.current = { x: 0, y: newDirY };
            }
        }
    };

    // Safety check for init
    useEffect(() => {
        resetLevel(1);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none bg-stone-900"
            onMouseMove={handleMouseMove}
            style={{
                backgroundImage: 'url("temple-sunset.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            <GameHUD
                round={level}
                totalRounds={LEVELS.length}
                instruction={gameState === 'playing' ? "ដឹកនាំពស់ទៅរកចំណី! 🍎" : "បញ្ចប់!"}
                score={score}
                goal={currentLevelConfig.target}
            />

            {/* GAME BOARD */}
            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/30 border-4 border-stone-500/50 rounded-xl shadow-2xl backdrop-blur-sm"
                style={{
                    width: GRID_SIZE * CELL_SIZE,
                    height: GRID_SIZE * CELL_SIZE,
                }}
            >
                {/* Grid Lines (Optional, subtle) */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
                    }}
                />

                {/* FOOD */}
                <div
                    className="absolute transition-all duration-300 animate-bounce"
                    style={{
                        left: food.x * CELL_SIZE,
                        top: food.y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        fontSize: `${CELL_SIZE - 2}px`,
                        lineHeight: `${CELL_SIZE}px`,
                        textAlign: 'center'
                    }}
                >
                    🍎
                </div>

                {/* SNAKE */}
                {snake.map((segment, i) => {
                    const isHead = i === 0;
                    return (
                        <div
                            key={`${segment.x}-${segment.y}-${i}`}
                            className={`absolute rounded-sm transition-all duration-75 ${isHead ? 'z-10 bg-green-400 scale-110' : 'z-0 bg-green-600'}`}
                            style={{
                                left: segment.x * CELL_SIZE,
                                top: segment.y * CELL_SIZE,
                                width: CELL_SIZE - 2,
                                height: CELL_SIZE - 2,
                                margin: 1, // small gap between segments
                                boxShadow: isHead ? '0 0 10px #4ade80' : 'none',
                                borderRadius: isHead ? '50%' : '4px'
                            }}
                        >
                            {isHead && (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px]">
                                    👀
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* OVERLAYS */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 animate-in fade-in">
                    <div className="bg-white p-8 rounded-3xl text-center space-y-4 shadow-2xl border-4 border-red-500">
                        <h2 className="text-4xl font-black text-red-500">ចប់ហើយ! 😢</h2>
                        <button
                            onClick={() => resetLevel(level)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-xl transition-transform hover:scale-105"
                        >
                            លេងម្តងទៀត
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'level_complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 animate-in fade-in">
                    <div className="bg-white p-12 rounded-[3rem] text-center border-8 border-green-500 animate-in zoom-in">
                        <h2 className="text-6xl mb-4">🎉</h2>
                        <h3 className="text-4xl font-black text-green-600 mb-2">ឆ្លងកម្រិត!</h3>
                        <p className="text-xl text-gray-500 font-bold">កម្រិតបន្ទាប់...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
