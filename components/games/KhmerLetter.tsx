import React, { useState, useEffect, useRef } from "react";
import { audioService } from "../../services/audioService";
import { languageService } from "../../services/languageService";
import { GameHUD } from "../GameHUD";

interface Point {
  x: number;
  y: number;
}

interface Letter {
  char: string;
  name: string;
  paths: Point[][];
}

const KHMER_LETTERS: Letter[] = [
  {
    char: "ក",
    name: "កា",
    paths: [
      [
        { x: 30, y: 30 },
        { x: 30, y: 70 },
        { x: 70, y: 70 },
        { x: 70, y: 30 },
        { x: 30, y: 30 },
      ],
    ],
  },
  {
    char: "ខ",
    name: "ខា",
    paths: [
      [
        { x: 30, y: 30 },
        { x: 30, y: 70 },
        { x: 70, y: 70 },
      ],
      [
        { x: 50, y: 30 },
        { x: 50, y: 50 },
      ],
    ],
  },
  {
    char: "គ",
    name: "គា",
    paths: [
      [
        { x: 30, y: 30 },
        { x: 70, y: 30 },
        { x: 70, y: 70 },
        { x: 30, y: 70 },
      ],
    ],
  },
  {
    char: "ឃ",
    name: "ឃា",
    paths: [
      [
        { x: 30, y: 50 },
        { x: 70, y: 50 },
      ],
      [
        { x: 50, y: 30 },
        { x: 50, y: 70 },
      ],
    ],
  },
  {
    char: "ង",
    name: "ងា",
    paths: [
      [
        { x: 50, y: 30 },
        { x: 30, y: 50 },
        { x: 50, y: 70 },
        { x: 70, y: 50 },
        { x: 50, y: 30 },
      ],
    ],
  },
];

export const KhmerLetter: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = count;
  const [currentLetter, setCurrentLetter] = useState<Letter>(KHMER_LETTERS[0]);
  const [userPath, setUserPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [completed, setCompleted] = useState(false);
  // Explicitly type the ref for the game card (white box)
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLevelUp) {
      const letterIndex = (round - 1) % KHMER_LETTERS.length;
      setCurrentLetter(KHMER_LETTERS[letterIndex]);
      setUserPath([]);
      setProgress(0);
      setCompleted(false);
    }
  }, [round, showLevelUp]);

  const getRelativePos = (e: React.MouseEvent): Point => {
    if (!cardRef.current) return { x: 0, y: 0 };
    const rect = cardRef.current.getBoundingClientRect();
    // Calculate position relative to the CARD, not the window
    // Clamp values to 0-100 to keep drawing inside the box roughly
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (completed) return;
    setIsDrawing(true);
    const pos = getRelativePos(e);
    setUserPath([pos]);
    audioService.playHover();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || completed) return;
    const pos = getRelativePos(e);
    setUserPath((prev) => [...prev, pos]);

    // Calculate progress based on coverage
    const newProgress = Math.min(100, userPath.length / 2);
    setProgress(newProgress);

    if (newProgress >= 80 && !completed) {
      setCompleted(true);
      audioService.playPop();

      setTimeout(() => {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          audioService.playSuccess();
          onComplete();
        }
      }, 800);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound((r) => r + 1);
      }, 2000);
    }, 2000);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-amber-100 to-amber-200"
      // Add global mouse up listener to catch drags that end outside the box
      onMouseUp={handleMouseUp}
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={`គូរអក្សរ "${currentLetter.char}" (${currentLetter.name})`}
      />

      {/* Letter display area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={cardRef}
          className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-white rounded-[3rem] shadow-2xl border-8 border-amber-300 touch-none cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
        >
          {/* Ghost letter to trace */}
          <div className="absolute inset-0 flex items-center justify-center text-[180px] md:text-[250px] text-amber-200 font-bold pointer-events-none select-none">
            {currentLetter.char}
          </div>

          {/* User's drawing */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
          >
            {userPath.length > 1 && (
              <path
                d={`M ${userPath.map((p) => `${p.x},${p.y}`).join(" L ")}`}
                stroke="#f59e0b"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="drop-shadow-lg"
              />
            )}
          </svg>

          {/* Progress indicator */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Completion checkmark */}
          {completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[3rem] animate-in fade-in duration-300 z-10 pointer-events-none">
              <div className="text-8xl animate-bounce">✅</div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-8 text-6xl opacity-50 pointer-events-none">
        📝
      </div>
      <div className="absolute bottom-8 right-8 text-6xl opacity-50 pointer-events-none">
        ✏️
      </div>

      {/* Level up modal */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-200 text-center">
            <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4">
              ពូកែណាស់!
            </h2>
            <p className="text-xl font-black text-amber-900">
              អក្សរបន្ទាប់! 📝
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
