'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers } from '../data/LitvinovLancers';

const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč' }) => {
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'end'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0); // čas v sekundách
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [teams, setTeams] = useState(() => {
    // Získáme všechny aktivní hráče
    const activePlayers = litvinovLancers.players.filter(p => p.attendance >= 75);
    
    // Rozdělíme je podle dresů
    const whitePlayers = activePlayers.filter(p => 
      assignedJerseys?.white?.has(`${p.name} ${p.surname}`)
    );
    const blackPlayers = activePlayers.filter(p => 
      assignedJerseys?.black?.has(`${p.name} ${p.surname}`)
    );

    return {
      white: {
        name: 'Lancers Bílý',
        players: whitePlayers
      },
      black: {
        name: 'Lancers Černý',
        players: blackPlayers
      }
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
      const eventTypes = ['shot', 'save', 'hit', 'penalty'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const attackingTeam = Math.random() > 0.5 ? 'white' : 'black';
      const defendingTeam = attackingTeam === 'white' ? 'black' : 'white';
      
      const isPlayerInAttackingTeam = assignedJerseys?.[attackingTeam]?.has('PLAYER');
      const isPlayerAttacking = isPlayerInAttackingTeam && Math.random() < 0.2;
      
      let attackingPlayer;
      if (isPlayerAttacking) {
        attackingPlayer = { 
          name: playerName,
          surname: '',
          isPlayer: true 
        };
      } else {
        attackingPlayer = teams[attackingTeam].players[
          Math.floor(Math.random() * teams[attackingTeam].players.length)
        ];
      }
      
      // Vybereme náhodného brankáře z bránícího týmu
      const defendingGoalie = teams[defendingTeam].players.find(p => p.position === 'brankář');
      
      let newEvent = {
        type: randomEvent,
        time: gameTime,
        team: attackingTeam,
        player: attackingPlayer,
        description: getEventDescription(randomEvent, attackingPlayer, attackingTeam)
      };

      if (randomEvent === 'shot') {
        // Hráč (uživatel) má vyšší šanci dát gól :)
        const baseGoalChance = attackingPlayer.isPlayer ? 0.4 : 0.3;
        const goalChance = Math.random();
        const isGoal = goalChance > (defendingGoalie ? 0.8 - baseGoalChance : 0.7 - baseGoalChance);
        
        if (isGoal) {
          setScore(prev => ({
            ...prev,
            [attackingTeam]: prev[attackingTeam] + 1
          }));
          newEvent.type = 'goal';
          
          if (attackingPlayer.isPlayer) {
            // Speciální zpráva pro hráče
            newEvent.description = `GÓL! 🚨 SKÓRUJEŠ za tým ${teams[attackingTeam].name}! Skvělá střela! 🔥`;
          } else {
            newEvent.description = `GÓL! ${attackingPlayer.name} ${attackingPlayer.surname} skóruje za tým ${teams[attackingTeam].name}! 🚨`;
          }
        } else if (defendingGoalie) {
          newEvent.type = 'save';
          if (attackingPlayer.isPlayer) {
            newEvent.description = `Škoda! ${defendingGoalie.name} ${defendingGoalie.surname} chytá tvoji střelu! 🧤`;
          } else {
            newEvent.description = `Výborný zákrok! ${defendingGoalie.name} ${defendingGoalie.surname} chytá střelu od ${attackingPlayer.name}a! 🧤`;
          }
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
                  </div>
                ))}
                {assignedJerseys?.white?.has('PLAYER') && (
                  <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold">{playerName.charAt(0)}</span>
                    </div>
                    <span className="font-bold">{playerName}</span>
                    <span className="text-indigo-400 text-sm">(útočník)</span>
                  </div>
                )}
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
                  </div>
                ))}
                {assignedJerseys?.black?.has('PLAYER') && (
                  <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold">{playerName.charAt(0)}</span>
                    </div>
                    <span className="font-bold">{playerName}</span>
                    <span className="text-indigo-400 text-sm">(útočník)</span>
                  </div>
                )}
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