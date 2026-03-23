import React, { useState, useRef, useEffect } from "react";
import { audioService } from "../../../services/audioService";
import { languageService } from "../../../services/languageService";
import { GameHUD } from "../../GameHUD";

interface ToySorterProps {
  onComplete: () => void;
  count?: number;
}

interface Toy {
  id: number;
  emoji: string;
  x: number;
  y: number;
  isSorted: boolean;
}

const EMOJIS = [
  "🧸",
  "🚗",
  "🦖",
  "⚽",
  "🚁",
  "🎨",
  "🚀",
  "🚂",
  "🛸",
  "🤖",
  "👾",
  "🎲",
  "🧩",
];

const ToySorter: React.FC<ToySorterProps> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [toys, setToys] = useState<Toy[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [language, setLanguage] = useState<"km" | "en">(
    (languageService.getLanguage() as "km" | "en") || "km",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    const roundCount = count + (r - 1) * 2;
    const initialToys = Array.from({ length: roundCount }).map((_, i) => ({
      id: Math.random(),
      emoji: EMOJIS[i % EMOJIS.length],
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 35,
      isSorted: false,
    }));
    setToys(initialToys);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  useEffect(() => {
    const unsubscribe = languageService.subscribe(() => {
      setLanguage(languageService.getLanguage() as "km" | "en");
    });
    return unsubscribe;
  }, []);

  const handleStart = (id: number) => {
    audioService.playDragStart();
    setDraggingId(id);
  };

  const handleMove = (e: any) => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      setToys((prev) =>
        prev.map((t) => (t.id === draggingId ? { ...t, x, y } : t)),
      );
    }
  };

  const handleEnd = () => {
    if (draggingId !== null) {
      const toy = toys.find((t) => t.id === draggingId);
      if (toy && toy.x > 30 && toy.x < 70 && toy.y > 60) {
        audioService.playCollect();
        const nextToys = toys.map((t) =>
          t.id === draggingId ? { ...t, isSorted: true } : t,
        );
        setToys(nextToys);
        if (nextToys.every((t) => t.isSorted)) {
          if (round < totalRounds) {
            handleRoundComplete();
          } else {
            setTimeout(onComplete, 1000);
          }
        }
      } else {
        audioService.playDragEnd();
      }
      setDraggingId(null);
    }
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

  const sortedCount = toys.filter((t) => t.isSorted).length;
  const currentRoundTotal = count + (round - 1) * 2;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
      className="relative w-full h-full bg-orange-50 overflow-hidden select-none flex flex-col items-center"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={languageService.t("game.toy_sorter_instruction")}
        score={sortedCount}
        goal={currentRoundTotal}
        actionType={languageService.t("game.hud.action_type.drag")}
      />

      <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 w-28 sm:w-36 md:w-48 lg:w-64 h-16 sm:h-20 md:h-32 lg:h-40 bg-orange-200 border-2 sm:border-3 md:border-4 border-orange-400 rounded-b-2xl sm:rounded-b-3xl flex flex-col items-center justify-end p-1.5 sm:p-2 md:p-3 lg:p-4 shadow-inner">
        <div className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl">📦</div>
        <div className="font-black text-orange-800 text-[8px] sm:text-[10px] md:text-xs lg:text-sm uppercase tracking-widest mt-0.5 sm:mt-1">
          {languageService.t("game.toy_sorter_box")}
        </div>
      </div>

      {toys.map(
        (toy) =>
          !toy.isSorted && (
            <div
              key={toy.id}
              onMouseDown={() => handleStart(toy.id)}
              onTouchStart={() => handleStart(toy.id)}
              onMouseEnter={() => audioService.playHover()}
              className={`absolute cursor-grab active:cursor-grabbing text-3xl sm:text-4xl md:text-6xl lg:text-7xl transition-transform ${draggingId === toy.id ? "scale-125 z-50" : "hover:scale-110"}`}
              style={{
                left: `${toy.x}%`,
                top: `${toy.y}%`,
                transform: `translate(-50%, -50%)`,
                transition:
                  draggingId === toy.id
                    ? "none"
                    : "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            >
              {toy.emoji}
            </div>
          ),
      )}

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

      {/* {round === totalRounds &&
        toys.every((t) => t.isSorted) &&
        !showLevelUp && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-30 p-4">
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-orange-600 animate-bounce text-center">
              រៀបចំស្អាតអស់ហើយ! 🧸📦
            </h2>
          </div>
        )} */}
    </div>
  );
};

// Fix: Added missing default export to match import in App.tsx
export default ToySorter;
