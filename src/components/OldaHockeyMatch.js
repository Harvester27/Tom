'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { litvinovLancers } from '../data/LitvinovLancers';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowLeftOnRectangleIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon as XMarkSolidIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  UserCircleIcon,
  FlagIcon, // Goal icon alternative
  HandRaisedIcon // Save icon alternative
} from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx'; // Knihovna pro podmíněné třídy: npm install clsx

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 15; // Celková délka zápasu (15 min pro demo)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 8;
const EVENT_CHECK_INTERVAL = 15; // V sekundách herního času

// Konstanty pro střídání
const SHIFT_DURATION = 45; // Délka střídání v sekundách
const FATIGUE_INCREASE_RATE = 2.5; // Zvýšeno z 0.8 na 2.5 - rychlejší únava
const RECOVERY_RATE = 1.5; // Zvýšeno z 0.4 na 1.5 - rychlejší regenerace
const MAX_FATIGUE = 100;
const FATIGUE_PERFORMANCE_IMPACT = 0.5; // Jak moc únava ovlivňuje výkon (0-1)

// --- Helper Functions ---
const formatGameTime = (totalSeconds, periodDuration) => {
  const period = Math.min(3, Math.floor(totalSeconds / periodDuration) + 1);
  const timeInPeriod = totalSeconds % periodDuration;
  const minutes = Math.floor(timeInPeriod / 60);
  const seconds = timeInPeriod % 60;
  return `Třetina ${period} | ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getPlayerKey = (player) => `${player.name}-${player.surname}-${player.position}`;

// Optimalizace aktualizace stavu
const useTeamState = (initialTeams) => {
  const [teams, setTeams] = useState(initialTeams);
  const [teamState, setTeamState] = useState(() => {
    const initializeTeamState = (team) => ({
      onIce: [],
      bench: [],
      fatigue: {},
      lastShiftChange: 0
    });

    return {
      white: initializeTeamState(initialTeams.white),
      black: initializeTeamState(initialTeams.black)
    };
  });
  
  const updateTeam = useCallback((teamColor, updates) => {
    setTeams(prev => ({
      ...prev,
      [teamColor]: {
        ...prev[teamColor],
        ...updates
      }
    }));
  }, []);

  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => ({
      ...prev,
      [teamColor]: {
        ...prev[teamColor],
        ...updates
      }
    }));
  }, []);

  return [teams, updateTeam, teamState, updateTeamState];
};

// --- Component ---
const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'paused', 'finished'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0); // čas v sekundách
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [highlightedPlayerKey, setHighlightedPlayerKey] = useState(null);
  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);

  // Použijeme optimalizovaný hook pro práci s týmy
  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: {
      name: 'Bílý tým',
      players: []
    },
    black: {
      name: 'Černý tým',
      players: []
    }
  });

  // --- Team Initialization ---
  useEffect(() => {
    console.log("🏃 DEBUG: Inicializuji týmy...");
    // Získáme všechny aktivní hráče a zachováme jejich SKUTEČNÝ level
    const activePlayers = litvinovLancers.players.filter(p => p.attendance >= 75).map(player => ({
      ...player,
      // Použijeme přímo level z LitvinovLancers, bez přepočtu
      key: getPlayerKey(player)
    }));

    // Rozdělíme je podle dresů
    const whitePlayers = activePlayers.filter(p =>
      assignedJerseys?.white?.has(`${p.name} ${p.surname}`)
    );
    const blackPlayers = activePlayers.filter(p =>
      assignedJerseys?.black?.has(`${p.name} ${p.surname}`)
    );

     // Přidáme hráče (uživatele) do správného týmu
    const playerStats = {
      name: playerName,
      surname: '(Ty)', // Odlišení hráče
      position: 'útočník', // Výchozí, může být upraveno
      level: playerLevel || 3, // Použijeme skutečný level hráče, default 3
      isPlayer: true,
      key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'})
    };

    // Rozdělíme zbytek hráčů náhodně do týmů, přidáme klíče
    const remainingPlayers = activePlayers
      .filter(p =>
        !assignedJerseys?.white?.has(`${p.name} ${p.surname}`) &&
        !assignedJerseys?.black?.has(`${p.name} ${p.surname}`)
      )
      .map(p => ({ ...p, key: getPlayerKey(p) }));

    // Náhodně zamícháme zbývající hráče
    const shuffledPlayers = [...remainingPlayers].sort(() => Math.random() - 0.5);

    // Přidáme hráče (uživatele) do týmu
     const whiteTeam = { name: 'Lancers Bílý', players: whitePlayers.map(p => ({ ...p, key: getPlayerKey(p) })) };
     const blackTeam = { name: 'Lancers Černý', players: blackPlayers.map(p => ({ ...p, key: getPlayerKey(p) })) };

    if (assignedJerseys?.white?.has(playerName)) {
      whiteTeam.players.push(playerStats);
    } else if (assignedJerseys?.black?.has(playerName)) {
      blackTeam.players.push(playerStats);
    } else {
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
    const ensureGoalie = (team, otherTeam) => {
        let hasGoalie = team.players.some(p => p.position === 'brankář');
        if (!hasGoalie) {
            // Najdeme brankáře mezi aktivními hráči, kteří ještě nejsou v žádném týmu
            const availableGoalie = activePlayers.find(p =>
                p.position === 'brankář' &&
                !team.players.some(tp => getPlayerKey(tp) === getPlayerKey(p)) &&
                !otherTeam.players.some(otp => getPlayerKey(otp) === getPlayerKey(p))
            );
            if (availableGoalie) {
                team.players.push({ ...availableGoalie, key: getPlayerKey(availableGoalie) });
                hasGoalie = true;
            }
        }
         // Pokud stále nemá brankáře, vytvoříme náhradního
        if (!hasGoalie) {
            const backupGoalie = {
                name: 'Náhradní', surname: 'Brankář', position: 'brankář', level: 3, attendance: 75,
                key: getPlayerKey({ name: 'Náhradní', surname: 'Brankář', position: 'brankář'})
            };
            // Zajistíme unikátnost klíče, pokud by náhodou už existoval
            while (team.players.some(p => p.key === backupGoalie.key) || otherTeam.players.some(p => p.key === backupGoalie.key)) {
                 backupGoalie.key += '_'; // Přidáme podtržítko pro unikátnost
            }
            team.players.push(backupGoalie);
        }
    };

    // Musíme zajistit brankáře pro oba týmy současně, aby si nekradli stejného dostupného
    ensureGoalie(whiteTeam, blackTeam);
    ensureGoalie(blackTeam, whiteTeam);

    // Seřadíme hráče podle pozic (Brankář, Obránce, Útočník)
    const sortPlayers = (players) => {
        const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
        return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };

    whiteTeam.players = sortPlayers(whiteTeam.players);
    blackTeam.players = sortPlayers(blackTeam.players);

    updateTeam('white', { players: whiteTeam.players });
    updateTeam('black', { players: blackTeam.players });

    // Aktualizujeme teamState po inicializaci týmů
    const initializeTeamState = (team) => ({
      onIce: team.players.slice(0, 5),
      bench: team.players.slice(5),
      fatigue: team.players.reduce((acc, player) => {
        acc[player.key] = 0;
        return acc;
      }, {}),
      lastShiftChange: 0
    });

    updateTeamState('white', initializeTeamState(whiteTeam));
    updateTeamState('black', initializeTeamState(blackTeam));

    // Přidáme na konec inicializace před updateTeamState
    console.log("🏃 DEBUG: Inicializuji teamState pro BÍLÝ tým...", whiteTeam.players.map(p => `${p.name} ${p.surname} (${p.key})`));
    console.log("🏃 DEBUG: Inicializuji teamState pro ČERNÝ tým...", blackTeam.players.map(p => `${p.name} ${p.surname} (${p.key})`));

    // Testujeme správné klíče hráčů
    const allPlayers = [...whiteTeam.players, ...blackTeam.players];
    allPlayers.forEach(player => {
      if (!player.key) {
        console.error(`🔴 DEBUG: Hráč ${player.name} ${player.surname} nemá klíč!`);
      }
    });
  }, [updateTeam, updateTeamState]);

  // --- Highlight Player ---
  const triggerHighlight = useCallback((playerKeys) => {
    if (!Array.isArray(playerKeys)) playerKeys = [playerKeys];
    playerKeys.forEach(key => {
        if (!key) return;
        setHighlightedPlayerKey(prev => ({ ...(prev ?? {}), [key]: true })); // Set highlight
        setTimeout(() => {
            setHighlightedPlayerKey(prev => {
                 if (!prev) return null;
                 const newHighlights = { ...prev };
                 delete newHighlights[key];
                 return Object.keys(newHighlights).length > 0 ? newHighlights : null;
            }); // Remove highlight after delay
        }, 1500); // Zvýraznění na 1.5 sekundy
    });
  }, []);

  // --- Game Simulation Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setGameTime(prevTime => {
        const newTime = prevTime + 1;

        if (newTime >= GAME_DURATION_SECONDS) {
          setGameState('finished');
          if (onGameComplete) {
            onGameComplete({ score, events });
          }
          clearInterval(timerInterval);
          return GAME_DURATION_SECONDS;
        }

        // Aktualizace periody
        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        if (newPeriod !== currentPeriod) {
          setCurrentPeriod(newPeriod);
          // Můžeme přidat událost změny periody, pokud chceme
           const periodChangeEvent = {
              type: 'period_change',
              time: newTime,
              description: `Začala ${newPeriod}. třetina!`,
              period: newPeriod
           };
           setEvents(prev => [...prev, periodChangeEvent]);
           setLastEvent(periodChangeEvent);
        }

        // --- Event Generation Logic ---
        if (newTime > 0 && newTime % EVENT_CHECK_INTERVAL === 0) {
            const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
            const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';
            const attackingTeam = teams[attackingTeamId];
            const defendingTeam = teams[defendingTeamId];

            // --- Decide Event Type ---
            const eventRoll = Math.random();
            let eventType = 'attack'; // Default
            if (eventRoll < 0.08) { // 8% šance na faul
                eventType = 'penalty';
            } else { // Jinak útok
                eventType = 'attack';
            }

            let newEvent = { time: newTime, team: attackingTeamId };

            if (eventType === 'penalty') {
                // Vyber hráče, který fauloval (ne brankáře)
                const possibleFoulers = attackingTeam.players.filter(p => p.position !== 'brankář');
                 if (possibleFoulers.length === 0) return newTime; // Žádný hráč k faulování
                 const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                 newEvent.type = 'penalty';
                 newEvent.player = fouler;
                 newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeam.name}) dostává 2 minuty! 😠 (${fouler.isPlayer ? 'Ty!' : ''})`;
                 triggerHighlight(fouler.key);

            } else { // Attack logic
                 // Vyber útočníka (ne brankáře)
                 const attackers = attackingTeam.players.filter(p => p.position !== 'brankář');
                 if (attackers.length === 0) return newTime; // Nemá kdo útočit
                 const attacker = attackers[Math.floor(Math.random() * attackers.length)];

                 // Najdi brankáře a obránce
                 const goalie = defendingTeam.players.find(p => p.position === 'brankář');
                 const defenders = defendingTeam.players.filter(p => p.position === 'obránce');
                 const defender = defenders.length > 0 ? defenders[Math.floor(Math.random() * defenders.length)] : null;

                 // --- Calculate Goal Chance ---
                 let goalChance = 0.25; // Base chance
                 goalChance += (attacker.level || 1) * 0.04; // Attacker skill bonus
                 if (attacker.isPlayer) goalChance += 0.15; // Player bonus
                 if (defender) goalChance -= (defender.level || 1) * 0.03; // Defender skill penalty
                 if (goalie) goalChance -= (goalie.level || 1) * 0.06; // Goalie skill penalty
                 goalChance = Math.max(0.05, Math.min(0.85, goalChance)); // Clamp chance

                 const outcomeRoll = Math.random();

                 if (outcomeRoll < goalChance) {
                     // --- GÓL ---
                     setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                     // Najdi asistenta (jiný hráč útočícího týmu, ne brankář)
                     const possibleAssists = attackingTeam.players.filter(p => p.key !== attacker.key && p.position !== 'brankář');
                     const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;

                     newEvent.type = 'goal';
                     newEvent.player = attacker;
                     newEvent.assistant = assistant;
                     newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} (${attacker.isPlayer ? 'Ty!' : attackingTeam.name}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}` : ''}!`;
                     triggerHighlight([attacker.key, assistant?.key].filter(Boolean)); // Zvýrazní střelce a asistenta

                 } else if (outcomeRoll < goalChance + 0.35 || !defender) {
                     // --- ZÁKROK BRANKÁŘE ---
                     newEvent.type = 'save';
                     newEvent.player = goalie; // Brankář je "hráčem" události
                     newEvent.shooter = attacker; // Kdo střílel
                     newEvent.description = `🧤 Skvělý zákrok! ${goalie?.name || 'Brankář'} ${goalie?.surname || ''} (${defendingTeam.name}) chytá střelu od ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.`;
                     triggerHighlight([goalie?.key, attacker.key].filter(Boolean));

                 } else {
                    // --- BLOK OBRÁNCE ---
                     newEvent.type = 'defense';
                     newEvent.player = defender; // Obránce je "hráčem" události
                     newEvent.attacker = attacker; // Kdo útočil
                     newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeam.name}) zastavil akci hráče ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                     triggerHighlight([defender.key, attacker.key].filter(Boolean));
                 }
            }

            setLastEvent(newEvent);
            setEvents(prev => [newEvent, ...prev]); // Přidáváme na začátek pro snazší zobrazení
        }

        return newTime;
      });
    }, 1000 / gameSpeed);

    return () => clearInterval(timerInterval);
  }, [gameState, gameSpeed, teams, score, currentPeriod, onGameComplete, triggerHighlight]); // Přidány závislosti

  // Scroll event log to top when new event is added
   useEffect(() => {
       if (eventLogRef.current) {
           eventLogRef.current.scrollTop = 0;
       }
        // Scroll last event into view (optional, can be distracting)
        // if (lastEventRef.current) {
        //     lastEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // }
   }, [events]);

  // Efekt pro aktualizaci únavy
  useEffect(() => {
    if (gameState !== 'playing') {
      console.log("🔴 DEBUG: Hra není ve stavu 'playing', aktuální stav:", gameState);
      return;
    }

    const interval = setInterval(() => {
      console.log("🏃 DEBUG: Aktualizuji únavu hráčů...");
      
      // Ověříme, že teamState obsahuje správné údaje
      console.log("🟡 DEBUG: Kompletní teamState před aktualizací:", teamState);
      
      setTeamState(prev => {
        // Pro účely debugování získáme celkový stav před změnou
        console.log("🏃 DEBUG: Aktuální stav únavy - BÍLÝ tým:", prev.white.fatigue);
        console.log("🏃 DEBUG: Aktuální stav únavy - ČERNÝ tým:", prev.black.fatigue);
        console.log("🏃 DEBUG: Hráči na ledě - BÍLÝ tým:", prev.white.onIce.map(p => p.key));
        console.log("🏃 DEBUG: Hráči na ledě - ČERNÝ tým:", prev.black.onIce.map(p => p.key));
        
        // Ověříme strukturu objektů hráčů a jejich klíčů
        console.log("🔍 DEBUG: Struktura hráčů na ledě - BÍLÝ tým:", prev.white.onIce);
        console.log("🔍 DEBUG: Struktura hráčů na ledě - ČERNÝ tým:", prev.black.onIce);
        
        const updateTeamFatigue = (teamState, teamColor) => {
          // Je důležité vytvořit nový objekt, abychom nevytvářeli referenční problémy
          const newFatigue = { ...teamState.fatigue };
          
          // Zvýšení únavy hráčů na ledě
          teamState.onIce.forEach(player => {
            if (!player.key) {
              console.error(`🔴 DEBUG: Hráč ${player.name} ${player.surname} nemá klíč!`);
              return;
            }
            
            // Používáme key pro přístup k únavě
            const oldFatigue = newFatigue[player.key] || 0;
            newFatigue[player.key] = Math.min(
              MAX_FATIGUE,
              oldFatigue + FATIGUE_INCREASE_RATE
            );
            
            console.log(`🏃 DEBUG: ${teamColor} tým - Hráč ${player.name} ${player.surname} (${player.key}) - na ledě - únava: ${oldFatigue} -> ${newFatigue[player.key]}`);
          });

          // Regenerace hráčů na střídačce
          teamState.bench.forEach(player => {
            if (!player.key) {
              console.error(`🔴 DEBUG: Hráč ${player.name} ${player.surname} nemá klíč!`);
              return;
            }
            
            const oldFatigue = newFatigue[player.key] || 0;
            newFatigue[player.key] = Math.max(
              0,
              oldFatigue - RECOVERY_RATE
            );
            
            console.log(`🏃 DEBUG: ${teamColor} tým - Hráč ${player.name} ${player.surname} (${player.key}) - na střídačce - únava: ${oldFatigue} -> ${newFatigue[player.key]}`);
          });

          return {
            ...teamState,
            fatigue: newFatigue
          };
        };

        const newWhite = updateTeamFatigue(prev.white, "BÍLÝ");
        const newBlack = updateTeamFatigue(prev.black, "ČERNÝ");
        
        console.log("🏃 DEBUG: Nový stav únavy - BÍLÝ tým:", newWhite.fatigue);
        console.log("🏃 DEBUG: Nový stav únavy - ČERNÝ tým:", newBlack.fatigue);
        
        // Vraťme konkrétní nový objekt, abychom zajistili, že React zaregistruje změnu
        return {
          white: {
            ...prev.white,
            fatigue: { ...newWhite.fatigue } // Zajistíme, že to je skutečně nový objekt
          },
          black: {
            ...prev.black,
            fatigue: { ...newBlack.fatigue } // Zajistíme, že to je skutečně nový objekt
          }
        };
      });
    }, 1000); // Každou sekundu aktualizujeme únavu

    return () => clearInterval(interval);
  }, [gameState]);

  // Efekt pro automatické střídání
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      // Automatické střídání pro oba týmy
      ['white', 'black'].forEach(teamColor => {
        setTeamState(prev => {
          const teamState = prev[teamColor];
          const now = gameTime;

          // Kontrola, zda je vhodný čas na střídání
          if (now - teamState.lastShiftChange < SHIFT_DURATION) {
            return prev;
          }

          // Seřazení hráčů na ledě podle únavy (nejvíc unavení první)
          const sortedOnIce = [...teamState.onIce].sort((a, b) => 
            teamState.fatigue[b.key] - teamState.fatigue[a.key]
          );

          // Seřazení hráčů na střídačce podle odpočinku (nejvíc odpočatí první)
          const sortedBench = [...teamState.bench].sort((a, b) => 
            teamState.fatigue[a.key] - teamState.fatigue[b.key]
          );

          // Najdeme hráče (uživatele) v týmu
          const playerInTeam = [...sortedOnIce, ...sortedBench].find(p => p.isPlayer);
          
          // Pokud je hráč v tomto týmu, nebudeme ho automaticky střídat
          const playersToChange = sortedOnIce.filter(p => !p.isPlayer);
          const availableBench = sortedBench.filter(p => !p.isPlayer);

          // Výměna nejvíce unavených hráčů za odpočaté
          const numToChange = Math.min(2, Math.floor(playersToChange.length / 2));
          
          // Vytvoříme nové sestavy
          let newOnIce = [...sortedOnIce];
          let newBench = [...sortedBench];

          // Pokud máme hráče ke střídání
          if (numToChange > 0) {
            // Odstraníme unavené hráče (kromě uživatele)
            const toRemove = playersToChange.slice(0, numToChange);
            newOnIce = newOnIce.filter(p => !toRemove.includes(p));
            
            // Přidáme odpočaté hráče
            const toAdd = availableBench.slice(0, numToChange);
            newOnIce = [...newOnIce, ...toAdd];
            
            // Aktualizujeme lavičku
            newBench = [
              ...sortedBench.filter(p => !toAdd.includes(p)),
              ...toRemove
            ];

            // Přidáme událost o střídání
            const playersIn = toAdd.map(p => p.name).join(", ");
            const playersOut = toRemove.map(p => p.name).join(", ");
            
            setEvents(prev => [{
              time: gameTime,
              type: 'substitution',
              team: teamColor,
              description: `Střídání v týmu ${teamColor === 'white' ? 'Bílých' : 'Černých'}: ${playersIn} ↔️ ${playersOut}`
            }, ...prev]);
          }

          return {
            ...prev,
            [teamColor]: {
              ...teamState,
              onIce: newOnIce,
              bench: newBench,
              lastShiftChange: now
            }
          };
        });
      });
    }, 5000); // Kontrola každých 5 sekund

    return () => clearInterval(interval);
  }, [gameState, gameTime]);

  // Funkce pro manuální střídání hráče - kontrola logiky
  const handlePlayerSubstitution = (teamColor) => {
    setTeamState(prev => {
      const teamState = prev[teamColor];
      // Zajistíme, že teamState a jeho pole jsou definována
      if (!teamState || !teamState.onIce || !teamState.bench || !teamState.fatigue) {
          console.error("Chyba: teamState není správně inicializován pro", teamColor);
          return prev; // Vrátíme původní stav, abychom zabránili chybě
      }

      const now = gameTime;

      // Najdeme hráče v týmu
      const playerOnIce = teamState.onIce.find(p => p.isPlayer);
      const playerOnBench = teamState.bench.find(p => p.isPlayer);

      // Pokud hráč není v tomto týmu, nic neděláme
      if (!playerOnIce && !playerOnBench) return prev;

      // Pokud je hráč na ledě, přesuneme ho na lavičku
      if (playerOnIce) {
         // Najdeme nejodpočatějšího hráče na lavičce (který není hráč)
         const restedBenchPlayer = [...teamState.bench]
            .filter(p => !p.isPlayer) // Jen AI hráči
            .sort((a, b) => (teamState.fatigue[a.key] || 0) - (teamState.fatigue[b.key] || 0))[0]; // Seřadíme a vezmeme prvního

         // Pokud není nikdo na lavičce k vystřídání, nic neděláme
         if (!restedBenchPlayer) return prev;

         const newOnIce = teamState.onIce.filter(p => !p.isPlayer); // Odstraníme hráče
         newOnIce.push(restedBenchPlayer); // Přidáme nejodpočatějšího z lavičky
         const newBench = teamState.bench.filter(p => p !== restedBenchPlayer); // Odstraníme hráče z lavičky
         newBench.push(playerOnIce); // Přidáme hráče na lavičku

         setEvents(prevEvents => [{
          time: gameTime,
          type: 'substitution',
          team: teamColor,
          description: `${playerName} ⬇️ střídá, ${restedBenchPlayer.name} ⬆️ na led.`
        }, ...prevEvents]);

        return {
          ...prev,
          [teamColor]: {
            ...teamState,
            onIce: newOnIce,
            bench: newBench,
            lastShiftChange: now // Resetujeme časovač střídání pro hráče
          }
        };
      }

      // Pokud je hráč na lavičce, přesuneme ho na led
      if (playerOnBench) {
         // Najdeme nejunavenějšího hráče na ledě (který není hráč)
         const tiredOnIcePlayer = [...teamState.onIce]
            .filter(p => !p.isPlayer) // Jen AI hráči
            .sort((a, b) => (teamState.fatigue[b.key] || 0) - (teamState.fatigue[a.key] || 0))[0]; // Seřadíme a vezmeme prvního

         // Pokud není koho vystřídat na ledě, nic neděláme
         if (!tiredOnIcePlayer) return prev;

         const newBench = teamState.bench.filter(p => !p.isPlayer); // Odstraníme hráče z lavičky
         newBench.push(tiredOnIcePlayer); // Přidáme unaveného na lavičku
         const newOnIce = teamState.onIce.filter(p => p !== tiredOnIcePlayer); // Odstraníme unaveného z ledu
         newOnIce.push(playerOnBench); // Přidáme hráče na led

         setEvents(prevEvents => [{
          time: gameTime,
          type: 'substitution',
          team: teamColor,
          description: `${playerName} ⬆️ naskakuje na led místo ${tiredOnIcePlayer.name} ⬇️.`
        }, ...prevEvents]);

        return {
          ...prev,
          [teamColor]: {
            ...teamState,
            onIce: newOnIce,
            bench: newBench,
            lastShiftChange: now // Resetujeme časovač střídání pro hráče
          }
        };
      }

      return prev; // Vrátíme původní stav, pokud nedošlo ke změně
    });
  };

  // --- Event Handlers ---
  const handleStartPause = () => {
    if (gameState === 'playing') {
      console.log("🎮 DEBUG: Pauzuji hru");
      setGameState('paused');
    } else {
      console.log("🎮 DEBUG: Spouštím hru, předchozí stav:", gameState);
      setGameState('playing');
    }
  };

  const changeSpeed = (delta) => {
    setGameSpeed(prev => Math.max(1, Math.min(MAX_SPEED, prev + delta)));
  };

  // --- Render Helper ---
  const getEventIcon = (type) => {
    switch (type) {
      case 'goal': return <FlagIcon className="h-5 w-5 text-green-400" />;
      case 'save': return <HandRaisedIcon className="h-5 w-5 text-blue-400" />;
      case 'defense': return <ShieldCheckIcon className="h-5 w-5 text-orange-400" />;
      case 'penalty': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'period_change': return <ClockIcon className="h-5 w-5 text-indigo-400" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderPlayer = (player, teamId) => {
     const isHighlighted = highlightedPlayerKey?.[player.key];
     const playerTeamColor = teamId === 'white' ? 'border-white/50' : 'border-gray-500/50';
     const highlightClass = isHighlighted ? (teamId === 'white' ? 'bg-white/30 scale-105' : 'bg-gray-600/50 scale-105') : '';
     const playerPhotoUrl = player.isPlayer
         ? '/assets/images/players/default_player.png' // Cesta k vaší defaultní fotce hráče
         : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);

     return (
       <div
         key={player.key}
         className={clsx(
           "flex items-center gap-2 p-1.5 rounded-md transition-all duration-300 ease-in-out",
           highlightClass
         )}
       >
         <Image
           src={playerPhotoUrl}
           alt={`${player.name} ${player.surname}`}
           width={28}
           height={28}
           className={`rounded-full object-cover border-2 ${playerTeamColor} flex-shrink-0`}
           unoptimized={true} // Pokud nemáš optimalizaci pro externí URL nebo lokální cesty
           onError={(e) => { e.target.src = '/assets/images/players/default_player.png'; }} // Fallback image
         />
         <div className="flex-grow text-sm truncate">
           {player.name} {player.surname}
           <span className="text-xs text-gray-400 ml-1">({player.position.slice(0, 1).toUpperCase()})</span>
         </div>
         <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/20 rounded">
           L{player.level || 1}
         </span>
       </div>
     );
  };

  // Upravím renderPlayerStatus pro lepší zobrazení únavy
  const renderPlayerStatus = (player, teamColor) => {
    // Zajistíme, že teamState a fatigue existují
    const currentTeamState = teamState[teamColor];
    if (!currentTeamState || !currentTeamState.fatigue) {
      console.error(`🔴 DEBUG: Chybějící teamState nebo fatigue pro tým ${teamColor}`, { currentTeamState });
      return null; // Nebo vrátit placeholder
    }

    // Kontrola klíče hráče
    if (!player.key) {
      console.error(`🔴 DEBUG: Hráč ${player.name} ${player.surname} nemá klíč!`);
      const generatedKey = getPlayerKey(player);
      console.log(`🟢 DEBUG: Generuji náhradní klíč pro hráče: ${generatedKey}`);
      player.key = generatedKey;
    }

    // Kontrola, zda existuje fatigue pro hráče
    let fatigue = 0;
    if (player.key in currentTeamState.fatigue) {
      fatigue = Math.round(currentTeamState.fatigue[player.key] || 0);
    } else {
      console.error(`🔴 DEBUG: Hráč ${player.name} ${player.surname} (${player.key}) nemá záznam o únavě!`);
      // Inicializace únavy pro hráče, pokud neexistuje
      setTeamState(prev => {
        const newState = { ...prev };
        newState[teamColor].fatigue[player.key] = 0;
        return newState;
      });
    }

    const isOnIce = currentTeamState.onIce?.some(p => p.key === player.key);
    
    // Debug log pro zobrazování únavy
    console.log(`🔵 DEBUG: Rendering player ${player.name} ${player.surname} (${player.key}) - tým ${teamColor} - únava: ${fatigue}% - ${isOnIce ? 'na ledě' : 'na střídačce'}`);
    
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-300 ${
        isOnIce ? 'bg-green-700/30 border border-green-500/40' : 'bg-gray-700/30 border border-transparent'
      }`}>
        {/* Player Image */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700">
          <Image
            src={player.isPlayer ? '/assets/images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
            alt={player.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized={true}
            onError={(e) => { e.target.src = '/assets/images/players/default_player.png'; }}
          />
        </div>
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{player.name} {player.surname} {player.isPlayer ? '(Ty)' : ''}</div>
          <div className="text-xs text-indigo-300">{player.position} - L{player.level || 1}</div>
          <div className="text-xs text-red-300">Únava: {fatigue}% {player.key && player.key.substring(0, 5)}</div>
        </div>
        {/* Fatigue Bar */}
        <div className="w-20 flex-shrink-0">
          <div className="text-xs text-gray-400 mb-1 text-right">{fatigue}%</div>
          <div className="h-2.5 bg-gray-600 rounded-full overflow-hidden relative">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                fatigue > 80 ? 'bg-red-500' : 
                fatigue > 50 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${fatigue}%` }}
            />
          </div>
        </div>
        {/* On Ice Indicator */}
        {isOnIce && (
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0" title="Na ledě"></div>
        )}
        {/* Status indikátor */}
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.key in currentTeamState.fatigue ? 'green' : 'red' }}></div>
      </div>
    );
  };

  // Optimalizovaná komponenta pro tabulku hráčů
  const TeamTable = React.memo(({ whiteTeam, blackTeam }) => {
    const [selectedTeam, setSelectedTeam] = useState('white'); // 'white' nebo 'black'

    const currentTeam = selectedTeam === 'white' ?
      { players: whiteTeam.players, title: whiteTeam.name } :
      { players: blackTeam.players, title: blackTeam.name };

    // Zkontrolujeme, zda jsou data týmů k dispozici
    if (!currentTeam.players) {
        return (
            <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500">
                Načítání týmů...
            </div>
        );
    }


    return (
      // Změna: Odebrání pevné šířky a použití w-full pro flexibilitu
      <div className="w-full bg-black/50 rounded-lg overflow-hidden flex flex-col h-full">
        <div className="bg-indigo-900/50 p-2 flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => setSelectedTeam('white')}
            className={clsx( // Použití clsx pro lepší čitelnost tříd
              'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', // Přidáno flex-1 a text-center
              selectedTeam === 'white' ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            Bílí
          </button>
          <button
            onClick={() => setSelectedTeam('black')}
            className={clsx(
              'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', // Přidáno flex-1 a text-center
              selectedTeam === 'black' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50' // Mírně upravené barvy pro černý tým
            )}
          >
            Černí
          </button>
        </div>
        {/* Změna: Zvýšení max-h a použití flex-grow pro vyplnění prostoru */}
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-indigo-900/50">
          {currentTeam.players.map((player, index) => (
            <div
              key={player.key || `${player.name}-${player.surname}-${index}`} // Robustnější klíč pro případ chybějícího key
              className={`p-2 text-sm ${index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'}
                         hover:bg-indigo-900/30 transition-colors flex items-center gap-2`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700"> {/* Přidán rámeček pro konzistenci */}
                <Image
                  src={player.isPlayer ? '/assets/images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
                  alt={player.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={(e) => { e.target.src = '/assets/images/players/default_player.png'; }} // Fallback
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{player.name} {player.surname} {player.isPlayer ? '(Ty)' : ''}</div>
                <div className="text-xs text-indigo-300">{player.position}</div>
              </div>
              <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/20 rounded">
                L{player.level || 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  });

  TeamTable.displayName = 'TeamTable';

  // --- Main Render ---
  return (
    <div className="fixed inset-0 bg-black/95 text-gray-200 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-7xl h-[95vh] bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            disabled={gameState === 'playing'}
            title={gameState === 'playing' ? "Nelze opustit během hry" : "Zpět do kabiny"}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Zpět
          </button>
          <h2 className="text-2xl font-bold text-cyan-400 tracking-tight">Lancers Simulátor Zápasu</h2>
          <div className="w-24"> {/* Placeholder for balance */}</div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">

          {/* Left Column: Teams & Controls */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
             {/* Teams */}
             <div className="flex justify-center flex-grow min-h-[200px]">
                <TeamTable 
                  whiteTeam={{ players: teams.white.players, name: teams.white.name }}
                  blackTeam={{ players: teams.black.players, name: teams.black.name }}
                />
            </div>

            {/* Game Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center gap-4 flex-shrink-0">
              {gameState !== 'finished' && (
                 <>
                   <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1} className="p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors">
                     <BackwardIcon className="h-5 w-5 text-white" />
                   </button>

                   <button onClick={handleStartPause} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-lg flex items-center gap-2 transition-colors">
                     {gameState === 'playing' ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                     {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                   </button>

                   <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED} className="p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors">
                     <ForwardIcon className="h-5 w-5 text-white" />
                   </button>

                   <div className="text-sm text-gray-400 ml-4">
                     Rychlost: {gameSpeed}x
                   </div>

                   <div className="text-sm text-gray-400 ml-4">
                     Hra: {gameState}
                   </div>
                 </>
              )}
              {gameState === 'finished' && (
                <div className='text-center'>
                    <p className="text-xl font-semibold text-yellow-400 mb-2">Zápas skončil!</p>
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Zpět do kabiny
                    </button>
                </div>
              )}
            </div>
          </div>


          {/* Right Column: Scoreboard & Events */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            {/* Scoreboard & Time */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center flex-shrink-0">
              <div className="flex justify-around items-center mb-2">
                  <span className="text-3xl lg:text-4xl font-bold text-white">{teams.white.name}</span>
                  <span className="text-5xl lg:text-6xl font-bold text-cyan-400 tabular-nums">
                     {score.white} : {score.black}
                  </span>
                  <span className="text-3xl lg:text-4xl font-bold text-gray-400">{teams.black.name}</span>
              </div>
              <div className="text-xl font-mono text-yellow-500 tracking-wider">
                 {gameState === 'finished' ? 'Konec zápasu' : formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}
              </div>
            </div>

             {/* Last Event */}
             <div ref={lastEventRef} className="bg-black/30 border border-gray-700 rounded-lg p-3 text-center h-20 flex items-center justify-center flex-shrink-0 overflow-hidden">
               {lastEvent ? (
                 <div className="animate-fadeIn flex items-center gap-3">
                     {getEventIcon(lastEvent.type)}
                     <p className="text-sm md:text-base">{lastEvent.description}</p>
                     {/* <p className="text-xs text-cyan-400">{formatGameTime(lastEvent.time, PERIOD_DURATION_SECONDS)}</p> */}
                 </div>
               ) : (
                 <p className="text-gray-500 italic">Očekává se úvodní buly...</p>
               )}
             </div>


            {/* Event Log */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex flex-col flex-grow overflow-hidden">
               <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex-shrink-0 text-center">Průběh zápasu</h3>
               <div ref={eventLogRef} className="overflow-y-auto flex-grow space-y-2 pr-2 custom-scrollbar">
                {events.length === 0 && gameState !== 'finished' && (
                     <p className="text-gray-500 text-center pt-4 italic">Zatím žádné události.</p>
                 )}
                 {events.map((event, index) => (
                   <div key={index} className="bg-black/30 p-2 rounded-md flex items-center gap-2 text-xs md:text-sm">
                     <span className="text-cyan-500 font-mono flex-shrink-0 w-24">
                       {formatGameTime(event.time, PERIOD_DURATION_SECONDS)}
                     </span>
                     <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                     <span className="flex-grow">{event.description}</span>
                   </div>
                 ))}
                 {gameState === 'finished' && (
                    <div className="mt-4 p-4 bg-green-900/50 rounded-lg text-center">
                        <TrophyIcon className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                        <p className="text-xl font-bold text-white">Konečný stav!</p>
                        <p className="text-lg text-gray-300">{teams.white.name} {score.white} - {score.black} {teams.black.name}</p>
                    </div>
                 )}
               </div>
            </div>

            {/* Přidání tlačítek pro střídání */}
            <div className="flex gap-4 mb-4 justify-center">
              {['white', 'black'].map(teamColor => {
                const team = teamState[teamColor];
                const playerInTeam = [...(team.onIce || []), ...(team.bench || [])].find(p => p.isPlayer);
                
                if (!playerInTeam) return null;

                const isOnIce = team.onIce.some(p => p.isPlayer);
                const fatigue = team.fatigue[playerInTeam.key] || 0;
                
                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)}
                    className={`px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 ${
                      isOnIce 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isOnIce ? '⬇️ Jít na střídačku' : '⬆️ Naskočit na led'}
                    <div className="text-xs bg-black/30 px-2 py-1 rounded">
                      Únava: {Math.round(fatigue)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Přidání zobrazení hráčů a jejich stavu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
              {/* Tým Bílých */}
              <div className="bg-gray-800/40 rounded-lg p-3 flex flex-col border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-3 text-center text-white border-b border-gray-600 pb-2 flex-shrink-0">Bílý tým</h3>
                <div className="space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                  {teams.white.players?.length > 0 ? ( // Kontrola existence players
                      teams.white.players.map(player => renderPlayerStatus(player, 'white'))
                  ) : (
                      <p className="text-gray-500 text-center italic p-4">Žádní hráči</p>
                  )}
                </div>
              </div>
              {/* Tým Černých */}
              <div className="bg-gray-800/40 rounded-lg p-3 flex flex-col border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-3 text-center text-gray-400 border-b border-gray-600 pb-2 flex-shrink-0">Černý tým</h3>
                <div className="space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                  {teams.black.players?.length > 0 ? ( // Kontrola existence players
                      teams.black.players.map(player => renderPlayerStatus(player, 'black'))
                  ) : (
                       <p className="text-gray-500 text-center italic p-4">Žádní hráči</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Inline styles for scrollbar and animation */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 183, 255, 0.5); /* Cyan-ish */
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 183, 255, 0.8);
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 183, 255, 0.5) rgba(0, 0, 0, 0.2);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OldaHockeyMatch;