'use client';

import React, { useState, useCallback, useMemo } from 'react';

/**
 * Komponenta pro vykreslení mapy s lokacemi
 */
export const LocationMap = ({
  locations,
  currentDate,
  currentHour,
  weather,
  hockeyPractice,
  selectedLocation,
  setSelectedLocation,
  showLocationInfo,
  setShowLocationInfo,
  isHockeyPracticeDay,
  isBeforePractice,
  onLocationAction
}) => {
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // Funkce pro zpracování kliknutí na lokaci
  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(location);
    setShowLocationInfo(true);
  }, [setSelectedLocation, setShowLocationInfo]);

  // Funkce pro získání třídy animace počasí
  const getWeatherAnimationClass = useCallback(() => {
    if (weather === 'clear' || weather === 'partlyCloudy' || weather === 'cloudy') {
      return '';
    }
    
    switch (weather) {
      case 'rain': 
        return 'animate-rain bg-gradient-to-b from-transparent to-blue-500/10';
      case 'thunderstorm': 
        return 'animate-storm bg-gradient-to-b from-transparent to-purple-500/20';
      case 'snow': 
        return 'animate-snow bg-gradient-to-b from-transparent to-white/10';
      case 'snowRain': 
        return 'animate-mixed-precipitation bg-gradient-to-b from-transparent to-blue-500/10';
      case 'fog': 
        return 'animate-fog bg-gradient-to-b from-gray-400/20 to-gray-400/10';
      default:
        return '';
    }
  }, [weather]);

  // Funkce pro získání stylu cest podle počasí
  const getRoadStyles = useMemo(() => {
    let mainRoadStyle = 'stroke-2 fill-none transition-all duration-1000 ';
    let secondaryRoadStyle = 'stroke-2 fill-none transition-all duration-1000 ';
    let riverStyle = 'stroke-[3] fill-none transition-all duration-1000 ';
    
    switch (weather) {
      case 'clear':
        mainRoadStyle += 'stroke-slate-400/50';
        secondaryRoadStyle += 'stroke-slate-400/30';
        riverStyle += 'stroke-blue-500/30';
        break;
      case 'cloudy':
        mainRoadStyle += 'stroke-gray-400/50';
        secondaryRoadStyle += 'stroke-gray-400/30';
        riverStyle += 'stroke-gray-500/30';
        break;
      case 'rain':
      case 'thunderstorm':
      case 'snowRain':
        mainRoadStyle += 'stroke-blue-400/30';
        secondaryRoadStyle += 'stroke-blue-400/20';
        riverStyle += 'stroke-blue-700/30';
        break;
      default:
        mainRoadStyle += 'stroke-gray-400/30';
        secondaryRoadStyle += 'stroke-gray-400/20';
        riverStyle += 'stroke-gray-700/30';
    }
    
    return { mainRoadStyle, secondaryRoadStyle, riverStyle };
  }, [weather]);

  // Funkce pro zpracování kliknutí na akci lokace
  const handleLocationAction = useCallback((location, action) => {
    if (typeof action === 'object' && action.onClick) {
      action.onClick();
    } else if (onLocationAction) {
      onLocationAction(location, action);
    }
  }, [onLocationAction]);

  return (
    <div className="flex-1 h-[600px] bg-indigo-900/30 rounded-xl overflow-hidden relative border border-indigo-500/30">
      {/* Weather effects overlay */}
      {weather !== 'clear' && weather !== 'partlyCloudy' && weather !== 'cloudy' && (
        <div className={`absolute inset-0 pointer-events-none z-0 ${getWeatherAnimationClass()}`} />
      )}
      
      {/* Roads and River */}
      <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100">
        {/* Main city border */}
        <path 
          d="M 20,20 C 40,20 60,20 80,20 C 80,40 80,60 80,80 C 60,80 40,80 20,80 C 20,60 20,40 20,20" 
          className={getRoadStyles.mainRoadStyle}
          strokeDasharray="4 2"
        />
        {/* Main streets */}
        <path 
          d="M 50,20 Q 50,50 50,80 M 20,50 Q 50,50 80,50" 
          className={getRoadStyles.secondaryRoadStyle}
          strokeDasharray="4 2"
        />
        {/* River */}
        <path 
          d="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60" 
          className={getRoadStyles.riverStyle}
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
      
      {/* Locations */}
      <div className="absolute inset-0 z-10">
        {locations.map((location) => {
          const isHockeyDay = location.id === 'stadium' && 
                             hockeyPractice && 
                             isHockeyPracticeDay(currentDate, hockeyPractice) && 
                             isBeforePractice(currentHour, hockeyPractice);
          return (
            <button
              key={location.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 hover:scale-110 
                ${location.id === 'stadium' && isHockeyDay ? 'animate-pulse-strong' : 'hover:z-20'}
                ${weather === 'rain' ? 'shadow-glow' : 'shadow-lg'}`}
              style={{
                left: `${location.x}%`,
                top: `${location.y}%`,
                backgroundColor: `${location.color}40`,
                boxShadow: hoveredLocation?.id === location.id
                  ? `0 0 20px ${location.color}80`
                  : isHockeyDay
                  ? `0 0 30px rgba(255, 255, 255, 0.8)`
                  : `0 0 10px ${location.color}40`,
                borderColor: location.color
              }}
              onClick={() => handleLocationClick(location)}
              onMouseEnter={() => setHoveredLocation(location)}
              onMouseLeave={() => setHoveredLocation(null)}
            >
              {/* Hokejový trénink notifikace */}
              {isHockeyDay && (
                <>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full" />
                </>
              )}
              
              {/* Ikona lokace */}
              <span className="text-3xl filter drop-shadow-lg transform transition-transform duration-300 hover:scale-110">
                {location.icon}
              </span>
              
              {/* Tooltip při hoveru */}
              {hoveredLocation?.id === location.id && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                               whitespace-nowrap bg-black/80 text-white text-sm px-2 py-1 
                               rounded-lg pointer-events-none z-30">
                  {location.name}
                  {isHockeyDay && (
                    <span className="ml-2 text-red-400">• Hokej v {hockeyPractice.time}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Informační panel lokace */}
      {showLocationInfo && selectedLocation && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                      w-96 bg-black/80 backdrop-blur-sm rounded-xl p-6
                      border border-indigo-500/30 text-white
                      animate-slideUp shadow-xl z-20">
          <h3 className="text-2xl font-bold text-indigo-400 mb-2 flex items-center gap-2">
            <span>{selectedLocation.icon}</span>
            {selectedLocation.name}
          </h3>
          <p className="text-indigo-100 mb-4">
            {selectedLocation.description}
          </p>
          <div className="space-y-2">
            {Array.isArray(selectedLocation.actions) && selectedLocation.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleLocationAction(selectedLocation, action)}
                className="w-full text-left px-4 py-2 rounded-lg
                          bg-indigo-500/20 hover:bg-indigo-500/30
                          transition-colors duration-200
                          text-indigo-200 hover:text-indigo-100"
              >
                {typeof action === 'object' ? action.name : action}
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
  );
};

/**
 * Hook pro správu lokací a jejich interakcí
 */
export function useLocationMap() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  
  // Výchozí definice lokací
  const defaultLocations = [
    {
      id: 'home',
      name: 'Tvůj dům',
      description: 'Luxusní sídlo s výhledem na město. Zde si můžeš odpočinout, prohlédnout trofeje a naplánovat další kroky své kariéry.',
      x: 30,
      y: 20,
      icon: '🏠',
      color: '#FFD700',
      actions: []
    },
    {
      id: 'stadium',
      name: 'Zimní stadion',
      description: 'Moderní hokejová aréna s kapacitou 15 000 diváků. Domov tvého týmu a místo, kde se píše historie.',
      x: 70,
      y: 60,
      icon: '🏟️',
      color: '#87CEEB',
      actions: []
    },
    {
      id: 'shop',
      name: 'Hokejové centrum',
      description: 'Specializovaný obchod s nejnovějším hokejovým vybavením a možností vylepšení karet hráčů.',
      x: 20,
      y: 70,
      icon: '🏪',
      color: '#98FB98',
      actions: []
    },
    {
      id: 'gym',
      name: 'Sportovní centrum',
      description: 'Špičkově vybavené fitness centrum s osobními trenéry a rehabilitačním oddělením.',
      x: 80,
      y: 30,
      icon: '💪',
      color: '#FF6B6B',
      actions: []
    },
    {
      id: 'school',
      name: 'Hokejová akademie',
      description: 'Vzdělávací centrum pro hokejisty. Zde se můžeš naučit nové taktiky a strategii.',
      x: 50,
      y: 40,
      icon: '🎓',
      color: '#DDA0DD',
      actions: []
    },
    {
      id: 'restaurant',
      name: 'Sportovní restaurace',
      description: 'Restaurace specializovaná na výživu sportovců. Perfektní místo pro týmové porady.',
      x: 40,
      y: 65,
      icon: '🍽️',
      color: '#FFA07A',
      actions: []
    },
    {
      id: 'medical',
      name: 'Sportovní klinika',
      description: 'Zdravotnické zařízení specializované na sportovní medicínu a rehabilitaci.',
      x: 60,
      y: 25,
      icon: '🏥',
      color: '#F08080',
      actions: []
    }
  ];
  
  const [locations, setLocations] = useState(defaultLocations);
  
  // Funkce pro aktualizaci dostupných akcí pro lokaci
  const updateLocationActions = useCallback((locationId, actions) => {
    setLocations(prevLocations => 
      prevLocations.map(loc => 
        loc.id === locationId ? { ...loc, actions } : loc
      )
    );
  }, []);
  
  // Funkce pro aktualizaci konkrétní lokace
  const updateLocation = useCallback((locationId, updatedData) => {
    setLocations(prevLocations => 
      prevLocations.map(loc => 
        loc.id === locationId ? { ...loc, ...updatedData } : loc
      )
    );
  }, []);
  
  // Funkce pro přidání nové lokace
  const addLocation = useCallback((newLocation) => {
    setLocations(prevLocations => [...prevLocations, newLocation]);
  }, []);
  
  // Funkce pro smazání lokace
  const removeLocation = useCallback((locationId) => {
    setLocations(prevLocations => 
      prevLocations.filter(loc => loc.id !== locationId)
    );
  }, []);

  return {
    locations,
    selectedLocation,
    setSelectedLocation,
    showLocationInfo,
    setShowLocationInfo,
    updateLocationActions,
    updateLocation,
    addLocation,
    removeLocation
  };
}

/**
 * Funkce pro kontrolu, zda je den hokejového tréninku
 */
export function isHockeyPracticeDay(currentDate, hockeyPractice) {
  if (!hockeyPractice || !hockeyPractice.date) {
    return false;
  }
  
  const practiceDate = new Date(hockeyPractice.date);
  
  return currentDate.getDate() === practiceDate.getDate() &&
         currentDate.getMonth() === practiceDate.getMonth() &&
         currentDate.getFullYear() === practiceDate.getFullYear();
}

/**
 * Funkce pro kontrolu, zda je před tréninkem
 */
export function isBeforePractice(currentHour, hockeyPractice) {
  if (!hockeyPractice || !hockeyPractice.time) {
    return false;
  }
  
  const practiceHour = parseInt(hockeyPractice.time.split(':')[0]);
  return currentHour < practiceHour;
}