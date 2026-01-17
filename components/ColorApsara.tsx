import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface ColorSection {
    id: number;
    path: string;
    color: string;
    targetColor: string;
    filled: boolean;
}

const APSARA_COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#9370DB', '#FF6347', '#32CD32'];

export const ColorApsara: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [sections, setSections] = useState<ColorSection[]>([]);
    const [selectedColor, setSelectedColor] = useState<string>(APSARA_COLORS[0]);
    const [filled, setFilled] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numSections = count + (r - 1) * 2;

        // Create abstract sections representing parts of an Apsara
        const newSections: ColorSection[] = Array.from({ length: numSections }).map((_, i) => ({
            id: i,
            path: '', // We'll use simple shapes
            color: '#E5E5E5',
            targetColor: APSARA_COLORS[i % APSARA_COLORS.length],
            filled: false,
        }));

        setSections(newSections);
        setFilled(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    const handleColorSection = (sectionId: number) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section || section.filled) return;

        if (selectedColor === section.targetColor) {
            audioService.playPop();
            setSections(prev => prev.map(s =>
                s.id === sectionId ? { ...s, color: selectedColor, filled: true } : s
            ));

            const newFilled = filled + 1;
            setFilled(newFilled);

            if (newFilled === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        } else {
            audioService.playError();
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

    // Section positions for the Apsara silhouette
    const getSectionStyle = (index: number, total: number) => {
        const basePatterns = [
            // Crown area
            { top: '10%', left: '45%', width: '80px', height: '60px', borderRadius: '50% 50% 30% 30%' },
            // Face
            { top: '18%', left: '48%', width: '50px', height: '60px', borderRadius: '50%' },
            // Left arm
            { top: '35%', left: '25%', width: '100px', height: '30px', borderRadius: '50px', transform: 'rotate(-30deg)' },
            // Right arm
            { top: '35%', left: '58%', width: '100px', height: '30px', borderRadius: '50px', transform: 'rotate(30deg)' },
            // Body
            { top: '40%', left: '42%', width: '80px', height: '120px', borderRadius: '40px 40px 20px 20px' },
            // Skirt left
            { top: '60%', left: '30%', width: '70px', height: '130px', borderRadius: '20px 50% 50% 20px', transform: 'rotate(-10deg)' },
            // Skirt right
            { top: '60%', left: '55%', width: '70px', height: '130px', borderRadius: '50% 20px 20px 50%', transform: 'rotate(10deg)' },
            // Decoration 1
            { top: '25%', left: '35%', width: '40px', height: '40px', borderRadius: '50%' },
            // Decoration 2
            { top: '25%', left: '58%', width: '40px', height: '40px', borderRadius: '50%' },
            // Foot area
            { top: '85%', left: '45%', width: '60px', height: '30px', borderRadius: '50%' },
        ];

        return basePatterns[index % basePatterns.length];
    };

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-purple-200 via-pink-100 to-amber-100">
            {/* Decorative temple background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                <div className="text-[300px] text-amber-800">🏛️</div>
            </div>

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-pink-300 shadow-sm">
                <span className="text-pink-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-pink-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-pink-800">
                        ផាត់ពណ៌អប្សរា! 💃 ({filled}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Apsara figure area */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[300px] h-[400px]">
                {/* Apsara emoji as background guide */}
                <div className="absolute inset-0 flex items-center justify-center text-[200px] opacity-20 pointer-events-none">
                    💃
                </div>

                {/* Colorable sections */}
                {sections.map((section, i) => {
                    const style = getSectionStyle(i, sections.length);
                    return (
                        <div
                            key={section.id}
                            className={`absolute cursor-pointer transition-all duration-300 border-4 ${section.filled
                                    ? 'border-white/50 shadow-lg'
                                    : 'border-dashed border-gray-400 hover:border-pink-400 hover:scale-105'
                                }`}
                            style={{
                                ...style,
                                backgroundColor: section.color,
                                boxShadow: section.filled ? `0 0 20px ${section.color}` : undefined,
                            }}
                            onClick={() => handleColorSection(section.id)}
                            onMouseEnter={() => !section.filled && audioService.playHover()}
                        >
                            {/* Target color hint */}
                            {!section.filled && (
                                <div
                                    className="absolute -top-3 -right-3 w-6 h-6 rounded-full border-2 border-white shadow-lg"
                                    style={{ backgroundColor: section.targetColor }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Color palette */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/50 backdrop-blur-md p-4 rounded-3xl border-2 border-pink-300 shadow-xl">
                <p className="text-center text-pink-800 font-bold mb-3 text-sm">ជ្រើសរើសពណ៌:</p>
                <div className="flex gap-3">
                    {APSARA_COLORS.map((color, i) => (
                        <button
                            key={i}
                            className={`w-12 h-12 rounded-2xl border-4 transition-all duration-200 ${selectedColor === color
                                    ? 'border-white scale-110 shadow-xl'
                                    : 'border-transparent hover:scale-105'
                                }`}
                            style={{
                                backgroundColor: color,
                                boxShadow: selectedColor === color ? `0 0 20px ${color}` : undefined,
                            }}
                            onClick={() => {
                                setSelectedColor(color);
                                audioService.playHover();
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Selected color indicator */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
                <p className="text-pink-700 font-bold text-sm mb-1">ពណ៌បានជ្រើស:</p>
                <div
                    className="w-10 h-10 rounded-full border-4 border-white shadow-lg mx-auto"
                    style={{ backgroundColor: selectedColor }}
                />
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-pink-200 text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-4">ស្រស់ស្អាត!</h2>
                        <p className="text-xl font-black text-pink-900">អប្សរាបន្ទាប់! 💃</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && filled === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-6">អប្សរាស្អាតណាស់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">💃</span>
                            <span className="animate-bounce">✨</span>
                            <span className="animate-pulse">💃</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
