import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

interface Obstacle {
    id: number;
    x: number;
    y: number;
    type: 'car' | 'bike' | 'person' | 'dog';
}

interface Passenger {
    x: number;
    y: number;
    pickedUp: boolean;
}

export const TukTukDriver: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [tukTukPos, setTukTukPos] = useState({ x: 20, y: 70 });
    const [dragging, setDragging] = useState(false);
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [passenger, setPassenger] = useState<Passenger>({ x: 80, y: 30, pickedUp: false });
    const [destination, setDestination] = useState({ x: 80, y: 70 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const initRound = (r: number) => {
        setTukTukPos({ x: 10, y: 50 + Math.random() * 20 });
        setPassenger({ x: 70 + Math.random() * 20, y: 20 + Math.random() * 20, pickedUp: false });
        setDestination({ x: 70 + Math.random() * 20, y: 60 + Math.random() * 20 });
        setCompleted(false);

        // Generate obstacles
        const numObstacles = 2 + r;
        const newObstacles: Obstacle[] = Array.from({ length: numObstacles }).map((_, i) => ({
            id: i,
            x: 30 + Math.random() * 40,
            y: 25 + Math.random() * 50,
            type: ['car', 'bike', 'person', 'dog'][Math.floor(Math.random() * 4)] as any,
        }));
        setObstacles(newObstacles);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, showLevelUp]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current || completed) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Check collision with obstacles
        const collision = obstacles.some(obs => {
            const dist = Math.hypot(x - obs.x, y - obs.y);
            return dist < 8;
        });

        if (!collision) {
            setTukTukPos({ x: Math.max(5, Math.min(95, x)), y: Math.max(15, Math.min(85, y)) });
        } else {
            audioService.playError();
        }

        // Check if picked up passenger
        if (!passenger.pickedUp) {
            const distToPassenger = Math.hypot(x - passenger.x, y - passenger.y);
            if (distToPassenger < 10) {
                setPassenger(prev => ({ ...prev, pickedUp: true }));
                audioService.playPop();
            }
        }

        // Check if reached destination with passenger
        if (passenger.pickedUp) {
            const distToDest = Math.hypot(x - destination.x, y - destination.y);
            if (distToDest < 10 && !completed) {
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
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => {
                setShowLevelUp(false);
                setRound(r => r + 1);
            }, 2000);
        }, 2000);
    };

    const getObstacleEmoji = (type: string) => {
        switch (type) {
            case 'car': return '🚗';
            case 'bike': return '🏍️';
            case 'person': return '🚶';
            case 'dog': return '🐕';
            default: return '🚗';
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={() => setDragging(true)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            style={{
                background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 15%, #808080 15%, #808080 100%)',
            }}
        >
            {/* Buildings in background */}
            <div className="absolute top-0 left-0 right-0 h-[15%] flex items-end justify-around pointer-events-none">
                {['🏢', '🏬', '🏪', '🏠', '🏨', '🏦', '🏪'].map((building, i) => (
                    <div key={i} className="text-4xl md:text-5xl opacity-80">{building}</div>
                ))}
            </div>

            {/* Road markings */}
            <div className="absolute top-[40%] left-0 right-0 h-2 flex justify-around pointer-events-none">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-12 h-2 bg-yellow-400 rounded" />
                ))}
            </div>
            <div className="absolute top-[60%] left-0 right-0 h-2 flex justify-around pointer-events-none">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-12 h-2 bg-yellow-400 rounded" />
                ))}
            </div>

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction={!passenger.pickedUp ? 'រើសអ្នកដំណើរ! 🧑' : 'ទៅទីកន្លែង! 🏁'}
            />

            {/* Obstacles */}
            {obstacles.map(obs => (
                <div
                    key={obs.id}
                    className="absolute text-4xl md:text-5xl pointer-events-none animate-obstacle"
                    style={{
                        left: `${obs.x}%`,
                        top: `${obs.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {getObstacleEmoji(obs.type)}
                </div>
            ))}

            {/* Passenger (if not picked up) */}
            {!passenger.pickedUp && (
                <div
                    className="absolute text-4xl md:text-5xl animate-bounce pointer-events-none"
                    style={{
                        left: `${passenger.x}%`,
                        top: `${passenger.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    🧑
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl">👋</div>
                </div>
            )}

            {/* Destination */}
            {passenger.pickedUp && (
                <div
                    className="absolute text-4xl md:text-5xl animate-pulse pointer-events-none"
                    style={{
                        left: `${destination.x}%`,
                        top: `${destination.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    🏁
                </div>
            )}

            {/* Tuk-tuk */}
            <div
                className={`absolute text-5xl md:text-6xl drop-shadow-2xl transition-transform duration-100 ${completed ? 'animate-bounce' : ''}`}
                style={{
                    left: `${tukTukPos.x}%`,
                    top: `${tukTukPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                🛺
                {passenger.pickedUp && (
                    <div className="absolute -top-4 -right-2 text-2xl">🧑</div>
                )}
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-200 text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-gray-700">ផ្លូវកាន់តែពិបាក! 🛺</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-6">អ្នកបើកតុកតុកពូកែ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🛺</span>
                            <span className="animate-bounce">🏆</span>
                            <span className="animate-pulse">🛺</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes obstacle {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-5px); }
        }
        .animate-obstacle {
          animation: obstacle 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
