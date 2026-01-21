import React from 'react';

interface GameHUDProps {
    round?: number;
    totalRounds?: number;
    instruction?: string;
    progress?: number; // 0-100
    score?: number;
    goal?: number;
    customContent?: React.ReactNode;
}

export const GameHUD: React.FC<GameHUDProps> = ({
    round,
    totalRounds,
    instruction,
    progress,
    score,
    goal,
    customContent
}) => {
    return (
        <>
            {/* Instruction / Title - Top Center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-31 text-center w-full px-4 pointer-events-none">
                <div className="inline-block bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-lg md:text-xl font-bold text-white drop-shadow-md flex items-center gap-3 justify-center min-w-[200px]">
                        {instruction}
                        {(score !== undefined || goal !== undefined) && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-base">
                                {score}{goal !== undefined ? ` / ${goal}` : ''}
                            </span>
                        )}
                        {progress !== undefined && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-base">
                                {Math.floor(progress)}%
                            </span>
                        )}
                    </h2>
                </div>
            </div>

            {/* Round Indicator - Top Right */}
            {(round !== undefined && totalRounds !== undefined) && (
                <div className="absolute top-4 right-8 z-40 animate-in fade-in slide-in-from-right-4 duration-700 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                        <span className="text-white font-bold text-sm md:text-lg tracking-wider drop-shadow-md">
                            ជុំទី {round}/{totalRounds}
                        </span>
                    </div>
                </div>
            )}

            {/* Custom Content (if absolutely needed) */}
            {customContent}
        </>
    );
};
