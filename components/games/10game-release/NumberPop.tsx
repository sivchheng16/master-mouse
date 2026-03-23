import React, { useState, useEffect } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

interface NumberPopProps {
  onComplete: () => void;
  total?: number;
}

export const NumberPop: React.FC<NumberPopProps> = ({
  onComplete,
  total = 8,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [next, setNext] = useState(1);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [errorId, setErrorId] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTotal = total + (round - 1) * 4;

  const initRound = (r: number) => {
    const newPositions: { x: number; y: number }[] = [];
    const minDistance = 15;
    const count = total + (r - 1) * 4;

    for (let i = 0; i < count; i++) {
      let x, y, tooClose;
      let attempts = 0;
      do {
        x = 10 + Math.random() * 80;
        y = 20 + Math.random() * 60;
        tooClose = newPositions.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });
        attempts++;
      } while (tooClose && attempts < 200);
      newPositions.push({ x, y });
    }
    setPositions(newPositions);
    setNext(1);
    setIsProcessing(false);
  };

  useEffect(() => {
    initRound(round);
  }, [round, total]);

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound((r) => r + 1);
      }, 2500);
    }, 2000);
  };

  const handleClick = (num: number) => {
    if (isProcessing || showLevelUp || num < next) return;

    if (num === next) {
      audioService.playPop();
      if (num === currentTotal) {
        setIsProcessing(true);
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setNext((n) => n + 1);
          setTimeout(onComplete, 2000);
        }
      } else {
        setNext((n) => n + 1);
      }
    } else {
      audioService.playError();
      setErrorId(num);
      setIsProcessing(true);
      setTimeout(() => {
        setErrorId(null);
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <div
      key={`num-round-${round}`}
      className="relative w-full h-full bg-slate-50 overflow-hidden select-none flex flex-col"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.number_pop_instruction")}
        actionType={languageService.t("game.hud.action_type.click")}
      />

      <div className="flex justify-center pt-12 sm:pt-14 md:pt-16 lg:pt-20 z-20 shrink-0 px-2">
        <div className="bg-white/95 backdrop-blur-md border-1.5 sm:border-2 md:border-3 border-sky-200 px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-2xl sm:rounded-3xl shadow-lg md:shadow-xl flex items-center gap-3 sm:gap-4 md:gap-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-sky-500 rounded-full flex items-center justify-center border-b-6 sm:border-b-8 border-sky-700">
            <span className="text-white font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl">
              {next <= currentTotal ? next : "🎉"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-0">
        {positions.map((p, i) => {
          const num = i + 1;
          const isActive = num === next;
          const isDone = num < next;
          const isError = errorId === num;

          return (
            <div
              key={`num-${round}-${num}`}
              className={`absolute transition-all duration-300 ${isDone ? "z-0" : isActive || isError ? "z-30" : "z-10"}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                onClick={() => handleClick(num)}
                disabled={isDone || showLevelUp}
                className={`w-10 h-10 sm:w-14 sm:h-14 md:w-20 lg:w-24 sm:h-14 md:h-20 lg:h-24 rounded-full text-lg sm:text-2xl md:text-3xl lg:text-5xl font-black transition-all duration-300 border-2 sm:border-3 md:border-4 flex flex-col items-center justify-center shadow-lg relative ${
                  isDone
                    ? "bg-emerald-100 text-emerald-400 border-emerald-200 scale-90 opacity-40"
                    : isError
                      ? "bg-red-500 text-white border-white scale-110 animate-shake"
                      : isActive
                        ? "bg-orange-500 text-white border-white scale-110 shadow-orange-200 animate-wiggle ring-2 sm:ring-3 md:ring-4 ring-orange-200"
                        : "bg-white text-sky-500 border-sky-50 hover:border-sky-300 hover:scale-105 active:scale-95"
                }`}
              >
                <span>{num}</span>
                {isDone && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 text-sm sm:text-lg md:text-2xl lg:text-3xl animate-in zoom-in duration-500">
                    ⭐
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 top-0 flex items-center justify-center bg-black/40 backdrop-blur-lg z-50 animate-in fade-in zoom-in duration-500 p-4">
                <h1
                  className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white 
                         drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] 
                         animate-pulse tracking-wide text-center"
                >
                  {languageService.t("completion.level_up")}
                </h1>
              </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
