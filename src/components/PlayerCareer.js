'use client';

import React, { useState, useEffect } from 'react';

const PlayerCareer = ({ onBack, money, xp, level, getXpToNextLevel, getLevelProgress }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [temperature, setTemperature] = useState(22);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [playerName, setPlayerName] = useState('Nový hráč');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');

  // Funkce pro formátování data
  const formatDate = (date) => {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 
                   'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  };

  // Funkce pro generování realistického počasí podle měsíce
  const generateWeather = (date) => {
    const month = date.getMonth(); // 0-11
    let possibleWeathers = [];
    let baseTemp = 0;
    let tempVariation = 0;

    // Nastavení možného počasí a teplot podle měsíce
    switch(month) {
      case 11: // Prosinec
      case 0:  // Leden
      case 1:  // Únor
        possibleWeathers = [
          { type: 'clear', weight: 30, tempMod: 0 },
          { type: 'cloudy', weight: 40, tempMod: -2 },
          { type: 'snow', weight: 30, tempMod: -4 }
        ];
        baseTemp = 0;
        tempVariation = 5;
        break;
      case 2:  // Březen
      case 3:  // Duben
      case 4:  // Květen
        possibleWeathers = [
          { type: 'clear', weight: 40, tempMod: 2 },
          { type: 'cloudy', weight: 35, tempMod: 0 },
          { type: 'rain', weight: 25, tempMod: -2 }
        ];
        baseTemp = 15;
        tempVariation = 7;
        break;
      case 5:  // Červen
      case 6:  // Červenec
      case 7:  // Srpen
        possibleWeathers = [
          { type: 'clear', weight: 50, tempMod: 3 },
          { type: 'cloudy', weight: 30, tempMod: 0 },
          { type: 'rain', weight: 20, tempMod: -3 }
        ];
        baseTemp = 24;
        tempVariation = 6;
        break;
      case 8:  // Září
      case 9:  // Říjen
      case 10: // Listopad
        possibleWeathers = [
          { type: 'clear', weight: 35, tempMod: 2 },
          { type: 'cloudy', weight: 40, tempMod: 0 },
          { type: 'rain', weight: 25, tempMod: -3 }
        ];
        baseTemp = 12;
        tempVariation = 8;
        break;
    }

    // Vážený výběr počasí
    const totalWeight = possibleWeathers.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedWeather = possibleWeathers[0];
    
    for (const weather of possibleWeathers) {
      random -= weather.weight;
      if (random <= 0) {
        selectedWeather = weather;
        break;
      }
    }

    // Generování teploty
    const randomTemp = baseTemp + (Math.random() * 2 - 1) * tempVariation + selectedWeather.tempMod;
    
    return {
      type: selectedWeather.type,
      temperature: Math.round(randomTemp)
    };
  };

  // Funkce pro posun na další den - aktualizuje i počasí
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    setCurrentDate(nextDay);
    
    // Generování nového počasí pro další den
    const newWeather = generateWeather(nextDay);
    setWeather(newWeather.type);
    setTemperature(newWeather.temperature);
    
    setShowLocationInfo(false);
  };

  // Funkce pro uložení jména hráče
  const savePlayerName = () => {
    if (tempFirstName && tempLastName) {
      setPlayerName(`${tempFirstName} ${tempLastName}`);
      setShowNameModal(false);
      setTempFirstName('');
      setTempLastName('');
    }
  };

  // Nastavení počátečního data a počasí při prvním načtení
  useEffect(() => {
    const startDate = new Date(2024, 5, 1); // Měsíce jsou 0-based, takže 5 = červen
    startDate.setHours(8, 0, 0, 0);
    setCurrentDate(startDate);
    
    // Generování počátečního počasí
    const initialWeather = generateWeather(startDate);
    setWeather(initialWeather.type);
    setTemperature(initialWeather.temperature);
  }, []);

  // Funkce pro získání emoji počasí
  const getWeatherEmoji = () => {
    switch(weather) {
      case 'clear': return '☀️';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      default: return '☀️';
    }
  };

  // Funkce pro získání textového popisu počasí
  const getWeatherDescription = () => {
    switch(weather) {
      case 'clear': return 'Jasno';
      case 'cloudy': return 'Zataženo';
      case 'rain': return 'Déšť';
      case 'snow': return 'Sněžení';
      default: return 'Jasno';
    }
  };

  const locations = [
    {
      id: 'home',
      name: 'Tvůj dům',
      description: 'Luxusní sídlo s výhledem na město. Zde si můžeš odpočinout, prohlédnout trofeje a naplánovat další kroky své kariéry.',
      x: 30,
      y: 20,
      icon: '🏠',
      color: '#FFD700',
      actions: [
        {
          name: 'Jít spát (další den)',
          onClick: goToNextDay
        },
        {
          name: 'Nastavit jméno hráče',
          onClick: () => setShowNameModal(true)
        },
        {
          name: 'Rozdělení atributů',
          onClick: () => console.log('Rozdělení atributů')
        },
        {
          name: 'Prohlídka trofejí',
          onClick: () => console.log('Prohlídka trofejí')
        }
      ]
    },
    {
      id: 'stadium',
      name: 'Zimní stadion',
      description: 'Moderní hokejová aréna s kapacitou 15 000 diváků. Domov tvého týmu a místo, kde se píše historie.',
      x: 70,
      y: 60,
      icon: '🏟️',
      color: '#87CEEB',
      actions: ['Trénink týmu', 'Zápas', 'Prohlídka stadionu']
    },
    {
      id: 'shop',
      name: 'Hokejové centrum',
      description: 'Specializovaný obchod s nejnovějším hokejovým vybavením a možností vylepšení karet hráčů.',
      x: 20,
      y: 70,
      icon: '🏪',
      color: '#98FB98',
      actions: ['Nákup vybavení', 'Vylepšení karet', 'Prodej věcí']
    },
    {
      id: 'gym',
      name: 'Sportovní centrum',
      description: 'Špičkově vybavené fitness centrum s osobními trenéry a rehabilitačním oddělením.',
      x: 80,
      y: 30,
      icon: '💪',
      color: '#FF6B6B',
      actions: ['Silový trénink', 'Rehabilitace', 'Konzultace s trenérem']
    },
    {
      id: 'school',
      name: 'Hokejová akademie',
      description: 'Vzdělávací centrum pro hokejisty. Zde se můžeš naučit nové taktiky a strategii.',
      x: 50,
      y: 40,
      icon: '🎓',
      color: '#DDA0DD',
      actions: ['Studium taktiky', 'Mentoring', 'Analýza zápasů']
    },
    {
      id: 'restaurant',
      name: 'Sportovní restaurace',
      description: 'Restaurace specializovaná na výživu sportovců. Perfektní místo pro týmové porady.',
      x: 40,
      y: 65,
      icon: '🍽️',
      color: '#FFA07A',
      actions: ['Týmová večeře', 'Konzultace s nutričním specialistou', 'Společenská akce']
    },
    {
      id: 'medical',
      name: 'Sportovní klinika',
      description: 'Zdravotnické zařízení specializované na sportovní medicínu a rehabilitaci.',
      x: 60,
      y: 25,
      icon: '🏥',
      color: '#F08080',
      actions: ['Zdravotní prohlídka', 'Rehabilitace', 'Konzultace']
    }
  ];

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setShowLocationInfo(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8 overflow-y-auto">
      {/* Stats v levém horním rohu */}
      <div className="fixed top-4 left-4 flex gap-4 z-50">
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            Peníze: <span className="font-bold text-indigo-400">{money.toLocaleString()} Kč</span>
          </p>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 relative overflow-hidden shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl relative z-10">
            <span className="font-bold text-indigo-400">{playerName}</span>
            <span className="mx-2">•</span>
            Level: <span className="font-bold text-indigo-400">{level}</span>
            <span className="ml-1 text-sm text-indigo-200">({xp} XP)</span>
          </p>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" 
               style={{ width: `${getLevelProgress(xp)}%` }}></div>
          <div className="absolute top-1 right-2 text-xs text-indigo-200">
            {getXpToNextLevel(xp)} XP do dalšího levelu
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            <span className="font-bold text-indigo-400">{formatDate(currentDate)}</span>
            <span className="mx-2">•</span>
            <span className="font-bold text-indigo-400">8:00</span>
          </p>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            <span className="mr-2">{getWeatherEmoji()}</span>
            <span className="font-bold text-indigo-400">{getWeatherDescription()}</span>
            <span className="mx-2">•</span>
            <span className="font-bold text-indigo-400">{temperature}°C</span>
          </p>
        </div>
      </div>

      {/* Modal pro nastavení jména */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-indigo-400 mb-6">Nastavení jména hráče</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-indigo-300 mb-2">Jméno</label>
                <input
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Zadejte jméno"
                />
              </div>
              <div>
                <label className="block text-indigo-300 mb-2">Příjmení</label>
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Zadejte příjmení"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 bg-gray-500/50 hover:bg-gray-500/70 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={savePlayerName}
                  disabled={!tempFirstName || !tempLastName}
                  className={`flex-1 ${
                    tempFirstName && tempLastName
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : 'bg-indigo-500/50 cursor-not-allowed'
                  } text-white font-bold py-2 px-4 rounded-lg transition-colors`}
                >
                  Uložit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full mx-auto">
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-8 border border-indigo-500/20 shadow-xl backdrop-blur-sm">
          {/* Hlavička */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Mapa města
            </h2>
            <div className="text-indigo-300 mt-2">
              {weather === 'clear' ? '☀️ Jasno' :
                weather === 'cloudy' ? '☁️ Zataženo' :
                weather === 'rain' ? '🌧️ Déšť' :
                '❄️ Sněžení'}
            </div>
          </div>

          {/* Mapa */}
          <div className={`relative w-full h-[600px] rounded-xl overflow-hidden transition-all duration-1000
            ${weather === 'clear' ? 'bg-gradient-to-br from-blue-800/20 to-blue-600/20' :
              weather === 'cloudy' ? 'bg-gradient-to-br from-gray-800/20 to-gray-600/20' :
              weather === 'rain' ? 'bg-gradient-to-br from-blue-900/20 to-blue-700/20' :
              'bg-gradient-to-br from-gray-900/20 to-blue-800/20'}`}>
            
            {/* Efekty počasí */}
            {weather !== 'clear' && weather !== 'cloudy' && (
              <div className={`absolute inset-0 pointer-events-none
                ${weather === 'rain' ? 'animate-rain bg-gradient-to-b from-transparent to-blue-500/10' :
                  weather === 'snow' ? 'animate-snow bg-gradient-to-b from-transparent to-white/10' : ''}`}
              />
            )}

            {/* Cesty */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Hlavní cesty */}
              <path 
                d="M 20,20 C 40,20 60,20 80,20 C 80,40 80,60 80,80 C 60,80 40,80 20,80 C 20,60 20,40 20,20" 
                className={`stroke-2 fill-none transition-all duration-1000
                  ${weather === 'clear' ? 'stroke-slate-400/50' :
                    weather === 'cloudy' ? 'stroke-gray-400/50' :
                    weather === 'rain' ? 'stroke-blue-400/30' :
                    'stroke-gray-400/30'}`}
                strokeDasharray="4 2"
              />
              
              {/* Vedlejší cesty */}
              <path 
                d="M 50,20 Q 50,50 50,80 M 20,50 Q 50,50 80,50" 
                className={`stroke-2 fill-none transition-all duration-1000
                  ${weather === 'clear' ? 'stroke-slate-400/30' :
                    weather === 'cloudy' ? 'stroke-gray-400/30' :
                    weather === 'rain' ? 'stroke-blue-400/20' :
                    'stroke-gray-400/20'}`}
                strokeDasharray="4 2"
              />
              
              {/* Řeka */}
              <path 
                d="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60" 
                className={`stroke-[3] fill-none transition-all duration-1000
                  ${weather === 'clear' ? 'stroke-blue-500/30' :
                    weather === 'cloudy' ? 'stroke-gray-500/30' :
                    weather === 'rain' ? 'stroke-blue-700/30' :
                    'stroke-gray-700/30'}`}
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  dur="5s"
                  repeatCount="indefinite"
                  values="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60;
                         M 10,42 Q 30,47 40,37 Q 50,27 60,47 Q 70,67 90,62;
                         M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60"
                />
              </path>
            </svg>

            {/* Lokace */}
            {locations.map((location) => (
              <button
                key={location.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                  w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300 hover:scale-110 
                  ${selectedLocation?.id === location.id 
                    ? 'ring-4 ring-opacity-50 z-20' 
                    : 'hover:z-10'}
                  ${weather === 'rain' ? 'shadow-glow' : 'shadow-lg'}`}
                style={{ 
                  left: `${location.x}%`, 
                  top: `${location.y}%`,
                  backgroundColor: `${location.color}40`,
                  boxShadow: hoveredLocation?.id === location.id 
                    ? `0 0 20px ${location.color}80` 
                    : `0 0 10px ${location.color}40`,
                  borderColor: location.color
                }}
                onClick={() => handleLocationClick(location)}
                onMouseEnter={() => setHoveredLocation(location)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                <span className="text-3xl filter drop-shadow-lg transform transition-transform duration-300 hover:scale-110">
                  {location.icon}
                </span>
                {hoveredLocation?.id === location.id && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                               whitespace-nowrap bg-black/80 text-white text-sm px-2 py-1 
                               rounded-lg pointer-events-none">
                    {location.name}
                  </div>
                )}
              </button>
            ))}

            {/* Info panel o lokaci */}
            {showLocationInfo && selectedLocation && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                           w-96 bg-black/80 backdrop-blur-sm rounded-xl p-6
                           border border-indigo-500/30 text-white
                           animate-slideUp shadow-xl">
                <h3 className="text-2xl font-bold text-indigo-400 mb-2 flex items-center gap-2">
                  <span>{selectedLocation.icon}</span>
                  {selectedLocation.name}
                </h3>
                <p className="text-indigo-100 mb-4">
                  {selectedLocation.description}
                </p>
                <div className="space-y-2">
                  {selectedLocation.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick || (() => {})}
                      className="w-full text-left px-4 py-2 rounded-lg
                               bg-indigo-500/20 hover:bg-indigo-500/30
                               transition-colors duration-200
                               text-indigo-200 hover:text-indigo-100"
                    >
                      {action.name || action}
                    </button>
                  ))}
                </div>
                <button
                  className="mt-4 bg-indigo-500/50 hover:bg-indigo-500/70 
                           px-4 py-2 rounded-lg text-sm transition-colors
                           absolute top-4 right-4"
                  onClick={() => setShowLocationInfo(false)}
                >
                  ✕
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

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes rain {
          0% { background-position: 0% 0%; }
          100% { background-position: 20% 100%; }
        }
        
        @keyframes snow {
          0% { background-position: 0% 0%; }
          100% { background-position: 10% 100%; }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-rain {
          animation: rain 0.8s linear infinite;
          background-size: 100px 100px;
          background-image: repeating-linear-gradient(
            transparent 0px,
            transparent 5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 10px
          );
        }

        .animate-snow {
          animation: snow 3s linear infinite;
          background-size: 100px 100px;
          background-image: radial-gradient(
            circle at 50% 50%,
            white 0.1em,
            transparent 0.2em
          );
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default PlayerCareer; 