/**
 * Card Collection Game - Hockey Manager
 * Version: 1.0.10
 * Last update: Added match summary screen and fixed goalie statistics
 */

import { debugGoalieStats } from '../debug';
import { useState, useEffect } from 'react';
import MatchEnd from './MatchEnd';

/**
 * Starts a new tournament if the team is complete
 * Initializes groups, matches and goalie statistics
 */
// Version 1.0.8 - Tournament Update
const startTournament = () => {
  if (canPlayMatch()) {
    setShowTournament(true);
    // Nastavíme týmy do skupin
    setTournamentState(prev => ({
      ...prev,
      phase: 'groups',
      groups: {
        A: [
          { team: teamKafacBilina, points: 0, score: { for: 0, against: 0 } },
          { team: teamNorthBlades, points: 0, score: { for: 0, against: 0 } },
          { team: selectedTeam, points: 0, score: { for: 0, against: 0 } }
        ],
        B: [
          { team: teamGinTonic, points: 0, score: { for: 0, against: 0 } },
          { team: teamGurmaniZatec, points: 0, score: { for: 0, against: 0 } },
          { team: teamPredatorsNymburk, points: 0, score: { for: 0, against: 0 } }
        ]
      },
      // Přidáme všechny brankáře do statistik s rozšířenými statistikami
      goalies: [
        { 
          id: selectedTeam.goalkeeper, 
          name: cards.find(c => c.id === selectedTeam.goalkeeper)?.name || 'Neznámý brankář', 
          team: selectedTeam.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        },
        { 
          id: teamKafacBilina.goalkeeper.id, 
          name: teamKafacBilina.goalkeeper.name, 
          team: teamKafacBilina.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        },
        { 
          id: teamNorthBlades.goalkeeper.id, 
          name: teamNorthBlades.goalkeeper.name, 
          team: teamNorthBlades.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        },
        { 
          id: teamGinTonic.goalkeeper.id, 
          name: teamGinTonic.goalkeeper.name, 
          team: teamGinTonic.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        },
        { 
          id: teamGurmaniZatec.goalkeeper.id, 
          name: teamGurmaniZatec.goalkeeper.name, 
          team: teamGurmaniZatec.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        },
        { 
          id: teamPredatorsNymburk.goalkeeper.id, 
          name: teamPredatorsNymburk.goalkeeper.name, 
          team: teamPredatorsNymburk.name,
          saves: 0,
          shots: 0,
          shutouts: 0
        }
      ]
    }));
  }
}

/**
 * Updates goalie statistics after each match
 * Tracks saves, shots and shutouts
 */
const updateGoalieStats = (homeGoalieId, awayGoalieId, homeScore, awayScore, homeSaves, awaySaves, homeShots, awayShots) => {
  setTournamentState(prev => ({
    ...prev,
    goalies: prev.goalies.map(goalie => {
      if (goalie.id === homeGoalieId) {
        return {
          ...goalie,
          saves: goalie.saves + homeSaves,
          shots: goalie.shots + homeShots,
          shutouts: goalie.shutouts + (awayScore === 0 ? 1 : 0)
        };
      }
      if (goalie.id === awayGoalieId) {
        return {
          ...goalie,
          saves: goalie.saves + awaySaves,
          shots: goalie.shots + awayShots,
          shutouts: goalie.shutouts + (homeScore === 0 ? 1 : 0)
        };
      }
      return goalie;
    })
  }));
};

// Upravíme funkci playTournamentMatch aby aktualizovala statistiky brankářů
const playTournamentMatch = (homeTeam, awayTeam) => {
  // Simulace zápasu
  const homeScore = Math.floor(Math.random() * 6);
  const awayScore = Math.floor(Math.random() * 6);
  
  // Simulace střel a zákroků
  const homeShots = homeScore + Math.floor(Math.random() * 20) + 15; // Minimálně 15 střel + góly
  const awayShots = awayScore + Math.floor(Math.random() * 20) + 15;
  const homeSaves = awayShots - awayScore;
  const awaySaves = homeShots - homeScore;

  // Aktualizace statistik brankářů
  updateGoalieStats(
    homeTeam.goalkeeper.id,
    awayTeam.goalkeeper.id,
    homeScore,
    awayScore,
    homeSaves,
    awaySaves,
    homeShots,
    awayShots
  );

  return { home: homeScore, away: awayScore };
};

// DEBUG: Verze 1.0.8 - Statistiky brankářů
const updateMatchStats = () => {
  // DEBUG: Kontrola turnajového stavu
  console.log('DEBUG: Začínám aktualizaci statistik');
  console.log('DEBUG: Tournament state:', tournamentState);
  console.log('DEBUG: Match state:', matchState);

  if (!tournamentState || !tournamentState.goalies) {
    console.log('DEBUG: Chybí turnajový stav nebo brankáři');
    return;
  }

  // Najdeme brankáře v turnajových statistikách
  const homeGoalie = tournamentState.goalies.find(g => g.id === selectedTeam.goalkeeper);
  const awayGoalie = tournamentState.goalies.find(g => g.id === matchState.currentOpponent.goalkeeper.id);

  console.log('DEBUG: Nalezení brankáři:', { homeGoalie, awayGoalie });

  if (homeGoalie && awayGoalie) {
    // Spočítáme góly z událostí zápasu
    const homeGoals = matchState.events.filter(e => e.type === 'goal' && !e.isHomeTeam).length;
    const awayGoals = matchState.events.filter(e => e.type === 'goal' && e.isHomeTeam).length;
    
    // Použijeme skutečné statistiky ze zápasu
    const homeShots = matchState.playerStats.shots[selectedTeam.goalkeeper] || 0;
    const awayShots = matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] || 0;
    const homeSaves = matchState.playerStats.saves[selectedTeam.goalkeeper] || 0;
    const awaySaves = matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] || 0;

    console.log('DEBUG: Statistiky ze zápasu:', {
      homeGoalie: homeGoalie.name,
      awayGoalie: awayGoalie.name,
      homeShots,
      awayShots,
      homeSaves,
      awaySaves,
      homeGoals,
      awayGoals
    });

    // Aktualizujeme statistiky v turnajovém stavu
    setTournamentState(prev => {
      const newState = {
        ...prev,
        goalies: prev.goalies.map(goalie => {
          if (goalie.id === selectedTeam.goalkeeper) {
            const newStats = {
              ...goalie,
              saves: (goalie.saves || 0) + homeSaves,
              shots: (goalie.shots || 0) + awayShots,
              shutouts: (goalie.shutouts || 0) + (awayGoals === 0 ? 1 : 0)
            };
            console.log('DEBUG: Nové statistiky domácího brankáře:', newStats);
            return newStats;
          }
          if (goalie.id === matchState.currentOpponent.goalkeeper.id) {
            const newStats = {
              ...goalie,
              saves: (goalie.saves || 0) + awaySaves,
              shots: (goalie.shots || 0) + homeShots,
              shutouts: (goalie.shutouts || 0) + (homeGoals === 0 ? 1 : 0)
            };
            console.log('DEBUG: Nové statistiky hostujícího brankáře:', newStats);
            return newStats;
          }
          return goalie;
        })
      };
      console.log('DEBUG: Nový turnajový stav:', newState);
      return newState;
    });
  }
};

const CardGame = () => {
  const [showMatchSummary, setShowMatchSummary] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);

  const endMatch = () => {
    console.log('DEBUG: Končím zápas');
    setMatchEnded(true);
  };

  const confirmMatchEnd = () => {
    console.log('DEBUG: Potvrzuji konec zápasu');
    updateMatchStats();
    setShowMatch(false);
    setMatchState(initialMatchState);
    setShowTournament(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      {/* ... existing code ... */}

      {showMatch && (
        <div className="relative">
          {/* ... existing match UI ... */}
          
          <div className="mt-4 flex justify-center">
            {!matchEnded ? (
              <button
                onClick={endMatch}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Ukončit zápas
              </button>
            ) : (
              <MatchEnd
                matchState={matchState}
                selectedTeam={selectedTeam}
                onConfirm={confirmMatchEnd}
              />
            )}
          </div>
        </div>
      )}

      {/* Obrazovka se souhrnem zápasu */}
      {showMatchSummary && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl border border-gray-700 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Souhrn zápasu</h2>
            
            {/* Statistiky domácího brankáře */}
            <div className="mb-4">
              <h3 className="text-lg text-green-400">{selectedTeam.name}</h3>
              <div className="text-white">
                Střely: {matchState.playerStats.shots[selectedTeam.goalkeeper] || 0}
                <br />
                Zákroky: {matchState.playerStats.saves[selectedTeam.goalkeeper] || 0}
                <br />
                Úspěšnost: {Math.round(((matchState.playerStats.saves[selectedTeam.goalkeeper] || 0) / (matchState.playerStats.shots[selectedTeam.goalkeeper] || 1)) * 100)}%
              </div>
            </div>

            {/* Statistiky hostujícího brankáře */}
            <div className="mb-6">
              <h3 className="text-lg text-blue-400">{matchState.currentOpponent.name}</h3>
              <div className="text-white">
                Střely: {matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] || 0}
                <br />
                Zákroky: {matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] || 0}
                <br />
                Úspěšnost: {Math.round(((matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] || 0) / (matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] || 1)) * 100)}%
              </div>
            </div>

            <button
              onClick={confirmMatchEnd}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Potvrdit a pokračovat
            </button>
          </div>
        </div>
      )}

      {/* ... rest of the UI ... */}
    </div>
  );
};

export default CardGame; 