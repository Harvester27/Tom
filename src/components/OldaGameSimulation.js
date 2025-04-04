'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers, personalityTypes } from '../data/LitvinovLancers';

const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState('entering'); // entering -> greeting -> locker_room -> warmup -> ...
  const [currentTime, setCurrentTime] = useState(16 * 60 + 30); // 16:30 v minutách
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showPlayerInteraction, setShowPlayerInteraction] = useState(false);
  const [interactingPlayer, setInteractingPlayer] = useState(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [showGreetPrompt, setShowGreetPrompt] = useState(false);
  const [playerGreetings, setPlayerGreetings] = useState({});
  const [hasGreeted, setHasGreeted] = useState(false);

  // Funkce pro náhodný výběr hráčů podle jejich docházky
  const selectPlayersByChance = (players) => {
    return players.filter(player => {
      // Vygenerujeme náhodné číslo 0-100
      const chance = Math.random() * 100;
      // Hráč přijde, pokud je náhodné číslo menší než jeho docházka
      return chance < player.attendance;
    });
  };

  // Funkce pro zajištění minimálního počtu hráčů
  const ensureMinimumPlayers = (selectedPlayers, allPlayers, minCount, position) => {
    let players = [...selectedPlayers];
    
    // Pokud nemáme dost hráčů, přidáme ty s nejvyšší docházkou
    if (players.length < minCount) {
      const remainingPlayers = allPlayers
        .filter(p => !players.includes(p))
        .sort((a, b) => b.attendance - a.attendance);
      
      while (players.length < minCount && remainingPlayers.length > 0) {
        players.push(remainingPlayers.shift());
      }
    }
    
    return players;
  };

  // Funkce pro omezení maximálního počtu hráčů
  const limitMaxPlayers = (players, maxCount) => {
    // Seřadíme podle docházky a vezmeme jen maxCount hráčů
    return [...players].sort((a, b) => b.attendance - a.attendance).slice(0, maxCount);
  };

  // Výběr aktivních hráčů
  const [activePlayers] = useState(() => {
    // Získáme všechny hráče
    const allPlayers = litvinovLancers.players;
    
    // Rozdělíme hráče podle pozic
    const goalkeepers = allPlayers.filter(p => p.position === 'brankář');
    const defenders = allPlayers.filter(p => p.position === 'obránce');
    const forwards = allPlayers.filter(p => p.position === 'útočník');

    // Najdeme Oldřicha (ten přijde vždy)
    const olda = defenders.find(p => p.name === "Oldřich" && p.surname === "Štěpanovský");
    const defendersWithoutOlda = defenders.filter(p => p !== olda);

    // Vybereme hráče podle jejich šance na příchod
    let selectedGoalkeepers = selectPlayersByChance(goalkeepers);
    let selectedDefenders = selectPlayersByChance(defendersWithoutOlda);
    let selectedForwards = selectPlayersByChance(forwards);

    // Zajistíme minimální počty
    selectedGoalkeepers = ensureMinimumPlayers(selectedGoalkeepers, goalkeepers, 2, 'brankář');
    selectedDefenders = ensureMinimumPlayers(selectedDefenders, defendersWithoutOlda, 5, 'obránce');
    selectedForwards = ensureMinimumPlayers(selectedForwards, forwards, 6, 'útočník');

    // Omezíme maximální počty (2 brankáři, celkem max 22 hráčů)
    selectedGoalkeepers = limitMaxPlayers(selectedGoalkeepers, 2);
    
    // Přidáme Oldřicha k obráncům
    selectedDefenders = [...selectedDefenders, olda];
    
    // Omezíme celkový počet hráčů v poli (max 20)
    const maxFieldPlayers = 20;
    const totalFieldPlayers = selectedDefenders.length + selectedForwards.length;
    if (totalFieldPlayers > maxFieldPlayers) {
      // Pokud máme moc hráčů, proporcionálně snížíme počty
      const ratio = maxFieldPlayers / totalFieldPlayers;
      const maxDefenders = Math.floor((selectedDefenders.length - 1) * ratio); // -1 pro Oldřicha
      const maxForwards = Math.floor(selectedForwards.length * ratio);
      
      selectedDefenders = [
        ...limitMaxPlayers(selectedDefenders.filter(p => p !== olda), maxDefenders),
        olda
      ];
      selectedForwards = limitMaxPlayers(selectedForwards, maxForwards);
    }

    // Vrátíme všechny vybrané hráče
    return [
      ...selectedGoalkeepers,
      ...selectedDefenders,
      ...selectedForwards
    ];
  });

  // Rozdělení hráčů podle pozic pro lepší organizaci
  const groupedPlayers = activePlayers.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {});

  // Formátování času
  const formatGameTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Efekt pro simulaci času v kabině
  useEffect(() => {
    if (gameState !== 'locker_room') return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + (1 * gameSpeed);
        // Když je 17:00, začneme zápas
        if (newTime >= 17 * 60) {
          setGameState('warmup');
          return 0; // Reset času pro zápas
        }
        return newTime;
      });
    }, 60000 / gameSpeed); // Upraveno na minutové intervaly (60000ms = 1 minuta)

    return () => clearInterval(interval);
  }, [gameState, gameSpeed]);

  // Funkce pro generování náhodného pozdravu
  const getRandomGreeting = () => {
    const greetings = [
      "Ahoj!",
      "Čau!",
      "Nazdar!",
      "Zdravím!",
      "Čus!",
      "Dobrý den!",
      "Zdar!",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Funkce pro zpracování pozdravu od hráče
  const handleGreet = () => {
    setHasGreeted(true);
    setShowGreetPrompt(false);

    // Postupně necháme odpovědět hráče s fotkami
    let delay = 0;
    const hraciSFotkou = activePlayers.filter(player => {
      const hasPhoto = !litvinovLancers.players.find(p => 
        p.name === player.name && 
        p.surname === player.surname
      )?.photo?.includes('default');
      return hasPhoto;
    });

    // Rozdělíme celkový čas 1.5 sekundy mezi všechny hráče
    const timePerPlayer = 1500 / hraciSFotkou.length;
    
    hraciSFotkou.forEach((player, index) => {
      delay = index * timePerPlayer; // Každý další hráč odpoví po timePerPlayer ms
      setTimeout(() => {
        setPlayerGreetings(prev => ({
          ...prev,
          [`${player.name}${player.surname}`]: getRandomGreeting()
        }));

        // Každá bublina zmizí po 3 sekundách
        setTimeout(() => {
          setPlayerGreetings(prev => {
            const newGreetings = { ...prev };
            delete newGreetings[`${player.name}${player.surname}`];
            return newGreetings;
          });
        }, 3000);
      }, delay);
    });

    // Po 2 sekundách od posledního pozdravu přejdeme do stavu locker_room
    setTimeout(() => {
      setGameState('locker_room');
    }, delay + 2000);
  };

  // Komponenta pro zobrazení hráče v kabině
  const LockerRoomPlayer = ({ player }) => (
    <div className={`relative flex items-center gap-4 bg-black/30 p-3 rounded-xl hover:bg-black/40 transition-colors
      ${player.name === "Oldřich" && player.surname === "Štěpanovský" ? 'border-2 border-yellow-500/50' : ''}`}>
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/50">
        <Image
          src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
          alt={player.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          unoptimized={true}
        />
      </div>
      <div>
        <div className="text-base font-bold text-white">
          {player.name} {player.surname}
          <span className="ml-2 text-xs text-indigo-400">({player.attendance}%)</span>
        </div>
        <div className="text-sm text-indigo-300">
          {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
          <span className="mx-2">•</span>
          {personalityTypes[player.personality].name}
        </div>
      </div>
      {/* Bublina s pozdravem */}
      {playerGreetings[`${player.name}${player.surname}`] && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                      bg-white text-black px-3 py-1 rounded-xl
                      animate-greetingBubble whitespace-nowrap">
          {playerGreetings[`${player.name}${player.surname}`]}
        </div>
      )}
    </div>
  );

  // Komponenta pro ovládání času
  const TimeControl = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 p-2 rounded-xl">
      <div className="text-xl font-bold text-indigo-400 mr-4">
        {formatGameTime(currentTime)}
      </div>
      {[1, 2, 4, 8, 16].map(speed => (
        <button
          key={speed}
          onClick={() => setGameSpeed(speed)}
          className={`px-3 py-1 rounded-lg ${
            gameSpeed === speed 
              ? 'bg-indigo-500 text-white' 
              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
          } transition-colors`}
        >
          {speed}×
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-7xl w-full mx-4 relative">
        {gameState === 'entering' ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8 animate-fadeIn">
              Vstupuješ do kabiny...
            </h2>
            <button
              onClick={() => {
                setGameState('greeting');
                setShowGreetPrompt(true);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl
                        transition-all duration-300 transform hover:scale-105"
            >
              Vstoupit do kabiny
            </button>
          </div>
        ) : gameState === 'greeting' ? (
          <>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8">
              Kabina Lancers
            </h2>
            
            <div className="space-y-6">
              {/* Brankáři */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Brankáři <span className="text-sm text-indigo-400">({groupedPlayers['brankář']?.length || 0} / 2)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {groupedPlayers['brankář']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>

              {/* Obránci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Obránci <span className="text-sm text-indigo-400">({groupedPlayers['obránce']?.length || 0} / 6)</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {groupedPlayers['obránce']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>

              {/* Útočníci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Útočníci <span className="text-sm text-indigo-400">({groupedPlayers['útočník']?.length || 0} / 11)</span>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {groupedPlayers['útočník']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>
            </div>

            {showGreetPrompt && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-indigo-900/90 p-8 rounded-xl border border-indigo-500/30 text-center">
                  <h3 className="text-2xl font-bold text-indigo-300 mb-4">
                    Pozdravit ostatní?
                  </h3>
                  <div className="space-x-4">
                    <button
                      onClick={handleGreet}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Pozdravit
                    </button>
                    <button
                      onClick={() => {
                        setShowGreetPrompt(false);
                        setGameState('locker_room');
                      }}
                      className="bg-gray-500/50 hover:bg-gray-500/70 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Ignorovat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : gameState === 'locker_room' ? (
          <>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8">
              Kabina Lancers
            </h2>
            
            <div className="space-y-6">
              {/* Brankáři */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Brankáři <span className="text-sm text-indigo-400">({groupedPlayers['brankář']?.length || 0} / 2)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {groupedPlayers['brankář']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>

              {/* Obránci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Obránci <span className="text-sm text-indigo-400">({groupedPlayers['obránce']?.length || 0} / 6)</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {groupedPlayers['obránce']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>

              {/* Útočníci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Útočníci <span className="text-sm text-indigo-400">({groupedPlayers['útočník']?.length || 0} / 11)</span>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {groupedPlayers['útočník']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-indigo-300">
              Hráči se připravují na zápas...
            </div>

            <TimeControl />
          </>
        ) : (
          <div>Další stavy hry budou následovat...</div>
        )}

        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Zpět
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes greetingBubble {
          0% { opacity: 0; transform: translate(-50%, 10px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-greetingBubble {
          animation: greetingBubble 3s ease-out forwards;
        }

        /* Stylové scrollbary */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default OldaGameSimulation; 