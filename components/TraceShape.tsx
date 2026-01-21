import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface Dot {
  id: number;
  x: number;
  y: number;
}

export const TraceShape: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 12 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [traced, setTraced] = useState<number[]>([]);
  const [dots, setDots] = useState<Dot[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const shapeNames = ["រង្វង់ (CIRCLE)", "ការ៉េ (SQUARE)", "បេះដូង (HEART)"];

  const getShapeDots = (r: number, baseCount: number): Dot[] => {
    const newDots: Dot[] = [];
    const currentCount = baseCount + (r - 1) * 4;

    if (r === 1) {
      // Circle
      for (let i = 0; i < currentCount; i++) {
        const angle = (i * 2 * Math.PI) / currentCount;
        newDots.push({
          id: i,
          x: 50 + 35 * Math.cos(angle),
          y: 50 + 35 * Math.sin(angle)
        });
      }
    } else if (r === 2) {
      // Square
      const perSide = Math.ceil(currentCount / 4);
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 20 + (i / perSide) * 60, y: 20 }); // Top
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 80, y: 20 + (i / perSide) * 60 }); // Right
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 80 - (i / perSide) * 60, y: 80 }); // Bottom
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 20, y: 80 - (i / perSide) * 60 }); // Left
    } else {
      // Heart
      for (let i = 0; i < currentCount; i++) {
        const t = (i * 2 * Math.PI) / currentCount;
        // Heart curve parametric equations
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        newDots.push({
          id: i,
          x: 50 + x * 2.2,
          y: 45 + y * 2.2
        });
      }
    }
    return newDots;
  };

  useEffect(() => {
    setDots(getShapeDots(round, count));
    setTraced([]);
  }, [round, count]);

  const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    // 0. UPDATE VISUAL CURSOR (Always track, even if not clicking)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate percentage position exactly matching the game logic's coordinate system
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      setCursorPos({ x: px, y: py });
    }

    // Only process GAME LOGIC if dragging (left click held)
    if (e.buttons !== 1 || showLevelUp || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    // 1. BOUNDARY CHECK: Are we "on the line"?
    // Calculate distance to the NEAREST dot (traced or untraced)
    let minDistanceToShape = 100;
    dots.forEach((dot) => {
      const dist = Math.sqrt(Math.pow(dot.x - px, 2) + Math.pow(dot.y - py, 2));
      if (dist < minDistanceToShape) minDistanceToShape = dist;
    });

    // Threshold for being "out of bounds". slightly larger than catch radius (8)
    const MAX_DEVIATION = 12;

    if (minDistanceToShape > MAX_DEVIATION) {
      // User went off the path!
      if (traced.length > 0) {
        // Only fail if they had actually started tracing something
        handleFail();
      }
      return;
    }

    // 2. TRACING LOGIC
    // Find closest UNTRACED dot to catch
    let closestId = -1;
    let minDist = 8; // Catch radius

    dots.forEach((dot) => {
      if (!traced.includes(dot.id)) {
        const dist = Math.sqrt(Math.pow(dot.x - px, 2) + Math.pow(dot.y - py, 2));
        if (dist < minDist) {
          minDist = dist;
          closestId = dot.id;
        }
      }
    });

    if (closestId !== -1) {
      audioService.playTing(traced.length);
      const nextTraced = [...traced, closestId];
      setTraced(nextTraced);

      if (nextTraced.length === dots.length) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(onComplete, 1500);
        }
      }
    }
  };

  const handleFail = () => {
    if (traced.length === 0) return; // Prevent spamming if already empty

    audioService.playError(); // "Effection false sound"
    setTraced([]); // "Restart game again" (reset round progress)

    // Optional: Add visual shake effect logic here if needed, 
    // but for now simple reset + sound meets requirement.
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2500);
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
  };

  return (
    <div className="relative w-full h-full bg-orange-50/30 flex flex-col items-center justify-center select-none overflow-hidden p-4">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={`គូសតាមរូប: ${shapeNames[round - 1]}`}
        score={traced.length}
        goal={dots.length}
      />

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-72 h-72 md:w-[32rem] md:h-[32rem] flex-shrink flex items-center justify-center cursor-none group"
      >
        {/* Connection Path Guide */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
          <path
            d={dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ') + (round === 1 || round === 3 ? ' Z' : '')}
            fill="none"
            stroke="orange"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </svg>

        {dots.map(d => (
          <div
            key={`${round}-${d.id}`}
            className={`absolute w-8 h-8 md:w-11 md:h-11 rounded-full transition-all duration-300 border-2 border-white shadow-md flex items-center justify-center ${traced.includes(d.id)
              ? 'bg-orange-500 scale-110 z-10 shadow-orange-200'
              : 'bg-orange-100 opacity-60 group-hover:opacity-100'
              }`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {traced.includes(d.id) && (
              <span className="text-white text-xs animate-in zoom-in"></span>
            )}
          </div>
        ))}

        {/* Custom Cursor Follower within Container */}
        {cursorPos && (
          <div
            className="absolute w-6 h-6 bg-cyan-400 rounded-full blur-[2px] pointer-events-none z-50 mix-blend-screen animate-pulse"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 15px 5px rgba(34, 211, 238, 0)'
            }}
          />
        )}
        {/* Connection Path Guide */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
          <path
            d={dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ') + (round === 1 || round === 3 ? ' Z' : '')}
            fill="none"
            stroke="orange"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </svg>

        {dots.map(d => (
          <div
            key={`${round}-${d.id}`}
            className={`absolute w-8 h-8 md:w-11 md:h-11 rounded-full transition-all duration-300 border-2 border-white shadow-md flex items-center justify-center ${traced.includes(d.id)
              ? 'bg-orange-500 scale-110 z-10 shadow-orange-200'
              : 'bg-orange-100 opacity-60 group-hover:opacity-100'
              }`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {traced.includes(d.id) && (
              <span className="text-white text-xs animate-in zoom-in"></span>
            )}
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-4xl md:text-6xl opacity-[0.15] font-black text-orange-500 uppercase tracking-tighter rotate-10 select-none">
            {shapeNames[round - 1].split(' ')[0]}
          </div>
        </div>
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-orange-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-orange-900">ត្រៀមខ្លួនសម្រាប់រូបរាងបន្ទាប់! ✨</p>
          </div>
        </div>
      )}

      {round === totalRounds && traced.length === dots.length && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md z-30 animate-in fade-in duration-500">
          <div className="text-center">
            <h2 className="title-font text-5xl md:text-7xl text-orange-600 animate-bounce drop-shadow-lg">ជោគជ័យ! 🏆</h2>
            <div className="flex justify-center gap-4 mt-4 text-4xl">
              <span>🏆</span><span>🏆</span><span>🏆</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-orange-900/30 font-black text-[10px] md:text-xs uppercase tracking-[0.4em] pointer-events-none flex items-center gap-4">
        <span className="w-12 h-px bg-current opacity-20" />
        Trace and Hold Skills
        <span className="w-12 h-px bg-current opacity-20" />
      </div>
    </div>
  );
};