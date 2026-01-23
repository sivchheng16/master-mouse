import React from 'react';
import { LevelHistory } from '../../types';
import { languageService } from '@/services/languageService';

interface RankingPageProps {
    onBack: () => void;
    xp: number;
    completedCount: number;
    history: LevelHistory[];
}

export const RankingPage: React.FC<RankingPageProps> = ({ onBack, xp, completedCount, history }) => {
    // Sort history by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans animate-in fade-in slide-in-from-bottom-10 duration-500">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm border-b border-slate-200 flex items-center justify-between shrink-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 group"
                >
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-bold text-slate-600 group-hover:text-slate-900">{languageService.t('account.back')}</span>
                </button>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest leading-none">{languageService.t('ranking.my_stats')}</h1>
                <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-full lg:h-auto">

                    {/* Left Column: Profile & Stats */}
                    <div className="lg:col-span-1 space-y-6 flex flex-col">

                        {/* Box 1: Profile */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center flex-1">
                            <div className="w-28 h-28 bg-white rounded-full p-2 shadow-md mb-4 border-2 border-slate-100">
                                <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center overflow-hidden">
                                    <img src="./guest.png" alt="User" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-1">{languageService.t('account.koompi_user')}</h2>
                            <p className="text-slate-500 font-bold mb-4 uppercase tracking-wider text-xs">Level {Math.floor(completedCount / 5) + 1} {languageService.t('account.level_explorer')}</p>

                            <div className="w-full h-px bg-slate-100 my-4"></div>

                            <div className="text-center">
                                <span className="text-5xl font-black text-yellow-500 block mb-1">{xp}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{languageService.t('account.total_points')}</span>
                            </div>
                        </div>

                        {/* Box 2: Quick Stats */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                                <div className="text-2xl mb-1">⚡</div>
                                <div className="font-black text-lg text-slate-700">{completedCount}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{languageService.t('ranking.xp')}</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                                <div className="text-2xl mb-1">💎</div>
                                <div className="font-black text-lg text-slate-700">{completedCount * 50}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{languageService.t('ranking.gems')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="lg:col-span-2 flex flex-col min-h-[400px]">
                        {/* Box 3: History */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                <h3 className="font-black text-lg text-slate-700 flex items-center gap-2">
                                    <span>📜</span> <span>{languageService.t('ranking.history')}</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{sortedHistory.length} {languageService.t('ranking.record')}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
                                {sortedHistory.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">{languageService.t('ranking.lesson')}</th>
                                                <th className="px-6 py-4">{languageService.t('ranking.date')}</th>
                                                <th className="px-6 py-4 text-right">{languageService.t('ranking.time')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {sortedHistory.map((record, index) => {
                                                const date = new Date(record.completedAt);
                                                return (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-sm">
                                                                    {record.level}
                                                                </div>
                                                                <span className="font-bold text-slate-700">{languageService.t('ranking.lesson_prefix')} {record.level}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 font-medium text-sm">
                                                            {date.toLocaleDateString('km-KH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-sm">
                                                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-10 text-slate-300">
                                        <div className="text-4xl mb-2 grayscale opacity-50">📅</div>
                                        <p className="font-bold">{languageService.t('ranking.no_history')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
