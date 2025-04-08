import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  TrophyIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  StarIcon,
  ClockIcon,
  FireIcon,
  ShieldCheckIcon,
  HandRaisedIcon,
  FlagIcon,
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

const PostGameRewards = ({ gameResult, playerName, onBack, onContinue }) => {
  const [rewards, setRewards] = useState(null);
  const [showingStats, setShowingStats] = useState(true);
  const [experienceGained, setExperienceGained] = useState(0);
  
  // Spočítat odměny na základě výsledků zápasu
  useEffect(() => {
    if (!gameResult) return;
    
    const isWin = gameResult.score.white > gameResult.score.black;
    const isDraw = gameResult.score.white === gameResult.score.black;
    const wasAbandoned = gameResult.abandoned || false;
    
    // Najít statistiky hráče
    const playerStats = Object.values(gameResult.playerStats || {}).find(stats => {
      // Hledáme statistiky hráče - mohli bychom identifikovat podle klíče, ale zatím jednoduše hledáme nenulové statistiky
      return stats.goals > 0 || stats.assists > 0 || stats.blocks > 0 || stats.saves > 0;
    }) || { timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0, shots: 0, saves: 0 };
    
    // Základní XP za účast
    let xp = 100;
    
    // XP za výsledek
    if (isWin) xp += 100;
    else if (isDraw) xp += 50;
    
    // XP za výkon
    xp += playerStats.goals * 30;
    xp += playerStats.assists * 15;
    xp += playerStats.blocks * 10;
    xp += playerStats.saves * 5;
    
    // Penalizace za předčasný odchod
    if (wasAbandoned) xp = Math.floor(xp * 0.5);
    
    // Simulovat postupné načítání XP pro efekt
    let currentXP = 0;
    const xpInterval = setInterval(() => {
      if (currentXP < xp) {
        currentXP += Math.max(1, Math.floor(xp / 20));
        if (currentXP > xp) currentXP = xp;
        setExperienceGained(currentXP);
      } else {
        clearInterval(xpInterval);
      }
    }, 100);
    
    // Generujeme odměny (zde by mohl být komplexnější systém)
    const generatedRewards = {
      experiencePoints: xp,
      coins: Math.floor(xp * 0.8),
      items: []
    };
    
    // Přidat odměny za speciální výkony
    if (playerStats.goals >= 2) {
      generatedRewards.items.push({
        name: "Sběratelská hokejka",
        description: "Speciální odměna za vstřelení více gólů!",
        rarity: "rare",
        icon: "/Images/rewards/hockey_stick.png"
      });
    }
    
    if (playerStats.saves >= 10) {
      generatedRewards.items.push({
        name: "Brankářská maska",
        description: "Speciální odměna za mnoho zákroků!",
        rarity: "epic",
        icon: "/Images/rewards/goalie_mask.png"
      });
    }
    
    setRewards(generatedRewards);
    
    return () => clearInterval(xpInterval);
  }, [gameResult]);
  
  if (!gameResult || !rewards) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white z-50">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <p className="text-xl">Zpracování výsledků zápasu...</p>
        </div>
      </div>
    );
  }
  
  // Formátování času (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Informace o výsledku
  const isWin = gameResult.score.white > gameResult.score.black;
  const isDraw = gameResult.score.white === gameResult.score.black;
  const wasAbandoned = gameResult.abandoned || false;
  
  // Text výsledku
  let resultText = "Prohra";
  let resultColorClass = "text-red-500";
  
  if (isWin) {
    resultText = "Výhra";
    resultColorClass = "text-green-500";
  } else if (isDraw) {
    resultText = "Remíza";
    resultColorClass = "text-yellow-500";
  }
  
  if (wasAbandoned) {
    resultText = "Zápas nedokončen";
    resultColorClass = "text-gray-500";
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="w-full max-w-screen-xl bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-red-600/80 hover:bg-red-600 text-white"
            title="Zpět do kabiny"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span>Zpět</span>
          </button>
          <h2 className="text-2xl font-bold text-cyan-400 tracking-tight text-center px-2 flex items-center gap-2">
            <TrophyIcon className="h-6 w-6 text-yellow-400" /> Výsledky zápasu
          </h2>
          <div className="w-24"></div>
        </div>
        
        {/* Score Board */}
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/40 to-purple-900/30 p-4 border-b border-indigo-800/50">
          <div className="text-center mb-2">
            <h3 className={`text-xl font-bold ${resultColorClass}`}>{resultText}</h3>
            <p className="text-gray-400 text-sm">{wasAbandoned ? "Neúplná statistika" : "Konečný výsledek"}</p>
          </div>
          
          <div className="flex justify-around items-center py-2">
            <span className="text-xl sm:text-2xl font-bold text-white truncate px-2">Lancers Bílý</span>
            <span className="text-4xl sm:text-5xl font-bold text-cyan-300 tabular-nums tracking-tighter flex-shrink-0 mx-2">
              {gameResult.score.white} : {gameResult.score.black}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-300 truncate px-2">Lancers Černý</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setShowingStats(true)} 
            className={`flex-1 px-4 py-2 font-medium ${showingStats ? 'bg-indigo-900/50 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
          >
            Statistika
          </button>
          <button 
            onClick={() => setShowingStats(false)} 
            className={`flex-1 px-4 py-2 font-medium ${!showingStats ? 'bg-indigo-900/50 text-white border-b-2 border-cyan-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
          >
            Odměny
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-auto p-4">
          {showingStats ? (
            // Statistiky
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Osobní statistiky */}
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-700 flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5 text-cyan-400" /> Osobní statistiky
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(gameResult.playerStats || {}).map(([key, stats]) => {
                    // Zobrazit jen statistiky hráče - mohli bychom identifikovat podle klíče
                    if (stats.goals === 0 && stats.assists === 0 && stats.blocks === 0 && stats.saves === 0 && stats.timeOnIce < 60) {
                      return null;
                    }
                    
                    return (
                      <div key={key} className="bg-gray-900/60 rounded-lg border border-gray-800 p-3">
                        <h4 className="font-semibold text-cyan-300 mb-2 flex justify-between">
                          <span>{playerName} <span className="text-cyan-400">(Ty)</span></span>
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4 text-gray-500" /> Čas na ledě:
                            </span>
                            <span className="font-mono text-gray-300">{formatTime(stats.timeOnIce)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <FlagIcon className="w-4 h-4 text-green-500" /> Góly:
                            </span>
                            <span className="font-mono font-bold text-green-400">{stats.goals}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <StarIcon className="w-4 h-4 text-yellow-500" /> Asistence:
                            </span>
                            <span className="font-mono font-bold text-yellow-400">{stats.assists}</span>
                          </div>
                          
                          {stats.blocks > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-1">
                                <ShieldCheckIcon className="w-4 h-4 text-blue-500" /> Bloky:
                              </span>
                              <span className="font-mono text-blue-400">{stats.blocks}</span>
                            </div>
                          )}
                          
                          {stats.saves > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-1">
                                <HandRaisedIcon className="w-4 h-4 text-purple-500" /> Zákroky:
                              </span>
                              <span className="font-mono text-purple-400">{stats.saves}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <FireIcon className="w-4 h-4 text-orange-500" /> Střely:
                            </span>
                            <span className="font-mono text-orange-400">{stats.shots}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Timeline events */}
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-700 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-cyan-400" /> Klíčové momenty
                </h3>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(gameResult.events || [])
                    .filter(event => ['goal', 'penalty', 'period_change'].includes(event.type))
                    .map((event, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-900/60 rounded-lg border border-gray-800 p-2 flex items-start gap-2"
                      >
                        <div className="bg-indigo-900/50 rounded-full p-1.5 flex-shrink-0">
                          {event.type === 'goal' && <FlagIcon className="w-4 h-4 text-green-400" />}
                          {event.type === 'penalty' && <ShieldCheckIcon className="w-4 h-4 text-red-400" />}
                          {event.type === 'period_change' && <ClockIcon className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {formatTime(event.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            // Odměny
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/40 to-purple-900/30 rounded-lg border border-indigo-800 p-5 mb-6 w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4 text-center text-cyan-300 flex items-center justify-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-yellow-400" />
                  Získané odměny
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/70 rounded-lg border border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500/20 rounded-full p-2">
                        <StarIcon className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-300">Zkušenosti</h4>
                        <p className="text-xs text-gray-400">Zkušenostní body získané v zápase</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">+{experienceGained}</div>
                  </div>
                  
                  <div className="bg-gray-900/70 rounded-lg border border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-600/20 rounded-full p-2">
                        <TrophyIcon className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-300">Mince</h4>
                        <p className="text-xs text-gray-400">Odměna za dokončení zápasu</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">+{rewards.coins}</div>
                  </div>
                </div>
                
                {rewards.items.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-center text-indigo-300">Speciální odměny</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rewards.items.map((item, index) => (
                        <div key={index} className="bg-gray-900/70 rounded-lg border border-indigo-700 p-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-indigo-900/50 flex items-center justify-center overflow-hidden">
                            {item.icon ? (
                              <Image src={item.icon} alt={item.name} width={40} height={40} className="object-contain" />
                            ) : (
                              <StarIcon className="w-6 h-6 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium text-indigo-300">{item.name}</h5>
                            <p className="text-xs text-gray-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={onContinue || onBack} 
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-bold text-lg flex items-center gap-2"
              >
                <TrophyIcon className="w-5 h-5" /> Pokračovat
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); }
      `}</style>
    </div>
  );
};

export default PostGameRewards; 