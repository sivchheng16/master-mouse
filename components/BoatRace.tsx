import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface PathPoint {
    x: number;
    y: number;
}

export const BoatRace: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [path, setPath] = useState<PathPoint[]>([]);
    const [boatPos, setBoatPos] = useState({ x: 10, y: 50 });
    const [currentPointIndex, setCurrentPointIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [competitors, setCompetitors] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const generatePath = (r: number) => {
        const points: PathPoint[] = [];
        const numPoints = 6 + r * 2;
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: 8 + (i / (numPoints - 1)) * 80,
                y: 40 + Math.sin(i * 0.6) * 15 + (Math.random() - 0.5) * 10,
            });
        }
        return points;
    };

    useEffect(() => {
        if (!showLevelUp) {
            const newPath = generatePath(round);
            setPath(newPath);
            setBoatPos({ x: 8, y: 50 });
            setCurrentPointIndex(0);
            setProgress(0);
            setCompleted(false);

            // Competitor boats
            setCompetitors([
                { x: 5, y: 35 },
                { x: 5, y: 65 },
            ]);
        }
    }, [round, showLevelUp]);

    // Animate competitors
    useEffect(() => {
        if (showLevelUp || completed) return;

        const interval = setInterval(() => {
            setCompetitors(prev => prev.map(comp => ({
                ...comp,
                x: Math.min(90, comp.x + 0.2 + Math.random() * 0.3),
            })));
        }, 100);

        return () => clearInterval(interval);
    }, [showLevelUp, completed]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || completed || path.length === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        if (currentPointIndex < path.length) {
            const target = path[currentPointIndex];
            const dist = Math.hypot(mouseX - target.x, mouseY - target.y);

            if (dist < 10) {
                setBoatPos({ x: target.x, y: target.y });
                const newIndex = currentPointIndex + 1;
                setCurrentPointIndex(newIndex);
                setProgress((newIndex / path.length) * 100);
                audioService.playHover();

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
                background: 'linear-gradient(180deg, #1e3a5f 0%, #2980b9 30%, #3498db 70%, #5dade2 100%)',
            }}
        >
            {/* Crowd on banks */}
            <div className="absolute top-0 left-0 right-0 h-[20%] bg-gradient-to-b from-green-600 to-green-500 flex items-end justify-around overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="text-2xl md:text-3xl animate-cheer" style={{ animationDelay: `${i * 0.1}s` }}>
                        {['👋', '🙌', '👏', '🎉'][i % 4]}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-green-600 to-green-500 flex items-start justify-around overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="text-2xl md:text-3xl animate-cheer" style={{ animationDelay: `${i * 0.15}s` }}>
                        {['👋', '🙌', '👏', '🎉'][i % 4]}
                    </div>
                ))}
            </div>

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-300 shadow-sm">
                <span className="text-white font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-[22%] left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/30 backdrop-blur-xl px-6 py-3 rounded-[2rem] border-2 border-blue-300 shadow-xl">
                    <h2 className="text-lg md:text-2xl font-black text-white drop-shadow-lg">
                        បុណ្យអុំទូក! ដើរតាមផ្លូវ! 🚣 ({Math.floor(progress)}%)
                    </h2>
                </div>
            </div>

            {/* Water waves */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-full h-8 bg-white/5 animate-wave"
                        style={{
                            top: `${25 + i * 12}%`,
                            animationDelay: `${i * 0.3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Path markers */}
            {path.map((point, i) => (
                <div
                    key={i}
                    className={`absolute w-6 h-6 rounded-full transition-all duration-300 ${i < currentPointIndex
                            ? 'bg-yellow-400 border-2 border-yellow-600 scale-75'
                            : i === currentPointIndex
                                ? 'bg-green-400 border-2 border-green-600 animate-pulse scale-125'
                                : 'bg-white/30 border-2 border-white/50'
                        }`}
                    style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}

            {/* Finish line */}
            {path.length > 0 && (
                <div
                    className="absolute text-4xl animate-bounce"
                    style={{
                        left: `${path[path.length - 1].x + 3}%`,
                        top: `${path[path.length - 1].y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    🏁
                </div>
            )}

            {/* Competitor boats */}
            {competitors.map((comp, i) => (
                <div
                    key={i}
                    className="absolute text-4xl drop-shadow-lg opacity-70"
                    style={{
                        left: `${comp.x}%`,
                        top: `${comp.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    🛶
                </div>
            ))}

            {/* Player boat */}
            <div
                className={`absolute text-5xl md:text-6xl drop-shadow-2xl transition-all duration-200 ${completed ? 'animate-bounce' : ''}`}
                style={{
                    left: `${boatPos.x}%`,
                    top: `${boatPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                🚣
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[50%] bg-white/20 backdrop-blur-md rounded-full p-1">
                <div
                    className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
                        <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4">ឈ្នះហើយ!</h2>
                        <p className="text-xl font-black text-blue-900">ជុំបន្ទាប់លឿនជាង! 🚣</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-6">ជើងឯកអុំទូក! 🏆</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🚣</span>
                            <span className="animate-bounce">🏅</span>
                            <span className="animate-pulse">🚣</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes wave {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        .animate-wave {
          animation: wave 8s linear infinite;
        }
        @keyframes cheer {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }
        .animate-cheer {
          animation: cheer 0.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
