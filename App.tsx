import React, { useState, useEffect, useRef } from 'react';
import { GameType } from './types';
import { getEncouragingMessage } from './services/geminiService';
import { audioService } from './services/audioService';
import BalloonPop from './components/BalloonPop';
import MagicGarden from './components/MagicGarden';
import ToySorter from './components/ToySorter';
import RainbowPath from './components/RainbowPath';
import MagicalColors from './components/MagicalColors';
import { DeepSeaScroll } from './components/DeepSeaScroll';
import Tutorial from './components/Tutorial';
import { WhackMole } from './components/WhackMole';
import { BalloonSizer } from './components/BalloonSizer';
import { StarCatcher } from './components/StarCatcher';
import { GemSorter } from './components/GemSorter';
import { ButterflyMaze } from './components/ButterflyMaze';
import { NumberPop } from './components/NumberPop';
import { TraceShape } from './components/TraceShape';
import { Flashlight } from './components/Flashlight';
import { PatternMaster } from './components/PatternMaster';
import { WaterRefill } from './components/WaterRefill';
import { SoapBubbles } from './components/SoapBubbles';
// New Cambodian-themed games
import { RicePlanting } from './components/RicePlanting';
import { KhmerLetter } from './components/KhmerLetter';
import { NoodleMaker } from './components/NoodleMaker';
import { WaterSplash } from './components/WaterSplash';
import { ElephantMarch } from './components/ElephantMarch';
import { TempleBuilder } from './components/TempleBuilder';
import { FruitChop } from './components/FruitChop';
import { KiteFlying } from './components/KiteFlying';
import { LotusBloom } from './components/LotusBloom';
import { CoconutCatch } from './components/CoconutCatch';
import { TukTukDriver } from './components/TukTukDriver';
import { MarketShop } from './components/MarketShop';
import { FishPond } from './components/FishPond';
import { BoatRace } from './components/BoatRace';
import { ColorApsara } from './components/ColorApsara';
import { GeckoHunt } from './components/GeckoHunt';
import { Firecracker } from './components/Firecracker';
import { BobaShake } from './components/BobaShake';
import { PalmClimb } from './components/PalmClimb';
import OfflineStatus from './components/OfflineStatus';
import InstallPwa from './components/InstallPwa';

const LEVELS_PER_CHAPTER = 17;
const TOTAL_LEVELS = 102;

const CHAPTER_THEMES = [
  { name: "សួនស្មៅរីករាយ", objective: "រៀនពីរបៀបចុចម៉ៅដំបូងបង្អស់", color: "bg-[#58cc02]", border: "border-[#46a302]", accent: "bg-[#46a302]", text: "text-[#58cc02]" },
  { name: "ឆ្នេរសមុទ្រពណ៌មាស", objective: "អូស និងទម្លាក់របស់របរ", color: "bg-[#1cb0f6]", border: "border-[#1899d6]", accent: "bg-[#1899d6]", text: "text-[#1cb0f6]" },
  { name: "ព្រៃមន្តអាគម", objective: "ប្រើប្រាស់ប៊ូតុងម៉ៅខាងស្តាំ", color: "bg-[#ff4b4b]", border: "border-[#d33131]", accent: "bg-[#d33131]", text: "text-[#ff4b4b]" },
  { name: "ពិភពបង្អែម", objective: "រៀនប្រើកង់ម៉ៅ (Scroll)", color: "bg-[#ce82ff]", border: "border-[#af67e6]", accent: "bg-[#af67e6]", text: "text-[#ce82ff]" },
  { name: "ជម្រៅទឹកសមុទ្រ", objective: "ហាត់ចុចឱ្យបានលឿន និងច្បាស់", color: "bg-[#ff9600]", border: "border-[#e38600]", accent: "bg-[#e38600]", text: "text-[#ff9600]" },
  { name: "ភ្នំទឹកកក", objective: "ក្លាយជាកំពូលអ្នកប្រើម៉ៅ", color: "bg-[#2b70c9]", border: "border-[#1e4e8d]", accent: "bg-[#1e4e8d]", text: "text-[#2b70c9]" },
];

const SidebarItem = ({ icon, label, active = false, onClick, colorClass = "" }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 border-2 ${active
      ? 'bg-[#ddf4ff] border-[#84d8ff] text-[#1899d6]'
      : `bg-transparent border-transparent text-[#777] hover:bg-[#f7f7f7] ${colorClass}`
      }`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="hidden lg:block text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [levelMap, setLevelMap] = useState<GameType[]>([]);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("តើកូនរួចរាល់សម្រាប់លេងឬនៅ?");
  const [loading, setLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [gameResetKey, setGameResetKey] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompleted = localStorage.getItem('mouse_master_completed_v2');
    const tutorialDone = localStorage.getItem('mouse_master_tutorial_v2');
    const savedLevelMap = localStorage.getItem('mouse_master_level_map_v2');

    if (savedCompleted) {
      try { setCompletedLevels(new Set(JSON.parse(savedCompleted))); } catch (e) { console.error(e); }
    }

    if (savedLevelMap) {
      try { setLevelMap(JSON.parse(savedLevelMap)); } catch (e) { generateAndSaveLevelMap(); }
    } else {
      generateAndSaveLevelMap();
    }

    if (!tutorialDone) setShowTutorial(true);
  }, []);

  useEffect(() => {
    if (completedLevels.size > 0) {
      localStorage.setItem('mouse_master_completed_v2', JSON.stringify(Array.from(completedLevels)));
    }
  }, [completedLevels]);

  // Handle automatic scrolling to next lesson
  useEffect(() => {
    if (currentLevel === 0 && !loading && !showTutorial) {
      // Find the first uncompleted level that is accessible
      let nextLevel = 1;
      for (let i = 1; i <= TOTAL_LEVELS; i++) {
        if (!completedLevels.has(i)) {
          nextLevel = i;
          break;
        }
      }

      // Small delay to ensure the layout is fully ready
      const scrollTimer = setTimeout(() => {
        scrollToLevel(nextLevel);
      }, 150);

      return () => clearTimeout(scrollTimer);
    }
  }, [currentLevel, loading, showTutorial, completedLevels]);

  const scrollToLevel = (lvl: number) => {
    const targetElement = document.getElementById(`level-button-${lvl}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const generateAndSaveLevelMap = () => {
    const types = Object.values(GameType);
    const newMap: GameType[] = [];
    for (let c = 0; c < 6; c++) {
      const shuffled = [...types].sort(() => Math.random() - 0.5);
      newMap.push(...shuffled.slice(0, LEVELS_PER_CHAPTER));
    }
    setLevelMap(newMap);
    localStorage.setItem('mouse_master_level_map_v2', JSON.stringify(newMap));
  };

  const handleLevelComplete = () => {
    const nextCompleted = new Set(completedLevels);
    nextCompleted.add(currentLevel);
    setCompletedLevels(nextCompleted);

    setLoading(true);
    audioService.playSuccess();

    getEncouragingMessage(`មេរៀនទី ${currentLevel}`).then(msg => {
      setMessage(msg);
      setLoading(false);
      setCurrentLevel(0);
      setGameResetKey(0); // Reset key when leaving level
    });
  };

  const handleResetProgress = () => {
    localStorage.removeItem('mouse_master_completed_v2');
    localStorage.removeItem('mouse_master_tutorial_v2');
    setCompletedLevels(new Set());
    setShowTutorial(true);
    setShowResetConfirm(false);
    setCurrentLevel(0);
  };

  const isLevelLocked = (lvl: number) => {
    // Rule: First lesson of ANY chapter is ALWAYS unlocked so kids can jump themes
    if (lvl === 1) return false;
    if ((lvl - 1) % LEVELS_PER_CHAPTER === 0) return false;

    // Rule: Lessons within a chapter require the previous one to be completed
    return !completedLevels.has(lvl - 1);
  };

  const renderGame = () => {
    if (showTutorial) return (
      <Tutorial
        onComplete={() => {
          setShowTutorial(false);
          localStorage.setItem('mouse_master_tutorial_v2', 'true');
        }}
        onSkip={() => setShowTutorial(false)}
      />
    );

    if (loading) return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="w-32 h-32 bg-[#ddf4ff] rounded-full flex items-center justify-center text-7xl animate-bounce mb-8 border-4 border-[#84d8ff]">🤖</div>
        <h2 className="text-4xl font-black text-[#4b4b4b] mb-4">ពូកែណាស់!</h2>
        <p className="text-[#afafaf] font-bold uppercase tracking-[0.2em]">កំពុងរៀបចំមេរៀនបន្ទាប់...</p>
      </div>
    );

    const type = levelMap[currentLevel - 1];
    if (!type) return null;

    const factor = 1 + (currentLevel / TOTAL_LEVELS);

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
        <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentLevel(0);
                setGameResetKey(0);
              }}
              className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-90"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <button
              onClick={() => {
                audioService.playPop();
                setGameResetKey(prev => prev + 1);
              }}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 active:scale-90 active:rotate-180 duration-500 border border-white/10"
              title="លេងម្ដងទៀត"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>

          <div className="flex-1 px-8 md:px-24">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[#58cc02] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(88,204,2,0.5)]"
                style={{ width: `${(currentLevel / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 shadow-xl">
            <span className="text-xl">💎</span>
            <span className="text-white font-black text-lg">{completedLevels.size * 50}</span>
          </div>
        </nav>
        <div className="flex-1 relative min-h-0">
          {(() => {
            const props = { onComplete: handleLevelComplete, key: `game-${currentLevel}-${gameResetKey}` };
            switch (type) {
              case GameType.CLICK: return <BalloonPop {...props} count={Math.floor(5 * factor)} />;
              case GameType.HOVER: return <MagicGarden {...props} count={Math.floor(8 * factor)} />;
              case GameType.DRAG: return <ToySorter {...props} count={Math.floor(3 * factor)} />;
              case GameType.FOLLOW: return <RainbowPath {...props} segments={Math.floor(8 * factor)} />;
              case GameType.WHACK: return <WhackMole {...props} goal={Math.floor(5 * factor)} />;
              case GameType.RIGHT_CLICK: return <MagicalColors {...props} count={Math.floor(4 * factor)} />;
              case GameType.NUMBER_POP: return <NumberPop {...props} total={Math.floor(8 * factor)} />;
              case GameType.TRACE: return <TraceShape {...props} count={Math.floor(12 * factor)} />;
              case GameType.SCROLL: return <DeepSeaScroll {...props} count={Math.floor(3 * factor)} />;
              case GameType.SOAP_BUBBLES: return <SoapBubbles {...props} count={Math.floor(6 * factor)} />;
              case GameType.FLASHLIGHT: return <Flashlight {...props} count={Math.floor(3 * factor)} />;
              case GameType.PATTERN: return <PatternMaster {...props} length={Math.floor(3 * factor)} />;
              case GameType.WATER_REFILL: return <WaterRefill {...props} />;
              case GameType.STAR_CATCH: return <StarCatcher {...props} count={Math.floor(8 * factor)} />;
              case GameType.GEM_SORT: return <GemSorter {...props} count={Math.floor(4 * factor)} />;
              case GameType.MAZE: return <ButterflyMaze {...props} difficulty={factor} />;
              case GameType.SIZE_WHEEL: return <BalloonSizer {...props} tolerance={Math.max(5, Math.floor(15 / factor))} />;
              // New Cambodian-themed games
              case GameType.RICE_PLANTING: return <RicePlanting {...props} count={Math.floor(6 * factor)} />;
              case GameType.KHMER_LETTER: return <KhmerLetter {...props} count={Math.floor(3 * factor)} />;
              case GameType.NOODLE_MAKER: return <NoodleMaker {...props} count={Math.floor(4 * factor)} />;
              case GameType.WATER_SPLASH: return <WaterSplash {...props} count={Math.floor(5 * factor)} />;
              case GameType.ELEPHANT_MARCH: return <ElephantMarch {...props} count={Math.floor(3 * factor)} />;
              case GameType.TEMPLE_BUILDER: return <TempleBuilder {...props} count={Math.floor(5 * factor)} />;
              case GameType.FRUIT_CHOP: return <FruitChop {...props} count={Math.floor(6 * factor)} />;
              case GameType.KITE_FLYING: return <KiteFlying {...props} count={Math.floor(3 * factor)} />;
              case GameType.LOTUS_BLOOM: return <LotusBloom {...props} count={Math.floor(5 * factor)} />;
              case GameType.COCONUT_CATCH: return <CoconutCatch {...props} count={Math.floor(8 * factor)} />;
              case GameType.TUK_TUK: return <TukTukDriver {...props} count={Math.floor(3 * factor)} />;
              case GameType.MARKET_SHOP: return <MarketShop {...props} count={Math.floor(5 * factor)} />;
              case GameType.FISH_POND: return <FishPond {...props} count={Math.floor(5 * factor)} />;
              case GameType.BOAT_RACE: return <BoatRace {...props} count={Math.floor(3 * factor)} />;
              case GameType.COLOR_APSARA: return <ColorApsara {...props} count={Math.floor(6 * factor)} />;
              case GameType.GECKO_HUNT: return <GeckoHunt {...props} count={Math.floor(6 * factor)} />;
              case GameType.FIRECRACKER: return <Firecracker {...props} count={Math.floor(5 * factor)} />;
              case GameType.BOBA_SHAKE: return <BobaShake {...props} count={Math.floor(3 * factor)} />;
              case GameType.PALM_CLIMB: return <PalmClimb {...props} count={Math.floor(3 * factor)} />;
              default: return <BalloonPop {...props} />;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-['Quicksand'] selection:bg-[#84d8ff]">
      <aside className="hidden md:flex w-20 lg:w-64 border-r-2 border-[#e5e5e5] flex-col p-4 shrink-0 overflow-y-auto">
        <div className="mb-10 px-4">
          <h1
            onClick={() => window.location.reload()}
            className="title-font text-[#58cc02] text-2xl lg:text-3xl tracking-tighter hover:scale-105 transition-transform cursor-pointer"
          >
            កូនកណ្ដុរ
          </h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon="🏠" label="ទំព័រដើម" active={currentLevel === 0} onClick={() => setCurrentLevel(0)} />
          <SidebarItem icon="🏆" label="ចំណាត់ថ្នាក់" />
          <SidebarItem icon="👤" label="គណនី" />
          <SidebarItem icon="⚙️" label="កំណត់" onClick={() => setShowResetConfirm(true)} />
        </nav>
        <div className="mt-auto border-t-2 border-[#e5e5e5] pt-4 px-2">
          <div className="flex items-center gap-3 bg-[#f7f7f7] p-3 rounded-2xl border-2 border-[#e5e5e5] group cursor-default">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-[#e5e5e5] group-hover:scale-110 transition-transform">🤖</div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-[10px] font-black text-[#afafaf] uppercase tracking-widest leading-none mb-1">Botsky</p>
              <p className="text-xs font-bold text-[#4b4b4b] truncate">{message}</p>
            </div>
          </div>
        </div>
      </aside>

      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col items-center scroll-smooth">
        {currentLevel === 0 ? (
          <div className="w-full max-w-2xl py-12 px-4 animate-in fade-in duration-700">
            {CHAPTER_THEMES.map((chapter, chapterIdx) => (
              <section key={chapterIdx} className="mb-20">
                <div className={`w-full rounded-3xl p-6 md:p-8 mb-16 text-white shadow-[0_6px_0_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.01] ${chapter.color}`}>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-black text-lg md:text-xl uppercase tracking-[0.2em] opacity-80 mb-2">ជំពូក {chapterIdx + 1}</h3>
                      <h2 className="title-font text-2xl md:text-4xl leading-tight mb-2">{chapter.name}</h2>
                      <p className="font-bold text-white/90 text-sm md:text-base">{chapter.objective}</p>
                    </div>
                    <button
                      onClick={() => scrollToLevel(chapterIdx * LEVELS_PER_CHAPTER + 1)}
                      className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all border-b-4 border-black/20 shrink-0"
                    >
                      🚀 ចុចទៅទីនេះ
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-14">
                  {Array.from({ length: LEVELS_PER_CHAPTER }).map((_, i) => {
                    const lvlNum = chapterIdx * LEVELS_PER_CHAPTER + i + 1;
                    const isCompleted = completedLevels.has(lvlNum);
                    const isLocked = isLevelLocked(lvlNum);
                    const isActive = !isLocked && !isCompleted;
                    const windingOffset = Math.sin(i * 0.7) * 90;

                    return (
                      <div
                        key={lvlNum}
                        id={`level-button-${lvlNum}`}
                        className="relative flex flex-col items-center group"
                        style={{ marginLeft: `${windingOffset}px` }}
                      >
                        {/* Tooltip - Always visible for Active level, otherwise on hover */}
                        <div className={`absolute bottom-full mb-4 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-30 ${isActive ? 'opacity-100 scale-100 animate-float-level-tiny' : 'opacity-0 group-hover:opacity-100'}`}>
                          <div className="bg-[#4b4b4b] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase whitespace-nowrap shadow-2xl border-2 border-white/10">
                            មេរៀនទី {lvlNum}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[10px] border-x-transparent border-t-[10px] border-t-[#4b4b4b]" />
                          </div>
                        </div>

                        <button
                          disabled={isLocked}
                          onClick={() => {
                            audioService.playGameStart();
                            setCurrentLevel(lvlNum);
                          }}
                          className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all duration-300 border-b-[10px] active:border-b-0 active:translate-y-2 focus:outline-none ${isCompleted
                            ? 'bg-[#ffc800] border-[#e38600] text-white shadow-xl'
                            : isActive
                              ? `${chapter.color} ${chapter.border} text-white animate-bounce-active shadow-2xl ring-4 ring-offset-4 ring-sky-100`
                              : 'bg-[#e5e5e5] border-[#afafaf] text-[#afafaf] cursor-default'
                            }`}
                        >
                          <span className="text-4xl md:text-5xl drop-shadow-md">
                            {isCompleted ? '⭐' : isActive ? '🎯' : '🔒'}
                          </span>

                          {isActive && (
                            <div className="absolute -left-24 top-0 bot-float-side hidden sm:block pointer-events-none">
                              <div className="bg-white px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] shadow-lg relative mb-2">
                                <p className="text-[10px] font-black text-[#58cc02] uppercase tracking-wider">តោះលេង!</p>
                                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-l-8 border-l-[#e5e5e5]" />
                              </div>
                              <div className="w-14 h-14 bg-[#ddf4ff] rounded-full border-2 border-[#84d8ff] flex items-center justify-center text-3xl shadow-md ml-auto animate-pulse">🤖</div>
                            </div>
                          )}
                        </button>

                        <div className="mt-4 text-center">
                          <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isLocked ? 'text-[#afafaf]' : chapter.text}`}>
                            {isCompleted ? 'ជោគជ័យ' : isActive ? 'ចាប់ផ្ដើម' : 'បិទជិត'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {renderGame()}
      </main>

      <aside className="hidden xl:flex w-80 border-l-2 border-[#e5e5e5] flex-col p-6 gap-6 shrink-0 overflow-y-auto bg-[#fafafa]/50">
        <div className="flex gap-4 justify-between bg-white border-2 border-[#e5e5e5] p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xl">🔥</span>
            <span className="font-black text-[#ff9600] text-lg">0</span>
            <span className="text-[10px] font-bold text-[#afafaf] uppercase">ថ្ងៃ</span>
          </div>
          <div className="w-px bg-[#e5e5e5] h-10 self-center" />
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xl">💎</span>
            <span className="font-black text-[#1cb0f6] text-lg">{completedLevels.size * 50}</span>
            <span className="text-[10px] font-bold text-[#afafaf] uppercase">រង្វាន់</span>
          </div>
          <div className="w-px bg-[#e5e5e5] h-10 self-center" />
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xl">❤️</span>
            <span className="font-black text-[#ff4b4b] text-lg">5</span>
            <span className="text-[10px] font-bold text-[#afafaf] uppercase">បេះដូង</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#e5e5e5] p-6 rounded-3xl shadow-sm">
          <h4 className="font-black text-[#4b4b4b] uppercase text-xs tracking-widest mb-5">ការរីកចម្រើនសរុប</h4>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-xs font-black text-[#afafaf] uppercase">
              <span>មេរៀនសរុប</span>
              <span className="text-[#4b4b4b]">{completedLevels.size}/{TOTAL_LEVELS}</span>
            </div>
            <div className="h-5 bg-[#e5e5e5] rounded-full overflow-hidden border-2 border-[#e5e5e5]">
              <div
                className="h-full bg-[#58cc02] transition-all duration-1000"
                style={{ width: `${(completedLevels.size / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-[#afafaf] italic text-center">កូនកំពុងធ្វើបានយ៉ាងអស្ចារ្យ!</p>
          </div>
        </div>

        <div className="bg-white border-2 border-[#e5e5e5] p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-[#4b4b4b] uppercase text-xs tracking-widest">ចំណាត់ថ្នាក់</h4>
            <button className="text-[#1cb0f6] font-black text-[10px] uppercase hover:underline">មើលទាំងអស់</button>
          </div>
          <div className="flex flex-col gap-5">
            {[
              { name: "កូនខ្លា", xp: 5250, icon: "🐯", me: false },
              { name: "បងនាគ", xp: 4850, icon: "🐲", me: false },
              { name: "អ្នក (You)", xp: completedLevels.size * 100, icon: "🤖", me: true }
            ].sort((a, b) => b.xp - a.xp).map((user, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${user.me ? 'bg-[#ddf4ff] border-2 border-[#84d8ff]' : 'border-2 border-transparent hover:bg-gray-50'}`}>
                <span className={`font-black w-5 text-center ${i === 0 ? 'text-[#ffc800]' : 'text-[#afafaf]'}`}>{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-[#e5e5e5] text-xl shadow-sm">{user.icon}</div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-black truncate leading-none mb-1 ${user.me ? 'text-[#1899d6]' : 'text-[#4b4b4b]'}`}>{user.name}</p>
                  <p className="text-[10px] text-[#afafaf] font-black uppercase tracking-wider">{user.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 text-center shadow-2xl border-b-8 border-[#e5e5e5] animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-7xl mb-6">⚙️</div>
            <h2 className="title-font text-3xl text-[#4b4b4b] mb-4">កំណត់ឡើងវិញ?</h2>
            <p className="font-bold text-[#777] mb-8 leading-relaxed">តើកូនចង់លុបការរីកចម្រើនទាំងអស់ ហើយចាប់ផ្ដើមមេរៀនពីដំបូងឡើងវិញមែនទេ?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResetProgress}
                className="w-full bg-[#ff4b4b] hover:bg-[#d33131] text-white font-black py-4 rounded-2xl border-b-4 border-black/20 transition-all uppercase tracking-widest text-sm"
              >
                យល់ព្រម លុបវាចេញ
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-white hover:bg-gray-100 text-[#afafaf] font-black py-4 rounded-2xl border-2 border-[#e5e5e5] border-b-4 transition-all uppercase tracking-widest text-sm"
              >
                ទេ ទុកវាដដែល
              </button>
            </div>
          </div>
        </div>
      )}

      <OfflineStatus />
      <InstallPwa />
    </div>
  );
};

export default App;