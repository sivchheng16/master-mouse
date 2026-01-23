import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

export const ButterflyMaze: React.FC<{ onComplete: () => void; difficulty?: number }> = ({ onComplete, difficulty = 1.0 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [failed, setFailed] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [collisionActive, setCollisionActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGameStarted(false);
    setFailed(false);
    setCollisionActive(false);
  }, [round]);

  const handleWall = () => {
    if (gameStarted && collisionActive && !showLevelUp && !failed) {
      audioService.playError();
      setFailed(true);
      setGameStarted(false);
      setCollisionActive(false);
      setTimeout(() => setFailed(false), 1200);
    }
  };

  const handleStart = (e: React.MouseEvent) => {
    if (!gameStarted && !showLevelUp && !failed) {
      audioService.playGameStart();
      setGameStarted(true);
      setFailed(false);
      updateMousePosition(e);
      // Give a tiny grace period for the hand to adjust
      setTimeout(() => setCollisionActive(true), 400);
    }
  };

  const updateMousePosition = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCompleteRound = () => {
    if (round < totalRounds) {
      audioService.playSuccess();
      setShowLevelUp(true);
      setGameStarted(false);
      setCollisionActive(false);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound(r => r + 1);
      }, 2500);
    } else {
      audioService.playSuccess();
      onComplete();
    }
  };

  const pathHeightPx = Math.max(45, (140 / difficulty) - (round * 15));

  return (
    <div className="relative w-full h-full bg-yellow-50 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={failed ? 'អូស! ប៉ះជញ្ជាំងហើយ! ព្យាយាមម្តងទៀត' : !gameStarted ? 'ចាប់ផ្ដើមពីទង់ជាតិ! 🏁' : 'នាំមេអំបៅទៅរកផ្កា! 🌸'}
      />


      {/* <div className="absolute top-4 text-xl font-black text-yellow-900 text-center w-full uppercase z-20 pointer-events-none px-4  bg-white/90 px-8 py-3 rounded-3xl border-2 border-slate-200 shadow-xl">
      </div>
       */}
      <div
        ref={containerRef}
        onMouseMove={gameStarted ? updateMousePosition : undefined}
        className="w-full max-w-2xl h-64 relative bg-yellow-400 rounded-[2.5rem] overflow-hidden border-8 border-yellow-500/30 shadow-inner"
      >
        <div onMouseEnter={handleWall} className="absolute inset-0 z-0 cursor-no-drop" />

        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 bg-white flex items-center justify-between px-10 border-y-4 border-yellow-200 z-10"
          style={{ height: `${pathHeightPx}px` }}
          onMouseEnter={(e) => e.stopPropagation()}
        >
          <div
            onMouseEnter={handleStart}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl cursor-pointer transition-colors ${gameStarted ? 'bg-green-100 ring-4 ring-green-400' : 'bg-white shadow-md hover:bg-gray-50'}`}
          >
            🏁
          </div>

          <div
            onMouseEnter={() => gameStarted && handleCompleteRound()}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all shadow-lg ${gameStarted ? 'bg-emerald-400 cursor-pointer animate-pulse' : 'bg-gray-200 grayscale opacity-50'}`}
          >
            🌸
          </div>
        </div>

        {gameStarted && (
          <div
            className="absolute pointer-events-none text-4xl z-30 transition-transform duration-75"
            style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
          >
            🦋
          </div>
        )}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-yellow-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-yellow-900">ផ្លូវនឹងតូចជាងមុន! 🦋</p>
          </div>
        </div>
      )}
    </div>
  );
};