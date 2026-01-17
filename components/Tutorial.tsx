import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialStep = 'click' | 'hover' | 'drag' | 'double_click';

const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<TutorialStep>('click');
  const [isHovered, setIsHovered] = useState(false);
  const [hoverDone, setHoverDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 20, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const startDragging = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      audioService.playDragStart();
    }
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));

      setDragPos({ x: clampedX, y: clampedY });

      if (clampedX > 75 && clampedX < 95 && clampedY > 40 && clampedY < 60) {
        setIsDragging(false);
        audioService.playSuccess();
        setStep('double_click');
      }
    }
  };

  const stopDragging = () => {
    if (isDragging) {
      audioService.playDragEnd();
    }
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleDragMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      className="relative w-full h-full bg-sky-950/90 overflow-hidden flex flex-col items-center justify-center p-6 md:p-8"
    >
      <div className="absolute top-6 flex flex-col items-center gap-1 md:gap-2 pointer-events-none">
        <h2 className="title-font text-2xl md:text-4xl text-white drop-shadow-lg text-center">របៀបប្រើប្រាស់ម៉ៅ (Tutorial)</h2>
        <div className="flex gap-2">
          {(['click', 'hover', 'drag', 'double_click'] as TutorialStep[]).map((s) => (
            <div
              key={s}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-500 ${step === s ? 'bg-sky-400 scale-150 shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        {step === 'click' && (
          <div className="flex flex-col items-center gap-4 md:gap-8 animate-in fade-in zoom-in duration-500">
            <div className="text-xl md:text-2xl font-black text-sky-200 text-center">ចុចម៉ៅខាងឆ្វេង ដើម្បីដាស់កូនកណ្ដុរ!</div>
            <button
              onClick={() => {
                audioService.playPop();
                setStep('hover');
              }}
              className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full flex items-center justify-center text-6xl md:text-8xl shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-90 transition-all cursor-pointer relative group"
            >
              <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
              🐭
            </button>
          </div>
        )}

        {step === 'hover' && (
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-in fade-in slide-in-from-right duration-500">
            <div className="text-xl md:text-2xl font-black text-sky-200 text-center">ដាក់ម៉ៅពីលើពពក ដើម្បីឱ្យផ្កាយធ្លាក់មក!</div>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div
                onMouseEnter={() => {
                  setIsHovered(true);
                  setHoverDone(true);
                  audioService.playHover();
                }}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-32 h-20 md:w-40 md:h-24 bg-white rounded-full flex items-center justify-center text-4xl md:text-6xl shadow-xl transition-all duration-500 cursor-crosshair relative ${isHovered ? 'scale-110 shadow-sky-300' : 'scale-100'}`}
              >
                ☁️
                {(isHovered || hoverDone) && (
                  <div className={`absolute top-full mt-4 text-3xl md:text-4xl ${isHovered ? 'animate-bounce' : 'animate-pulse'} star-pop`}>
                    ⭐
                  </div>
                )}
              </div>

              {hoverDone && (
                <button
                  onClick={() => {
                    audioService.playSuccess();
                    setStep('drag');
                  }}
                  className="bg-emerald-500 text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-3xl font-black shadow-lg hover:bg-emerald-600 animate-in fade-in zoom-in hover:scale-105 active:scale-95 transition-all"
                >
                  បន្តទៅមុខទៀត ➔
                </button>
              )}
            </div>
            {!hoverDone && (
              <div className="text-white/40 font-bold animate-pulse text-sm">
                សាកល្បងដាក់ម៉ៅចំកណ្ដាលពពក
              </div>
            )}
          </div>
        )}

        {step === 'drag' && (
          <div className="w-full h-full relative animate-in fade-in slide-in-from-right duration-500">
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-xl md:text-2xl font-black text-sky-200 text-center w-full pointer-events-none">អូសឈីសទៅឱ្យកូនកណ្ដុរ!</div>

            <div className="absolute top-1/2 right-[10%] md:right-[15%] -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border-4 border-dashed border-sky-400/40 rounded-full flex items-center justify-center pointer-events-none">
              <span className={`text-6xl md:text-8xl transition-opacity ${isDragging ? 'opacity-100 animate-pulse' : 'opacity-80'}`}>🐭</span>
            </div>

            <div
              onMouseDown={startDragging}
              className={`absolute cursor-grab active:cursor-grabbing text-5xl md:text-7xl transition-all ${isDragging ? 'scale-125 z-50 drop-shadow-2xl' : 'hover:scale-110 drop-shadow-lg'}`}
              style={{
                left: `${dragPos.x}%`,
                top: `${dragPos.y}%`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              🧀
            </div>

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex items-center gap-4 text-sky-400 font-bold italic text-sm md:text-base pointer-events-none">
              <span className="animate-pulse">ចុចឱ្យជាប់ហើយអូសឈីស...</span>
            </div>
          </div>
        )}

        {step === 'double_click' && (
          <div className="flex flex-col items-center gap-6 md:gap-8 animate-in fade-in slide-in-from-right duration-500">
            <div className="text-xl md:text-2xl font-black text-sky-200 text-center">ចុចឱ្យលឿន <span className="text-yellow-400">២ដង</span> ដើម្បីបើកកាដូ!</div>
            <div
              onDoubleClick={() => {
                audioService.playSuccess();
                setTimeout(onComplete, 1200);
              }}
              className="w-40 h-40 md:w-56 md:h-56 bg-white/10 rounded-[2rem] md:rounded-[3rem] border-4 border-white/20 flex items-center justify-center text-7xl md:text-9xl hover:bg-white/20 transition-all cursor-pointer group active:scale-95 shadow-xl"
            >
              <div className="group-hover:scale-110 transition-transform">🎁</div>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping delay-100" />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSkip}
        className="absolute bottom-4 right-6 text-white/40 hover:text-white font-bold text-xs md:text-sm underline underline-offset-4 transition-colors"
      >
        រំលង (Skip)
      </button>
    </div>
  );
};

export default Tutorial;
