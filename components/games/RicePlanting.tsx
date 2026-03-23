import React, { useState, useEffect, useRef } from "react";
import { audioService } from "../../services/audioService";
import { languageService } from "../../services/languageService";
import { GameHUD } from "../GameHUD";

interface Seedling {
  id: number;
  x: number;
  y: number;
  planted: boolean;
}

interface PlotSpot {
  id: number;
  x: number;
  y: number;
  filled: boolean;
}

export const RicePlanting: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 6 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [plots, setPlots] = useState<PlotSpot[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [planted, setPlanted] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCount = count + (round - 1) * 2;

  const initRound = (r: number) => {
    const numSeedlings = count + (r - 1) * 2;
    const newSeedlings = Array.from({ length: numSeedlings }).map((_, i) => ({
      id: i,
      x: 10 + (i % 4) * 20,
      y: 75 + Math.floor(i / 4) * 12,
      planted: false,
    }));

    const newPlots = Array.from({ length: numSeedlings }).map((_, i) => ({
      id: i,
      x: 15 + (i % 4) * 18,
      y: 25 + Math.floor(i / 4) * 15,
      filled: false,
    }));

    setSeedlings(newSeedlings);
    setPlots(newPlots);
    setPlanted(0);
  };

  useEffect(() => {
    if (!showLevelUp) initRound(round);
  }, [round, count, showLevelUp]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseUp = () => {
    if (dragging === null) return;

    const seedling = seedlings.find((s) => s.id === dragging);
    if (!seedling) return;

    // Check if dropped on an empty plot
    const targetPlot = plots.find((p) => {
      const dist = Math.hypot(dragPos.x - p.x, dragPos.y - p.y);
      return dist < 10 && !p.filled;
    });

    if (targetPlot) {
      audioService.playPop();
      setPlots((prev) =>
        prev.map((p) => (p.id === targetPlot.id ? { ...p, filled: true } : p)),
      );
      setSeedlings((prev) =>
        prev.map((s) => (s.id === dragging ? { ...s, planted: true } : s)),
      );

      const newPlanted = planted + 1;
      setPlanted(newPlanted);

      if (newPlanted === currentCount) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(() => {
            audioService.playSuccess();
            onComplete();
          }, 800);
        }
      }
    }

    setDragging(null);
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
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-default"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        background:
          "linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #8B4513 40%, #8B4513 100%)",
      }}
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ដាំស្រូវក្នុងស្រែ!"
        score={planted}
        goal={currentCount}
      />

      {/* Sky with sun */}
      <div className="absolute top-8 right-12 w-20 h-20 bg-yellow-300 rounded-full shadow-[0_0_60px_rgba(255,200,0,0.6)] animate-pulse" />

      {/* Clouds */}
      <div className="absolute top-12 left-[10%] text-6xl opacity-80 animate-float-cloud">
        ☁️
      </div>
      <div
        className="absolute top-20 left-[60%] text-4xl opacity-60 animate-float-cloud"
        style={{ animationDelay: "-5s" }}
      >
        ☁️
      </div>

      {/* Paddy field water effect */}
      <div className="absolute top-[40%] left-0 right-0 h-[35%] bg-gradient-to-b from-[#7CB342]/30 to-[#558B2F]/50 pointer-events-none" />

      {/* Rice paddy plot spots */}
      {plots.map((plot) => (
        <div
          key={`plot-${plot.id}`}
          className={`absolute w-14 h-14 rounded-full transition-all duration-300 ${
            plot.filled
              ? "bg-green-500/80 border-4 border-green-600"
              : "bg-amber-800/40 border-4 border-dashed border-amber-600/60"
          }`}
          style={{
            left: `${plot.x}%`,
            top: `${plot.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {plot.filled && (
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">
              🌱
            </div>
          )}
        </div>
      ))}

      {/* Seedlings to drag */}
      {seedlings
        .filter((s) => !s.planted)
        .map((seedling) => (
          <div
            key={`seedling-${seedling.id}`}
            className={`absolute cursor-grab active:cursor-grabbing transition-transform ${
              dragging === seedling.id
                ? "scale-125 z-50 opacity-75"
                : "hover:scale-110"
            }`}
            style={{
              left:
                dragging === seedling.id ? `${dragPos.x}%` : `${seedling.x}%`,
              top:
                dragging === seedling.id ? `${dragPos.y}%` : `${seedling.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging(seedling.id);
              audioService.playHover();
            }}
          >
            <div className="text-4xl md:text-5xl drop-shadow-lg hover:animate-wiggle">
              🌾
            </div>
          </div>
        ))}

      {/* Level up modal */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-200 text-center">
            <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4 uppercase">
              អស្ចារ្យ!
            </h2>
            <p className="text-xl font-black text-amber-900">
              ស្រែកាន់តែធំ! 🌾🌱
            </p>
          </div>
        </div>
      )}

      {/* Completion message */}
      {round === totalRounds && planted === currentCount && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border-8 border-white text-center">
            <h2 className="title-font text-5xl text-green-600 animate-bounce drop-shadow-lg mb-6">
              ដាំស្រូវរួចហើយ! 🎉
            </h2>
            <div className="flex justify-center gap-4 text-5xl">
              <span className="animate-pulse">🌾</span>
              <span className="animate-bounce">🌱</span>
              <span className="animate-pulse">🌾</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translate(-50%, -50%) rotate(-3deg); }
          50% { transform: translate(-50%, -50%) rotate(3deg); }
        }
        .hover\\:animate-wiggle:hover {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes float-cloud {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        .animate-float-cloud {
          animation: float-cloud 30s linear infinite;
        }
      `}</style>
    </div>
  );
};
