import React from 'react';
import { languageService } from '../../services/languageService';

interface AboutPageProps {
    onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col font-sans animate-in fade-in slide-in-from-bottom-10 duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between shrink-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200 border border-slate-100 group"
                >
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-bold text-slate-600 group-hover:text-slate-900">{languageService.t('account.back')}</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto px-4 pb-12 flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4">

                    {/* Card 1: About Game */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 p-8 md:p-10 animate-in zoom-in-95 duration-500 delay-100 ring-1 ring-slate-100 text-center flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner border bg-slate-700 mb-6 group hover:scale-105 transition-transform duration-500">
                                <img src="./koompi.png" alt="Koompi" className="w-14 h-14 object-contain" />
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 mb-4">{languageService.t('about.app_name')}</h1>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                {languageService.t('about.description')}
                            </p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{languageService.t('account.version')}</p>
                        </div>
                    </div>

                    {/* Card 2: About Team */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 p-8 md:p-10 animate-in zoom-in-95 duration-500 delay-200 ring-1 ring-slate-100 text-center flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border border-blue-100">
                                🛠️
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">{languageService.t('about.team_title')}</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                {languageService.t('about.team_desc')}
                            </p>

                            <a href="https://koompi.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-xl shadow-lg shadow-slate-900/20">
                                <span>🌐</span>
                                <span>{languageService.t('about.website')}</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
