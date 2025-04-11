'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  UserGroupIcon,
  XMarkIcon as XMarkSolidIcon,
  FlagIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Importujeme litvinovLancers z datové složky
// import { litvinovLancers } from '../data/LitvinovLancers';

// --- Helper Functions ---
export const formatTimeOnIce = (totalSeconds) => {
  const seconds = Math.floor(totalSeconds || 0); // Zaokrouhlíme dolů
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getEventIcon = (type) => {
  switch (type) {
    case 'goal': return <FlagIcon className="h-5 w-5 text-green-400" />;
    case 'save': return <HandRaisedIcon className="h-5 w-5 text-blue-400" />;
    case 'defense': return <ShieldCheckIcon className="h-5 w-5 text-orange-400" />;
    case 'penalty': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    case 'period_change': return <ClockIcon className="h-5 w-5 text-indigo-400" />;
    case 'substitution': return <UserGroupIcon className="h-5 w-5 text-teal-400" />;
    case 'miss': return <XMarkSolidIcon className="h-5 w-5 text-gray-500" />;
    case 'turnover': return <InformationCircleIcon className="h-5 w-5 text-purple-400 transform rotate-90" />;
    default: return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
  }
};

// --- PlayerStatus Component ---
export const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey, highlightedPlayerKey, litvinovLancers }) => {
  const [animateIceChange, setAnimateIceChange] = useState(false);
  const [prevIsOnIce, setPrevIsOnIce] = useState(isOnIce);
  
  // Sledujeme změny v isOnIce a vyvoláme animaci
  useEffect(() => {
    // Pokud se změnil stav hráče na ledě, spustíme animaci
    if (prevIsOnIce !== isOnIce) {
      console.log(`%c[SUB][UI] 🔄 Player ${player.surname} changed ice status: ${prevIsOnIce ? 'ON→OFF' : 'OFF→ON'}`, 
        isOnIce ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
      setAnimateIceChange(true);
      setPrevIsOnIce(isOnIce);
      
      const timer = setTimeout(() => {
        setAnimateIceChange(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnIce, player.surname, prevIsOnIce]);
  
  if (!player || !player.key) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-900/50 border border-red-700">
        <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
        <div className="text-xs text-red-300">Chyba: Data hráče</div>
      </div>
    );
  }

  const fatigue = Math.round(fatigueValue || 0);
  const playerPhotoUrl = player.isPlayer 
    ? '/Images/default_player.png' 
    : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);

  // Force debugovací výpis pro sledování isOnIce u každého vykreslení
  if (player.isPlayer) {
    console.log(`%c[SUB][UI] 👤 Render player ${player.surname} (${teamColor}): isOnIce=${isOnIce}, fatigue=${fatigue}`,
      isOnIce ? 'color: green' : 'color: purple');
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border ${
      isOnIce 
        ? 'bg-green-800/40 border-green-600/50 shadow-md' 
        : 'bg-gray-800/40 border-gray-700/50'
      } ${
        highlightedPlayerKey?.[player.key] 
          ? (teamColor === 'white' 
              ? 'bg-white/20 scale-105 ring-2 ring-white' 
              : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') 
          : ''
      } ${
        animateIceChange 
          ? (isOnIce ? 'ring-2 ring-green-400 scale-[1.02]' : 'ring-2 ring-red-400 scale-[1.02]')
          : ''
      }`}
    >
      {/* Obrázek hráče */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700 relative">
        <Image
          src={playerPhotoUrl}
          alt={`${player.name} ${player.surname}`}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          unoptimized={true}
          onError={(e) => {
            console.error(`❌ Image error for ${player.name} ${player.surname}. Fallback to default.`);
            e.currentTarget.src = '/Images/default_player.png';
            e.currentTarget.onerror = () => {
              console.error(`❌ Fallback image also failed. Trying alternative path.`);
              e.currentTarget.src = '/public/Images/default_player.png';
              e.currentTarget.onerror = null;
            };
          }}
        />
        {/* Zelená tečka, pokud je hráč na ledě - přidaná animace při změně */}
        {isOnIce && (
          <div 
            className={`absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800 ${
              animateIceChange ? 'animate-pulse' : ''
            }`} 
            title="Na ledě"
          ></div>
        )}
      </div>

      {/* Jméno a pozice */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-gray-100">
          {player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}
        </div>
        <div className="text-xs text-indigo-300">{player.position} - L{player.level || 1}</div>
      </div>

      {/* Únava */}
      <div className="w-20 flex-shrink-0 text-right">
        <div className="text-xs text-gray-400 mb-1">{fatigue}%</div>
        <div className="h-2.5 bg-gray-600 rounded-full overflow-hidden relative">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${
              fatigue > 80 
                ? 'bg-red-500' 
                : fatigue > 50 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
            }`} 
            style={{ width: `${fatigue}%` }} 
          />
        </div>
      </div>
    </div>
  );
});

PlayerStatus.displayName = 'PlayerStatus';

// --- TeamTable Component ---
export const TeamTable = React.memo(({ teamData, teamColor, teamState, playerStats, playersOnIceState, litvinovLancers }) => {
  const [selectedTeamColor, setSelectedTeamColor] = useState(teamColor);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setSelectedTeamColor(teamColor); // Aktualizujeme, pokud se změní prop
  }, [teamColor]);

  const currentTeam = teamData[selectedTeamColor];
  
  if (!currentTeam || !currentTeam.players) {
    return (
      <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">
        Načítání...
      </div>
    );
  }
  
  if (currentTeam.players.length === 0) {
    return (
      <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">
        Žádní hráči.
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
      <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
        <button 
          onClick={() => {setSelectedTeamColor('white'); setShowStats(false);}} 
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', 
            selectedTeamColor === 'white' 
              ? 'bg-white text-black shadow-md' 
              : 'text-white hover:bg-white/20'
          )}
        >
          Bílí ({teamData.white.players?.length ?? 0})
        </button>
        <button 
          onClick={() => {setSelectedTeamColor('black'); setShowStats(false);}} 
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', 
            selectedTeamColor === 'black' 
              ? 'bg-gray-600 text-white shadow-md' 
              : 'text-gray-300 hover:bg-gray-700/50'
          )}
        >
          Černí ({teamData.black.players?.length ?? 0})
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className={clsx(
            'px-3 py-1 rounded-lg text-xs font-bold transition-colors text-center ml-1',
            showStats 
              ? 'bg-yellow-500 text-black shadow-md' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          )}
          disabled={!selectedTeamColor}
        >
          {showStats ? 'Info' : 'Statistiky'}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {showStats ? (
          <table className="w-full text-xs">
            <thead className="bg-gray-800 text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="p-1 text-left font-semibold">Hráč</th>
                <th className="p-1 text-center font-semibold" title="Čas na ledě">ČNL</th>
                <th className="p-1 text-center font-semibold" title="Góly">G</th>
                <th className="p-1 text-center font-semibold" title="Asistence">A</th>
                <th className="p-1 text-center font-semibold" title="Trestné minuty">TM</th>
                <th className="p-1 text-center font-semibold" title="Bloky (pole) / Zásahy (brankář)">B/Z</th>
                <th className="p-1 text-center font-semibold" title="Střely (pole) / Úspěšnost % (brankář)">S/Ú%</th>
              </tr>
            </thead>
            <tbody className='bg-gray-800/30'>
              {currentTeam.players.map((player) => {
                if (!player || !player.key) return null;
                const isGoalie = player.position === 'brankář';
                const stats = playerStats[player.key] || { 
                  timeOnIce: 0, 
                  goals: 0, 
                  assists: 0, 
                  penalties: 0, 
                  blocks: 0, 
                  shots: 0, 
                  saves: 0, 
                  savePercentage: 0, 
                  shotsAgainst: 0 
                };

                return (
                  <tr 
                    key={player.key} 
                    className={`border-b border-gray-700/50 hover:bg-indigo-900/30 ${
                      player.isPlayer ? 'font-bold text-cyan-300' : 'text-gray-200'
                    }`}
                  >
                    <td className="p-1 font-medium">
                      <div className="flex items-center">
                        <span className="truncate max-w-[90px]">
                          {player.surname}
                        </span>
                      </div>
                    </td>
                    <td className="p-1 text-center text-gray-400 tabular-nums">{formatTimeOnIce(stats.timeOnIce)}</td>
                    <td className="p-1 text-center">{stats.goals}</td>
                    <td className="p-1 text-center">{stats.assists}</td>
                    <td className="p-1 text-center">{stats.penalties}</td>
                    <td className="p-1 text-center">{isGoalie ? stats.saves : stats.blocks}</td>
                    <td className="p-1 text-center">{isGoalie ? `${stats.savePercentage}%` : stats.shots}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          // Standardní zobrazení hráčů
          currentTeam.players.map((player, index) => {
            if (!player || !player.key) return null;
            
            const playerPhotoUrl = player.isPlayer 
              ? '/Images/default_player.png' 
              : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
            
            return (
              <div 
                key={player.key} 
                className={`p-2 text-sm ${
                  index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'
                } hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-600">
                  <Image 
                    src={playerPhotoUrl} 
                    alt={player.name} 
                    width={32} 
                    height={32} 
                    className="w-full h-full object-cover" 
                    unoptimized={true} 
                    onError={(e) => { 
                      console.error(`❌ TEAM TABLE: Image error for ${player.name} ${player.surname}. Fallback to default.`);
                      e.currentTarget.src = '/Images/default_player.png'; 
                      e.currentTarget.onerror = () => {
                        console.error(`❌ TEAM TABLE: Fallback image also failed. Trying alternative path.`);
                        e.currentTarget.src = '/public/Images/default_player.png';
                        e.currentTarget.onerror = () => {
                          console.error(`❌ TEAM TABLE: All paths failed.`);
                          e.currentTarget.onerror = null;
                        };
                      };
                    }} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate font-medium ${player.isPlayer ? 'text-cyan-300' : 'text-gray-200'}`}>
                    {player.name} {player.surname} {player.isPlayer ? '(Ty)' : ''}
                  </div>
                  <div className="text-xs text-indigo-300">{player.position}</div>
                </div>
                <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/30 rounded-md">
                  L{player.level || 1}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

TeamTable.displayName = 'TeamTable';

// --- PlayerSpecialAction Component ---
export const PlayerSpecialAction = ({ action, onOptionSelect }) => {
  const [result, setResult] = useState(null);
  
  const handleOptionClick = (option) => {
    const actionResult = onOptionSelect(option);
    setResult(actionResult);
  };

  if (!action) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 max-w-md w-full mx-auto border border-cyan-700 shadow-lg animate-fadeIn">
        <h3 className="text-xl text-center font-bold text-cyan-400 mb-3">Speciální akce!</h3>
        
        {!result ? (
          <>
            <p className="text-gray-300 mb-4 text-center">{action.description}</p>
            
            <div className="space-y-3 mb-5">
              {action.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors text-left flex justify-between items-center ${
                    option.difficulty === 'easy' ? 'bg-green-700 hover:bg-green-600' :
                    option.difficulty === 'medium' ? 'bg-amber-700 hover:bg-amber-600' :
                    'bg-red-700 hover:bg-red-600'
                  }`}
                >
                  <span>{option.text}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-black/30">
                    {option.difficulty === 'easy' ? 'Lehké' :
                     option.difficulty === 'medium' ? 'Střední' :
                     'Těžké'}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="text-xs text-gray-400 italic text-center">
              Únava hráče: {action.playerFatigue}%
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className={`text-xl font-bold mb-3 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? 'Úspěch!' : 'Neúspěch!'}
            </div>
            <p className="text-gray-300 mb-5">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};