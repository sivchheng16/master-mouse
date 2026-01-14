import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface Piece {
  id: number;
  correctIdx: number;
  currentX: number;
  currentY: number;
  isPlaced: boolean;
  row: number;
  col: number;
}

interface PicturePuzzleProps {
  onComplete: () => void;
  gridSize?: number; // e.g., 2 for 2x2
}

const PUZZLE_IMAGE = "https://images.unsplash.com/photo-1590244955328-936660144565?q=80&w=800&auto=format&fit=crop";

const PicturePuzzle: React.FC<PicturePuzzleProps> = ({ onComplete, gridSize = 2 }) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for layout
  const GRID_WIDTH = 45;
  const GRID_START_X = 10;
  const GRID_START_Y = 22;
  const PIECE_SIZE = GRID_WIDTH / gridSize;

  const initPuzzle = () => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Random starting position in the "tray" area (right side of the screen)
      newPieces.push({
        id: i,
        correctIdx: i,
        currentX: 65 + Math.random() * 20,
        currentY: 25 + Math.random() * 55,
        isPlaced: false,
        row,
        col
      });
    }
    setPieces(newPieces);
    setDraggingId(null);
  };

  useEffect(() => {
    initPuzzle();
  }, [gridSize]);

  const handleStart = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isPlaced) return;

    audioService.playDragStart();
    setDraggingId(id);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setOffset({ x: x - piece.currentX, y: y - piece.currentY });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingId === null || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPieces(prev => prev.map(p => 
      p.id === draggingId ? { ...p, currentX: x - offset.x, currentY: y - offset.y } : p
    ));
  };

  const handleEnd = () => {
    if (draggingId === null) return;

    const piece = pieces.find(p => p.id === draggingId);
    if (piece) {
      // Calculate target center position for this piece's row/col
      const targetX = GRID_START_X + (piece.col * PIECE_SIZE) + (PIECE_SIZE / 2);
      const targetY = GRID_START_Y + (piece.row * PIECE_SIZE) + (PIECE_SIZE / 2);

      const distance = Math.sqrt(Math.pow(piece.currentX - targetX, 2) + Math.pow(piece.currentY - targetY, 2));

      // Threshold for snapping
      if (distance < PIECE_SIZE * 0.4) {
        audioService.playCollect();
        const nextPieces = pieces.map(p => 
          p.id === draggingId ? { ...p, currentX: targetX, currentY: targetY, isPlaced: true } : p
        );
        setPieces(nextPieces);
        if (nextPieces.every(p => p.isPlaced)) {
          setTimeout(onComplete, 1800);
        }
      } else {
        audioService.playDragEnd();
      }
    }
    setDraggingId(null);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
      className="relative w-full h-full bg-sky-50/30 overflow-hidden select-none flex flex-col items-center p-4"
    >
      <div className="absolute top-6 bg-white/90 backdrop-blur-md px-10 py-3 rounded-3xl shadow-3d-soft z-20 border-2 border-sky-100 flex items-center gap-4 animate-pop-in">
        <div className="text-sm md:text-xl font-black text-sky-800 tracking-tight">
          មេរៀនផ្គុំរូបភាព ({pieces.filter(p => p.isPlaced).length}/{pieces.length})
        </div>
      </div>

      {/* Target Grid Area */}
      <div 
        className="absolute bg-white/50 border-4 border-dashed border-sky-200 rounded-[2.5rem] overflow-hidden shadow-inner flex items-center justify-center transition-all"
        style={{ 
          left: `${GRID_START_X}%`, 
          top: `${GRID_START_Y}%`, 
          width: `${GRID_WIDTH}%`, 
          aspectRatio: '1/1' 
        }}
      >
        <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {Array.from({ length: gridSize * gridSize }).map((_, i) => (
            <div key={i} className="border border-sky-100/40 flex items-center justify-center relative">
                <div className="text-sky-200/20 font-black text-3xl md:text-5xl">{i + 1}</div>
                {/* Visual slot indicator */}
                <div className="absolute inset-2 rounded-xl bg-sky-900/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Pieces Tray Sidebar Indicator */}
      <div className="absolute right-[8%] top-[25%] bottom-[15%] w-[32%] bg-white/30 rounded-[3rem] border-2 border-white/50 border-dashed pointer-events-none flex flex-col items-center py-6">
        <div className="bg-sky-500/80 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black text-white uppercase tracking-widest shadow-sm">បំណែករូបភាព</div>
      </div>

      {/* Render Pieces */}
      {pieces.map((piece) => (
        <div
          key={piece.id}
          onMouseDown={(e) => handleStart(piece.id, e)}
          onTouchStart={(e) => handleStart(piece.id, e)}
          className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${
            piece.isPlaced ? 'z-10' : draggingId === piece.id ? 'z-50 scale-105 shadow-2xl' : 'z-20 hover:scale-105 shadow-md'
          }`}
          style={{ 
            left: `${piece.currentX}%`, 
            top: `${piece.currentY}%`, 
            width: `${PIECE_SIZE}%`, 
            aspectRatio: '1/1',
            transform: 'translate(-50%, -50%)',
            pointerEvents: piece.isPlaced ? 'none' : 'auto',
            transition: draggingId === piece.id ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div 
            className={`w-full h-full rounded-2xl overflow-hidden border-4 transition-all ${
              piece.isPlaced ? 'border-emerald-400 shadow-none ring-0' : 'border-white ring-4 ring-sky-100 shadow-xl'
            }`}
            style={{
              backgroundImage: `url(${PUZZLE_IMAGE})`,
              backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
              backgroundPosition: `${(piece.col * 100) / (gridSize - 1)}% ${(piece.row * 100) / (gridSize - 1)}%`,
            }}
          >
            {piece.isPlaced && (
               <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-in fade-in duration-500">
                  <span className="text-white text-3xl md:text-5xl drop-shadow-lg">⭐</span>
               </div>
            )}
          </div>
        </div>
      ))}

      {pieces.every(p => p.isPlaced) && pieces.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md z-[60] animate-in zoom-in fade-in duration-700">
          <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-3d-soft border-[10px] border-emerald-100 text-center flex flex-col items-center">
            <div className="w-56 h-56 md:w-80 md:h-80 rounded-[2rem] overflow-hidden mb-8 shadow-2xl ring-4 ring-emerald-400 animate-wiggle">
               <img src={PUZZLE_IMAGE} className="w-full h-full object-cover" alt="Completed" />
            </div>
            <h2 className="title-font text-3xl md:text-6xl text-emerald-600 animate-bounce drop-shadow-sm">រូបភាពស្អាតណាស់! 🌈</h2>
            <p className="mt-4 text-emerald-800 font-bold uppercase tracking-[0.2em] text-xs">រូបភាពត្រូវបានផ្គុំជោគជ័យ!</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sky-400/50 font-black text-[10px] uppercase tracking-[0.4em] pointer-events-none">
        DRAG AND DROP SKILLS TRAINING
      </div>
    </div>
  );
};

export default PicturePuzzle;