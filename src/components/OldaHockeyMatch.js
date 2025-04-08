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
import clsx from 'clsx';
import PlayerSpecialAction from './PlayerSpecialAction';

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 90; // PŮVODNÍ: 90 minut (od 16:30 do 18:00)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 64;
const EVENT_CHECK_INTERVAL = 15;

// Konstanty pro střídání a únavu
const SHIFT_DURATION = 60;
const BASE_FATIGUE_INCREASE_RATE = 1.25;
const BASE_RECOVERY_RATE = 1.5;
const MAX_FATIGUE = 100;
const FATIGUE_IMPACT_FACTOR = 0.0015;

// Nové konstanty pro speciální akce
const SPECIAL_ACTION_CHANCE = 0.1;
const SPECIAL_ACTION_INTERVAL = 30;
const MIN_TIME_BETWEEN_ACTIONS = 120;

// --- Helper Functions ---

// PŮVODNÍ FUNKCE ČASU (16:30 - 18:00)
const formatGameTime = (totalSeconds, periodDuration) => {
  totalSeconds = Math.max(0, Math.min(totalSeconds, GAME_DURATION_SECONDS)); // Ošetření hranic
  const startHour = 16;
  const startMinute = 30;
  const totalMinutesElapsed = Math.floor(totalSeconds / 60);
  const secondsElapsed = Math.floor(totalSeconds % 60); // Použijeme floor

  let currentHour = startHour;
  let currentMinute = startMinute + totalMinutesElapsed;

  currentHour += Math.floor(currentMinute / 60);
  currentMinute = currentMinute % 60;

  // Korekce, pokud čas přesáhne 18:00:00
   if (totalSeconds === GAME_DURATION_SECONDS) {
        currentHour = 18;
        currentMinute = 0;
       // secondsElapsed bude 0 pokud GAME_DURATION_SECONDS je násobek 60
   } else if (currentHour >= 18) {
       // Pokud jsme v průběhu hry překročili 18:00 (což by nemělo nastat při správné délce),
       // zobrazíme 18:00:00 jako strop.
       currentHour = 18;
       currentMinute = 0;
       // Sekundy zde neupravujeme, necháme je doběhnout, ale hodiny/minuty zastropujeme.
       // Pro zobrazení je ale lepší zobrazit 18:00:00
       // if (totalSeconds < GAME_DURATION_SECONDS) secondsElapsed = 0; // Vynulujeme i sekundy pro zobrazení
   }


  const period = Math.min(3, Math.floor(totalSeconds / periodDuration) + 1);

  // Použijeme Math.floor i pro sekundy pro jistotu
  return `Třetina ${period} | ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:${secondsElapsed.toString().padStart(2, '0')}`;
};


const getPlayerKey = (player) => {
  if (!player || !player.name || !player.surname || !player.position) {
      console.error("🔴 ERROR: Nelze vygenerovat klíč, chybí data hráče:", player);
      return `invalid-player-${Math.random().toString(36).substring(7)}`;
  }
  return `${player.name}-${player.surname}-${player.position}`;
}

const calculateAverageOnIceFatigue = (playersOnIce = [], fatigueState = {}) => {
    const fieldPlayers = playersOnIce.filter(p => p && p.position !== 'brankář');
    if (fieldPlayers.length === 0) {
        return 0;
    }
    const totalFatigue = fieldPlayers.reduce((sum, player) => {
        // Použijeme ?? 0 pro případ, že hráč ještě nemá záznam o únavě
        return sum + (fatigueState[player.key] ?? 0);
    }, 0);
    return totalFatigue / fieldPlayers.length;
};

// Optimalizovaný hook pro správu stavu týmů a jejich interního stavu
const useTeamState = (initialTeamsData) => {
  const [teams, setTeams] = useState(() => ({
    white: { name: initialTeamsData.white.name, players: [] },
    black: { name: initialTeamsData.black.name, players: [] }
  }));
  const [teamState, setTeamStateInternal] = useState(() => { // Přejmenováno na internal, aby nedošlo ke kolizi
      const initializeSingleTeamState = () => ({
        onIce: [], bench: [], fatigue: {}, lastShiftChange: 0
      });
      return { white: initializeSingleTeamState(), black: initializeSingleTeamState() };
  });

  // Memoizovaná funkce pro aktualizaci seznamu hráčů týmu
  const updateTeam = useCallback((teamColor, updates) => {
    setTeams(prev => ({ ...prev, [teamColor]: { ...prev[teamColor], ...updates } }));
  }, []);

  // Memoizovaná funkce pro aktualizaci dynamického stavu týmu (onIce, bench, fatigue)
  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamStateInternal(prev => { // Používáme přejmenovanou funkci
        const newState = { ...prev };
        // Podpora pro funkční i objektové aktualizace
        if (typeof updates === 'function') {
            newState[teamColor] = updates(prev[teamColor]);
        } else {
            newState[teamColor] = { ...prev[teamColor], ...updates };
        }
        return newState;
    });
  }, []); // Závislost je prázdná, protože setTeamStateInternal je stabilní

  // Vracíme stav a aktualizační funkce
  return [teams, updateTeam, teamState, updateTeamState]; // Vracíme původní název teamState pro vnější použití
};

// --- Component ---
const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  const [gameState, setGameState] = useState('warmup');
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [highlightedPlayerKey, setHighlightedPlayerKey] = useState(null);
  const [playerStats, setPlayerStats] = useState({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [specialAction, setSpecialAction] = useState(null);
  const [lastSpecialActionTime, setLastSpecialActionTime] = useState(0);

  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);
  const processedEventRef = useRef(null); // Pro sledování zpracovaných statistik

  // Použití hooku useTeamState
  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Team Initialization Effect --- (Beze změn oproti tvému původnímu kódu)
  useEffect(() => {
    console.log("🔄 Initializing teams...");
    const activePlayers = litvinovLancers.players
      .filter(p => p.attendance >= 75)
      .map(player => ({
        ...player,
        level: player.level || 1,
        key: getPlayerKey(player)
      }));

    const userPlayer = {
      name: playerName,
      surname: '(Ty)',
      position: 'útočník',
      level: playerLevel || 3,
      isPlayer: true,
      key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'})
    };

    const whiteAssignedKeys = new Set();
    const blackAssignedKeys = new Set();
    const whiteAssignedPlayers = [];
    const blackAssignedPlayers = [];

    if (assignedJerseys?.white) {
      activePlayers.forEach(p => {
        if (assignedJerseys.white.has(`${p.name} ${p.surname}`)) {
          whiteAssignedPlayers.push(p);
          whiteAssignedKeys.add(p.key);
        }
      });
      if (assignedJerseys.white.has(playerName) && !whiteAssignedKeys.has(userPlayer.key)) {
          whiteAssignedPlayers.push(userPlayer);
          whiteAssignedKeys.add(userPlayer.key);
      }
    }
     if (assignedJerseys?.black) {
      activePlayers.forEach(p => {
        if (assignedJerseys.black.has(`${p.name} ${p.surname}`) && !whiteAssignedKeys.has(p.key)) {
          blackAssignedPlayers.push(p);
          blackAssignedKeys.add(p.key);
        }
      });
       if (assignedJerseys.black.has(playerName) && !whiteAssignedKeys.has(userPlayer.key) && !blackAssignedKeys.has(userPlayer.key)) {
           blackAssignedPlayers.push(userPlayer);
           blackAssignedKeys.add(userPlayer.key);
       }
    }

    const remainingPlayers = activePlayers.filter(p =>
      !whiteAssignedKeys.has(p.key) && !blackAssignedKeys.has(p.key)
    );

    if (!whiteAssignedKeys.has(userPlayer.key) && !blackAssignedKeys.has(userPlayer.key)) {
       if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
           whiteAssignedPlayers.push(userPlayer);
           whiteAssignedKeys.add(userPlayer.key);
       } else {
           blackAssignedPlayers.push(userPlayer);
           blackAssignedKeys.add(userPlayer.key);
       }
    }

    const shuffledRemaining = [...remainingPlayers].sort(() => Math.random() - 0.5);
    shuffledRemaining.forEach(player => {
      if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
        whiteAssignedPlayers.push(player);
      } else {
        blackAssignedPlayers.push(player);
      }
    });

    const ensureGoalie = (teamPlayers, otherTeamPlayers) => {
      let hasGoalie = teamPlayers.some(p => p.position === 'brankář');
      if (!hasGoalie) {
        const availableGoalie = activePlayers.find(p =>
          p.position === 'brankář' &&
          !teamPlayers.some(tp => tp.key === p.key) &&
          !otherTeamPlayers.some(otp => otp.key === p.key)
        );
        if (availableGoalie) {
          teamPlayers.push(availableGoalie);
        } else {
          const backupGoalie = { name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75, key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})};
          while (teamPlayers.some(p => p.key === backupGoalie.key) || otherTeamPlayers.some(p => p.key === backupGoalie.key)) { backupGoalie.key += '_'; }
          teamPlayers.push(backupGoalie);
        }
      }
    };
    ensureGoalie(whiteAssignedPlayers, blackAssignedPlayers);
    ensureGoalie(blackAssignedPlayers, whiteAssignedPlayers);

    const sortPlayers = (players) => {
      const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
      return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };
    const finalWhitePlayers = sortPlayers(whiteAssignedPlayers);
    const finalBlackPlayers = sortPlayers(blackAssignedPlayers);

    updateTeam('white', { name: 'Lancers Bílý', players: finalWhitePlayers });
    updateTeam('black', { name: 'Lancers Černý', players: finalBlackPlayers });

    const initialStats = {};
    [...finalWhitePlayers, ...finalBlackPlayers].forEach(player => {
      if (!player.key) { console.error("🔴 INIT STATS ERROR: Player missing key:", player); return; }
      initialStats[player.key] = { timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0, shots: 0, saves: 0, savePercentage: 0, shotsAgainst: 0 };
    });
    setPlayerStats(initialStats);

    const initializeDynamicState = (players) => {
       const onIce = players.slice(0, 6);
       const bench = players.slice(6);
       const fatigue = players.reduce((acc, player) => {
         if (player.key) acc[player.key] = 0;
         else console.error(`🔴 INIT FATIGUE: Hráč ${player.name} ${player.surname} nemá platný klíč!`);
         return acc;
       }, {});
       return { onIce, bench, fatigue, lastShiftChange: 0 };
    };
    updateTeamState('white', initializeDynamicState(finalWhitePlayers));
    updateTeamState('black', initializeDynamicState(finalBlackPlayers));

    console.log("✅ Teams initialized successfully.");
    setGameState('paused');

  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]); // Závislosti by měly být správně


  // --- Highlight Player Effect --- (Beze změny)
  const triggerHighlight = useCallback((playerKeys) => {
    if (!playerKeys) return;
    const keysArray = Array.isArray(playerKeys) ? playerKeys : [playerKeys];
    keysArray.forEach(key => {
        if (!key) return;
        setHighlightedPlayerKey(prev => ({ ...(prev ?? {}), [key]: true }));
        setTimeout(() => {
            setHighlightedPlayerKey(prev => {
                 if (!prev) return null;
                 const newHighlights = { ...prev };
                 delete newHighlights[key];
                 return Object.keys(newHighlights).length > 0 ? newHighlights : null;
            });
        }, 1500);
    });
  }, []);

  // --- Game Simulation Effect (Time, Events) ---
   useEffect(() => {
    if (gameState !== 'playing') return;

    let intervalId;

    const gameTick = () => {
        // Přímo voláme setGameTime s callbackem, abychom měli jistotu aktuálního času
        setGameTime(prevTime => {
            const timeIncrement = gameSpeed;
            const newTime = Math.min(GAME_DURATION_SECONDS, prevTime + timeIncrement);

            // --- Konec Hry ---
            if (newTime >= GAME_DURATION_SECONDS && prevTime < GAME_DURATION_SECONDS) {
                // Zastavíme hru PŘED jakoukoliv další logikou pro tento tick
                setGameState('finished');
                // Výsledky předáme až po aktualizaci stavu
                // Použijeme setTimeout, abychom zajistili, že se stav 'finished' projeví
                setTimeout(() => {
                    if (onGameComplete) onGameComplete({ score, events, playerStats });
                     console.log("🏁 Game finished! Final Score:", score);
                }, 0);
                return GAME_DURATION_SECONDS; // Vrátíme konečný čas
            }

            // Pokud se hra mezitím zastavila nebo skončila, neděláme nic dalšího
             if (gameState !== 'playing' && newTime < GAME_DURATION_SECONDS) {
                 console.log("Game tick skipped, gameState is not 'playing'");
                 return prevTime;
             }


            // --- Změna periody ---
            const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
            const oldPeriod = Math.min(3, Math.floor(prevTime / PERIOD_DURATION_SECONDS) + 1);
            if (newPeriod > oldPeriod) {
                setCurrentPeriod(newPeriod);
                const periodStartTime = oldPeriod * PERIOD_DURATION_SECONDS;
                const periodChangeEvent = { type: 'period_change', time: periodStartTime, description: `Začala ${newPeriod}. třetina!`, period: newPeriod, id: `${periodStartTime}-period-${newPeriod}` };
                setEvents(prev => [periodChangeEvent, ...prev]);
                setLastEvent(periodChangeEvent);
                processedEventRef.current = null;
            }

            // --- Generování událostí ---
            const currentIntervalCount = Math.floor(newTime / EVENT_CHECK_INTERVAL);
            const prevIntervalCount = Math.floor(prevTime / EVENT_CHECK_INTERVAL);

            if (currentIntervalCount > prevIntervalCount) {
                const intervalsPassed = currentIntervalCount - prevIntervalCount;
                for (let i = 1; i <= intervalsPassed; i++) {
                    const checkTime = (prevIntervalCount + i) * EVENT_CHECK_INTERVAL;
                    if (checkTime > newTime || checkTime >= GAME_DURATION_SECONDS) continue; // Zpracováváme jen časy do aktuálního newTime

                    // Zde POUŽIJEME teamState přímo, protože je v closure tohoto useEffectu
                    // a měl by být aktuální díky závislosti na gameState
                    const currentTeamState = teamState; // Použijeme stav z closure

                    const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
                    const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';

                    const attackingTeamState = currentTeamState[attackingTeamId];
                    const defendingTeamState = currentTeamState[defendingTeamId];
                    if (!attackingTeamState || !defendingTeamState) continue; // Pokud stav není

                    const attackingTeamOnIce = attackingTeamState.onIce ?? [];
                    const defendingTeamOnIce = defendingTeamState.onIce ?? [];
                    const fatigueData = { ...currentTeamState.white.fatigue, ...currentTeamState.black.fatigue };

                    if (attackingTeamOnIce.length < 5 || defendingTeamOnIce.length < 5) continue;

                    const eventRoll = Math.random();
                    let eventType = 'attack';
                    if (eventRoll < 0.08) eventType = 'penalty';

                    let newEvent = { time: checkTime, team: attackingTeamId, id: `${checkTime}-${attackingTeamId}-${Math.random()}` };

                    if (eventType === 'penalty') {
                        const possibleFoulers = attackingTeamOnIce.filter(p => p && p.position !== 'brankář');
                        if (possibleFoulers.length === 0) continue;
                        const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                        newEvent.type = 'penalty'; newEvent.player = fouler; newEvent.penaltyMinutes = 2;
                        newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává ${newEvent.penaltyMinutes} minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}`;
                        triggerHighlight(fouler.key);
                    } else {
                         const attackersOnIce = attackingTeamOnIce.filter(p => p && p.position !== 'brankář');
                         if (attackersOnIce.length === 0) continue;
                         const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];
                         const goalie = defendingTeamOnIce.find(p => p && p.position === 'brankář');
                         const defendersOnIce = defendingTeamOnIce.filter(p => p && p.position === 'obránce');
                         const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;

                         let goalChance = 0.25 + (attacker.level || 1) * 0.04 - (defender?.level || 1) * 0.03 - (goalie?.level || 1) * 0.06;
                         if (attacker.isPlayer) goalChance += 0.10;
                         const attackingAvgFatigue = calculateAverageOnIceFatigue(attackingTeamOnIce, fatigueData);
                         const defendingAvgFatigue = calculateAverageOnIceFatigue(defendingTeamOnIce, fatigueData);
                         goalChance += (defendingAvgFatigue - attackingAvgFatigue) * FATIGUE_IMPACT_FACTOR;
                         goalChance = Math.max(0.05, Math.min(0.85, goalChance));

                         const outcomeRoll = Math.random();
                         if (outcomeRoll < goalChance) { // GÓL
                            // Aktualizace skóre pomocí callbacku pro zajištění správné hodnoty
                            setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                            const possibleAssists = attackingTeamOnIce.filter(p => p && p.key !== attacker.key && p.position !== 'brankář');
                            const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;
                            newEvent.type = 'goal'; newEvent.player = attacker; newEvent.assistant = assistant; newEvent.goalieKey = goalie?.key;
                            newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}${assistant.isPlayer ? ' (Tvoje asistence!)' : ''}` : ''}!`;
                            triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
                            // STATS SE ZAPOČÍTAJÍ V JINÉM EFEKTU
                         } else if (outcomeRoll < goalChance + 0.35 || !goalie) { // ZÁKROK / VEDLE
                            if (goalie) {
                                newEvent.type = 'save'; newEvent.player = goalie; newEvent.shooter = attacker;
                                newEvent.description = `🧤 Zákrok! ${goalie.name} ${goalie.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) chytá střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.`;
                                triggerHighlight([goalie.key, attacker.key]);
                            } else {
                                newEvent.type = 'miss'; newEvent.player = attacker;
                                newEvent.description = `💨 Střela vedle od ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}).`;
                                triggerHighlight(attacker.key);
                            }
                         } else if (defender) { // BLOK
                            newEvent.type = 'defense'; newEvent.player = defender; newEvent.attacker = attacker;
                            newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                            triggerHighlight([defender.key, attacker.key]);
                         } else { // ZTRÁTA PUKU
                            newEvent.type = 'turnover'; newEvent.player = attacker;
                            newEvent.description = `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.`;
                         }
                    }
                    setLastEvent(newEvent);
                    setEvents(prev => [newEvent, ...prev]);
                    processedEventRef.current = null; // Nová událost, resetujeme pro statistiky
                }
            }

            // --- Kontrola střídání ---
             ['white', 'black'].forEach(teamColor => {
                 // Voláme updateTeamState, které použije aktuální stav díky useCallback
                 updateTeamState(teamColor, prevTeamState => {
                     if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) return prevTeamState;

                     const timeSinceLastChange = newTime - (prevTeamState.lastShiftChange || 0);
                     const tiredOnIce = prevTeamState.onIce.filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));
                     const restedOnBench = prevTeamState.bench.filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (prevTeamState.fatigue[a.key] ?? MAX_FATIGUE) - (prevTeamState.fatigue[b.key] ?? MAX_FATIGUE));
                     const hasHighlyTiredPlayer = tiredOnIce.length > 0 && (prevTeamState.fatigue[tiredOnIce[0].key] ?? 0) > 80;

                     if ((timeSinceLastChange < SHIFT_DURATION && !hasHighlyTiredPlayer) || restedOnBench.length === 0 || tiredOnIce.length === 0) {
                         // Pokud čas uplynul, ale není koho střídat, resetujeme časovač
                         if (timeSinceLastChange >= SHIFT_DURATION && (restedOnBench.length === 0 || tiredOnIce.length === 0)) {
                            return { ...prevTeamState, lastShiftChange: newTime };
                         }
                         return prevTeamState; // Nic se nemění
                     }

                     const numToChange = Math.min(tiredOnIce.length, restedOnBench.length, hasHighlyTiredPlayer ? Math.max(1, Math.ceil(tiredOnIce.length / 2)) : 3);
                     if (numToChange <= 0) return { ...prevTeamState, lastShiftChange: newTime };

                     const playersOut = tiredOnIce.slice(0, numToChange); const playersOutKeys = new Set(playersOut.map(p => p.key));
                     const playersIn = restedOnBench.slice(0, numToChange); const playersInKeys = new Set(playersIn.map(p => p.key));
                     const newOnIce = [...prevTeamState.onIce.filter(p => !playersOutKeys.has(p.key)), ...playersIn];
                     const newBench = [...prevTeamState.bench.filter(p => !playersInKeys.has(p.key)), ...playersOut];
                     const playersInNames = playersIn.map(p => p.surname).join(", "); const playersOutNames = playersOut.map(p => p.surname).join(", ");

                     const subEvent = { time: newTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}`, id: `${newTime}-sub-${teamColor}-${Math.random()}` };
                     // Přidáme událost, ale nenastavujeme ji jako 'lastEvent'
                     setEvents(prev => [subEvent, ...prev]);
                     triggerHighlight([...playersInKeys, ...playersOutKeys]);
                     processedEventRef.current = null; // Reset statistik

                     return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: newTime };
                 });
             });


            // --- Kontrola speciálních akcí ---
            const currentActionIntervalCount = Math.floor(newTime / SPECIAL_ACTION_INTERVAL);
            const prevActionIntervalCount = Math.floor(prevTime / SPECIAL_ACTION_INTERVAL);

            if (currentActionIntervalCount > prevActionIntervalCount && newTime - lastSpecialActionTime >= MIN_TIME_BETWEEN_ACTIONS) {
                const actionCheckTime = currentActionIntervalCount * SPECIAL_ACTION_INTERVAL;
                 if (actionCheckTime <= newTime && actionCheckTime < GAME_DURATION_SECONDS) {
                    const playerTeamColor = findPlayerTeamColor();
                    if (playerTeamColor && Math.random() < SPECIAL_ACTION_CHANCE) {
                        // Zde POUŽIJEME teamState přímo
                        const currentTeamState = teamState;
                        const playerOnIce = currentTeamState[playerTeamColor]?.onIce.some(p => p.isPlayer);
                        if (playerOnIce) {
                            generateSpecialAction(playerTeamColor, actionCheckTime);
                            setLastSpecialActionTime(actionCheckTime);
                            // Hru pozastaví až generateSpecialAction/handleSpecialActionResult
                            // Zde pouze nastavíme akci, ale hra běží dál, dokud se dialog nezobrazí
                            setGameState('paused'); // OK, pozastavíme hned zde
                        }
                    }
                }
            }

            return newTime; // Vrátíme nový čas pro další tick
        }); // Konec setGameTime callbacku
    }; // Konec gameTick funkce

    intervalId = setInterval(gameTick, 1000); // Interval 1 sekunda reálného času

    return () => clearInterval(intervalId);

  // Závislosti: gameState, gameSpeed, teamState (pro přístup v event gen), callbacky a konstanty
  // score, events, playerStats jsou potřeba pro onGameComplete a speciální akce
  // lastSpecialActionTime pro logiku speciálních akcí
  }, [gameState, gameSpeed, teamState, updateTeamState, score, events, playerStats, lastSpecialActionTime, findPlayerTeamColor, generateSpecialAction, triggerHighlight, onGameComplete]);


  // --- Aktualizace statistik POUZE na základě lastEvent ---
  useEffect(() => {
    if (!lastEvent || !lastEvent.id || lastEvent.id === processedEventRef.current) {
        return; // Žádná nová událost nebo už zpracováno
    }
    //console.log(`Processing stats for event: ${lastEvent.id}, type: ${lastEvent.type}`);
    processedEventRef.current = lastEvent.id; // Označíme jako zpracované

    setPlayerStats(prevStats => {
        const newStats = JSON.parse(JSON.stringify(prevStats)); // Hluboká kopie

        const updateStat = (playerKey, statName, value = 1) => {
            if (playerKey && newStats[playerKey]) {
                newStats[playerKey][statName] = (newStats[playerKey][statName] || 0) + value;
            }
        };

        const updateGoalieStats = (goalieKey, isGoal) => {
            if (goalieKey && newStats[goalieKey]) {
                const goalieStat = newStats[goalieKey];
                goalieStat.shotsAgainst = (goalieStat.shotsAgainst || 0) + 1;
                if (!isGoal) {
                    goalieStat.saves = (goalieStat.saves || 0) + 1;
                }
                goalieStat.savePercentage = goalieStat.shotsAgainst > 0
                    ? Math.round((goalieStat.saves / goalieStat.shotsAgainst) * 100)
                    : 0;
            }
        };

        switch (lastEvent.type) {
            case 'goal':
                if (lastEvent.player?.key) { updateStat(lastEvent.player.key, 'goals', 1); updateStat(lastEvent.player.key, 'shots', 1); }
                if (lastEvent.assistant?.key) { updateStat(lastEvent.assistant.key, 'assists', 1); }
                if(lastEvent.goalieKey) { updateGoalieStats(lastEvent.goalieKey, true); }
                break;
            case 'save':
                if (lastEvent.player?.key) { updateGoalieStats(lastEvent.player.key, false); } // Brankář
                if (lastEvent.shooter?.key) { updateStat(lastEvent.shooter.key, 'shots', 1); } // Střelec
                break;
            case 'miss':
                if (lastEvent.player?.key) { updateStat(lastEvent.player.key, 'shots', 1); }
                break;
            case 'defense': // Blok
                if (lastEvent.attacker?.key) { updateStat(lastEvent.attacker.key, 'shots', 1); } // Střela útočníka
                if (lastEvent.player?.key) { // Blokující hráč
                    const blockChance = (lastEvent.player.position === 'obránce') ? 0.6 : 0.3;
                    if (Math.random() < blockChance) { updateStat(lastEvent.player.key, 'blocks', 1); }
                }
                break;
            case 'penalty':
                if (lastEvent.player?.key && lastEvent.penaltyMinutes) { updateStat(lastEvent.player.key, 'penalties', lastEvent.penaltyMinutes); }
                break;
            default: break;
        }
        return newStats;
    });
  }, [lastEvent]); // POUZE lastEvent


  // --- Fatigue Update Effect --- (Samostatný interval)
  useEffect(() => {
    if (gameState !== 'playing') return;
    const fatigueInterval = setInterval(() => {
        const fatigueIncreaseRate = BASE_FATIGUE_INCREASE_RATE * gameSpeed;
        const recoveryRate = BASE_RECOVERY_RATE * gameSpeed;
        const updateFatigueForTeam = (teamColor) => {
            updateTeamState(teamColor, prevTeamState => {
                if (!prevTeamState?.fatigue || !prevTeamState.onIce || !prevTeamState.bench) return prevTeamState;
                let fatigueChanged = false; const newFatigue = { ...prevTeamState.fatigue };
                prevTeamState.onIce.forEach(player => {
                    if (player?.key) {
                        const currentFatigue = newFatigue[player.key] ?? 0;
                        const rate = player.position === 'brankář' ? fatigueIncreaseRate * 0.5 : fatigueIncreaseRate;
                        const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + rate);
                        if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = Math.round(updatedFatigue); fatigueChanged = true; }
                    }
                });
                prevTeamState.bench.forEach(player => {
                    if (player?.key) {
                        const currentFatigue = newFatigue[player.key] ?? 0;
                        const updatedFatigue = Math.max(0, currentFatigue - recoveryRate);
                        if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = Math.round(updatedFatigue); fatigueChanged = true; }
                    }
                });
                return fatigueChanged ? { ...prevTeamState, fatigue: newFatigue } : prevTeamState;
            });
        };
        updateFatigueForTeam('white');
        updateFatigueForTeam('black');
    }, 1000); // Každou reálnou sekundu
    return () => clearInterval(fatigueInterval);
  }, [gameState, gameSpeed, updateTeamState]);


  // --- Aktualizace času na ledě --- (Samostatný interval)
  useEffect(() => {
      if (gameState !== 'playing') return;
      const toiInterval = setInterval(() => {
          // Použijeme callback, abychom měli aktuální teamState
          setPlayerStats(prevStats => {
              // Získáme aktuální teamState bez triggerování re-renderu v tomto místě
              const currentTeamState = teamState; // Čteme teamState z closure
              if (!currentTeamState) return prevStats; // Pojistka

              let statsChanged = false;
              const newStats = { ...prevStats }; // Mělká kopie stačí

              ['white', 'black'].forEach(teamColor => {
                  const teamStateData = currentTeamState[teamColor];
                  if (!teamStateData || !teamStateData.onIce) return; // Přeskočíme, pokud data nejsou

                  teamStateData.onIce.forEach(player => {
                      if (player && player.key && newStats[player.key]) {
                          // Přičítáme počet herních sekund (gameSpeed) za 1 reálnou sekundu
                          newStats[player.key] = {
                              ...newStats[player.key],
                              timeOnIce: (newStats[player.key].timeOnIce || 0) + gameSpeed
                          };
                          statsChanged = true;
                      }
                  });
              });

              return statsChanged ? newStats : prevStats;
          });
      }, 1000); // Každou reálnou sekundu
      return () => clearInterval(toiInterval);
  // Závislost na teamState zde zajistí, že máme aktuální stav v closure pro výpočet
  }, [gameState, gameSpeed, teamState]);


  // --- Ostatní pomocné funkce a handlery ---
   const findPlayerTeamColor = useCallback(() => {
    if (teams.white.players?.some(p => p.isPlayer)) return 'white';
    if (teams.black.players?.some(p => p.isPlayer)) return 'black';
    return null;
  }, [teams]); // Závisí jen na seznamu hráčů

   const isPlayerOnIce = useCallback((teamColor) => {
      if (!teamColor) return false;
      // Čteme přímo aktuální stav teamState
      return teamState[teamColor]?.onIce.some(p => p && p.isPlayer) ?? false;
   }, [teamState]); // Závisí na teamState

   // --- generateSpecialAction ---
    const generateSpecialAction = useCallback((playerTeamColor, currentTime) => {
        // Použijeme aktuální teamState
        const currentTeamState = teamState;
        if (!currentTeamState) return;

        const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';
        const player = currentTeamState[playerTeamColor]?.onIce.find(p => p.isPlayer);
        if (!player) return;

        const playerFatigue = currentTeamState[playerTeamColor]?.fatigue[player.key] || 0;
        const opposingGoalie = currentTeamState[opposingTeamColor]?.onIce.find(p => p.position === 'brankář');
        const opposingDefenders = currentTeamState[opposingTeamColor]?.onIce.filter(p => p.position === 'obránce');
        const opposingDefender = opposingDefenders.length > 0 ? opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)] : null;
        const teammates = currentTeamState[playerTeamColor]?.onIce.filter(p => p.position !== 'brankář' && !p.isPlayer);
        const teammate = teammates.length > 0 ? teammates[Math.floor(Math.random() * teammates.length)] : null;

        const actionTypes = [ /* ... (stejné jako předtím) ... */
            { type: 'shot_opportunity', description: 'Máš šanci na přímou střelu!', options: [{ id: 'shoot', text: 'Vystřelit', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát spoluhráči', difficulty: 'easy' }, { id: 'deke', text: 'Kličkovat a zkusit obejít', difficulty: 'hard' }] },
            { type: 'one_on_one', description: 'Jsi sám před brankářem!', options: [{ id: 'shoot_high', text: 'Vystřelit nahoru', difficulty: 'medium' }, { id: 'shoot_low', text: 'Vystřelit dolů', difficulty: 'medium' }, { id: 'deke', text: 'Kličkovat brankáři', difficulty: 'hard' }] },
            { type: 'defensive_challenge', description: 'Protihráč se blíží k bráně a ty ho můžeš zastavit!', options: [{ id: 'stick_check', text: 'Zkusit hokejkou vypíchnout puk', difficulty: 'medium' }, { id: 'body_check', text: 'Zkusit bodyček', difficulty: 'hard' }, { id: 'position', text: 'Zaujmout dobrou pozici', difficulty: 'easy' }] },
            { type: 'rebound_opportunity', description: 'Puk se odrazil od brankáře!', options: [{ id: 'quick_shot', text: 'Rychlá dorážka', difficulty: 'hard' }, { id: 'control', text: 'Zkontrolovat puk', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát lépe postavenému', difficulty: 'easy' }] }
        ];
        const selectedAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const fullAction = {
            ...selectedAction, time: currentTime, player, playerTeamColor, playerFatigue,
            opposingGoalie, opposingDefender, teammate,
            gameContext: { score, period: currentPeriod, timeRemaining: GAME_DURATION_SECONDS - currentTime }
        };
        setSpecialAction(fullAction);
    }, [teamState, score, currentPeriod]); // Závisí na teamState, score, currentPeriod

   // --- handleSpecialActionResult ---
   const handleSpecialActionResult = useCallback((option) => {
        if (!specialAction) return;
        const { player, playerTeamColor, playerFatigue, opposingGoalie, teammate, time } = specialAction;
        const playerLevel = player.level || 1;
        const fatigueImpact = playerFatigue / MAX_FATIGUE;

        let successChance;
        switch (option.difficulty) { case 'easy': successChance = 0.8; break; case 'medium': successChance = 0.6; break; case 'hard': successChance = 0.4; break; default: successChance = 0.5; }
        successChance += (playerLevel - 1) * 0.05; successChance -= fatigueImpact * 0.3;
        successChance = Math.max(0.1, Math.min(0.9, successChance));
        const isSuccess = Math.random() < successChance;

        let resultMessage, eventDescription, eventType;
        const teamName = playerTeamColor === 'white' ? 'Bílí' : 'Černí';
        const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';
        let generatedEventPayload = null; // Pro statistiky

        if (isSuccess) {
            switch (specialAction.type) {
                case 'shot_opportunity': case 'one_on_one': case 'rebound_opportunity':
                    if (option.id.includes('shoot') || option.id === 'quick_shot' || option.id === 'deke') {
                        const goalChance = option.id === 'deke' ? 0.7 : 0.5;
                        const isGoal = Math.random() < goalChance;
                        if (isGoal) {
                            resultMessage = `Výborně! Tvoje akce skončila gólem!`; eventDescription = `🚨 GÓÓÓL! ${player.name} ${player.surname} (Ty!) (${teamName}) skóruje po speciální akci!`; eventType = 'goal';
                            setScore(prev => ({ ...prev, [playerTeamColor]: prev[playerTeamColor] + 1 }));
                            generatedEventPayload = { type: 'goal', player: player, assistant: null, goalieKey: opposingGoalie?.key };
                        } else {
                            resultMessage = `Dobrá střela, ale ${opposingGoalie ? opposingGoalie.surname : 'brankář'} ji chytil.`; eventDescription = `🧤 Zákrok! ${opposingGoalie ? opposingGoalie.name + ' ' + opposingGoalie.surname : 'Brankář'} chytá tvoji střelu po speciální akci.`; eventType = 'save';
                            generatedEventPayload = { type: 'save', player: opposingGoalie, shooter: player };
                        }
                    } else if (option.id === 'pass' && teammate) {
                        resultMessage = `Tvoje přihrávka byla přesná.`; eventDescription = `${player.name} ${player.surname} (Ty!) přesně přihrává na ${teammate.name} ${teammate.surname} po speciální akci.`; eventType = 'pass';
                    } else {
                        resultMessage = `Akce se podařila! Získal jsi kontrolu nad pukem.`; eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci (${option.text}).`; eventType = 'success';
                    }
                    break;
                case 'defensive_challenge':
                    resultMessage = `Úspěšně jsi zastavil útok soupeře!`; eventDescription = `🛡️ Dobrá obrana! ${player.name} ${player.surname} (Ty!) (${teamName}) zastavil útok soupeře po speciální akci.`; eventType = 'defense';
                    generatedEventPayload = { type: 'defense', player: player, attacker: null }; // Započítáme blok
                    break;
                default: resultMessage = `Akce byla úspěšná!`; eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`; eventType = 'success'; break;
            }
        } else { // Neúspěch
            switch (specialAction.type) {
                case 'shot_opportunity': case 'one_on_one': case 'rebound_opportunity':
                    resultMessage = `Bohužel, akce se nepovedla podle plánu.`; eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí (${option.text}).`;
                    if (option.id.includes('shoot') || option.id === 'quick_shot') { eventType = 'miss'; generatedEventPayload = { type: 'miss', player: player }; }
                    else { eventType = 'turnover'; }
                    break;
                case 'defensive_challenge':
                    const opponentGoalChance = option.id === 'body_check' ? 0.4 : 0.2; const isOpponentGoal = Math.random() < opponentGoalChance;
                    if (isOpponentGoal) {
                        resultMessage = `Nepodařilo se ti zastavit útok a soupeř skóroval!`; eventDescription = `🚨 Gól soupeře! ${player.name} ${player.surname} (Ty!) nedokázal zastavit útok a soupeř skóroval.`; eventType = 'goal'; // Soupeřův gól
                        setScore(prev => ({ ...prev, [opposingTeamColor]: prev[opposingTeamColor] + 1 }));
                        // Vytvoříme událost pro log, ale ne pro statistiky hráče (nemáme střelce)
                        const opponentEvent = { time: time, type: 'goal', team: opposingTeamColor, description: eventDescription, id: `${time}-oppGoal-${Math.random()}` };
                        setEvents(prev => [opponentEvent, ...prev]);
                        setLastEvent(opponentEvent); // Nastavíme jako poslední event
                        processedEventRef.current = null;
                    } else {
                        resultMessage = `Nepodařilo se ti zastavit útok, ale naštěstí soupeř neskóroval.`; eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl s obranou při speciální akci.`; eventType = 'turnover';
                    }
                    break;
                default: resultMessage = `Akce nebyla úspěšná.`; eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí.`; eventType = 'miss'; break;
            }
        }

        // Přidáme událost popisující akci hráče (pokud nevznikl soupeřův gól nebo pokud to byl náš gól)
        if (eventType !== 'goal' || playerTeamColor === lastEvent?.team || generatedEventPayload?.type === 'goal') {
            const actionEvent = {
                type: eventType, time: time, player: player, team: playerTeamColor, description: eventDescription,
                // Přidáme data pro statistiky, pokud existují
                ...(generatedEventPayload || {}),
                id: `${time}-${eventType}-${player.key}-${Math.random()}`
            };
            setEvents(prev => [actionEvent, ...prev]);
            setLastEvent(actionEvent);
            processedEventRef.current = null; // Umožníme zpracování statistik
        }

        triggerHighlight(player.key);
        const actionResult = { success: isSuccess, message: resultMessage, eventType };

        setTimeout(() => {
            setSpecialAction(null);
            // POZOR: Pokud hra byla pozastavena POUZE kvůli akci, obnovíme ji.
            // Pokud byla pauznuta i uživatelem, necháme ji pauznutou.
            // Pro jednoduchost: pokud je stav paused, přepneme na playing.
            if (gameState === 'paused') {
                 setGameState('playing');
            }
        }, 2500);
        return actionResult;
   }, [specialAction, triggerHighlight, setEvents, setLastEvent, setScore, gameState]); // Přidána gameState závislost

   // --- handleStartPause ---
   const handleStartPause = () => {
        setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'));
   };

   // --- changeSpeed ---
   const changeSpeed = (delta) => {
        setGameSpeed(prev => {
            let newSpeed = prev;
            if (delta > 0) { if (prev < 8) newSpeed = prev + 1; else if (prev === 8) newSpeed = 16; else if (prev === 16) newSpeed = 32; else if (prev === 32) newSpeed = 64; else newSpeed = 64; }
            else { if (prev > 32) newSpeed = 32; else if (prev > 16) newSpeed = 16; else if (prev > 8) newSpeed = 8; else newSpeed = Math.max(1, prev - 1); }
            return newSpeed;
        });
   };

   // --- handlePlayerSubstitution ---
   const handlePlayerSubstitution = useCallback((teamColor) => {
        const currentTime = gameTime;
        const currentTeamState = teamState[teamColor]; // Čteme aktuální stav
        const player = teams[teamColor]?.players.find(p => p.isPlayer);

        if (!player || !currentTeamState) { console.error("SUB ERROR: Missing player or team state"); return; }
        const playerKey = player.key;
        const isOnIce = currentTeamState.onIce.some(p => p && p.key === playerKey);

        if (isOnIce) { // Jde z ledu
            const playerOnIceObject = currentTeamState.onIce.find(p => p.key === playerKey);
            if (!playerOnIceObject) return; // Chyba konzistence
            const restedBenchPlayer = [...currentTeamState.bench].filter(p => p && p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (currentTeamState.fatigue[a.key] ?? MAX_FATIGUE) - (currentTeamState.fatigue[b.key] ?? MAX_FATIGUE))[0];
            if (!restedBenchPlayer) { console.warn("SUB WARN: No rested AI players"); return; }
            const newOnIce = currentTeamState.onIce.filter(p => p.key !== playerKey); newOnIce.push(restedBenchPlayer);
            const newBench = currentTeamState.bench.filter(p => p.key !== restedBenchPlayer.key); newBench.push(playerOnIceObject);
            updateTeamState(teamColor, { onIce: newOnIce, bench: newBench, lastShiftChange: currentTime });
            const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️`, id: `${currentTime}-sub-${playerKey}-off` };
            setEvents(prev => [subEvent, ...prev]); triggerHighlight([playerKey, restedBenchPlayer.key]); processedEventRef.current = null;
        } else { // Jde z lavičky
             const playerOnBenchObject = currentTeamState.bench.find(p => p.key === playerKey);
             if (!playerOnBenchObject) return; // Chyba konzistence
             const fieldPlayersOnIceCount = currentTeamState.onIce.filter(p => p.position !== 'brankář').length;
             if (fieldPlayersOnIceCount >= 5) { console.warn("SUB WARN: Cannot sub on, ice full"); return; } // Kontrola plného ledu
             const tiredOnIcePlayer = [...currentTeamState.onIce].filter(p => p && p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (currentTeamState.fatigue[b.key] ?? 0) - (currentTeamState.fatigue[a.key] ?? 0))[0];
             if (!tiredOnIcePlayer) { console.warn("SUB WARN: No tired AI players to swap with"); return; }
             const newBench = currentTeamState.bench.filter(p => p.key !== playerKey); newBench.push(tiredOnIcePlayer);
             const newOnIce = currentTeamState.onIce.filter(p => p.key !== tiredOnIcePlayer.key); newOnIce.push(playerOnBenchObject);
             updateTeamState(teamColor, { onIce: newOnIce, bench: newBench, lastShiftChange: currentTime });
             const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️`, id: `${currentTime}-sub-${playerKey}-on` };
             setEvents(prev => [subEvent, ...prev]); triggerHighlight([playerKey, tiredOnIcePlayer.key]); processedEventRef.current = null;
        }
   }, [gameTime, teamState, teams, playerName, triggerHighlight, updateTeamState, setEvents]); // Závislost na teamState a teams

   // --- handleExit ---
   const handleExit = useCallback(() => {
        if (gameState === 'finished') { if (onGameComplete) onGameComplete({ score, events, playerStats }); }
        else { setShowExitConfirm(true); if (gameState === 'playing') setGameState('paused'); }
   }, [gameState, score, events, playerStats, onGameComplete]);

   // --- handleConfirmExit ---
   const handleConfirmExit = useCallback(() => {
        setShowExitConfirm(false);
        if (onGameComplete) onGameComplete({ score, events, playerStats, abandoned: true });
   }, [score, events, playerStats, onGameComplete]);

   // --- handleCancelExit ---
   const handleCancelExit = useCallback(() => { setShowExitConfirm(false); }, []);


  // --- Scroll event log ---
   useEffect(() => { if (eventLogRef.current) eventLogRef.current.scrollTop = 0; }, [events]);

  // --- Render Helper: getEventIcon --- (Beze změny)
   const getEventIcon = (type) => { /* ... (stejné jako předtím) ... */
        switch (type) {
          case 'goal': return <FlagIcon className="h-5 w-5 text-green-400" />;
          case 'save': return <HandRaisedIcon className="h-5 w-5 text-blue-400" />;
          case 'defense': return <ShieldCheckIcon className="h-5 w-5 text-orange-400" />;
          case 'penalty': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
          case 'period_change': return <ClockIcon className="h-5 w-5 text-indigo-400" />;
          case 'substitution': return <UserGroupIcon className="h-5 w-5 text-teal-400" />;
          case 'miss': return <XMarkSolidIcon className="h-5 w-5 text-gray-500" />;
          case 'turnover': return <ArrowLeftOnRectangleIcon className="h-5 w-5 text-purple-400 transform rotate-90" />;
          default: return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
        }
   };

  // --- Render Helper: PlayerStatus --- (OPRAVENO - bez setTeamState)
  const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey }) => {
     if (!player || !player.key) return <div className="flex items-center gap-2 p-2 rounded-lg bg-red-900/50 border border-red-700"><div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div><div className="text-xs text-red-300">Chyba: Data hráče</div></div>;
     const fatigue = Math.round(fatigueValue || 0);
     const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);

     // Používáme předané props 'isOnIce' a 'fatigueValue'
     return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border ${isOnIce ? 'bg-green-800/40 border-green-600/50 shadow-md' : 'bg-gray-800/40 border-gray-700/50'} ${highlightedPlayerKey?.[playerKey] ? (teamColor === 'white' ? 'bg-white/20 scale-105 ring-2 ring-white' : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') : ''}`}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700 relative">
          <Image src={playerPhotoUrl} alt={`${player.name} ${player.surname}`} width={40} height={40} className="w-full h-full object-cover" unoptimized={true} onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }} />
           {isOnIce && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" title="Na ledě"></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-gray-100">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div>
          <div className="text-xs text-indigo-300">{player.position} - L{player.level || 1}</div>
        </div>
        <div className="w-20 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-1">{fatigue}%</div>
          <div className="h-2.5 bg-gray-600 rounded-full overflow-hidden relative">
            <div className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${fatigue > 80 ? 'bg-red-500' : fatigue > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${fatigue}%` }} />
          </div>
        </div>
      </div>
     );
  });
  PlayerStatus.displayName = 'PlayerStatus';


  // --- Render Helper: TeamTable --- (OPRAVENO - formátování času)
  const TeamTable = React.memo(({ teamData, teamColor, playerStats }) => { // Přidáno playerStats jako prop
    const [selectedTeamColor, setSelectedTeamColor] = useState(teamColor);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => { setSelectedTeamColor(teamColor); }, [teamColor]);

    const currentTeam = teamData[selectedTeamColor];
    if (!currentTeam || !currentTeam.players) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Načítání...</div>;
    if (currentTeam.players.length === 0) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Žádní hráči.</div>;

    const formatTimeOnIce = (totalSeconds) => {
        const seconds = Math.floor(totalSeconds || 0); const mins = Math.floor(seconds / 60); const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          <button onClick={() => {setSelectedTeamColor('white'); setShowStats(false);}} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20')}>Bílí ({teamData.white.players?.length ?? 0})</button>
          <button onClick={() => {setSelectedTeamColor('black'); setShowStats(false);}} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50')}>Černí ({teamData.black.players?.length ?? 0})</button>
          <button onClick={() => setShowStats(!showStats)} disabled={!selectedTeamColor} className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-colors text-center ml-1', showStats ? 'bg-yellow-500 text-black shadow-md' : 'bg-gray-700 text-gray-200 hover:bg-gray-600', !selectedTeamColor && 'opacity-50 cursor-not-allowed')}>
            {showStats ? 'Info' : 'Statistiky'}
          </button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {showStats && playerStats ? ( // Zobrazíme statistiky, pokud jsou data
            <table className="w-full text-xs">
              <thead className="bg-gray-800 text-gray-300 sticky top-0 z-10">
                <tr><th className="p-1 text-left font-semibold">Hráč</th><th className="p-1 text-center font-semibold" title="Čas na ledě">ČNL</th><th className="p-1 text-center font-semibold" title="Góly">G</th><th className="p-1 text-center font-semibold" title="Asistence">A</th><th className="p-1 text-center font-semibold" title="Trestné minuty">TM</th><th className="p-1 text-center font-semibold" title="Bloky (pole) / Zásahy (brankář)">B/Z</th><th className="p-1 text-center font-semibold" title="Střely (pole) / Úspěšnost % (brankář)">S/Ú%</th></tr>
              </thead>
              <tbody className='bg-gray-800/30'>
                {currentTeam.players.map((player) => {
                  if (!player || !player.key) return null;
                  const isGoalie = player.position === 'brankář';
                  const stats = playerStats[player.key] || { timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0, shots: 0, saves: 0, savePercentage: 0, shotsAgainst: 0 };
                  return (
                    <tr key={player.key} className={`border-b border-gray-700/50 hover:bg-indigo-900/30 ${player.isPlayer ? 'font-bold text-cyan-300' : 'text-gray-200'}`}>
                      <td className="p-1 font-medium"><div className="flex items-center"><span className="truncate max-w-[90px]">{player.surname}</span></div></td>
                      <td className="p-1 text-center text-gray-400 tabular-nums">{formatTimeOnIce(stats.timeOnIce)}</td>
                      <td className="p-1 text-center">{stats.goals}</td><td className="p-1 text-center">{stats.assists}</td><td className="p-1 text-center">{stats.penalties}</td>
                      <td className="p-1 text-center">{isGoalie ? stats.saves : stats.blocks}</td><td className="p-1 text-center">{isGoalie ? `${stats.savePercentage}%` : stats.shots}</td>
                    </tr>);
                })}
              </tbody>
            </table>
          ) : ( // Standardní zobrazení
            currentTeam.players.map((player, index) => {
              if (!player || !player.key) return null;
              const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
              return (
                <div key={player.key} className={`p-2 text-sm ${index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'} hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-600"><Image src={playerPhotoUrl} alt={player.name} width={32} height={32} className="w-full h-full object-cover" unoptimized={true} onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }} /></div>
                  <div className="flex-1 min-w-0"><div className={`truncate font-medium ${player.isPlayer ? 'text-cyan-300' : 'text-gray-200'}`}>{player.name} {player.surname} {player.isPlayer ? '(Ty)' : ''}</div><div className="text-xs text-indigo-300">{player.position}</div></div>
                  <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/30 rounded-md">L{player.level || 1}</span>
                </div>);
            })
          )}
        </div>
      </div>
    );
  });
  TeamTable.displayName = 'TeamTable';


  // --- Main Render --- (OPRAVENO - tlačítka střídání a PlayerStatus)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button onClick={handleExit} className={clsx("flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium","bg-red-600/80 hover:bg-red-600 text-white",(gameState === 'finished') && "animate-pulse")} title={gameState === 'finished' ? "Zobrazit výsledky" : "Opustit zápas"}>
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span className="hidden sm:inline">{gameState === 'finished' ? 'Výsledky' : 'Opustit zápas'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">Lancers Simulátor Zápasu</h2>
          <div className="w-20 sm:w-28 flex justify-end">
            <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-md text-center w-full ${ gameState === 'playing' ? 'bg-green-600/70 text-green-100 animate-pulse' : gameState === 'paused' ? 'bg-yellow-600/70 text-yellow-100' : gameState === 'finished' ? 'bg-blue-600/70 text-blue-100' : 'bg-gray-600/70 text-gray-200' }`}>
                {gameState === 'playing' ? 'Hraje se' : gameState === 'paused' ? 'Pauza' : gameState === 'finished' ? 'Konec' : 'Start'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Left Column */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Team Table */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
                 {/* Předáváme aktuální playerStats */}
                 <TeamTable teamData={teams} teamColor="white" playerStats={playerStats} />
            </div>
            {/* Game Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? (
                 <>
                   <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1 || gameState !== 'playing'} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zpomalit"><BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   <button onClick={handleStartPause} className="px-4 py-1.5 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
                     {gameState === 'playing' ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />} {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                   </button>
                   <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED || gameState !== 'playing'} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zrychlit"><ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   <div className={`text-xs sm:text-sm ${gameSpeed > 8 ? 'text-yellow-400 font-bold' : 'text-gray-400'} ml-2 sm:ml-4 whitespace-nowrap`}>Rychlost: {gameSpeed}x</div>
                 </>
              ) : ( <div className='text-center flex flex-col items-center gap-2'><p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p></div> )}
            </div>
            {/* Manual Substitution Buttons (OPRAVENO) */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                 // Čteme přímo z existujícího stavu 'teamState'
                 const currentTeamState = teamState[teamColor];
                 const player = teams[teamColor]?.players.find(p => p.isPlayer);
                 if (!player || !currentTeamState) return null; // Nevykreslíme, pokud data chybí
                 const playerKey = player.key;
                 const isOnIce = currentTeamState.onIce.some(p => p.key === playerKey);
                 const fatigue = Math.round(currentTeamState.fatigue[playerKey] ?? 0);
                 const fieldPlayersOnIceCount = currentTeamState.onIce.filter(p => p.position !== 'brankář').length;
                 return (
                   <button key={teamColor} onClick={() => handlePlayerSubstitution(teamColor)}
                     disabled={gameState === 'finished' || (!isOnIce && fieldPlayersOnIceCount >= 5)}
                     className={clsx("px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center", isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white', (gameState === 'finished' || (!isOnIce && fieldPlayersOnIceCount >= 5)) && 'opacity-50 cursor-not-allowed')}
                     title={isOnIce ? `Jít střídat (únava: ${fatigue}%)` : (fieldPlayersOnIceCount >= 5 ? `Nelze naskočit (plno na ledě)` :`Naskočit na led (únava: ${fatigue}%)`)}
                   > {isOnIce ? (<> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Střídat <span className='hidden md:inline'>({fatigue}%)</span> </>) : (<> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Na led <span className='hidden md:inline'>({fatigue}%)</span> </>)}
                   </button>);
               })}
            </div>
            {/* Player Status (Fatigue) (OPRAVENO) */}
             <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                  {/* White Team Status */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">Bílý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                      {/* Čteme přímo teamState */}
                      {teams.white.players?.map(player => {
                          if (!player?.key) return null;
                          const currentFatigue = teamState.white?.fatigue?.[player.key];
                          const isPlayerOnIce = teamState.white?.onIce?.some(p => p.key === player.key);
                          return <PlayerStatus key={player.key} player={player} teamColor="white" fatigueValue={currentFatigue} isOnIce={isPlayerOnIce} playerKey={player.key}/>;
                       })}
                      {teams.white.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Prázdná.</p>}
                    </div>
                  </div>
                  {/* Black Team Status */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">Černý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                       {/* Čteme přímo teamState */}
                       {teams.black.players?.map(player => {
                          if (!player?.key) return null;
                           const currentFatigue = teamState.black?.fatigue?.[player.key];
                           const isPlayerOnIce = teamState.black?.onIce?.some(p => p.key === player.key);
                          return <PlayerStatus key={player.key} player={player} teamColor="black" fatigueValue={currentFatigue} isOnIce={isPlayerOnIce} playerKey={player.key}/>;
                       })}
                      {teams.black.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Prázdná.</p>}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full xl:flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
            {/* Scoreboard */}
            <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/60 to-purple-900/50 border border-indigo-700 rounded-lg p-3 sm:p-4 text-center flex-shrink-0 shadow-lg">
              <div className="flex justify-around items-center mb-2">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate px-2">{teams.white.name || 'Bílí'}</span>
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-cyan-300 tabular-nums tracking-tighter flex-shrink-0 mx-2">{score.white} : {score.black}</span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-300 truncate px-2">{teams.black.name || 'Černí'}</span>
              </div>
              <div className="text-lg sm:text-xl font-mono text-yellow-400 tracking-wider">{gameState === 'finished' ? `Konec zápasu (18:00:00)` : formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}</div>
            </div>
            {/* Last Event */}
             <div ref={lastEventRef} className="bg-black/40 border border-gray-700/80 rounded-lg p-3 h-16 sm:h-20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow">
               {lastEvent ? (<div className="animate-fadeIn flex items-center gap-2 sm:gap-3 text-center"><div className="flex-shrink-0">{getEventIcon(lastEvent.type)}</div><p className="text-xs sm:text-sm md:text-base text-gray-200">{lastEvent.description}</p></div>) : (<p className="text-gray-500 italic text-sm sm:text-base">Očekává se úvodní buly...</p>)}
             </div>
            {/* Event Log */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-2 sm:p-3 flex flex-col flex-grow overflow-hidden">
               <h3 className="text-base sm:text-lg font-semibold text-cyan-400 mb-2 flex-shrink-0 text-center border-b border-gray-600 pb-1.5">Průběh zápasu</h3>
               <div ref={eventLogRef} className="overflow-y-auto flex-grow space-y-1.5 sm:space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                {events.length === 0 && gameState !== 'finished' && (<p className="text-gray-500 text-center pt-4 italic text-sm">Zatím žádné události.</p>)}
                 {events.map((event, index) => (
                    <div key={event.id || `${event.time}-${index}`} className="bg-black/30 p-1.5 sm:p-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <span className="text-cyan-500 font-mono flex-shrink-0 w-20 sm:w-24 text-right">{formatGameTime(event.time, PERIOD_DURATION_SECONDS).split('|')[1]?.trim() ?? "??:??:??"}</span>
                      <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                      <span className="flex-grow text-gray-300">{event.description}</span>
                    </div>))}
                 {gameState === 'finished' && (<div className="mt-4 p-3 bg-gradient-to-r from-green-800/50 to-blue-800/50 rounded-lg text-center border border-green-600/50"><TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-1" /><p className="text-lg sm:text-xl font-bold text-white">KONEC ZÁPASU!</p><p className="text-base sm:text-lg text-gray-200">{teams.white.name} {score.white} - {score.black} {teams.black.name}</p></div>)}
               </div>
            </div>
          </div> {/* Konec pravého sloupce */}
        </div> {/* Konec hlavní obsahové oblasti */}

        {/* Special Action Dialog */}
        {specialAction && (<PlayerSpecialAction action={specialAction} onOptionSelect={handleSpecialActionResult} />)}

        {/* Potvrzovací dialog pro opuštění zápasu */}
        {showExitConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 max-w-md mx-auto border border-red-700 shadow-lg animate-fadeIn">
              <h3 className="text-xl text-center font-bold text-red-400 mb-3">Opravdu chceš opustit zápas?</h3>
              <p className="text-gray-300 mb-5 text-center">Aktuální stav zápasu nebude uložen a přijdeš o případné odměny.</p>
              <div className="flex justify-center gap-4">
                <button onClick={handleCancelExit} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Zůstat</button>
                <button onClick={handleConfirmExit} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">Opustit zápas</button>
              </div>
            </div>
          </div>)}
      </div> {/* Konec hlavního kontejneru zápasu */}

      {/* Styles */}
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); background-clip: padding-box; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); } .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; } `}</style>
    </div>
  );
};

export default OldaHockeyMatch;