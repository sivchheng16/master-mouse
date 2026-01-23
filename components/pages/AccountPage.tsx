import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { languageService } from '../../services/languageService';

interface AccountPageProps {
    onBack: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onBack }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [lang, setLang] = useState(languageService.getLanguage());
    // Force re-render on language change
    const [, setTick] = useState(0);

    useEffect(() => {
        setIsMuted(audioService.isMuted());

        const unsubscribe = languageService.subscribe(() => {
            setLang(languageService.getLanguage());
            setTick(t => t + 1);
        });
        return unsubscribe;
    }, []);

    const handleToggleMute = () => {
        const newMutedState = audioService.toggleMute();
        setIsMuted(newMutedState);
        if (!newMutedState) {
            audioService.playPop();
        }
    };

    const handleLanguageClick = () => {
        audioService.playHover();
        languageService.toggleLanguage();
    };

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

            {/* Centered Card Container */}
            <div className="flex-1 overflow-y-auto px-4 pb-12 flex flex-col items-center justify-center min-h-[500px]">

                {/* The Main Card */}
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 p-8 md:p-10 animate-in zoom-in-95 duration-500 ring-1 ring-slate-100">

                    {/* Profile Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4 group cursor-default">
                            <div className="absolute inset-0 bg-indigo-300 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="w-28 h-28 bg-white rounded-full p-2 relative shadow-lg ring-4 ring-indigo-50">
                                <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center overflow-hidden">
                                    <img src="./guest.png" alt="User" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-400 to-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 border-white shadow-md">
                                
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{languageService.t('account.koompi_user')}</h2>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{languageService.t('account.level_explorer')}</p>
                    </div>

                    {/* Settings List */}
                    <div className="space-y-4 mb-8">

                        {/* Sound Setting */}
                        <div
                            onClick={handleToggleMute}
                            className="bg-slate-50 hover:bg-slate-100 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] border border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isMuted ? 'bg-white text-slate-300 shadow-sm' : 'bg-white text-green-500 shadow-sm'}`}>
                                    {isMuted ? '🔇' : '🔊'}
                                </div>
                                <span className="font-bold text-slate-700 text-lg">{languageService.t('account.sound')}</span>
                            </div>

                            {/* Toggle Switch */}
                            <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${isMuted ? 'bg-slate-200' : 'bg-green-500'}`}>
                                <div className={`h-full aspect-square bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMuted ? 'translate-x-0' : 'translate-x-6'}`}></div>
                            </div>
                        </div>

                        {/* Language Setting */}
                        <div
                            onClick={handleLanguageClick}
                            className="bg-slate-50 hover:bg-slate-100 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] border border-slate-100 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-500 flex items-center justify-center text-2xl shadow-sm">
                                    🌐
                                </div>
                                <span className="font-bold text-slate-700 text-lg">{languageService.t('account.language')}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                                <span className="font-bold text-slate-600 transition-colors uppercase tracking-wider text-sm">
                                    {lang === 'km' ? 'khmer' : 'english'}
                                </span>
                                <span className="text-xl leading-none">{lang === 'km' ? '🇰🇭' : '🇺🇸'}</span>
                            </div>
                        </div>

                    </div>

                    {/* Logout Button */}
                    <button className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-black py-4 rounded-3xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-red-100 hover:border-red-200">
                        <span>{languageService.t('account.logout')}</span>
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{languageService.t('account.version')}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};
