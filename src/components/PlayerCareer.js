'use client';

import React, { useState } from 'react';

const PlayerCareer = ({ onBack, money, xp, level, getXpToNextLevel, getLevelProgress }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8 overflow-y-auto">
      {/* Stats v levém horním rohu */}
      <div className="fixed top-4 left-4 flex gap-4">
        <div className="bg-black/40 px-6 py-3 rounded-xl border border-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            Peníze: <span className="font-bold text-indigo-400">{money} Kč</span>
          </p>
        </div>
        <div className="bg-black/40 px-6 py-3 rounded-xl border border-indigo-500/20 relative overflow-hidden">
          <p className="text-indigo-100 text-xl relative z-10">
            Level: <span className="font-bold text-indigo-400">{level}</span>
            <span className="ml-1 text-sm text-indigo-200">({xp} XP)</span>
          </p>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" 
               style={{ width: `${getLevelProgress(xp)}%` }}></div>
          <div className="absolute top-1 right-2 text-xs text-indigo-200">
            {getXpToNextLevel(xp)} XP do dalšího levelu
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto">
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-8 border border-indigo-500/20">
          {/* Hlavička */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Kariéra hráče
            </h2>
            <p className="text-indigo-300 mt-2">
              Tato sekce je ve vývoji. Brzy zde najdete statistiky vaší kariéry, úspěchy a další zajímavé informace!
            </p>
          </div>

          {/* Tlačítko pro návrat */}
          <div className="flex justify-center mt-8">
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700
                text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300
                hover:scale-105 active:scale-95 border-2 border-white/20"
            >
              Zpět do menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCareer; 