import React, { useState, useEffect, useMemo } from "react";
import { audioService } from "../../services/audioService";
import { languageService } from "../../services/languageService";
import { GameHUD } from "../GameHUD";

interface FirecrackerItem {
  id: number;
  x: number;
  y: number;
  fuseProgress: number;
  exploded: boolean;
  missed: boolean;
  speed: number;
  startDelay: number;
}

export const Firecracker: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 5 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [firecrackers, setFirecrackers] = useState<FirecrackerItem[]>([]);
  const [exploded, setExploded] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentCount = count + (round - 1) * 2;

  const initRound = (r: number) => {
    const numFirecrackers = count + (r - 1) * 2;
    const newFirecrackers: FirecrackerItem[] = Array.from({
      length: numFirecrackers,
    }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80, // Random X between 10% and 90%
      y: 20 + Math.random() * 60, // Random Y between 20% and 80%
      fuseProgress: 0,
      exploded: false,
      missed: false,
      speed: 0.5 + r * 0.2 + Math.random() * 0.3,
      startDelay: i * 15 + Math.random() * 10, // Staggered start
    }));
    setFirecrackers(newFirecrackers);
    setExploded(0);
    // Do not reset missedCount here during round transition, only on full restart?
    // Usually missed count resets per level or accumulates?
    // User said "out of time 3 time should appear to start game again", implies 3 strikes total (probably cumulative or per game? Let's assume cumulative for challenge, or maybe per round?
    // Logic suggests 3 lives. Let's keep missedCount across rounds unless user wants per round.
    // Resetting here would make it per round. Let's NOT reset here to make it a game-wide limit.
  };

  const restartGame = () => {
    setRound(1);
    setExploded(0);
    setMissedCount(0);
    setGameOver(false);
    setShowLevelUp(false);
    initRound(1);
  };

  useEffect(() => {
    if (!showLevelUp) initRound(round);
  }, [round, count, showLevelUp]);

  // Animate fuse burning
  useEffect(() => {
    if (showLevelUp || gameOver) return;

    const interval = setInterval(() => {
      setFirecrackers((prev) => {
        let newMisses = 0;
        const nextFirecrackers = prev.map((fc) => {
          if (fc.exploded || fc.missed) return fc;

          if (fc.startDelay > 0) {
            return { ...fc, startDelay: fc.startDelay - 1 };
          }

          // Slow down for 5s red zone (25 units / 100 ticks = 0.25)
          const currentSpeed =
            fc.fuseProgress >= 70 && fc.fuseProgress < 95 ? 0.25 : fc.speed;

          const newProgress = fc.fuseProgress + currentSpeed;

          if (newProgress >= 100) {
            // Missed - fuse burned out
            audioService.playError();
            newMisses++;
            return { ...fc, missed: true, fuseProgress: 100 };
          }

          return { ...fc, fuseProgress: newProgress };
        });

        if (newMisses > 0) {
          setMissedCount((prevMissed) => {
            const totalMissed = prevMissed + newMisses;
            if (totalMissed >= 3) {
              setGameOver(true);
              audioService.playError();
            } else {
              // Check if round should complete despite misses (if no firecrackers left)
              // We need to know if ALL firecrackers are done (exploded or missed)
              // We can check nextFirecrackers from above scope? No, state update is async/functional.
              // Better: Check inside the effect or separate effect.
              // Actually, let's just check if (exploded + totalMissed === currentCount)
              // But exploded is state. We have 'newMisses' here.
              // Let's rely on a separate effect to check for round completion to be safe
              // OR calculate total processed.
            }
            return totalMissed;
          });
        }

        return nextFirecrackers;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showLevelUp, gameOver]);

  // Check for round completion (success or mixed)
  useEffect(() => {
    if (gameOver || showLevelUp) return;

    // Calculate total processed
    const totalProcessed = exploded + missedCount;
    if (totalProcessed >= currentCount && currentCount > 0) {
      if (round < totalRounds) {
        handleRoundComplete();
      } else {
        setTimeout(() => {
          audioService.playSuccess();
          onComplete();
        }, 800);
      }
    }
  }, [
    exploded,
    missedCount,
    currentCount,
    round,
    totalRounds,
    gameOver,
    showLevelUp,
    onComplete,
  ]);

  const handleClick = (firecrackerID: number) => {
    if (gameOver) return;
    const fc = firecrackers.find((f) => f.id === firecrackerID);
    if (!fc || fc.exploded || fc.missed) return;

    // Perfect timing: progress between 70-90%
    if (fc.fuseProgress >= 70 && fc.fuseProgress <= 95) {
      audioService.playExplosion();
      setFirecrackers((prev) =>
        prev.map((f) =>
          f.id === firecrackerID ? { ...f, exploded: true } : f,
        ),
      );

      setExploded((prev) => prev + 1);
      // Completion check is now in useEffect
    } else if (fc.fuseProgress < 70) {
      // Too early
      audioService.playError();
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

  // Decorations
  const decorations = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: ["✨", "🎊", "🎉", "⭐"][i % 4],
        delay: Math.random() * 2,
      })),
    [],
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-indigo-900 via-purple-900 to-black">
      {/* Stars in night sky */}
      {decorations.map((d) => (
        <div
          key={d.id}
          className="absolute text-xl opacity-60 animate-twinkle pointer-events-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            animationDelay: `${d.delay}s`,
          }}
        >
          {d.emoji}
        </div>
      ))}

      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ចុចពេលកាំជ្រួចពណ៌ 🔴 ក្រហម! 🎆"
        score={exploded}
        goal={currentCount}
        lives={3 - missedCount} // Pass lives to HUD if supported, or just show misses customly?
      />

      {/* Lives Indicator */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className={`text-3xl ${i < 3 - missedCount ? "grayscale-0" : "grayscale opacity-30"}`}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Firecrackers */}
      {firecrackers.map((fc) => (
        <div
          key={fc.id}
          className={`absolute transition-all duration-200 ${
            fc.exploded
              ? "scale-150"
              : fc.missed
                ? "opacity-30"
                : "cursor-pointer hover:scale-105"
          } ${fc.startDelay > 0 ? "opacity-0 pointer-events-none" : ""}`}
          style={{
            left: `${fc.x}%`,
            top: `${fc.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          onClick={() =>
            !fc.exploded &&
            !fc.missed &&
            fc.startDelay <= 0 &&
            handleClick(fc.id)
          }
          onMouseEnter={() =>
            !fc.exploded &&
            !fc.missed &&
            fc.startDelay <= 0 &&
            audioService.playHover()
          }
        >
          {/* Firecracker body */}
          <div
            className={`relative ${fc.fuseProgress >= 70 && !fc.exploded && !fc.missed ? "animate-shake" : ""}`}
          >
            {fc.exploded ? (
              // Explosion effect
              <div className="text-6xl animate-explode">💥</div>
            ) : (
              <>
                <div className="text-5xl md:text-6xl">🧨</div>

                {/* Fuse progress indicator */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      fc.fuseProgress >= 70 && fc.fuseProgress <= 95
                        ? "bg-red-500 animate-pulse"
                        : fc.fuseProgress < 70
                          ? "bg-yellow-400"
                          : "bg-gray-400"
                    }`}
                    style={{ width: `${fc.fuseProgress}%` }}
                  />
                </div>

                {/* Perfect zone indicator */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 pointer-events-none">
                  <div
                    className="absolute h-full bg-red-500/30 rounded"
                    style={{ left: "70%", width: "25%" }}
                  />
                </div>

                {/* Spark on fuse */}
                {!fc.missed && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl animate-spark"
                    style={{ left: `${50 + (fc.fuseProgress - 50) * 0.3}%` }}
                  >
                    🔥
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {/* Celebration effects for explosions */}
      {firecrackers
        .filter((fc) => fc.exploded)
        .map((fc) => (
          <div
            key={`effect-${fc.id}`}
            className="absolute pointer-events-none"
            style={{ left: `${fc.x}%`, top: `${fc.y}%` }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-firework"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>
        ))}

      {/* Level up modal */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-300 text-center">
            <h2 className="title-font text-5xl text-white animate-bounce mb-4 drop-shadow-lg">
              អស្ចារ្យ!
            </h2>
            <p className="text-xl font-black text-yellow-100">
              កាំជ្រួចកាន់តែលឿន! 🎆
            </p>
          </div>
        </div>
      )}

      {/* Completion */}
      {round === totalRounds &&
        exploded === currentCount &&
        !showLevelUp &&
        !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-300 text-center">
              <h2 className="title-font text-5xl text-white animate-bounce mb-6 drop-shadow-lg">
                កាំជ្រួចស្រស់ស្អាតណាស់! 🎉
              </h2>
              <div className="flex justify-center gap-4 text-5xl">
                <span className="animate-pulse">🎆</span>
                <span className="animate-bounce">💥</span>
                <span className="animate-pulse">🎆</span>
              </div>
            </div>
          </div>
        )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-b from-red-500 to-red-700 p-12 rounded-[3.5rem] shadow-2xl border-8 border-red-400 text-center">
            <h2 className="title-font text-4xl text-white animate-bounce mb-4 drop-shadow-lg">
              ហ្គេមចាញ់ហើយ!
            </h2>
            <p className="text-lg font-black text-red-100 mb-6">
              អ្នកបានខកខាន ៣ ដង{" "}
            </p>
            <button
              onClick={restartGame}
              className="px-6 py-3 bg-white text-red-600 rounded-full text-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              ព្យាយាមម្តងទៀត 🔄
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes spark {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.3); }
        }
        .animate-spark {
          animation: spark 0.3s ease-in-out infinite;
        }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-explode {
          animation: explode 0.5s ease-out forwards;
        }
        @keyframes firework {
          0% { transform: rotate(var(--angle, 0deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle, 0deg)) translateY(-80px) scale(0); opacity: 0; }
        }
        .animate-firework {
          animation: firework 0.8s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
