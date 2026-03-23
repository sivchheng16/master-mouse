import React, { useState, useEffect, useCallback } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
}

export const WhackMole: React.FC<{
  onComplete: () => void;
  goal?: number;
  speed?: number;
}> = ({ onComplete, goal = 5, speed = 1000 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [active, setActive] = useState<number | null>(null);
  const [whacked, setWhacked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [language, setLanguage] = useState<"km" | "en">(
    (languageService.getLanguage() as "km" | "en") || "km",
  );

  const currentSpeed = Math.max(400, speed - (round - 1) * 170);
  const currentGoal = goal + (round - 1) * 3;

  useEffect(() => {
    if (showLevelUp || score >= currentGoal) return;

    const timer = setInterval(() => {
      setActive((prev) => {
        let next;
        do {
          next = Math.floor(Math.random() * 9);
        } while (next === prev);
        return next;
      });
      setWhacked(null);
    }, currentSpeed);
    return () => clearInterval(timer);
  }, [currentSpeed, showLevelUp, round, score, currentGoal]);

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = languageService.subscribe(() => {
      setLanguage(languageService.getLanguage() as "km" | "en");
    });
    return unsubscribe;
  }, []);

  const createBoom = () => {
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 50 + Math.random() * 70;
      return {
        id: Math.random(),
        tx: Math.cos(angle) * velocity,
        ty: Math.sin(angle) * velocity,
        color: i % 2 === 0 ? "#ef4444" : "#fbbf24",
      };
    });
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 600);
  };

  const handleClick = useCallback(
    (index: number) => {
      if (showLevelUp || whacked !== null || score >= currentGoal) return;

      if (index === active) {
        audioService.playWhack();
        setWhacked(index);
        setActive(null);
        createBoom();

        const newScore = score + 1;
        setScore(newScore);

        if (newScore >= currentGoal) {
          if (round < totalRounds) {
            setTimeout(() => handleRoundComplete(false), 400);
          } else {
            setTimeout(() => handleRoundComplete(true), 800);
          }
        }
      } else {
        audioService.playHover();
      }
    },
    [active, whacked, score, currentGoal, round, totalRounds, showLevelUp],
  );

  const handleRoundComplete = (isLast: boolean) => {
    audioService.playSuccess();

    if (isLast) {
      setIsGameComplete(true);
      setTimeout(onComplete, 2500);
    } else {
      setTimeout(() => {
        setShowLevelUp(true);
        setTimeout(() => {
          setShowLevelUp(false);
          setScore(0);
          setRound((r) => r + 1);
        }, 2500);
      }, 500);
    }
  };

  return (
    <div
      key={`whack-round-${round}`}
      className="relative w-full h-full bg-emerald-50/30 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden p-1.5 sm:p-2 md:p-3 lg:p-4"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.whack_mole_instruction")}
        score={score}
        goal={currentGoal}
        actionType={languageService.t("game.hud.action_type.click")}
      />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/20 rounded-full blur-[80px]" />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full max-w-[280px] sm:max-w-[320px] md:max-w-md lg:max-w-2xl aspect-square items-center shrink z-10 px-2 sm:px-0">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className={`w-full aspect-square rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center transition-all cursor-pointer shadow-lg sm:shadow-xl active:shadow-inner active:scale-95 relative overflow-hidden group border-2 sm:border-4 ${active === i ? "bg-emerald-100/80 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]" : "bg-white/80 border-transparent hover:bg-white/95"}`}
          >
            <div className="absolute bottom-2 sm:bottom-3 w-3/4 h-1/4 bg-emerald-900/10 rounded-full blur-xl transition-opacity" />
            {active === i && (
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl animate-spring z-10 select-none drop-shadow-lg">
                🐞
              </span>
            )}
            {whacked === i && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl select-none transition-transform duration-200"
                  style={{
                    transform: "scaleY(0.2) scaleX(1.4) translateY(80%)",
                  }}
                >
                  🐞
                </span>
                {particles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute w-1.5 h-1.5 sm:w-2 md:w-2.5 sm:h-2 md:h-2.5 rounded-full"
                    style={
                      {
                        backgroundColor: p.color,
                        transform: `translate(${p.tx}px, ${p.ty}px)`,
                        transition: "transform 0.5s ease-out, opacity 0.5s",
                        opacity: 1,
                      } as any
                    }
                  />
                ))}
                <span className="absolute text-2xl sm:text-3xl md:text-4xl lg:text-5xl animate-ping opacity-60">
                  ✨
                </span>
              </div>
            )}
          </div>
        ))}
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
      {/* 
      {isGameComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500 p-4">
          <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl border-4 sm:border-6 md:border-8 border-emerald-200 text-center transform max-w-sm">
            <h2 className="title-font text-3xl sm:text-4xl md:text-5xl text-emerald-600 animate-bounce mb-3 sm:mb-4 md:mb-6 uppercase">
              {languageService.t("game.whack_mole_complete")}
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-black text-emerald-900">
              {languageService.t("game.excellent_job")}
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};
