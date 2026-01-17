import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

export const PatternMaster: React.FC<{ onComplete: () => void; length?: number; speed?: number }> = ({ onComplete, length = 3, speed = 800 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [sequence, setSequence] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [playing, setPlaying] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initRound = (r: number) => {
    const currentLength = length + (r - 1);
    const newSeq = Array.from({ length: currentLength }).map(() => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    setUserInput([]);
    setPlaying(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= newSeq.length) {
        clearInterval(interval);
        setPlaying(false);
        setActive(null);
        return;
      }

      const currentNote = newSeq[i];
      setActive(currentNote);
      audioService.playPianoNote(currentNote);

      setTimeout(() => setActive(null), speed * 0.7);
      i++;
    }, speed);
  };

  useEffect(() => {
    if (!showLevelUp) initRound(round);
  }, [round, length, showLevelUp]);

  const handleClick = (idx: number) => {
    if (playing || showLevelUp) return;

    const expected = sequence[userInput.length];

    if (idx === expected) {
      audioService.playPianoNote(idx);
      const nextInput = [...userInput, idx];
      setUserInput(nextInput);

      if (nextInput.length === sequence.length) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(() => {
            audioService.playSuccess();
            onComplete();
          }, 800);
        }
      }
    } else {
      audioService.playError();
      setUserInput([]);
      setActive(-1);
      setTimeout(() => setActive(null), 300);
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2500);
  };

  return (
    <div className="relative w-full h-full bg-rose-50 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden shadow-inner">
      <div className="absolute top-4 z-40 flex justify-center w-full px-4">
        <div className="bg-white/90 px-8 py-3 rounded-3xl border-2 border-rose-200 shadow-xl text-center">
          <div className="text-xl md:text-2xl font-black text-rose-800 tracking-tight leading-none">
            ចុចតាមលំនាំដែលបង្ហាញ
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-200 shadow-sm">
        <span className="text-rose-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>



      <div className="mb-6 md:mb-10 text-xl md:text-3xl font-black text-rose-800 text-center drop-shadow-sm uppercase tracking-tight">
        {playing ? 'ចាំមើលគំរូ! (Watch!)' : 'ឥឡូវនេះវេនកូន! (Your Turn!)'}
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8">
        {[
          { emoji: '🍎', color: 'border-red-400' },
          { emoji: '🍌', color: 'border-yellow-400' },
          { emoji: '🍇', color: 'border-purple-400' },
          { emoji: '🍊', color: 'border-orange-400' }
        ].map((item, i) => (
          <button
            key={i}
            onMouseDown={() => !playing && handleClick(i)}
            disabled={playing || showLevelUp}
            className={`w-24 h-24 md:w-36 md:h-36 text-5xl md:text-7xl rounded-[2rem] md:rounded-[3rem] transition-all duration-300 transform border-4 shadow-xl ${active === i
              ? 'bg-white border-sky-400 scale-110 shadow-[0_0_50px_rgba(56,189,248,0.4)] z-10'
              : active === -1
                ? 'bg-red-200 border-red-500 scale-95'
                : 'bg-white border-white hover:scale-105 active:scale-90'
              } ${playing ? 'cursor-default' : 'cursor-pointer active:bg-sky-50'}`}
          >
            <div className={`${active === i ? 'animate-bounce' : ''}`}>
              {item.emoji}
            </div>
          </button>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-rose-100 text-center">
            <h2 className="title-font text-5xl text-rose-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-rose-900">គំរូនឹងវែងជាងមុន! 🍎</p>
          </div>
        </div>
      )}
    </div>
  );
};