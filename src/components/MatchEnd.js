import React from 'react';

const MatchEnd = ({ matchState, selectedTeam, onConfirm }) => {
  return (
    <div className="bg-black/50 p-4 rounded-lg w-96">
      <h3 className="text-xl font-bold text-white mb-4">Statistiky brankářů</h3>
      
      {/* Domácí brankář */}
      <div className="mb-4">
        <h4 className="text-green-400">{selectedTeam.name}</h4>
        <div className="text-white">
          Střely: {matchState.playerStats.shots[selectedTeam.goalkeeper] || 0}
          <br />
          Zákroky: {matchState.playerStats.saves[selectedTeam.goalkeeper] || 0}
          <br />
          Úspěšnost: {Math.round(((matchState.playerStats.saves[selectedTeam.goalkeeper] || 0) / (matchState.playerStats.shots[selectedTeam.goalkeeper] || 1)) * 100)}%
        </div>
      </div>

      {/* Hostující brankář */}
      <div className="mb-4">
        <h4 className="text-blue-400">{matchState.currentOpponent.name}</h4>
        <div className="text-white">
          Střely: {matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] || 0}
          <br />
          Zákroky: {matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] || 0}
          <br />
          Úspěšnost: {Math.round(((matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] || 0) / (matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] || 1)) * 100)}%
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
      >
        Pokračovat do turnaje
      </button>
    </div>
  );
};

export default MatchEnd; 