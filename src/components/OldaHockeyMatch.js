'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers } from '../data/LitvinovLancers';

const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'end'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0); // čas v sekundách
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [teams, setTeams] = useState(() => {
    // Získáme všechny aktivní hráče
    const activePlayers = litvinovLancers.players.filter(p => p.attendance >= 75).map(player => ({
      ...player,
      level: Math.floor(player.attendance / 10)  // Level 1-10 podle docházky
    }));
    
    // Rozdělíme je podle dresů
    const whitePlayers = activePlayers.filter(p => 
      assignedJerseys?.white?.has(`${p.name} ${p.surname}`)
    );
    const blackPlayers = activePlayers.filter(p => 
      assignedJerseys?.black?.has(`${p.name} ${p.surname}`)
    );

    // Přidáme hráče do správného týmu
    const whiteTeam = {
      name: 'Lancers Bílý',
      players: whitePlayers
    };

    const blackTeam = {
      name: 'Lancers Černý',
      players: blackPlayers
    };

    // Rozdělíme zbytek hráčů náhodně do týmů
    const remainingPlayers = activePlayers.filter(p => 
      !assignedJerseys?.white?.has(`${p.name} ${p.surname}`) &&
      !assignedJerseys?.black?.has(`${p.name} ${p.surname}`)
    );

    // Náhodně zamícháme zbývající hráče
    const shuffledPlayers = [...remainingPlayers].sort(() => Math.random() - 0.5);

    // Přidáme hráče (uživatele) do týmu s menším počtem hráčů
    const playerStats = {
      name: playerName,
      surname: '',
      position: 'útočník',
      level: playerLevel,  // Použijeme skutečný level hráče
      isPlayer: true
    };

    if (assignedJerseys?.white?.has(playerName)) {
      whiteTeam.players.push(playerStats);
    } else if (assignedJerseys?.black?.has(playerName)) {
      blackTeam.players.push(playerStats);
    } else {
      // Pokud hráč není přiřazen, dáme ho do týmu s menším počtem hráčů
      if (whiteTeam.players.length <= blackTeam.players.length) {
        whiteTeam.players.push(playerStats);
      } else {
        blackTeam.players.push(playerStats);
      }
    }

    // Rozdělíme zbývající hráče tak, aby byly týmy vyrovnané
    shuffledPlayers.forEach((player) => {
      if (whiteTeam.players.length <= blackTeam.players.length) {
        whiteTeam.players.push(player);
      } else {
        blackTeam.players.push(player);
      }
    });

    // Ujistíme se, že každý tým má brankáře
    const ensureGoalie = (team) => {
      const hasGoalie = team.players.some(p => p.position === 'brankář');
      if (!hasGoalie) {
        // Najdeme brankáře mezi zbývajícími hráči
        const availableGoalie = activePlayers.find(p => 
          p.position === 'brankář' && 
          !whiteTeam.players.includes(p) && 
          !blackTeam.players.includes(p)
        );
        if (availableGoalie) {
          team.players.push(availableGoalie);
        } else {
          // Vytvoříme náhradního brankáře
          team.players.push({
            name: 'Náhradní',
            surname: 'Brankář',
            position: 'brankář',
            level: 3,
            attendance: 75
          });
        }
      }
    };

    ensureGoalie(whiteTeam);
    ensureGoalie(blackTeam);

    return {
      white: whiteTeam,
      black: blackTeam
    };
  });

  // Formátování času
  const formatGameTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Efekt pro simulaci času
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setGameTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60 * 20) { // 20 minut
            setGameState('end');
            if (onGameComplete) {
              onGameComplete({
                score: score,
                events: events
              });
            }
            return prev;
          }
          return newTime;
        });
      }, 1000 / gameSpeed);

      return () => clearInterval(interval);
    }
  }, [gameState, gameSpeed]);

  // Generování událostí
  useEffect(() => {
    if (gameState === 'playing' && gameTime % 30 === 0) {
      const eventTypes = ['attack'];  // Zjednodušíme typy událostí na útok
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const attackingTeam = Math.random() > 0.5 ? 'white' : 'black';
      const defendingTeam = attackingTeam === 'white' ? 'black' : 'white';

      // Vybereme náhodného útočníka (ne brankáře)
      const availableAttackers = teams[attackingTeam].players.filter(p => 
        p.position !== 'brankář' && (p.isPlayer || true)
      );
      
      const attacker = availableAttackers[Math.floor(Math.random() * availableAttackers.length)];
      
      // Vybereme náhodného obránce
      const availableDefenders = teams[defendingTeam].players.filter(p => p.position === 'obránce');
      const defender = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
      
      // Najdeme brankáře bránícího týmu
      const goalie = teams[defendingTeam].players.find(p => p.position === 'brankář');

      // Základní šance na gól
      let goalChance = 0.3;

      // Upravíme šanci podle levelu útočníka
      if (attacker.isPlayer) {
        goalChance += 0.1; // Bonus pro hráče
      } else {
        goalChance += (attacker.level || 1) * 0.05;
      }

      // Snížíme šanci podle levelu obránce (pokud nějaký je)
      if (defender) {
        goalChance -= (defender.level || 1) * 0.03;
      }

      // Snížíme šanci podle levelu brankáře
      if (goalie) {
        goalChance -= (goalie.level || 1) * 0.05;
      }

      // Omezíme šanci na rozumný rozsah
      goalChance = Math.max(0.1, Math.min(0.8, goalChance));

      let newEvent = {
        type: 'attack',
        time: gameTime,
        team: attackingTeam,
        player: attacker
      };

      // Rozhodnutí o výsledku útoku
      const roll = Math.random();
      if (roll < goalChance) {
        // Gól!
        setScore(prev => ({
          ...prev,
          [attackingTeam]: prev[attackingTeam] + 1
        }));
        newEvent.type = 'goal';
        
        if (attacker.isPlayer) {
          newEvent.description = `GÓL! 🚨 SKÓRUJEŠ za tým ${teams[attackingTeam].name}! Skvělá střela! 🔥`;
        } else {
          newEvent.description = `GÓL! ${attacker.name} ${attacker.surname} skóruje za tým ${teams[attackingTeam].name}! 🚨`;
        }
      } else if (roll < goalChance + 0.3) {
        // Zákrok obránce
        newEvent.type = 'defense';
        if (defender) {
          if (attacker.isPlayer) {
            newEvent.description = `${defender.name} ${defender.surname} ti skvěle zabránil v průniku! 🛡️`;
          } else {
            newEvent.description = `${defender.name} ${defender.surname} zastavil útok ${attacker.name}a ${attacker.surname}! 🛡️`;
          }
        } else {
          newEvent.description = `Obrana týmu ${teams[defendingTeam].name} odvrací nebezpečí! 🛡️`;
        }
      } else {
        // Zákrok brankáře
        newEvent.type = 'save';
        if (goalie) {
          if (attacker.isPlayer) {
            newEvent.description = `Výborný zákrok! ${goalie.name} ${goalie.surname} chytá tvoji střelu! 🧤`;
          } else {
            newEvent.description = `${goalie.name} ${goalie.surname} předvedl skvělý zákrok proti ${attacker.name}ovi! 🧤`;
          }
        } else {
          newEvent.description = `Střela mimo bránu! ❌`;
        }
      }

      setLastEvent(newEvent);
      setEvents(prev => [...prev, newEvent]);
    }
  }, [gameTime, gameState]);

  const getEventDescription = (type, player, team) => {
    const teamName = teams[team].name;
    // Speciální zprávy pro hráče (uživatele)
    if (player.isPlayer) {
      switch (type) {
        case 'shot':
          return `Střílíš na bránu za tým ${teamName}! 🏒`;
        case 'hit':
          return `Dáváš tvrdý hit za tým ${teamName}! Soupeř je na ledě! 💪`;
        case 'penalty':
          return `Dostal jsi trest 2 minuty za hákování! Jdeš na trestnou lavici. ⚠️`;
        default:
          return '';
      }
    }
    
    // Standardní zprávy pro ostatní hráče
    switch (type) {
      case 'shot':
        return `${player.name} ${player.surname} (${teamName}) střílí na bránu! 🏒`;
      case 'hit':
        return `${player.name} ${player.surname} (${teamName}) rozdává tvrdý hit! 💪`;
      case 'penalty':
        return `${player.name} ${player.surname} (${teamName}) jde na trestnou lavici. ⚠️`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto p-8">
        <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 rounded-xl p-8 border border-indigo-500/30 shadow-xl backdrop-blur-sm">
          {/* Hlavička */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={onBack}
              className="bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Zpět do kabiny
            </button>
            <h2 className="text-3xl font-bold text-indigo-400">Přátelský zápas</h2>
            <div className="w-24"></div>
          </div>

          {/* Skóre a čas */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold mb-4">
              <span className="text-white">Lancers Bílý</span>
              <span className="mx-4">{score.white} : {score.black}</span>
              <span className="text-gray-400">Lancers Černý</span>
            </div>
            <div className="text-2xl font-mono">{formatGameTime(gameTime)}</div>
          </div>

          {/* Ovládací prvky */}
          <div className="flex justify-center gap-4 mb-8">
            {gameState === 'warmup' && (
              <button
                onClick={() => setGameState('playing')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl text-xl font-bold transition-colors"
              >
                Začít zápas
              </button>
            )}
            {gameState === 'playing' && (
              <>
                <button
                  onClick={() => setGameSpeed(prev => Math.max(1, prev - 1))}
                  className="bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg"
                >
                  Zpomalit
                </button>
                <div className="bg-indigo-900/50 px-4 py-2 rounded-lg">
                  Rychlost: {gameSpeed}x
                </div>
                <button
                  onClick={() => setGameSpeed(prev => Math.min(5, prev + 1))}
                  className="bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg"
                >
                  Zrychlit
                </button>
              </>
            )}
          </div>

          {/* Sestavy týmů */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 p-4 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Lancers Bílý</h3>
              <div className="space-y-2">
                {teams.white.players.map((player) => (
                  <div key={`${player.name}-${player.surname}`} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
                        alt={player.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <span>{player.name} {player.surname}</span>
                    <span className="text-indigo-400 text-sm">({player.position})</span>
                    <span className="text-yellow-400 text-sm ml-auto">LVL {player.level || 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <h3 className="text-xl font-bold text-gray-400 mb-4">Lancers Černý</h3>
              <div className="space-y-2">
                {teams.black.players.map((player) => (
                  <div key={`${player.name}-${player.surname}`} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
                        alt={player.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <span>{player.name} {player.surname}</span>
                    <span className="text-indigo-400 text-sm">({player.position})</span>
                    <span className="text-yellow-400 text-sm ml-auto">LVL {player.level || 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Poslední událost */}
          {lastEvent && (
            <div className="bg-black/50 p-4 rounded-xl mb-8 text-center animate-fadeIn">
              <p className="text-xl">{lastEvent.description}</p>
              <p className="text-sm text-indigo-400">{formatGameTime(lastEvent.time)}</p>
            </div>
          )}

          {/* Seznam událostí */}
          <div className="bg-black/30 rounded-xl p-4 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {events.slice().reverse().map((event, index) => (
                <div key={index} className="bg-black/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400">{formatGameTime(event.time)}</span>
                    <span>{event.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OldaHockeyMatch; 