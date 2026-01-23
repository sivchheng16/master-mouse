import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

interface TreasureHuntProps {
  onComplete: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  emoji: string;
  found: boolean;
  name: string;
}

export const TreasureHunt: React.FC<TreasureHuntProps> = ({ onComplete }) => {
  const [activeTargetIdx, setActiveTargetIdx] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [lastSoundTick, setLastSoundTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const targets: Target[] = [
    { id: 0, x: 45, y: 35, emoji: '👑', found: false, name: 'ម្កុដមាស' },
    { id: 1, x: 40, y: 72, emoji: '💎', found: false, name: 'ត្បូងពេជ្រ' },
    { id: 2, x: 78, y: 28, emoji: '🏆', found: false, name: 'ពានរង្វាន់' }
  ];

  const paths = [
    [{ x: 15, y: 30 }, { x: 28, y: 18 }, { x: 45, y: 35 }], // To T1
    [{ x: 45, y: 35 }, { x: 58, y: 55 }, { x: 40, y: 72 }], // To T2
    [{ x: 40, y: 72 }, { x: 72, y: 68 }, { x: 88, y: 48 }, { x: 78, y: 28 }] // To T3
  ];

  const [currentProgress, setCurrentProgress] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (foundCount === targets.length || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    const currentPath = paths[activeTargetIdx];
    let closestDist = 100;
    let pointIndex = -1;

    currentPath.forEach((p, i) => {
      const d = Math.sqrt(Math.pow(p.x - px, 2) + Math.pow(p.y - py, 2));
      if (d < closestDist) {
        closestDist = d;
        pointIndex = i;
      }
    });

    if (closestDist < 8) {
      if (!isFollowing) {
        audioService.playHover();
      }
      setIsFollowing(true);
      const prog = (pointIndex / (currentPath.length - 1));
      if (prog > currentProgress) {
        setCurrentProgress(prog);
        // Play a little tick sound every 20% progress
        const tick = Math.floor(prog * 5);
        if (tick > lastSoundTick) {
          audioService.playBubble();
          setLastSoundTick(tick);
        }
      }
    } else {
      setIsFollowing(false);
    }
  };

  const handleDoubleClick = (idx: number) => {
    if (idx === activeTargetIdx && currentProgress >= 0.9 && !targets[idx].found) {
      audioService.playCollect();
      targets[idx].found = true;
      const nextCount = foundCount + 1;
      setFoundCount(nextCount);
      setLastSoundTick(0);

      if (nextCount < targets.length) {
        setActiveTargetIdx(nextCount);
        setCurrentProgress(0);
      } else {
        audioService.playSuccess();
        setTimeout(onComplete, 3000);
      }
    } else {
      audioService.playError();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full bg-[#f3e5ab] overflow-hidden select-none cursor-crosshair border-[20px] border-[#5d4037] shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"
      style={{
        backgroundImage: `url('https://www.transparenttextures.com/patterns/old-map.png')`,
        borderRadius: '20px'
      }}
    >
      {/* Real Map Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] mix-blend-multiply" />

      {/* Map Decorations */}
      <div className="absolute top-10 left-10 text-7xl opacity-30 rotate-[20deg] pointer-events-none drop-shadow-sm">🧭</div>
      <div className="absolute bottom-12 right-12 text-7xl opacity-30 -rotate-[15deg] pointer-events-none drop-shadow-sm">⚓</div>
      <div className="absolute top-1/2 left-[12%] text-5xl opacity-40 pointer-events-none grayscale">🏔️</div>
      <div className="absolute bottom-[20%] right-[10%] text-6xl opacity-40 pointer-events-none grayscale">🌴</div>
      <div className="absolute bottom-10 left-1/4 text-5xl opacity-30 pointer-events-none animate-pulse">🌊</div>
      <div className="absolute top-24 right-[35%] text-4xl opacity-30 pointer-events-none">💀</div>
      <div className="absolute top-1/4 right-[10%] text-4xl opacity-20 pointer-events-none">⛵</div>

      {/* Burned Edges Mask */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(93,64,55,0.6)]" />

      <GameHUD
        instruction={currentProgress < 0.9 ? "រំកិលម៉ៅតាមគន្លង..." : "ចុច ២ដងលើ \"X\"!"}
        score={foundCount}
        goal={targets.length}
      />

      {/* SVG Path Layer */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
        {paths.map((path, idx) => {
          const pathData = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const isCurrent = idx === activeTargetIdx;
          const isDone = idx < activeTargetIdx;

          return (
            <g key={idx}>
              {/* Burnt Paper Path Background */}
              <path
                d={pathData}
                fill="none"
                stroke="#8b5e3422"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="1 3"
              />
              {/* Interactive Path */}
              {(isCurrent || isDone) && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="3 4"
                  strokeOpacity={isDone ? 1 : Math.max(0.1, currentProgress)}
                  className="transition-all duration-300"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Start Point (Ancient Ship) */}
      <div
        className="absolute w-14 h-14 md:w-20 md:h-20 flex items-center justify-center text-5xl md:text-6xl z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] filter sepia"
        style={{ left: `${paths[0][0].x}%`, top: `${paths[0][0].y}%`, transform: 'translate(-50%, -50%) rotate(-10deg)' }}
      >
        🚢
      </div>

      {/* The Targets (Styled X marks) */}
      {targets.map((t, idx) => {
        const isCurrent = idx === activeTargetIdx;
        const isFound = idx < foundCount;
        const canOpen = isCurrent && currentProgress >= 0.9;

        return (
          <div
            key={t.id}
            className="absolute"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <button
              onDoubleClick={(e) => {
                e.preventDefault();
                handleDoubleClick(idx);
              }}
              onClick={() => {
                // If they single click but canOpen is true, play a hint sound
                if (canOpen) audioService.playHover();
                else audioService.playError();
              }}
              disabled={isFound}
              className={`relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all duration-500 transform ${isFound
                ? 'opacity-0 scale-50 pointer-events-none'
                : canOpen
                  ? 'scale-110 opacity-100 cursor-pointer'
                  : 'scale-90 opacity-40 cursor-not-allowed grayscale'
                }`}
            >
              {/* Hand drawn style X using pseudo elements or emojis */}
              <div className={`relative w-full h-full flex items-center justify-center text-6xl md:text-7xl font-black ${canOpen ? 'text-red-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' : 'text-[#8b5e34]/60'}`}>
                ✖️
              </div>
              {canOpen && (
                <div className="absolute -bottom-2 text-[8px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                  Double Click!
                </div>
              )}
            </button>

            {/* Treasure Content "Pop Out" */}
            {isFound && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-spring z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-ping" />
                  <span className="text-7xl md:text-9xl block filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
                    {t.emoji}
                  </span>
                  <div className="absolute -top-4 -right-4 text-4xl animate-bounce">✨</div>
                </div>
                <div className="bg-[#fdf5e6] backdrop-blur-sm px-5 py-2 rounded-xl border-2 border-[#8b5e34] shadow-2xl -mt-4 transform rotate-2">
                  <span className="text-[12px] md:text-sm font-black text-[#5d4037] whitespace-nowrap uppercase tracking-wide">{t.name}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Mouse Pointer Path Feedback */}
      {isFollowing && foundCount < targets.length && (
        <div
          className="absolute w-10 h-10 bg-red-500/20 rounded-full animate-ping pointer-events-none blur-md"
          style={{
            left: `${paths[activeTargetIdx][Math.floor(currentProgress * (paths[activeTargetIdx].length - 1))].x}%`,
            top: `${paths[activeTargetIdx][Math.floor(currentProgress * (paths[activeTargetIdx].length - 1))].y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Compass / Map Grid Details */}
      <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-black/5 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/5 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-black/5 pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/4 h-[1px] bg-black/5 pointer-events-none" />
      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-black/5 pointer-events-none" />
      <div className="absolute left-0 right-0 top-3/4 h-[1px] bg-black/5 pointer-events-none" />

      {/* Completion Overlay */}
      {foundCount === targets.length && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#5d4037]/30 backdrop-blur-md z-50 animate-in zoom-in fade-in duration-1000">
          <div className="bg-[#fdf5e6] p-12 rounded-[2rem] border-[10px] border-[#8b5e34] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 transform rotate-1">
            <div className="flex gap-6">
              {targets.map(t => (
                <div key={t.id} className="relative">
                  <span className="text-7xl md:text-9xl animate-bounce" style={{ animationDelay: `${t.id * 0.2}s` }}>{t.emoji}</span>
                  <div className="absolute inset-0 bg-yellow-300 blur-xl opacity-20 -z-10 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="title-font text-5xl md:text-7xl text-[#5d4037] uppercase tracking-tighter drop-shadow-md">
                ជោគជ័យដ៏អស្ចារ្យ!
              </h2>
              <div className="mt-4 inline-block bg-emerald-600 text-white font-black px-12 py-4 rounded-3xl shadow-xl text-2xl md:text-3xl animate-pulse ring-4 ring-emerald-200">
                កូនជាកំពូលអ្នករុករក! 🏴‍☠️🏆
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
