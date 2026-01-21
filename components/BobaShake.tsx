import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

export const BobaShake: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [shakeProgress, setShakeProgress] = useState(0);
    const [lastAngle, setLastAngle] = useState(0);
    const [totalRotation, setTotalRotation] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [bubblePositions, setBubblePositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const targetRotation = 360 * (2 + round); // More rotations needed in later rounds

    useEffect(() => {
        if (!showLevelUp) {
            setShakeProgress(0);
            setTotalRotation(0);
            setCompleted(false);

            // Initialize bubble positions
            const bubbles = Array.from({ length: 8 }).map(() => ({
                x: 40 + Math.random() * 20,
                y: 50 + Math.random() * 30,
            }));
            setBubblePositions(bubbles);
        }
    }, [round, showLevelUp]);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (completed || showLevelUp) return;

        // Calculate angle from center
        const dx = e.clientX - centerRef.current.x;
        const dy = e.clientY - centerRef.current.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Calculate rotation difference
        let diff = angle - lastAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Only count significant movements (to reduce noise)
        if (Math.abs(diff) > 2 && Math.abs(diff) < 50) {
            const newRotation = totalRotation + Math.abs(diff);
            setTotalRotation(newRotation);
            setShakeProgress(Math.min(100, (newRotation / targetRotation) * 100));

            // Play sound occasionally
            if (Math.random() < 0.1) {
                audioService.playHover();
            }

            // Shake the bubbles
            setBubblePositions(prev => prev.map(b => ({
                x: 38 + Math.random() * 24,
                y: 45 + Math.random() * 35,
            })));

            if (newRotation >= targetRotation && !completed) {
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

        setLastAngle(angle);
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
            className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-pink-200 via-pink-100 to-amber-100"
            onMouseMove={handleMouseMove}
        >
            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="រមូរម៉ៅដើម្បីអង្គុំ! 🧋"
                progress={shakeProgress}
            />

            {/* Circular motion guide */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-4 border-dashed border-pink-300/50 rounded-full pointer-events-none" />

            {/* Arrow indicators */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none">
                {[0, 90, 180, 270].map(angle => (
                    <div
                        key={angle}
                        className="absolute text-2xl text-pink-400 animate-pulse"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `rotate(${angle}deg) translateY(-140px)`,
                        }}
                    >
                        ↻
                    </div>
                ))}
            </div>

            {/* Boba tea cup */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${shakeProgress > 0 && !completed ? 'animate-shake' : ''}`}>
                {/* Cup body */}
                <div className="relative w-32 h-48 md:w-40 md:h-56">
                    {/* Straw */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-4 h-32 bg-gradient-to-r from-green-400 to-green-500 rounded-full z-10" />

                    {/* Cup */}
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/70 rounded-b-3xl border-4 border-white/50 overflow-hidden"
                        style={{
                            clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1), inset 0 0 30px rgba(255,255,255,0.5)',
                        }}
                    >
                        {/* Tea liquid */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-800 via-amber-600 to-amber-400 transition-all duration-300"
                            style={{ height: `${80 + shakeProgress * 0.15}%` }}
                        />

                        {/* Milk swirl effect */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 transition-opacity ${shakeProgress > 50 ? 'opacity-80' : 'opacity-30'}`}
                        />

                        {/* Bubbles (tapioca pearls) */}
                        {bubblePositions.map((pos, i) => (
                            <div
                                key={i}
                                className="absolute w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-gray-800 to-black rounded-full transition-all duration-100"
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3)',
                                }}
                            />
                        ))}
                    </div>

                    {/* Lid */}
                    <div className="absolute -top-2 left-0 right-0 h-6 bg-gradient-to-r from-pink-400 to-pink-500 rounded-t-2xl border-b-4 border-pink-600">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-pink-300 rounded-full" />
                    </div>

                    {/* Cup highlights */}
                    <div className="absolute top-8 left-2 w-2 h-20 bg-white/50 rounded-full" />
                </div>

                {/* Mixed indicator */}
                {completed && (
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                        ✨
                    </div>
                )}
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-pink-200 text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-4">ឆ្ងាញ់ណាស់!</h2>
                        <p className="text-xl font-black text-pink-900">អង្គុំច្រើនជាង! 🧋</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-6">ទឹកត្រាឆ្ងាញ់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🧋</span>
                            <span className="animate-bounce">😋</span>
                            <span className="animate-pulse">🧋</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
          25% { transform: translate(-50%, -50%) rotate(2deg) translateX(3px); }
          50% { transform: translate(-50%, -50%) rotate(-2deg); }
          75% { transform: translate(-50%, -50%) rotate(2deg) translateX(-3px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
