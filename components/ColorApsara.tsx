import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

// Define the structure for SVG paths
interface ApsaraSection {
    id: number;
    d: string; // SVG path data
    targetColor: string;
    currentColor: string; // Used for fill
    filled: boolean;
    name: string; // For debugging/testing
    dotX: number; // For placing the color hint dot
    dotY: number;
}

// RESTORED: Original Colors
const APSARA_COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#9370DB', '#FF6347', '#32CD32'];
// Gold, HotPink, Turquoise, Purple, RedOrange (Skin-ish), LimeGreen

const LIGHT_BG_COLOR = 'rgba(255, 255, 255, 0.5)';

export const ColorApsara: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [sections, setSections] = useState<ApsaraSection[]>([]);
    const [selectedColor, setSelectedColor] = useState<string>(APSARA_COLORS[0]);
    const [filledCount, setFilledCount] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [particles, setParticles] = useState<{ x: number, y: number, color: string, id: number }[]>([]);

    // Determine the sequence of poses for this game session ONCE on mount
    const [poseSequence, setPoseSequence] = useState<number[]>([]);

    useEffect(() => {
        // Randomly select 3 distinctive poses from our pool of 5
        const pool = [0, 1, 2, 3, 4];
        const shuffled = pool.sort(() => Math.random() - 0.5);
        setPoseSequence(shuffled.slice(0, 3));
    }, []);

    // SVG ViewBox dimensions
    const VIEW_W = 400;
    const VIEW_H = 600;

    // Helper to get a random color from the palette, excluding specific ones if needed
    const getRandomColor = useCallback((exclude: string[] = []) => {
        const available = APSARA_COLORS.filter(c => !exclude.includes(c));
        return available[Math.floor(Math.random() * available.length)];
    }, []);

    // --- GENERATE LEVEL DATA ---
    const generateLevel = useCallback((roundNum: number) => {
        // 1. DETERMINE COLORS
        const crownColor = APSARA_COLORS[0]; // Gold fixed
        const skinColor = APSARA_COLORS[4]; // RedOrange/Skin fixed for abstractness

        // Shuffle outfit colors
        const outfitColors = APSARA_COLORS.filter(c => c !== crownColor && c !== skinColor);
        const shuffledOutfit = [...outfitColors].sort(() => Math.random() - 0.5);

        const topColor = shuffledOutfit[0];
        const skirtColor1 = shuffledOutfit[1];
        const skirtColor2 = shuffledOutfit[2];
        const armBandColor = shuffledOutfit[3] || APSARA_COLORS[2];

        // 2. GET POSE FOR THIS ROUND
        // Use pre-shuffled sequence if available, otherwise fallback to index
        const poseIndex = poseSequence.length > 0 ? poseSequence[roundNum - 1] : (roundNum - 1) % 5;

        let paths = [];

        // STARTING PATH DEFINITIONS
        const CROWN_PATH = "M 180 120 L 200 40 L 220 120 Q 240 130 240 150 L 160 150 Q 160 130 180 120 Z";
        const FACE_PATH = "M 170 150 Q 160 180 170 210 Q 200 230 230 210 Q 240 180 230 150 Z";

        if (poseIndex === 0) {
            // --- POSE 1: STANDING (No Sash, Gap Closed) ---
            paths = [
                { name: "Crown", targetColor: crownColor, dotX: 200, dotY: 100, d: CROWN_PATH },
                { name: "Face", targetColor: skinColor, dotX: 200, dotY: 180, d: FACE_PATH },
                { name: "Torso", targetColor: topColor, dotX: 200, dotY: 270, d: "M 180 210 Q 160 220 165 260 L 175 330 L 225 330 L 235 260 Q 240 220 220 210 Z" },
                { name: "Left Arm", targetColor: skinColor, dotX: 135, dotY: 260, d: "M 160 220 Q 130 230 120 260 Q 110 290 140 300 L 150 290" },
                { name: "Right Arm", targetColor: skinColor, dotX: 265, dotY: 180, d: "M 240 220 Q 270 210 280 180 Q 290 150 260 140 L 250 150" },
                // Skirts widened to meet in center
                { name: "Skirt Left", targetColor: skirtColor1, dotX: 175, dotY: 410, d: "M 175 330 Q 150 400 130 480 L 195 490 L 200 330 Z" },
                { name: "Skirt Right", targetColor: skirtColor1, dotX: 225, dotY: 410, d: "M 225 330 Q 250 400 270 480 L 205 490 L 200 330 Z" },
            ];
        } else if (poseIndex === 1) {
            // --- POSE 2: GREETING (Sampeah - Hands clasped) ---
            paths = [
                { name: "Crown", targetColor: crownColor, dotX: 200, dotY: 100, d: CROWN_PATH },
                { name: "Face", targetColor: skinColor, dotX: 200, dotY: 180, d: FACE_PATH },
                { name: "Torso", targetColor: topColor, dotX: 200, dotY: 270, d: "M 180 210 Q 160 220 165 260 L 175 330 L 225 330 L 235 260 Q 240 220 220 210 Z" },
                // Arms bent inward to connect with hands
                { name: "Left Arm", targetColor: skinColor, dotX: 145, dotY: 240, d: "M 165 220 Q 130 240 150 260 L 190 250" },
                { name: "Right Arm", targetColor: skinColor, dotX: 255, dotY: 240, d: "M 235 220 Q 270 240 250 260 L 210 250" },
                // Hands (Sampeah Shape)
                { name: "Hands", targetColor: skinColor, dotX: 200, dotY: 235, d: "M 200 215 Q 212 230 210 245 L 200 255 L 190 245 Q 188 230 200 215 Z" },
                { name: "Skirt Main", targetColor: skirtColor1, dotX: 200, dotY: 400, d: "M 175 330 Q 160 400 150 480 L 250 480 Q 240 400 225 330 Z" },
            ];

        } else if (poseIndex === 2) {
            // --- POSE 3: DANCING (One leg up) ---
            paths = [
                { name: "Crown", targetColor: crownColor, dotX: 200, dotY: 100, d: CROWN_PATH },
                { name: "Face", targetColor: skinColor, dotX: 200, dotY: 180, d: FACE_PATH },
                { name: "Torso", targetColor: topColor, dotX: 200, dotY: 270, d: "M 180 210 Q 160 220 170 260 L 180 320 L 220 320 L 230 260 Q 240 220 220 210 Z" },
                { name: "Left Arm Up", targetColor: skinColor, dotX: 130, dotY: 190, d: "M 170 220 Q 140 210 130 180 L 140 170" },
                { name: "Right Arm Out", targetColor: skinColor, dotX: 270, dotY: 260, d: "M 230 220 Q 260 230 280 260 L 270 270" },
                // Legs adjusted (No sash)
                { name: "Leg R", targetColor: skirtColor1, dotX: 215, dotY: 400, d: "M 200 320 L 230 320 L 240 480 L 210 480 Z" },
                { name: "Leg L", targetColor: skirtColor2, dotX: 150, dotY: 340, d: "M 180 320 L 130 350 L 130 400 L 160 380 L 180 340 Z" },
            ];
        } else if (poseIndex === 3) {
            // --- POSE 4: BALANCING (Knees bent outward, traditional stable squat) ---
            paths = [
                { name: "Crown", targetColor: crownColor, dotX: 200, dotY: 100, d: CROWN_PATH },
                { name: "Face", targetColor: skinColor, dotX: 200, dotY: 180, d: FACE_PATH },
                { name: "Torso", targetColor: topColor, dotX: 200, dotY: 270, d: "M 180 210 Q 160 220 165 260 L 175 320 L 225 320 L 235 260 Q 240 220 220 210 Z" },
                // Arms both bent upwards (Mudra)
                { name: "Left Arm Up", targetColor: skinColor, dotX: 130, dotY: 200, d: "M 170 220 Q 130 240 130 200 L 140 190" },
                { name: "Right Arm Up", targetColor: skinColor, dotX: 270, dotY: 200, d: "M 230 220 Q 270 240 270 200 L 260 190" },
                // Wide squat stance
                { name: "Skirt Wide", targetColor: skirtColor1, dotX: 200, dotY: 400, d: "M 175 320 L 140 450 L 260 450 L 225 320 Z" }
            ];
        } else {
            // --- POSE 5: FLOWER (Hands holding flower/kbach, distinct legs) ---
            paths = [
                { name: "Crown", targetColor: crownColor, dotX: 200, dotY: 100, d: CROWN_PATH },
                { name: "Face", targetColor: skinColor, dotX: 200, dotY: 180, d: FACE_PATH },
                { name: "Torso", targetColor: topColor, dotX: 200, dotY: 270, d: "M 180 210 Q 160 220 165 260 L 175 330 L 225 330 L 235 260 Q 240 220 220 210 Z" },
                // One arm up, one down
                { name: "Left Arm Low", targetColor: skinColor, dotX: 135, dotY: 280, d: "M 160 220 Q 130 230 130 300 L 140 310" },
                { name: "Right Arm High", targetColor: skinColor, dotX: 265, dotY: 160, d: "M 240 220 Q 270 200 270 150 L 260 140" },
                // Standing crossing legs (simulated by tapered skirt)
                { name: "Skirt Tapered", targetColor: skirtColor1, dotX: 200, dotY: 420, d: "M 175 330 L 180 500 L 220 500 L 225 330 Z" }
            ];
        }

        return paths.map((p, i) => ({
            id: i,
            d: p.d,
            name: p.name,
            targetColor: p.targetColor,
            currentColor: LIGHT_BG_COLOR,
            filled: false,
            dotX: p.dotX,
            dotY: p.dotY
        }));

    }, [poseSequence, getRandomColor]);

    // Initialize Round
    useEffect(() => {
        if (!showLevelUp && poseSequence.length > 0) {
            const newSections = generateLevel(round);
            setSections(newSections);
            setFilledCount(0);
            setParticles([]);
        }
    }, [round, showLevelUp, poseSequence, generateLevel]);

    const handleSectionClick = (sectionId: number, e: React.MouseEvent) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section || section.filled) return;

        if (selectedColor === section.targetColor) {
            // Correct!
            audioService.playPop();

            const rect = (e.currentTarget as Element).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            spawnParticles(x, y, selectedColor);

            setSections(prev => prev.map(s =>
                s.id === sectionId ? { ...s, currentColor: selectedColor, filled: true } : s
            ));

            const newFilled = filledCount + 1;
            setFilledCount(newFilled);

            if (newFilled === sections.length) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 1000);
                }
            }
        } else {
            // Wrong color
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

    const spawnParticles = (x: number, y: number, color: string) => {
        const newP = Array.from({ length: 8 }).map((_, i) => ({
            id: Date.now() + i,
            x,
            y,
            color
        }));
        setParticles(prev => [...prev, ...newP]);
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newP.includes(p)));
        }, 1000);
    };

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-[#FFFBEB] to-[#FDF2F8]">
            {/* Background Pattern - Subtle Kbach/Floral motif could go here */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c0 16.57-13.43 30-30 30 16.57 0 30 13.43 30 30 0-16.57 13.43-30 30-30-16.57 0-30-13.43-30-30z' fill='%239C27B0' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}
            />

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ជ្រើសរើសពណ៌ ហើយដាក់អោយត្រូវ! 🎨"
                score={filledCount}
                goal={sections.length}
            />

            {/* Main Game Area */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-24">
                {/* SVG Container */}
                <div className="relative w-full max-w-[500px] aspect-[2/3] animate-in fade-in zoom-in duration-500">
                    <svg
                        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                        className="w-full h-full drop-shadow-2xl"
                        style={{ filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.2))' }}
                    >
                        {/* Rendering Sections */}
                        {sections.map((section) => {
                            const isTarget = !section.filled && selectedColor === section.targetColor;

                            return (
                                <g key={section.id} onClick={(e) => handleSectionClick(section.id, e as any)}>
                                    {/* MAIN SHAPE */}
                                    <path
                                        d={section.d}
                                        fill={section.filled ? section.currentColor : 'rgba(255,255,255,0.7)'}
                                        stroke={section.filled ? 'white' : '#9CA3AF'} // Greystroke for unpainted
                                        strokeWidth={section.filled ? 3 : 3}
                                        strokeDasharray={section.filled ? '0' : '8 6'} // Dashed for unpainted
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`transition-all duration-300 cursor-pointer ${!section.filled ? 'hover:fill-white' : ''
                                            }`}
                                    />

                                    {/* COLOR HINT DOT (Only when unpainted) */}
                                    {!section.filled && (
                                        <circle
                                            cx={section.dotX}
                                            cy={section.dotY}
                                            r={12}
                                            fill={section.targetColor}
                                            stroke="white"
                                            strokeWidth="3"
                                            className="animate-pulse"
                                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* DOM Particles */}
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            className="absolute w-4 h-4 rounded-full pointer-events-none animate-ping"
                            style={{
                                left: p.x,
                                top: p.y,
                                backgroundColor: p.color
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Color Palette (Dock Style) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl p-3 px-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex gap-3 items-center z-20 transition-all hover:scale-105 hover:bg-white/90">
                {APSARA_COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => {
                            setSelectedColor(color);
                            audioService.playHover();
                        }}
                        className={`w-12 h-12 rounded-full transition-all duration-300 transform relative group ${selectedColor === color
                                ? 'scale-125 shadow-lg ring-4 ring-white'
                                : 'hover:scale-110 hover:shadow-md opacity-90 hover:opacity-100'
                            }`}
                        style={{ backgroundColor: color }}
                    >
                        {selectedColor === color && (
                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-shadow">
                                ✓
                            </span>
                        )}
                        {/* Tooltip hint */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Select
                        </div>
                    </button>
                ))}
            </div>

            {/* Level Up / Success Overlay */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-300">
                    <div className="bg-white/90 p-8 rounded-[3rem] shadow-2xl border-4 border-white text-center transform scale-110 animate-bounce-subtle">
                        <div className="text-6xl mb-4">✨</div>
                        <h2 className="text-3xl font-black text-pink-500 mb-2">អស្ចារ្យណាស់!</h2>
                        <p className="text-gray-500 font-bold">ទៅវគ្គបន្ទាប់...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
