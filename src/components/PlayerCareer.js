'use client';

import React, { useState, useEffect } from 'react';

const PlayerCareer = ({ onBack, money, xp, level, getXpToNextLevel, getLevelProgress }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [temperature, setTemperature] = useState(22);
  const [currentHour, setCurrentHour] = useState(8);
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

  // Funkce pro generování realistického počasí podle měsíce a hodiny
  const generateWeather = (date, hour = 8) => {
    const month = date.getMonth(); // 0-11
    let possibleWeathers = [];
    let baseTemp = 0;
    let tempVariation = 0;

    // Základní nastavení podle měsíce
    switch(month) {
      case 11: // Prosinec
      case 0:  // Leden
      case 1:  // Únor
        possibleWeathers = [
          { type: 'clear', weight: 25, tempMod: 0 },
          { type: 'partlyCloudy', weight: 30, tempMod: -1 },
          { type: 'cloudy', weight: 25, tempMod: -2 },
          { type: 'snow', weight: 15, tempMod: -4 },
          { type: 'snowRain', weight: 5, tempMod: -1 }
        ];
        baseTemp = 0;
        tempVariation = 5;
        break;
      case 2:  // Březen
      case 3:  // Duben
      case 4:  // Květen
        possibleWeathers = [
          { type: 'clear', weight: 30, tempMod: 2 },
          { type: 'partlyCloudy', weight: 25, tempMod: 1 },
          { type: 'cloudy', weight: 20, tempMod: 0 },
          { type: 'rain', weight: 15, tempMod: -2 },
          { type: 'thunderstorm', weight: 10, tempMod: -3 }
        ];
        baseTemp = 15;
        tempVariation = 7;
        break;
      case 5:  // Červen
      case 6:  // Červenec
      case 7:  // Srpen
        possibleWeathers = [
          { type: 'clear', weight: 35, tempMod: 3 },
          { type: 'partlyCloudy', weight: 25, tempMod: 1 },
          { type: 'cloudy', weight: 15, tempMod: 0 },
          { type: 'rain', weight: 15, tempMod: -3 },
          { type: 'thunderstorm', weight: 10, tempMod: -4 }
        ];
        baseTemp = 24;
        tempVariation = 6;
        break;
      case 8:  // Září
      case 9:  // Říjen
      case 10: // Listopad
        possibleWeathers = [
          { type: 'clear', weight: 25, tempMod: 2 },
          { type: 'partlyCloudy', weight: 30, tempMod: 1 },
          { type: 'cloudy', weight: 25, tempMod: 0 },
          { type: 'rain', weight: 15, tempMod: -3 },
          { type: 'fog', weight: 5, tempMod: -1 }
        ];
        baseTemp = 12;
        tempVariation = 8;
        break;
    }

    // Úprava teploty podle denní doby
    const hourModifier = getHourlyTempModifier(hour);
    baseTemp += hourModifier;

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

    // Generování teploty s denním cyklem
    const randomTemp = baseTemp + (Math.random() * 2 - 1) * tempVariation + selectedWeather.tempMod;
    
    return {
      type: selectedWeather.type,
      temperature: Math.round(randomTemp)
    };
  };

  // Funkce pro získání modifikátoru teploty podle hodiny
  const getHourlyTempModifier = (hour) => {
    // Denní cyklus teploty:
    // 5-8: postupný nárůst z nočního minima
    // 9-14: postupný nárůst k dennímu maximu
    // 15-19: postupný pokles
    // 20-4: postupný pokles k nočnímu minimu
    
    if (hour >= 5 && hour <= 8) {
      return -2 + (hour - 5);
    } else if (hour >= 9 && hour <= 14) {
      return 1 + (hour - 9);
    } else if (hour >= 15 && hour <= 19) {
      return 6 - (hour - 15);
    } else {
      return -3;
    }
  };

  // Funkce pro aktualizaci počasí podle hodiny
  const updateHourlyWeather = () => {
    const currentWeather = generateWeather(currentDate, currentHour);
    setWeather(currentWeather.type);
    setTemperature(currentWeather.temperature);
  };

  // Efekt pro aktualizaci času a počasí
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(prev => {
        const newHour = prev + 1;
        if (newHour >= 24) {
          goToNextDay();
          return 8; // Nový den začíná v 8:00
        }
        // Aktualizace počasí při změně hodiny
        const currentWeather = generateWeather(currentDate, newHour);
        setWeather(currentWeather.type);
        setTemperature(currentWeather.temperature);
        return newHour;
      });
    }, 30000); // Každých 30 sekund = 1 herní hodina

    return () => clearInterval(interval);
  }, [currentDate]);

  // Funkce pro posun na další den
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    setCurrentDate(nextDay);
    setCurrentHour(8);
    
    // Generování nového počasí pro další den
    const newWeather = generateWeather(nextDay, 8);
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
      case 'partlyCloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'thunderstorm': return '⛈️';
      case 'snow': return '❄️';
      case 'snowRain': return '🌨️';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  };

  // Funkce pro získání textového popisu počasí
  const getWeatherDescription = () => {
    switch(weather) {
      case 'clear': return 'Jasno';
      case 'partlyCloudy': return 'Polojasno';
      case 'cloudy': return 'Zataženo';
      case 'rain': return 'Déšť';
      case 'thunderstorm': return 'Bouřky';
      case 'snow': return 'Sněžení';
      case 'snowRain': return 'Déšť se sněhem';
      case 'fog': return 'Mlha';
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
            <span className="font-bold text-indigo-400">{currentHour.toString().padStart(2, '0')}:00</span>
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
                weather === 'partlyCloudy' ? '⛅ Polojasno' :
                weather === 'cloudy' ? '☁️ Zataženo' :
                weather === 'rain' ? '🌧️ Déšť' :
                weather === 'thunderstorm' ? '⛈️ Bouřky' :
                weather === 'snow' ? '❄️ Sněžení' :
                '🌨️ Déšť se sněhem'}
            </div>
          </div>

          {/* Hlavní kontejner pro telefon a mapu */}
          <div className="flex gap-8">
            {/* Mobilní telefon */}
            <div className="w-[400px] h-[700px] bg-black rounded-[40px] p-3 relative shadow-2xl border-4 border-gray-800">
              {/* Výřez pro kameru a senzory */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-3xl z-20 flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                <div className="w-4 h-4 rounded-full bg-gray-800"></div>
                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
              </div>
              
              {/* Displej telefonu */}
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] overflow-hidden relative">
                {/* Stavový řádek */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/30 flex items-center justify-between px-6 text-white text-sm">
                  <span>{currentHour.toString().padStart(2, '0')}:{(Math.floor(Date.now() / 1000) % 60).toString().padStart(2, '0')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">5G</span>
                    <span>📶</span>
                    <span>🔋 100%</span>
                  </div>
                </div>

                {/* Hlavní obsah telefonu */}
                <div className="p-8 pt-12">
                  {/* Záložky */}
                  <div className="flex gap-2 mb-6">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors">
                      Zprávy
                    </button>
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors">
                      Kontakty
                    </button>
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors">
                      Kalendář
                    </button>
                  </div>

                  {/* Seznam zpráv (prozatím prázdný) */}
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Žádné nové zprávy</div>
                      <div className="text-white text-xs">Zde se budou zobrazovat vaše zprávy a oznámení</div>
                    </div>
                  </div>
                </div>

                {/* Navigační lišta */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-sm flex items-center justify-around px-6">
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    📱
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    📞
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className={`flex-1 h-[600px] rounded-xl overflow-hidden transition-all duration-1000
              ${weather === 'clear' ? 'bg-gradient-to-br from-blue-800/20 to-blue-600/20' :
                weather === 'partlyCloudy' ? 'bg-gradient-to-br from-blue-800/20 to-gray-600/20' :
                weather === 'cloudy' ? 'bg-gradient-to-br from-gray-800/20 to-gray-600/20' :
                weather === 'rain' ? 'bg-gradient-to-br from-blue-900/20 to-blue-700/20' :
                weather === 'thunderstorm' ? 'bg-gradient-to-br from-gray-900/20 to-purple-800/20' :
                weather === 'snow' ? 'bg-gradient-to-br from-gray-900/20 to-blue-800/20' :
                weather === 'snowRain' ? 'bg-gradient-to-br from-blue-900/20 to-gray-800/20' :
                'bg-gradient-to-br from-gray-800/20 to-gray-700/20'}`}>
              
              {/* Efekty počasí */}
              {weather !== 'clear' && weather !== 'partlyCloudy' && weather !== 'cloudy' && (
                <div className={`absolute inset-0 pointer-events-none
                  ${weather === 'rain' ? 'animate-rain bg-gradient-to-b from-transparent to-blue-500/10' :
                    weather === 'thunderstorm' ? 'animate-storm bg-gradient-to-b from-transparent to-purple-500/20' :
                    weather === 'snow' ? 'animate-snow bg-gradient-to-b from-transparent to-white/10' :
                    weather === 'snowRain' ? 'animate-mixed-precipitation bg-gradient-to-b from-transparent to-blue-500/10' :
                    weather === 'fog' ? 'animate-fog bg-gradient-to-b from-gray-400/20 to-gray-400/10' : ''}`}
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

        @keyframes storm {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes mixed-precipitation {
          0% { background-position: 0% 0%; }
          100% { background-position: 15% 100%; }
        }

        @keyframes fog {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
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

        .animate-storm {
          animation: storm 0.8s linear infinite;
        }

        .animate-mixed-precipitation {
          animation: mixed-precipitation 0.8s linear infinite;
          background-size: 100px 100px;
          background-image: repeating-linear-gradient(
            transparent 0px,
            transparent 5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 10px
          );
        }

        .animate-fog {
          animation: fog 0.8s linear infinite;
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default PlayerCareer; 