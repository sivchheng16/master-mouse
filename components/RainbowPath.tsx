import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface RainbowPathProps {
  onComplete: () => void;
  segments?: number;
}

const RainbowPath: React.FC<RainbowPathProps> = ({ onComplete, segments = 8 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [visited, setVisited] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentSegments = segments + (round - 1) * 4;

  useEffect(() => {
    setVisited([]);
  }, [round, segments]);

  const handleEnterSegment = (index: number) => {
    if (failed || showLevelUp) return;
    if (index === 0 || visited.includes(index - 1)) {
      if (!visited.includes(index)) {
        audioService.playTing(visited.length);
        const next = [...visited, index];
        setVisited(next);
        if (next.length === currentSegments) {
          if (round < totalRounds) {
            handleRoundComplete();
          } else {
            setTimeout(onComplete, 1000);
          }
        }
      }
    } else if (!visited.includes(index)) {
      audioService.playError();
      setFailed(true);
      setTimeout(() => {
        setVisited([]);
        setFailed(false);
      }, 1000);
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2000);
  };

  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-pink-400'];

  return (
    <div className="relative w-full h-full bg-indigo-50 overflow-hidden flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
        <span className="text-indigo-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="text-xl md:text-3xl font-black text-indigo-700 text-center mb-10">
        រំកិលម៉ៅតាមផ្លូវឥន្ទធនូ! ({visited.length}/{currentSegments})
      </div>

      <div className="flex w-full max-w-5xl h-32 relative bg-white/30 rounded-full border-2 border-dashed border-indigo-200 overflow-hidden">
        {Array.from({ length: currentSegments }).map((_, i) => (
          <div
            key={i}
            onMouseEnter={() => handleEnterSegment(i)}
            className={`flex-1 h-full transition-colors duration-300 border-r border-white/20 last:border-0 ${visited.includes(i) ? colors[i % colors.length] : 'bg-transparent'}`}
          />
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center">
            <h2 className="title-font text-5xl text-indigo-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-indigo-900">ផ្លូវនឹងវែងជាងមុន! 🌈</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RainbowPath;