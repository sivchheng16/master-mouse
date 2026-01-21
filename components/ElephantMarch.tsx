import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface PathPoint {
    x: number;
    y: number;
}

export const ElephantMarch: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [path, setPath] = useState<PathPoint[]>([]);
    const [elephantPos, setElephantPos] = useState({ x: 10, y: 50 });
    const [currentPointIndex, setCurrentPointIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const generatePath = (r: number) => {
        const points: PathPoint[] = [];
        const numPoints = 5 + r * 2; // More points in later rounds
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: 10 + (i / (numPoints - 1)) * 75,
                y: 35 + Math.sin(i * 0.8) * 20 + (Math.random() - 0.5) * 10,
            });
        }
        return points;
    };

    useEffect(() => {
        if (!showLevelUp) {
            const newPath = generatePath(round);
            setPath(newPath);
            setElephantPos({ x: 10, y: 50 });
            setCurrentPointIndex(0);
            setProgress(0);
            setCompleted(false);
        }
    }, [round, showLevelUp]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || completed || path.length === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        // Check if mouse is near the next path point
        if (currentPointIndex < path.length) {
            const target = path[currentPointIndex];
            const dist = Math.hypot(mouseX - target.x, mouseY - target.y);

            if (dist < 12) {
                // Move elephant to this point
                setElephantPos({ x: target.x, y: target.y });
                const newIndex = currentPointIndex + 1;
                setCurrentPointIndex(newIndex);
                setProgress((newIndex / path.length) * 100);
                audioService.playHover();

                // Check completion
                if (newIndex >= path.length) {
                    setCompleted(true);
                    if (round < totalRounds) {
                        handleRoundComplete();
                    } else {
                        setTimeout(() => {
                            audioService.playSuccess();
                            onComplete();
                        }, 800);
                    }
                }
            }
        }
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => {
            setShowLevelUp(false);
            setRound(r => r + 1);
        }, 2000);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none cursor-none"
            onMouseMove={handleMouseMove}
            style={{
                background: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 60%, #228B22 100%)',
            }}
        >
            {/* Jungle background elements */}
            <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="text-6xl md:text-8xl opacity-60" style={{ transform: `translateY(${10 + i * 5}px)` }}>
                        🌴
                    </div>
                ))}
            </div>

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ជួយដំរីដើរតាមផ្លូវ! 🐘"
                progress={progress}
            />

            {/* Path visualization */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {/* Path line */}
                {path.length > 1 && (
                    <path
                        d={`M ${path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                        stroke="#8B4513"
                        strokeWidth="8"
                        strokeDasharray="15,10"
                        strokeLinecap="round"
                        fill="none"
                        className="opacity-60"
                        style={{ transform: 'scale(1%)', transformOrigin: 'top left' }}
                    />
                )}

                {/* Completed path */}
                {currentPointIndex > 0 && (
                    <path
                        d={`M ${path.slice(0, currentPointIndex).map(p => `${p.x},${p.y}`).join(' L ')}`}
                        stroke="#FFD700"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        style={{ transform: 'translate(0, 0)' }}
                    />
                )}
            </svg>

            {/* Path point markers */}
            {path.map((point, i) => (
                <div
                    key={i}
                    className={`absolute w-8 h-8 rounded-full transition-all duration-300 ${i < currentPointIndex
                        ? 'bg-yellow-400 border-4 border-yellow-600 scale-75'
                        : i === currentPointIndex
                            ? 'bg-green-400 border-4 border-green-600 animate-pulse scale-125'
                            : 'bg-gray-300 border-4 border-gray-400'
                        }`}
                    style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {i === currentPointIndex && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                            👆
                        </div>
                    )}
                </div>
            ))}

            {/* Destination marker */}
            {path.length > 0 && (
                <div
                    className="absolute text-4xl animate-bounce"
                    style={{
                        left: `${path[path.length - 1].x}%`,
                        top: `${path[path.length - 1].y - 8}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    🏁
                </div>
            )}

            {/* Elephant */}
            <div
                className={`absolute text-6xl md:text-7xl transition-all duration-300 drop-shadow-xl ${completed ? 'animate-bounce' : ''}`}
                style={{
                    left: `${elephantPos.x}%`,
                    top: `${elephantPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                🐘
            </div>

            {/* Baby elephant following */}
            <div
                className="absolute text-4xl md:text-5xl transition-all duration-500 drop-shadow-lg"
                style={{
                    left: `${Math.max(5, elephantPos.x - 8)}%`,
                    top: `${elephantPos.y + 3}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                🐘
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-4 left-4 text-5xl opacity-70">🌿</div>
            <div className="absolute bottom-4 right-4 text-5xl opacity-70">🌺</div>
            <div className="absolute bottom-12 left-1/4 text-4xl opacity-60">🦋</div>
            <div className="absolute bottom-16 right-1/3 text-3xl opacity-50">🐦</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-green-200 text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-green-900">ផ្លូវបន្ទាប់វែងជាង! 🐘</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-6">ដំរីបានដល់ហើយ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🐘</span>
                            <span className="animate-bounce">🌴</span>
                            <span className="animate-pulse">🐘</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
