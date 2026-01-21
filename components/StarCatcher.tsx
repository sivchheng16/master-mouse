import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

export const StarCatcher: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 8 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [stars, setStars] = useState<{ id: number; x: number; y: number; caught: boolean }[]>([]);
  const [selection, setSelection] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 6;
    const newStars = Array.from({ length: rc }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 70 + 15,
      caught: false
    }));
    setStars(newStars);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showLevelUp) return;
    audioService.playHover();
    const rect = containerRef.current!.getBoundingClientRect();
    setSelection({ x1: e.clientX - rect.left, y1: e.clientY - rect.top, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selection && !showLevelUp) {
      const rect = containerRef.current!.getBoundingClientRect();
      setSelection({ ...selection, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
    }
  };

  const handleMouseUp = () => {
    if (selection && !showLevelUp) {
      const rect = containerRef.current!.getBoundingClientRect();
      const xMin = Math.min(selection.x1, selection.x2);
      const xMax = Math.max(selection.x1, selection.x2);
      const yMin = Math.min(selection.y1, selection.y2);
      const yMax = Math.max(selection.y1, selection.y2);

      let anyCaught = false;
      const nextStars = stars.map(s => {
        const sx = (s.x / 100) * rect.width;
        const sy = (s.y / 100) * rect.height;
        if (sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax && !s.caught) {
          anyCaught = true;
          return { ...s, caught: true };
        }
        return s;
      });

      if (anyCaught) {
        audioService.playCollect();
      } else {
        audioService.playDragEnd();
      }

      setStars(nextStars);
      if (nextStars.length > 0 && nextStars.every(s => s.caught)) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(onComplete, 1500);
        }
      }
      setSelection(null);
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2500);
  };

  const caughtCount = stars.filter(s => s.caught).length;
  const currentCount = count + (round - 1) * 6;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-indigo-950 overflow-hidden cursor-crosshair select-none"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="គូសប្រអប់ដើម្បីចាប់ផ្កាយទាំងអស់!"
        score={caughtCount}
        goal={currentCount}
      />

      {stars.map(s => (
        <div
          key={`${round}-${s.id}`}
          className={`absolute text-2xl md:text-4xl transition-all duration-700 pointer-events-none ${s.caught ? 'scale-0 rotate-[360deg] opacity-0 blur-sm' : 'scale-100 opacity-100 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'}`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          ⭐
        </div>
      ))}

      {selection && (
        <div
          className="absolute border-4 border-yellow-400 bg-yellow-400/20 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.3)] pointer-events-none"
          style={{
            left: Math.min(selection.x1, selection.x2),
            top: Math.min(selection.y1, selection.y2),
            width: Math.abs(selection.x1 - selection.x2),
            height: Math.abs(selection.y1 - selection.y2)
          }}
        />
      )}

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-indigo-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-indigo-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-indigo-900">ផ្កាយកំពុងធ្លាក់មកកាន់តែច្រើន! ✨🌌</p>
          </div>
        </div>
      )}
    </div>
  );
};