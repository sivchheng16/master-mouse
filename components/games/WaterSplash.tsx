import React, { useState, useEffect, useMemo } from "react";
import { audioService } from "../../services/audioService";
import { languageService } from "../../services/languageService";
import { GameHUD } from "../GameHUD";

interface Person {
  id: number;
  x: number;
  y: number;
  emoji: string;
  splashed: boolean;
  isHappy: boolean;
}

interface Splash {
  id: number;
  x: number;
  y: number;
}

export const WaterSplash: React.FC<{
  onComplete: () => void;
  count?: number;
}> = ({ onComplete, count = 5 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [people, setPeople] = useState<Person[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [splashed, setSplashed] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const PEOPLE_EMOJIS = ["👦", "👧", "👨", "👩", "🧒", "👶"];
  const currentCount = count + (round - 1) * 2;

  const initRound = (r: number) => {
    const numPeople = count + (r - 1) * 2;
    const newPeople = Array.from({ length: numPeople }).map((_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 25 + Math.random() * 50,
      emoji: PEOPLE_EMOJIS[i % PEOPLE_EMOJIS.length],
      splashed: false,
      isHappy: false,
    }));
    setPeople(newPeople);
    setSplashed(0);
  };

  useEffect(() => {
    if (!showLevelUp) initRound(round);
  }, [round, count, showLevelUp]);

  const handleSplash = (personId: number, x: number, y: number) => {
    const person = people.find((p) => p.id === personId);
    if (!person || person.splashed) return;

    audioService.playPop();

    // Create splash effect
    const newSplash: Splash = { id: Date.now(), x, y };
    setSplashes((prev) => [...prev, newSplash]);
    setTimeout(() => {
      setSplashes((prev) => prev.filter((s) => s.id !== newSplash.id));
    }, 600);

    // Mark person as splashed
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId ? { ...p, splashed: true, isHappy: true } : p,
      ),
    );

    const newSplashed = splashed + 1;
    setSplashed(newSplashed);

    if (newSplashed === currentCount) {
      if (round < totalRounds) {
        handleRoundComplete();
      } else {
        setTimeout(() => {
          audioService.playSuccess();
          onComplete();
        }, 800);
      }
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

  // Decorative elements
  const decorations = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        y: 10 + Math.random() * 80,
        emoji: ["🎉", "🎊", "🎋", "🌸", "🌺", "☀️", "🦋", "🐦"][i],
        delay: Math.random() * 2,
      })),
    [],
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-400 via-sky-300 to-green-400">
      {/* Sun */}
      <div className="absolute top-8 right-12 w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_80px_rgba(255,200,0,0.7)] animate-pulse" />

      {/* Decorative flowers and items */}
      {decorations.map((d) => (
        <div
          key={d.id}
          className="absolute text-3xl md:text-4xl opacity-70 animate-float pointer-events-none"
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
        instruction="សង្ក្រាន! ស្រោចទឹកមិត្តភក្តិ! 💦"
        score={splashed}
        goal={currentCount}
      />

      {/* Splash effects */}
      {splashes.map((splash) => (
        <div
          key={splash.id}
          className="absolute pointer-events-none z-40"
          style={{
            left: `${splash.x}%`,
            top: `${splash.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-6xl animate-splash">💦</div>
          {/* Water droplets */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-sky-400 rounded-full animate-droplet"
              style={
                {
                  "--angle": `${i * 45}deg`,
                  "--distance": "80px",
                } as any
              }
            />
          ))}
        </div>
      ))}

      {/* People to splash */}
      {people.map((person) => (
        <div
          key={person.id}
          className={`absolute transition-all duration-300 ${
            person.splashed ? "scale-110" : "cursor-pointer hover:scale-110"
          }`}
          style={{
            left: `${person.x}%`,
            top: `${person.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          onClick={() =>
            !person.splashed && handleSplash(person.id, person.x, person.y)
          }
          onMouseEnter={() => !person.splashed && audioService.playHover()}
        >
          <div
            className={`text-5xl md:text-6xl ${person.splashed ? "animate-wiggle" : "animate-bounce-slow"}`}
          >
            {person.splashed ? "😆" : person.emoji}
          </div>
          {person.splashed && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl animate-float">
              💧
            </div>
          )}
        </div>
      ))}

      {/* Water bucket decoration */}
      <div className="absolute bottom-8 left-8 text-6xl animate-bounce-slow">
        🪣
      </div>
      <div
        className="absolute bottom-8 right-8 text-6xl animate-bounce-slow"
        style={{ animationDelay: "0.5s" }}
      >
        🪣
      </div>

      {/* Level up modal */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200 text-center">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4">
              សប្បាយណាស់!
            </h2>
            <p className="text-xl font-black text-sky-900">
              មានមនុស្សច្រើនជាង! 💦
            </p>
          </div>
        </div>
      )}

      {/* Completion */}
      {round === totalRounds && splashed === currentCount && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-6">
              សួស្តីឆ្នាំថ្មី! 🎉
            </h2>
            <div className="flex justify-center gap-4 text-5xl">
              <span className="animate-pulse">💦</span>
              <span className="animate-bounce">🥳</span>
              <span className="animate-pulse">💦</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes splash {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-splash {
          animation: splash 0.5s ease-out forwards;
        }
        @keyframes droplet {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { 
            transform: translate(
              calc(cos(var(--angle)) * var(--distance)), 
              calc(sin(var(--angle)) * var(--distance))
            ) scale(0); 
            opacity: 0; 
          }
        }
        .animate-droplet {
          animation: droplet 0.6s ease-out forwards;
        }
        @keyframes wiggle {
          0%, 100% { transform: translate(-50%, -50%) rotate(-5deg); }
          50% { transform: translate(-50%, -50%) rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
