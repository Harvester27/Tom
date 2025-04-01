'use client';

import React, { useState } from 'react';

const PlayerCareer = ({ onBack, money, xp, level, getXpToNextLevel, getLevelProgress }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  const locations = [
    {
      id: 'home',
      name: 'Domov',
      description: 'Tvůj domov, kde si můžeš odpočinout a prohlédnout své trofeje',
      x: 30,
      y: 20,
      icon: '🏠'
    },
    {
      id: 'stadium',
      name: 'Zimní stadion',
      description: 'Zde probíhají všechny zápasy a tréninky',
      x: 70,
      y: 60,
      icon: '🏟️'
    },
    {
      id: 'shop',
      name: 'Hokejový obchod',
      description: 'Nakup si nové vybavení a vylepši své karty',
      x: 20,
      y: 70,
      icon: '🏪'
    },
    {
      id: 'gym',
      name: 'Posilovna',
      description: 'Zvyš své statistiky tréninkem',
      x: 80,
      y: 30,
      icon: '💪'
    },
    {
      id: 'school',
      name: 'Hokejová akademie',
      description: 'Nauč se nové taktiky a triky',
      x: 50,
      y: 40,
      icon: '🎓'
    }
  ];

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setShowLocationInfo(true);
  };

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
              Mapa města
            </h2>
          </div>

          {/* Mapa */}
          <div className="relative w-full h-[600px] bg-gradient-to-br from-emerald-800/20 to-emerald-600/20 rounded-xl overflow-hidden">
            {/* Cesty */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Hlavní cesty */}
              <path 
                d="M 20,20 L 80,20 L 80,80 L 20,80 L 20,20" 
                className="stroke-slate-400/50 stroke-2 fill-none"
                strokeDasharray="4 2"
              />
              {/* Vedlejší cesty */}
              <path 
                d="M 50,20 L 50,80 M 20,50 L 80,50" 
                className="stroke-slate-400/30 stroke-2 fill-none"
                strokeDasharray="4 2"
              />
              {/* Řeka */}
              <path 
                d="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60" 
                className="stroke-blue-500/30 stroke-[3] fill-none"
                strokeLinecap="round"
              />
            </svg>

            {/* Lokace */}
            {locations.map((location) => (
              <button
                key={location.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                  w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300 hover:scale-110 
                  ${selectedLocation?.id === location.id 
                    ? 'bg-indigo-600/80 ring-4 ring-indigo-400/50' 
                    : 'bg-indigo-500/50 hover:bg-indigo-500/70'}`}
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                onClick={() => handleLocationClick(location)}
              >
                <span className="text-3xl filter drop-shadow-lg">{location.icon}</span>
              </button>
            ))}

            {/* Info panel o lokaci */}
            {showLocationInfo && selectedLocation && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                           w-96 bg-black/80 backdrop-blur-sm rounded-xl p-4 
                           border border-indigo-500/30 text-white">
                <h3 className="text-xl font-bold text-indigo-400 mb-2">
                  {selectedLocation.name}
                </h3>
                <p className="text-indigo-100">
                  {selectedLocation.description}
                </p>
                <button
                  className="mt-4 bg-indigo-500/50 hover:bg-indigo-500/70 
                           px-4 py-2 rounded-lg text-sm transition-colors"
                  onClick={() => setShowLocationInfo(false)}
                >
                  Zavřít
                </button>
              </div>
            )}
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