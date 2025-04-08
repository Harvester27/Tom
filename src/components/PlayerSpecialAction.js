import React, { useState } from 'react';
import { XMarkIcon, LightBulbIcon, BoltIcon, FireIcon } from '@heroicons/react/24/solid';

const PlayerSpecialAction = ({ action, onOptionSelect }) => {
  const [result, setResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  
  if (!action) return null;
  
  const handleOptionClick = (option) => {
    setSelectedOption(option);
    const actionResult = onOptionSelect(option);
    setResult(actionResult);
  };
  
  // Pomocné funkce pro zobrazení obtížnosti
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': 
        return <LightBulbIcon className="h-4 w-4 text-green-400" />;
      case 'medium': 
        return <BoltIcon className="h-4 w-4 text-yellow-400" />;
      case 'hard': 
        return <FireIcon className="h-4 w-4 text-red-400" />;
      default: 
        return null;
    }
  };
  
  // Údaje o hráči a kontextu
  const playerName = action.player ? `${action.player.name} ${action.player.surname}` : "Ty";
  const playerTeam = action.playerTeamColor === 'white' ? 'Bílý tým' : 'Černý tým';
  const playerLevel = action.player?.level || 1;
  const playerFatigue = Math.round(action.playerFatigue || 0);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
      <div className="bg-gradient-to-b from-blue-900/90 to-gray-900/95 rounded-xl overflow-hidden shadow-2xl border border-indigo-700 w-full max-w-2xl mx-4 transform transition-all">
        
        {/* Header */}
        <div className="bg-indigo-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Speciální situace</h2>
          {/* Disabled X button since special actions require response */}
          <button className="text-gray-400 cursor-not-allowed opacity-50">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5">
          {/* Situation description */}
          <div className="mb-6 bg-black/40 rounded-lg p-4 border border-indigo-800/50">
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Situace:</h3>
            <p className="text-gray-100 text-lg">{action.description}</p>
          </div>
          
          {/* Player context */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-black/30 rounded-lg p-3 flex-1 min-w-[150px] border border-indigo-900/50">
              <h4 className="text-xs text-indigo-300 uppercase mb-1">Hráč</h4>
              <p className="text-white font-medium">{playerName} (Ty)</p>
              <div className="flex items-center mt-1">
                <span className="text-xs bg-yellow-900/70 text-yellow-300 px-1.5 py-0.5 rounded">L{playerLevel}</span>
                <span className="text-xs ml-2 bg-red-900/70 text-red-300 px-1.5 py-0.5 rounded">{playerFatigue}% únava</span>
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 flex-1 min-w-[150px] border border-indigo-900/50">
              <h4 className="text-xs text-indigo-300 uppercase mb-1">Tým</h4>
              <p className="text-white font-medium">{playerTeam}</p>
              <div className="text-xs mt-1 text-gray-400">
                {action.gameContext?.score.white} : {action.gameContext?.score.black}
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 flex-1 min-w-[150px] border border-indigo-900/50">
              <h4 className="text-xs text-indigo-300 uppercase mb-1">Čas</h4>
              <p className="text-white font-medium">Třetina {action.gameContext?.period}</p>
              <div className="text-xs mt-1 text-gray-400">
                {Math.floor(action.gameContext?.timeRemaining / 60)}:{(action.gameContext?.timeRemaining % 60).toString().padStart(2, '0')} zbývá
              </div>
            </div>
          </div>
          
          {/* Options or Result */}
          {result ? (
            <div className="bg-gray-800/80 rounded-lg p-6 border border-indigo-700 text-center">
              <h3 className={`text-xl font-bold mb-3 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Úspěch!' : 'Neúspěšné!'}
              </h3>
              <p className="text-white text-lg">{result.message}</p>
              <p className="text-gray-400 mt-3 text-sm">Hra bude pokračovat...</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-white mb-3">Vyber svoji akci:</h3>
              <div className="space-y-3">
                {action.options.map(option => (
                  <button
                    key={option.id}
                    className={`w-full p-4 text-left rounded-lg border border-indigo-700/50 hover:border-indigo-500 transition-all ${
                      selectedOption?.id === option.id ? 'bg-indigo-700/40 shadow-lg' : 'bg-gray-800/40 hover:bg-gray-800/60'
                    }`}
                    onClick={() => handleOptionClick(option)}
                    disabled={!!selectedOption}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium text-lg">{option.text}</span>
                      <div className="flex items-center">
                        <span className={`mr-1 text-sm ${getDifficultyColor(option.difficulty)}`}>
                          {option.difficulty === 'easy' ? 'Lehké' : option.difficulty === 'medium' ? 'Střední' : 'Těžké'}
                        </span>
                        {getDifficultyIcon(option.difficulty)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSpecialAction; 