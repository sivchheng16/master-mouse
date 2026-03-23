import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { languageService } from '../services/languageService';

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
  const steps: TutorialStep[] = ['click', 'hover', 'drag', 'double_click'];
  const currentStepIndex = steps.indexOf(step);

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
      className="relative w-full h-full bg-slate-900/40 backdrop-blur-xl overflow-hidden flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl"
    >
      {/* Header with Title and Progress */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none px-4">
        <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-center tracking-tight">
          {languageService.t('tutorial.title')}
        </h2>

        <div className="flex flex-col items-center gap-2 w-full max-w-xs md:max-w-md">
          <div className="flex justify-between w-full text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1 text-shadow-sm">
            <span>Progress</span>
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
          </div>
          <div className="w-full h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-700 ease-out"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 pt-40 pb-20">
        {step === 'click' && (
          <div className="flex flex-col items-center gap-6 md:gap-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-xl md:text-3xl font-black text-white text-center max-w-lg leading-relaxed drop-shadow-sm">
              {languageService.t('tutorial.click_step')}
            </div>
            <button
              onClick={() => {
                audioService.playPop();
                setStep('hover');
              }}
              className="w-32 h-32 md:w-56 md:h-56 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-7xl md:text-9xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent group-hover:from-sky-500/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full bg-white opacity-0 group-hover:opacity-10 rounded-full animate-ping" />
              </div>
              <span className="drop-shadow-2xl">🐭</span>
            </button>
          </div>
        )}

        {step === 'hover' && (
          <div className="flex flex-col items-center gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-5 duration-700 w-full max-w-2xl px-6">
            <div className="text-xl md:text-3xl font-black text-white text-center leading-relaxed drop-shadow-sm">
              {languageService.t('tutorial.hover_step')}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 w-full">
              <div
                onMouseEnter={() => {
                  if (!isHovered) {
                    setIsHovered(true);
                    setHoverDone(true);
                    audioService.playHover();
                  }
                }}
                onMouseLeave={() => setIsHovered(false)}
                className={`relative w-40 h-24 md:w-56 md:h-32 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center text-5xl md:text-7xl border-2 transition-all duration-500 cursor-crosshair group ${isHovered ? 'scale-110 border-sky-400/80 shadow-[0_0_30px_rgba(56,189,248,0.3)] bg-sky-500/10' : 'border-white/10 scale-100'}`}
              >
                <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity blur-md`} />
                <span>☁️</span>
                {(isHovered || hoverDone) && (
                  <div className={`absolute top-[80%] md:top-[90%] text-4xl md:text-6xl ${isHovered ? 'animate-bounce' : 'animate-pulse'}`}>
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
                  className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 md:px-12 md:py-5 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-[0_10px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] transform animate-in zoom-in-90 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  {languageService.t('tutorial.next')}
                </button>
              )}
            </div>
            {!hoverDone && (
              <div className="bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5 text-white/50 text-xs md:text-sm font-bold animate-pulse tracking-wide">
                {languageService.t('tutorial.hover_instruction')}
              </div>
            )}
          </div>
        )}

        {step === 'drag' && (
          <div className="w-full h-full relative animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute top-32 left-1/2 -translate-x-1/2 text-xl md:text-3xl font-black text-white text-center w-full max-w-lg pointer-events-none drop-shadow-sm">
              {languageService.t('tutorial.drag_step')}
            </div>

            <div className="absolute top-[55%] right-[10%] md:right-[15%] -translate-y-1/2 w-40 h-40 md:w-64 md:h-64 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center pointer-events-none bg-white/5 backdrop-blur-[2px]">
              <span className={`text-7xl md:text-[9rem] transition-all duration-500 ${isDragging ? 'opacity-100 filter drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-110' : 'opacity-40 grayscale-[50%]'}`}>🐭</span>
            </div>

            <div
              onMouseDown={startDragging}
              className={`absolute cursor-grab active:cursor-grabbing text-6xl md:text-[5.5rem] transition-all duration-300 select-none ${isDragging ? 'scale-125 z-50 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'hover:scale-110 drop-shadow-lg'}`}
              style={{
                left: `${dragPos.x}%`,
                top: `${dragPos.y}%`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              🧀
            </div>

            <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 text-sky-300 font-black text-xs md:text-sm pointer-events-none uppercase tracking-widest whitespace-nowrap">
              <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
              <span>{languageService.t('tutorial.drag_instruction')}</span>
            </div>
          </div>
        )}

        {step === 'double_click' && (
          <div className="flex flex-col items-center gap-8 md:gap-14 animate-in fade-in slide-in-from-top-5 duration-700 w-full max-w-2xl px-6 py-10">
            <div className="text-xl md:text-3xl font-black text-white text-center leading-relaxed drop-shadow-sm">
              {languageService.t('tutorial.double_click_step')}
            </div>

            <div className="relative group">
              <div className="absolute -inset-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-100" />
              <div
                onDoubleClick={() => {
                  audioService.playSuccess();
                  setTimeout(onComplete, 1200);
                }}
                className="relative w-44 h-44 md:w-72 md:h-72 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[3rem] border-2 border-white/10 flex items-center justify-center text-8xl md:text-[10rem] hover:border-yellow-400/50 hover:bg-white/20 transition-all cursor-pointer active:scale-95 shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="group-hover:scale-110 transition-transform duration-500 transform-gpu filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🎁</div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="px-4 py-2 bg-yellow-400/20 rounded-full border border-yellow-400/30 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">Click</span>
              </div>
              <div className="px-4 py-2 bg-yellow-400/20 rounded-full border border-yellow-400/30 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping delay-150" />
                <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">Click</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Skip Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={onSkip}
          className="pointer-events-auto bg-white/5 hover:bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/5 text-white/40 hover:text-white font-black text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group shadow-lg"
        >
          <span className="opacity-60 group-hover:opacity-100">{languageService.t('tutorial.skip')}</span>
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
