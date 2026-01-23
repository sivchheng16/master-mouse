import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../../services/audioService';
import { GameHUD } from '../../GameHUD';

interface MarketItem {
    id: number;
    emoji: string;
    name: string;
    x: number;
    y: number;
    inBasket: boolean;
    rotation?: number;
}

const MARKET_ITEMS = [
    { emoji: '🥭', name: 'ស្វាយ' },
    { emoji: '🍌', name: 'ចេក' },
    { emoji: '🥬', name: 'បន្លែ' },
    { emoji: '🐟', name: 'ត្រី' },
    { emoji: '🍚', name: 'អង្ករ' },
    { emoji: '🥥', name: 'ដូង' },
    { emoji: '🌶️', name: 'ម្ទេស' },
    { emoji: '🧅', name: 'ខ្ទឹម' },
    { emoji: '🥕', name: 'ការ៉ុត' },
    { emoji: '🍆', name: 'ត្រប់' },
    { emoji: '🌽', name: 'ពោត' },
    { emoji: '🍊', name: 'ក្រូច' },
    { emoji: '🥚', name: 'ពងមាន់' },
    { emoji: '🍅', name: 'ប៉េងប៉ោះ' },
    { emoji: '🥩', name: 'សាច់គោ' },
    { emoji: '🦀', name: 'ក្តាម' },
];

export const MarketShop: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [items, setItems] = useState<MarketItem[]>([]);
    const [targetItems, setTargetItems] = useState<string[]>([]);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [collected, setCollected] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentCount = count + (round - 1);

    // Grid Configuration
    const GRID_ROWS = 3;
    const GRID_COLS = 4;

    // Calculate precise position for a slot index
    const getSlotPosition = (index: number) => {
        const row = Math.floor(index / GRID_COLS);
        const col = index % GRID_COLS;

        // Horizontal: Cabinet is roughly from 35% to 95% of screen width
        // 4 Columns
        // Start offset approx 40%
        // Col width approx 12.5% to fix drift
        const x = 33 + col * 17.5;

        // Vertical: Shelves at roughly 38%, 56%, 74%
        // Lowered slightly to sit ON the shelf
        const y = 35 + row * 23.5;

        return { x, y };
    };

    const initRound = (r: number) => {
        const numItems = count + (r - 1);
        const shuffled = [...MARKET_ITEMS].sort(() => Math.random() - 0.5);

        // Items to collect (shown in shopping list)
        // Select the first 'numItems' from shuffle as targets
        const targetObjects = shuffled.slice(0, numItems);
        const targets = targetObjects.map(i => i.emoji);
        setTargetItems(targets);

        // Fill the cabinet with items (max 12 slots)
        // 1. Ensure all targets are in the cabinet
        // 2. Fill remainder with other items
        const totalSlots = GRID_ROWS * GRID_COLS;
        const fillerItems = shuffled.slice(numItems); // Items not selected as targets

        // Combine targets + fillers up to totalSlots
        // Note: shuffled already has them in order, simply slicing totalSlots works for content,
        // BUT we want to randomize their POSITION on the shelf.
        // If we just take shuffled.slice(0, totalSlots), the targets (index 0 to numItems) 
        // will always be in the first few slots.

        let cabinetItems = shuffled.slice(0, totalSlots);

        // Shuffle the cabinet items so targets are scattered
        cabinetItems = cabinetItems.sort(() => Math.random() - 0.5);

        const allItems: MarketItem[] = cabinetItems.map((item, i) => {
            const pos = getSlotPosition(i);
            return {
                id: i,
                ...item,
                x: pos.x,
                y: pos.y,
                inBasket: false,
                rotation: Math.random() * 10 - 5,
            };
        });

        setItems(allItems);
        setCollected(0);
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

        const item = items.find(i => i.id === dragging);
        if (!item) {
            setDragging(null);
            return;
        }

        // Check if dropped in basket area (Now Bottom Left: x < 30% && y > 65%)
        const inBasket = dragPos.x < 35 && dragPos.y > 60;

        if (inBasket && targetItems.includes(item.emoji) && !item.inBasket) {
            audioService.playPop();
            setItems(prev => prev.map(i => i.id === dragging ? { ...i, inBasket: true } : i));

            const newCollected = collected + 1;
            setCollected(newCollected);

            if (newCollected === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        } else if (inBasket && !targetItems.includes(item.emoji)) {
            // Wrong item
            audioService.playError();
        }

        setDragging(null);
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => {
                setShowLevelUp(false);
                setRound(r => r + 1);
            }, 2000);
        }, 2000);
    };



    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none font-sans bg-gray-50"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="./market_bg.png"
                    alt="Market Background"
                    className="w-full h-full object-cover filter blur-[2px] scale-105 opacity-80"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
            </div>

            {/* Header / Awning - Cleaner Look */}
            <div className="absolute top-4 left-0 right-0 h-[100px] z-10  flex items-center px-8  ">

                <div className="flex-1 flex items-center gap-5 ">
                    <div className="text-5xl icon-3d ">🏪</div>
                    <div className="space-y-2 ">
                        <h1 className="text-white font-black text-2xl md:text-3xl tracking-wide flex items-baseline gap-3">
                            <span className="text-3d">ផ្សារទំនើប</span>
                            <span className="text-yellow-300 text-3d-yellow">24h</span>
                        </h1>
                        <p className="text-red-100 text-sm font-black opacity-90 drop-shadow-md">ទិញទំនិញស្រស់ៗរាល់ថ្ងៃ!</p>
                    </div>
                </div>

                {/* HUD integrated into header area slightly? No, keep separate for now but cleaner */}
            </div>

            <div className="absolute top-4 left-0 right-0 z-10">
                <GameHUD
                    round={round}
                    totalRounds={totalRounds}
                    instruction="ទិញបន្លែផ្លែឈើដាក់ក្នុងកន្រ្តក! 🧺"
                    score={collected}
                    goal={currentCount}
                    actionType="Click"
                />
            </div>

            {/* Main Content Area */}
            <div className="absolute inset-0 pt-[180px] top-0 bottom-0 flex z-10 p-6 gap-20">

                {/* Left Side: Sidebar (List + Basket + Farmer) */}
                <div className="w-[320px] flex flex-col gap-4 h-full relative z-20 pointer-events-none">

                    {/* Shopping List - Notepad */}
                    <div className="flex-1 bg-yellow-50 rounded-xl shadow-xl border border-gray-200 relative overflow-hidden transform -rotate-1 pointer-events-auto">
                        {/* Top binding */}
                        <div className="h-12 bg-gray-800 flex items-center justify-center relative">
                            <span className="text-white font-bold tracking-widest text-sm">SHOPPING LIST</span>
                        </div>
                        {/* Paper Content */}
                        <div className="p-4 h-full overflow-y-auto custom-scrollbar bg-[linear-gradient(transparent_23px,#e5e7eb_24px)] bg-[size:100%_24px]">
                            <div className="space-y-4 font-handwriting text-xl text-slate-800 pt-1">
                                {targetItems.map((emoji, i) => {
                                    const isCollected = items.find(item => item.emoji === emoji && item.inBasket);
                                    return (
                                        <div key={i} className="flex items-center gap-3 h-[24px]">
                                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all
                                                ${isCollected ? 'border-green-600 bg-green-500 scale-110' : 'border-gray-400 bg-white'}`}>
                                                {isCollected && <span className="font-bold text-white text-xs">✓</span>}
                                            </div>
                                            <span className={`${isCollected ? 'line-through opacity-40 text-gray-400' : ''} flex items-center gap-2 transition-all`}>
                                                <span className="text-2xl drop-shadow-sm">{emoji}</span>
                                                <span className="font-bold text-base">{items.find(it => it.emoji === emoji)?.name}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Red Margin */}
                        <div className="absolute top-12 bottom-0 left-10 w-px bg-red-300 pointer-events-none"></div>
                    </div>

                    {/* Basket & Farmer Area */}
                    <div className="h-[250px] relative mt-4">
                        {/* Farmer - Peeking from left */}
                        {/* <div className="absolute bottom-0 left-[-20px] text-[7rem] z-10 drop-shadow-xl transform -scale-x-100 rotate-12">
                            🧑‍🌾
                        </div> */}

                        {/* Basket */}
                        <div className="absolute bottom-0 right-0 w-64 h-56 group pointer-events-auto">
                            <div className="absolute inset-x-0 bottom-0 top-10 flex justify-center items-end transition-transform duration-300 group-hover:scale-105">
                                <div className="text-[10rem] drop-shadow-2xl z-10 relative">
                                    🧺
                                    {/* Label Badge */}
                                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded-full shadow-md text-sm font-bold text-green-800 whitespace-nowrap border border-green-200">
                                        ដាក់ទីនេះ
                                    </div>
                                </div>
                            </div>

                            {/* Collected items visual feedback - HIDDEN AS REQUESTED */}
                            {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-40 h-32 pointer-events-none z-20">
                                {items.filter(i => i.inBasket).map((item, idx) => {
                                    // Pseudo-random deterministic placement based on ID/index so it doesn't jitter on re-render
                                    // but looks random
                                    const offset = (idx * 73) % 100; // 0-99
                                    const xOffset = (offset % 50) - 25; // -25% to 25% horizontal spread

                                    // Stack in layers: 0-2 at bottom, 3-5 mid, 6+ top
                                    const layer = Math.floor(idx / 3);
                                    const yOffset = layer * 10 - Math.abs(xOffset / 3); // Higher layers go up, middle items slightly lower (bowl shape)

                                    return (
                                        <div key={item.id}
                                            className="absolute text-5xl drop-shadow-sm transition-all duration-300 ease-out"
                                            style={{
                                                left: `${50 + xOffset}%`,
                                                bottom: `${20 + yOffset}%`,
                                                zIndex: 10 + idx,
                                                transform: `translateX(-50%) rotate(${(idx * 45) % 60 - 30}deg)`,
                                            }}
                                        >
                                            {item.emoji}
                                        </div>
                                    );
                                })}
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Right Side: Professional Vegetable Cabinet */}
                <div className="flex-1 h-full relative flex flex-col">
                    {/* Cabinet Frame */}
                    <div className="w-full h-full bg-slate-700 rounded-lg shadow-2xl border-x-8 border-t-8 border-slate-600 relative overflow-hidden flex flex-col">
                        {/* Top Branding */}
                        <div className="h-12 bg-slate-800 border-b border-slate-600 flex items-center justify-between px-6 z-10 shadow-md">
                            <div className="text-slate-400 text-xs font-mono tracking-widest">TEMP: 4°C</div>
                            <div className="text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span> FRESH PRODUCE
                            </div>
                        </div>

                        {/* Cabinet Internal */}
                        <div className="flex-1 bg-slate-600 relative flex flex-col pt-0 pb-0 justify-evenly px-4">
                            {/* Lighting Effect */}
                            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0"></div>

                            {/* Shelves */}
                            <div className="h-full flex flex-col pt-4 pb-2">
                                {[0, 1, 2].map(rowIdx => (
                                    <div key={rowIdx} className="flex-1 relative border-b-[8px] border-slate-800 bg-gradient-to-b from-slate-600 to-slate-700 box-border group shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                                        {/* Shelf Depth/Surface */}
                                        <div className="absolute bottom-[-8px] left-0 right-0 h-2 bg-slate-500 brightness-90"></div>

                                        {/* Back Shadow */}
                                        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/10 blur-sm"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Draggable Items Layer */}
                {items.filter(i => !i.inBasket).map((item, idx) => (
                    <div
                        key={item.id}
                        className={`absolute cursor-grab active:cursor-grabbing flex flex-col items-center justify-center
                        ${dragging === item.id ? 'scale-110 z-50 drop-shadow-2xl' : 'hover:scale-105 z-30 transition-all duration-300'}`}
                        style={{
                            left: dragging === item.id ? `${dragPos.x}%` : `${item.x}%`,
                            top: dragging === item.id ? `${dragPos.y}%` : `${item.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setDragging(item.id);
                            audioService.playHover();
                        }}
                    >
                        {/* Tray Container (Visual only, behind item) */}

                        {/* <div className={`absolute bottom-[28px] w-[100px] h-[30px] bg-slate-900 rounded-lg shadow-xl shadow-black/40
                             ${dragging === item.id ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}> */}
                        {/* Ice / Texture */}
                        {/* <div className="absolute inset-1 bg-sky-200/10 rounded overflow-hidden">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30"></div>
                            </div> */}
                        {/* </div> */}


                        {/* Simple White Label */}
                        <div className={`bg-white px-4 py-0.5 rounded-md shadow-lg flex items-center justify-center min-w-[70px] my-[8px]  z-20 
                            border border-slate-200 ${dragging === item.id ? 'opacity-0' : 'opacity-100'}`}>
                            <span className="text-sm font-bold text-slate-800 font-handwriting tracking-wide">{item.name}</span>
                        </div>

                        {/* Emoji Item */}
                        <div className="relative text-5xl filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] select-none transition-transform active:scale-95 pb-1 z-10">
                            {item.emoji}
                        </div>
                    </div>
                ))}


                {/* Vendor */}
                {/* <div className="absolute bottom-4 right-4 text-7xl md:text-8xl drop-shadow-xl animate-pulse-slow pointer-events-none">
                    👩‍🌾
                </div> */}

                {/* Level up modal */}
                {
                    showLevelUp && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-[10px] border-amber-300 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-yellow-50" style={{ backgroundImage: 'radial-gradient(#fcd34d 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                                <div className="relative z-10">
                                    <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4 drop-shadow-sm">ពូកែណាស់!</h2>
                                    <p className="text-2xl font-black text-amber-800">ទិញបានត្រឹមត្រូវ! 🛒</p>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Completion */}
                {
                    round === totalRounds && collected === currentCount && !showLevelUp && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-[10px] border-green-300 text-center">
                                <h2 className="title-font text-5xl text-green-600 animate-bounce mb-6">ទិញអស់ហើយ! 🎉</h2>
                                <div className="flex justify-center gap-6 text-6xl">
                                    <span className="animate-spin-slow">🥦</span>
                                    <span className="animate-bounce">🧺</span>
                                    <span className="animate-pulse">🍎</span>
                                </div>
                                <button
                                    onClick={onComplete}
                                    className="mt-8 px-8 py-3 bg-green-500 text-white rounded-full text-2xl font-bold shadow-lg hover:bg-green-600 hover:scale-105 transition-all"
                                >
                                    បញ្ចប់ហ្គេម 🏁
                                </button>
                            </div>
                        </div>
                    )
                }
                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;700&family=Patrick+Hand&display=swap');
                .font-handwriting {
                    font-family: 'Patrick Hand', 'Kantumruy Pro', cursive;
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                .text-3d {
                    text-shadow: 
                        0 1px 0 #ccc,
                        0 2px 0 #c9c9c9,
                        0 3px 0 #bbb,
                        0 4px 0 #b9b9b9,
                        0 5px 0 #aaa,
                        0 6px 1px rgba(0,0,0,.1),
                        0 0 5px rgba(0,0,0,.1),
                        0 1px 3px rgba(0,0,0,.3),
                        0 3px 5px rgba(0,0,0,.2),
                        0 5px 10px rgba(0,0,0,.25),
                        0 10px 10px rgba(0,0,0,.2),
                        0 20px 20px rgba(0,0,0,.15);
                }
                .text-3d-yellow {
                    text-shadow: 
                        0 1px 0 #fbbf24,
                        0 2px 0 #f59e0b,
                        0 3px 0 #d97706,
                        0 4px 0 #b45309,
                        0 5px 0 #78350f,
                        0 6px 1px rgba(0,0,0,.1),
                        0 0 5px rgba(0,0,0,.1),
                        0 1px 3px rgba(0,0,0,.3),
                        0 3px 5px rgba(0,0,0,.2);
                }
                .icon-3d {
                    filter: 
                        drop-shadow(0 1px 0 #ccc)
                        drop-shadow(0 2px 0 #bbb)
                        drop-shadow(0 3px 0 #aaa)
                        drop-shadow(0 4px 0 #999)
                        drop-shadow(0 5px 0 #888)
                        drop-shadow(0 10px 5px rgba(0,0,0,0.4));
                    transform: rotate(-5deg);
                }
            `}</style>
            </div >
        </div >
    );
};
