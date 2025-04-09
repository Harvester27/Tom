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
import PlayerSpecialAction from './PlayerSpecialAction'; // Import nové komponenty pro speciální akce

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 90; // PŮVODNÍ: 90 minut (od 16:30 do 18:00)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 64;
const EVENT_CHECK_INTERVAL = 15; // V sekundách herního času

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
  // Převedeme herní čas na skutečný čas od 16:30 do 18:00
  const startHour = 16;
  const startMinute = 30;

  // Počítáme minuty a sekundy od začátku
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Přidáme k počátečnímu času
  let currentHour = startHour;
  let currentMinute = startMinute + totalMinutes;

  // Ošetříme přetečení minut do hodin
  if (currentMinute >= 60) {
    currentHour += Math.floor(currentMinute / 60);
    currentMinute = currentMinute % 60;
  }

  // Ošetření pro případ, kdyby hra přesáhla 18:00 (i když by neměla)
  if (currentHour >= 18 && (currentMinute > 0 || seconds > 0)) {
      currentHour = 18;
      currentMinute = 0;
      // sekundy necháme, aby ukazovaly konec přesně na 18:00:00
  }

  // Určíme třetinu
  const period = Math.min(3, Math.floor(totalSeconds / periodDuration) + 1);

  return `Třetina ${period} | ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        return sum + (fatigueState[player.key] ?? 0);
    }, 0);
    return totalFatigue / fieldPlayers.length;
};

const useTeamState = (initialTeamsData) => {
  const [teams, setTeams] = useState(() => ({
    white: { name: initialTeamsData.white.name, players: [] },
    black: { name: initialTeamsData.black.name, players: [] }
  }));
  const [teamState, setTeamState] = useState(() => {
      const initializeSingleTeamState = () => ({
        onIce: [], bench: [], fatigue: {}, lastShiftChange: 0
      });
      return { white: initializeSingleTeamState(), black: initializeSingleTeamState() };
  });

  const updateTeam = useCallback((teamColor, updates) => {
    setTeams(prev => ({ ...prev, [teamColor]: { ...prev[teamColor], ...updates } }));
  }, []);

  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => {
        const newState = { ...prev };
        if (typeof updates === 'function') {
            newState[teamColor] = updates(prev[teamColor]);
        } else {
            newState[teamColor] = { ...prev[teamColor], ...updates };
        }
        return newState;
    });
  }, []); // Odstraněna závislost setTeamState, není potřeba

  return [teams, updateTeam, teamState, updateTeamState];
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
  // Ref pro sledování, zda už byla statistika pro daný event započítána
  const processedEventRef = useRef(null);

  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Team Initialization Effect --- (Bez změn oproti tvému původnímu kódu, jen init stats)
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

    // Rozdělení dle dresů... (kód zůstává stejný)
    if (assignedJerseys?.white) {
      activePlayers.forEach(p => {
        if (assignedJerseys.white.has(`${p.name} ${p.surname}`)) {
          whiteAssignedPlayers.push(p);
          whiteAssignedKeys.add(p.key);
        }
      });
      if (assignedJerseys.white.has(playerName)) {
          if (!whiteAssignedKeys.has(userPlayer.key)) whiteAssignedPlayers.push(userPlayer);
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
       if (assignedJerseys.black.has(playerName) && !whiteAssignedKeys.has(userPlayer.key)) {
           if (!blackAssignedKeys.has(userPlayer.key)) blackAssignedPlayers.push(userPlayer);
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

    // Zajistíme brankáře... (kód zůstává stejný)
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
          const backupGoalie = {
            name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75,
            key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})
          };
          while (teamPlayers.some(p => p.key === backupGoalie.key) || otherTeamPlayers.some(p => p.key === backupGoalie.key)) {
             backupGoalie.key += '_';
          }
          teamPlayers.push(backupGoalie);
        }
      }
    };
    ensureGoalie(whiteAssignedPlayers, blackAssignedPlayers);
    ensureGoalie(blackAssignedPlayers, whiteAssignedPlayers);

    // Seřadíme hráče... (kód zůstává stejný)
    const sortPlayers = (players) => {
      const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
      return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };
    const finalWhitePlayers = sortPlayers(whiteAssignedPlayers);
    const finalBlackPlayers = sortPlayers(blackAssignedPlayers);

    updateTeam('white', { name: 'Lancers Bílý', players: finalWhitePlayers });
    updateTeam('black', { name: 'Lancers Černý', players: finalBlackPlayers });

    // Inicializace statistik hráčů
    const initialStats = {};
    [...finalWhitePlayers, ...finalBlackPlayers].forEach(player => {
      if (!player.key) {
          console.error("🔴 INIT STATS ERROR: Player missing key:", player);
          return;
      }
      initialStats[player.key] = {
        timeOnIce: 0,
        goals: 0,
        assists: 0,
        penalties: 0, // Trestné minuty
        blocks: 0,
        shots: 0,
        saves: 0,
        savePercentage: 0, // Default na 0%
        shotsAgainst: 0
      };
    });
    setPlayerStats(initialStats);

    // Inicializace dynamického stavu... (kód zůstává stejný)
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]);


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
      setGameTime(prevTime => {
        // Použijeme `gameSpeed` pro výpočet přírůstku času
        const timeIncrement = gameSpeed; // Kolik herních sekund uplyne za 1 reálnou sekundu
        const newTime = Math.min(GAME_DURATION_SECONDS, prevTime + timeIncrement);

        if (newTime >= GAME_DURATION_SECONDS && prevTime < GAME_DURATION_SECONDS) {
            setGameState('finished');
            if (onGameComplete) onGameComplete({ score, events, playerStats });
            console.log("🏁 Game finished!");
            // Nemusíme clearInterval, protože se to zastaví samo změnou gameState
            return GAME_DURATION_SECONDS;
        }
        if (gameState !== 'playing') return prevTime; // Pokud se mezitím změní stav, zastavíme

        // --- Změna periody ---
        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        const oldPeriod = Math.min(3, Math.floor(prevTime / PERIOD_DURATION_SECONDS) + 1);
        if (newPeriod > oldPeriod) {
            setCurrentPeriod(newPeriod);
            // Čas události by měl být přesně na začátku nové periody
            const periodStartTime = oldPeriod * PERIOD_DURATION_SECONDS;
            const periodChangeEvent = { type: 'period_change', time: periodStartTime, description: `Začala ${newPeriod}. třetina!`, period: newPeriod };
            setEvents(prev => [periodChangeEvent, ...prev]);
            setLastEvent(periodChangeEvent);
            processedEventRef.current = null; // Reset pro statistiky
        }

        // --- Event Generation Logic ---
        // Musíme zjistit, zda tento tick překročil hranici kontroly událostí
        const currentIntervalCount = Math.floor(newTime / EVENT_CHECK_INTERVAL);
        const prevIntervalCount = Math.floor(prevTime / EVENT_CHECK_INTERVAL);

        if (currentIntervalCount > prevIntervalCount) {
            // Kolik kontrolních bodů jsme přeskočili (relevantní při vysoké rychlosti)
            const intervalsPassed = currentIntervalCount - prevIntervalCount;
            for (let i = 1; i <= intervalsPassed; i++) {
                const checkTime = (prevIntervalCount + i) * EVENT_CHECK_INTERVAL;
                if (checkTime > GAME_DURATION_SECONDS) break; // Nekontrolujeme po konci hry

                // Získání aktuálního stavu týmů pro rozhodování
                const currentTeamState = teamState;
                if (!currentTeamState) continue; // Skip, if state not ready

                const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
                const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';

                const attackingTeamState = currentTeamState[attackingTeamId];
                const defendingTeamState = currentTeamState[defendingTeamId];
                const attackingTeamOnIce = attackingTeamState?.onIce ?? [];
                const defendingTeamOnIce = defendingTeamState?.onIce ?? [];
                const fatigueData = { ...currentTeamState.white.fatigue, ...currentTeamState.black.fatigue };

                if (attackingTeamOnIce.length < 5 || defendingTeamOnIce.length < 5) continue; // Potřebujeme hráče v poli

                const eventRoll = Math.random();
                let eventType = 'attack';
                if (eventRoll < 0.08) eventType = 'penalty';

                let newEvent = { time: checkTime, team: attackingTeamId, id: `${checkTime}-${attackingTeamId}-${Math.random()}` }; // Unikátní ID pro event

                if (eventType === 'penalty') {
                    const possibleFoulers = attackingTeamOnIce.filter(p => p && p.position !== 'brankář');
                    if (possibleFoulers.length === 0) continue;
                    const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                    newEvent.type = 'penalty';
                    newEvent.player = fouler;
                    newEvent.penaltyMinutes = 2;
                    newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává ${newEvent.penaltyMinutes} minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}`;
                    triggerHighlight(fouler.key);
                } else {
                    const attackersOnIce = attackingTeamOnIce.filter(p => p && p.position !== 'brankář');
                    if (attackersOnIce.length === 0) continue;
                    const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];

                    const goalie = defendingTeamOnIce.find(p => p && p.position === 'brankář');
                    const defendersOnIce = defendingTeamOnIce.filter(p => p && p.position === 'obránce');
                    const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;

                    let goalChance = 0.25;
                    goalChance += (attacker.level || 1) * 0.04;
                    if (attacker.isPlayer) goalChance += 0.10;
                    if (defender) goalChance -= (defender.level || 1) * 0.03;
                    if (goalie) goalChance -= (goalie.level || 1) * 0.06;

                    const attackingAvgFatigue = calculateAverageOnIceFatigue(attackingTeamOnIce, fatigueData);
                    const defendingAvgFatigue = calculateAverageOnIceFatigue(defendingTeamOnIce, fatigueData);
                    const fatigueDifference = defendingAvgFatigue - attackingAvgFatigue;
                    const fatigueBonus = fatigueDifference * FATIGUE_IMPACT_FACTOR;
                    goalChance += fatigueBonus;
                    goalChance = Math.max(0.05, Math.min(0.85, goalChance));

                    const outcomeRoll = Math.random();
                    if (outcomeRoll < goalChance) { // GÓL
                        setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                        const possibleAssists = attackingTeamOnIce.filter(p => p && p.key !== attacker.key && p.position !== 'brankář');
                        const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;

                        newEvent.type = 'goal';
                        newEvent.player = attacker;
                        newEvent.assistant = assistant;
                        newEvent.goalieKey = goalie?.key; // Přidáme klíč brankáře pro statistiky
                        newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}${assistant.isPlayer ? ' (Tvoje asistence!)' : ''}` : ''}!`;
                        console.log(`🚨 Generated GOAL event with goalieKey=${goalie?.key}:`, attacker.key, assistant?.key);
                        triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
                        // ******** STATISTIKY SE NEPŘIDÁVAJÍ ZDE ********

                    } else if (outcomeRoll < goalChance + 0.35 || !goalie) { // ZÁKROK / VEDLE
                        if (goalie) {
                            newEvent.type = 'save';
                            newEvent.player = goalie;
                            newEvent.shooter = attacker;
                            newEvent.description = `🧤 Zákrok! ${goalie.name} ${goalie.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) chytá střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.`;
                            console.log(`🧤 Generated SAVE event:`, goalie.key, attacker.key);
                            triggerHighlight([goalie.key, attacker.key]);
                        } else {
                            newEvent.type = 'miss';
                            newEvent.player = attacker;
                            newEvent.description = `💨 Střela vedle od ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}).`;
                            console.log(`💨 Generated MISS event:`, attacker.key);
                            triggerHighlight(attacker.key);
                        }
                        // ******** STATISTIKY SE NEPŘIDÁVAJÍ ZDE ********

                    } else if (defender) { // BLOK
                        newEvent.type = 'defense';
                        newEvent.player = defender;
                        newEvent.attacker = attacker;
                        newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                        console.log(`🛡️ Generated DEFENSE event:`, defender.key, attacker.key);
                        triggerHighlight([defender.key, attacker.key]);
                        // ******** STATISTIKY SE NEPŘIDÁVAJÍ ZDE ********

                    } else { // ZTRÁTA PUKU
                        newEvent.type = 'turnover';
                        newEvent.player = attacker;
                        newEvent.description = `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.`;
                    }
                }
                setLastEvent(newEvent);
                setEvents(prev => [newEvent, ...prev]);
                processedEventRef.current = null; // Reset, nová událost přišla
            }
        } // Konec kontroly události

        // --- Kontrola střídání podle herního času ---
        ['white', 'black'].forEach(teamColor => {
            updateTeamState(teamColor, prevTeamState => {
                if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) {
                    return prevTeamState;
                }

                const timeSinceLastChange = newTime - (prevTeamState.lastShiftChange || 0);

                const tiredOnIce = prevTeamState.onIce
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));

                const restedOnBench = prevTeamState.bench
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? MAX_FATIGUE) - (prevTeamState.fatigue[b.key] ?? MAX_FATIGUE));

                const hasHighlyTiredPlayer = tiredOnIce.length > 0 && (prevTeamState.fatigue[tiredOnIce[0].key] ?? 0) > 80;

                if (timeSinceLastChange < SHIFT_DURATION && !hasHighlyTiredPlayer) {
                    return prevTeamState; // Ještě není čas a nikdo není extra unavený
                }
                if (restedOnBench.length === 0 || tiredOnIce.length === 0) {
                   // Není koho nebo kým střídat, i když by byl čas
                   // Resetujeme časovač, aby se to zkusilo brzy znovu
                   return { ...prevTeamState, lastShiftChange: newTime };
                }

                // Kolik hráčů můžeme reálně vyměnit (max 3 najednou, nebo více pokud je někdo vyčerpaný)
                const numToChange = Math.min(
                    tiredOnIce.length,
                    restedOnBench.length,
                    hasHighlyTiredPlayer ? Math.max(1, Math.ceil(tiredOnIce.length / 2)) : 3 // Střídej více, když je někdo vyčerpaný
                );

                if (numToChange <= 0) {
                    // Mělo by být pokryto kontrolou rested/tired.length === 0
                    return { ...prevTeamState, lastShiftChange: newTime }; // Pro jistotu
                }

                // Hráči ven a dovnitř
                const playersOut = tiredOnIce.slice(0, numToChange);
                const playersOutKeys = new Set(playersOut.map(p => p.key));
                const playersIn = restedOnBench.slice(0, numToChange);
                const playersInKeys = new Set(playersIn.map(p => p.key));

                // Nové sestavy
                const newOnIce = [
                    ...prevTeamState.onIce.filter(p => !playersOutKeys.has(p.key)),
                    ...playersIn
                ];
                const newBench = [
                    ...prevTeamState.bench.filter(p => !playersInKeys.has(p.key)),
                    ...playersOut
                ];

                // Logování a událost
                const playersInNames = playersIn.map(p => p.surname).join(", ");
                const playersOutNames = playersOut.map(p => p.surname).join(", ");
                // console.log(`✅ AUTO SUB EXECUTED (${teamColor}): ${playersInNames} IN <-> ${playersOutNames} OUT at ${newTime}`);
                const subEvent = {
                    time: newTime, type: 'substitution', team: teamColor,
                    description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}`,
                    id: `${newTime}-sub-${teamColor}-${Math.random()}` // Unikátní ID
                };
                setEvents(prev => [subEvent, ...prev]);
                // setLastEvent(subEvent); // Nechceme, aby střídání přepsalo poslední gólovou akci atd.
                triggerHighlight([...playersInKeys, ...playersOutKeys]);
                processedEventRef.current = null; // Reset

                // Vrátíme nový stav
                return {
                    ...prevTeamState,
                    onIce: newOnIce,
                    bench: newBench,
                    lastShiftChange: newTime // Aktualizujeme čas posledního úspěšného střídání
                };
            });
        });

        // --- Kontrola speciálních akcí pro hráče ---
        const currentActionIntervalCount = Math.floor(newTime / SPECIAL_ACTION_INTERVAL);
        const prevActionIntervalCount = Math.floor(prevTime / SPECIAL_ACTION_INTERVAL);

        if (currentActionIntervalCount > prevActionIntervalCount && newTime - lastSpecialActionTime >= MIN_TIME_BETWEEN_ACTIONS) {
            const actionCheckTime = currentActionIntervalCount * SPECIAL_ACTION_INTERVAL;
            if (actionCheckTime > GAME_DURATION_SECONDS) { /* skip */ }
            else {
                const playerTeamColor = findPlayerTeamColor();
                if (playerTeamColor && Math.random() < SPECIAL_ACTION_CHANCE) {
                    const currentTeamState = teamState; // Použijeme přímo existující teamState
                    const playerOnIce = currentTeamState && currentTeamState[playerTeamColor]?.onIce.some(p => p.isPlayer);

                    if (playerOnIce) {
                        generateSpecialAction(playerTeamColor, actionCheckTime);
                        setLastSpecialActionTime(actionCheckTime);
                        setGameState('paused'); // Pozastavíme hru
                    }
                }
            }
        }

        return newTime; // Vracíme nový čas
      });
    };

    // Spustíme interval, který volá gameTick každou sekundu
    intervalId = setInterval(gameTick, 1000); // Interval běží vždy 1 sekundu reálného času

    // Funkce pro vyčištění intervalu
    return () => clearInterval(intervalId);

  // ZÁVISLOSTI: Spustí se znovu jen když se změní gameState, gameSpeed, nebo klíčové callbacky/data
  }, [gameState, gameSpeed, teams, score, currentPeriod, GAME_DURATION_SECONDS, PERIOD_DURATION_SECONDS, EVENT_CHECK_INTERVAL, SHIFT_DURATION, SPECIAL_ACTION_INTERVAL, MIN_TIME_BETWEEN_ACTIONS, onGameComplete, triggerHighlight, updateTeamState, lastSpecialActionTime, playerStats, events]); // Odstraněna závislost setTeamState

  // --- Aktualizace statistik POUZE na základě lastEvent ---
  useEffect(() => {
    // Pokud není nová událost nebo už byla zpracována, nic neděláme
    if (!lastEvent || !lastEvent.id || lastEvent.id === processedEventRef.current) {
        //console.log(`Skipping stats update for event: ${lastEvent?.id} (already processed or null)`);
        return;
    }

    // Označíme událost jako zpracovanou
    processedEventRef.current = lastEvent.id;
    console.log(`🏒 Processing stats for event: ${lastEvent.id}, type: ${lastEvent.type}`, lastEvent);

    setPlayerStats(prevStats => {
        const newStats = JSON.parse(JSON.stringify(prevStats)); // Hluboká kopie pro jistotu

        const updateStat = (playerKey, statName, value = 1) => {
            if (playerKey && newStats[playerKey]) {
                newStats[playerKey][statName] = (newStats[playerKey][statName] || 0) + value;
                console.log(`🔹 Updated stat ${statName} for ${playerKey} to ${newStats[playerKey][statName]}`);
            } else if (playerKey) {
                console.warn(`⚠️ Player key ${playerKey} not found in stats for event type ${lastEvent.type}`);
            }
        };

        const updateGoalieStats = (goalieKey, isGoal) => {
            if (goalieKey && newStats[goalieKey]) {
                const goalieStat = newStats[goalieKey];
                goalieStat.shotsAgainst = (goalieStat.shotsAgainst || 0) + 1;
                if (!isGoal) {
                    goalieStat.saves = (goalieStat.saves || 0) + 1;
                }
                // Přepočet úspěšnosti
                goalieStat.savePercentage = goalieStat.shotsAgainst > 0
                    ? Math.round((goalieStat.saves / goalieStat.shotsAgainst) * 100)
                    : 0; // Pokud nejsou střely, úspěšnost je 0% (ne 100%)
                console.log(`🧤 Updated goalie ${goalieKey}: SA=${goalieStat.shotsAgainst}, S=${goalieStat.saves}, %=${goalieStat.savePercentage}, isGoal=${isGoal}`);
            } else if (goalieKey) {
                console.warn(`⚠️ Goalie key ${goalieKey} not found in stats for goal/save event`);
            } else {
                console.warn(`⚠️ No goalieKey provided for updateGoalieStats, isGoal=${isGoal}`);
            }
        };

        switch (lastEvent.type) {
            case 'goal':
                // Góly a asistence se přičítají vždy +1
                if (lastEvent.player?.key) {
                    updateStat(lastEvent.player.key, 'goals', 1);
                    updateStat(lastEvent.player.key, 'shots', 1); // Gól je také střela
                } else {
                    console.warn(`⚠️ Goal event missing player key:`, lastEvent);
                }
                if (lastEvent.assistant?.key) {
                    updateStat(lastEvent.assistant.key, 'assists', 1);
                } else {
                    console.log(`ℹ️ Goal without assist`);
                }
                // Aktualizace pro inkasujícího brankáře (pokud byl zadán v události)
                if(lastEvent.goalieKey) {
                    updateGoalieStats(lastEvent.goalieKey, true); // true = byl to gól
                } else {
                    console.warn(`⚠️ Goal event missing goalieKey:`, lastEvent);
                }
                break;

            case 'save':
                // Zákrok brankáře a střela útočníka
                if (lastEvent.player?.key) { // Brankář
                    updateGoalieStats(lastEvent.player.key, false); // false = nebyl to gól
                } else {
                    console.warn(`⚠️ Save event missing player (goalie) key:`, lastEvent);
                }
                if (lastEvent.shooter?.key) { // Střelec
                    updateStat(lastEvent.shooter.key, 'shots', 1);
                } else {
                    console.warn(`⚠️ Save event missing shooter key:`, lastEvent);
                }
                break;

            case 'miss':
                // Pouze střela pro útočníka
                if (lastEvent.player?.key) {
                    updateStat(lastEvent.player.key, 'shots', 1);
                } else {
                    console.warn(`⚠️ Miss event missing player key:`, lastEvent);
                }
                break;

            case 'defense': // Blok
                // Střela pro útočníka a možný blok pro obránce
                if (lastEvent.attacker?.key) {
                    updateStat(lastEvent.attacker.key, 'shots', 1);
                } else {
                    console.warn(`⚠️ Defense event missing attacker key:`, lastEvent);
                }
                if (lastEvent.player?.key) { // Hráč, který blokoval
                    // Náhodná šance na započítání bloku pro realističnost
                    const blockChance = (lastEvent.player.position === 'obránce') ? 0.6 : 0.3; // Obránci mají vyšší šanci
                    if (Math.random() < blockChance) {
                        updateStat(lastEvent.player.key, 'blocks', 1);
                    }
                } else {
                    console.warn(`⚠️ Defense event missing defender key:`, lastEvent);
                }
                break;

            case 'penalty':
                // Přičtení trestných minut
                if (lastEvent.player?.key && lastEvent.penaltyMinutes) {
                    updateStat(lastEvent.player.key, 'penalties', lastEvent.penaltyMinutes);
                } else {
                    console.warn(`⚠️ Penalty event missing player key or minutes:`, lastEvent);
                }
                break;

            default:
                // Pro ostatní typy událostí (turnover, period_change, substitution) se statistiky nemění
                break;
        }

        return newStats; // Vracíme aktualizovaný stav statistik
    });

  // ZÁVISLOST POUZE NA lastEvent!
  // Tím zajistíme, že se statistiky aktualizují POUZE jednou pro každou novou událost.
  }, [lastEvent]);


  // --- Fatigue Update Effect --- (Používá vlastní interval, nezávislý na hlavním)
  useEffect(() => {
    if (gameState !== 'playing') return;
    // console.log("🚀 Starting fatigue update interval.");
    const fatigueInterval = setInterval(() => {
        // Rychlost únavy a regenerace je násobena rychlostí hry
        const fatigueIncreaseRate = BASE_FATIGUE_INCREASE_RATE * gameSpeed;
        const recoveryRate = BASE_RECOVERY_RATE * gameSpeed;

        const updateFatigueForTeam = (teamColor) => {
            updateTeamState(teamColor, prevTeamState => {
                if (!prevTeamState?.fatigue || !prevTeamState.onIce || !prevTeamState.bench) return prevTeamState;
                let fatigueChanged = false;
                const newFatigue = { ...prevTeamState.fatigue };

                // Hráči na ledě se unavují
                prevTeamState.onIce.forEach(player => {
                    if (player?.key) {
                        const currentFatigue = newFatigue[player.key] ?? 0;
                        // Brankáři se unavují pomaleji
                        const rate = player.position === 'brankář' ? fatigueIncreaseRate * 0.5 : fatigueIncreaseRate;
                        const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + rate);
                        if (newFatigue[player.key] !== updatedFatigue) {
                            newFatigue[player.key] = Math.round(updatedFatigue); // Zaokrouhlíme pro přehlednost
                            fatigueChanged = true;
                        }
                    }
                });

                // Hráči na lavičce regenerují
                prevTeamState.bench.forEach(player => {
                    if (player?.key) {
                        const currentFatigue = newFatigue[player.key] ?? 0;
                        const updatedFatigue = Math.max(0, currentFatigue - recoveryRate);
                        if (newFatigue[player.key] !== updatedFatigue) {
                            newFatigue[player.key] = Math.round(updatedFatigue); // Zaokrouhlíme
                            fatigueChanged = true;
                        }
                    }
                });

                return fatigueChanged ? { ...prevTeamState, fatigue: newFatigue } : prevTeamState;
            });
        };

        updateFatigueForTeam('white');
        updateFatigueForTeam('black');

    }, 1000); // Interval únavy běží každou reálnou sekundu

    return () => {
        // console.log("🛑 Stopping fatigue update interval.");
        clearInterval(fatigueInterval);
    };
  }, [gameState, gameSpeed, updateTeamState]); // Závisí na stavu hry a rychlosti


  // --- Aktualizace času na ledě ---
  useEffect(() => {
      if (gameState !== 'playing') return;

      // Tento interval běží každou sekundu reálného času
      const toiInterval = setInterval(() => {
          setPlayerStats(prevStats => {
              const newStats = { ...prevStats };
              let statsChanged = false;

              // Použijeme přímo teamState místo setTeamState pro získání aktuálního stavu
              if (!teamState) return prevStats; // Pokud stav není k dispozici

              ['white', 'black'].forEach(teamColor => {
                  const playersOnIceKeys = new Set(teamState[teamColor]?.onIce?.map(p => p?.key).filter(Boolean) || []);

                  playersOnIceKeys.forEach(playerKey => {
                      if (newStats[playerKey]) {
                          // Přičítáme počet herních sekund, které uplynuly za tuto reálnou sekundu
                          newStats[playerKey].timeOnIce = (newStats[playerKey].timeOnIce || 0) + gameSpeed;
                          statsChanged = true;
                      }
                  });
              });

              return statsChanged ? newStats : prevStats;
          });
      }, 1000); // Běží každou reálnou sekundu

      return () => clearInterval(toiInterval);

  }, [gameState, gameSpeed, teamState]); // Závislost na teamState místo setTeamState


  // --- Ostatní pomocné funkce a handlery (findPlayerTeamColor, isPlayerOnIce, generateSpecialAction, handleSpecialActionResult, handleStartPause, changeSpeed, handleExit, handleConfirmExit, handleCancelExit, handlePlayerSubstitution) ---
  // (Tyto funkce zůstávají stejné jako v tvém původním kódu, pokud jsi s nimi byl spokojený)
  // --- find ---
    const findPlayerTeamColor = useCallback(() => {
    if (teams.white.players?.some(p => p.isPlayer)) return 'white';
    if (teams.black.players?.some(p => p.isPlayer)) return 'black';
    return null;
  }, [teams]);

  // --- isPlayerOnIce ---
  const isPlayerOnIce = useCallback((teamColor) => {
      if (!teamColor) return false;
      // Použijeme přímo stav týmu z teamState
      if (!teamState || !teamState[teamColor]?.onIce) return false;
      return teamState[teamColor].onIce.some(p => p && p.isPlayer);
  }, [teamState]); // Závislost na teamState

  // --- generateSpecialAction ---
  const generateSpecialAction = useCallback((playerTeamColor, currentTime) => {
    if (!teamState) return; // Pokud stav není k dispozici
    
    const currentTeamState = teamState;
    const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';

    const player = currentTeamState[playerTeamColor]?.onIce.find(p => p.isPlayer);
    if (!player) return; // Hráč mezitím vystřídal

    const playerFatigue = currentTeamState[playerTeamColor]?.fatigue[player.key] || 0;
    const opposingGoalie = currentTeamState[opposingTeamColor]?.onIce.find(p => p.position === 'brankář');
    const opposingDefenders = currentTeamState[opposingTeamColor]?.onIce.filter(p => p.position === 'obránce');
    const opposingDefender = opposingDefenders.length > 0
      ? opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)]
      : null;
    const teammates = currentTeamState[playerTeamColor]?.onIce.filter(p => p.position !== 'brankář' && !p.isPlayer);
    const teammate = teammates.length > 0
      ? teammates[Math.floor(Math.random() * teammates.length)]
      : null;

    const actionTypes = [
      { type: 'shot_opportunity', description: 'Máš šanci na přímou střelu!', options: [{ id: 'shoot', text: 'Vystřelit', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát spoluhráči', difficulty: 'easy' }, { id: 'deke', text: 'Kličkovat a zkusit obejít', difficulty: 'hard' }] },
      { type: 'one_on_one', description: 'Jsi sám před brankářem!', options: [{ id: 'shoot_high', text: 'Vystřelit nahoru', difficulty: 'medium' }, { id: 'shoot_low', text: 'Vystřelit dolů', difficulty: 'medium' }, { id: 'deke', text: 'Kličkovat brankáři', difficulty: 'hard' }] },
      { type: 'defensive_challenge', description: 'Protihráč se blíží k bráně a ty ho můžeš zastavit!', options: [{ id: 'stick_check', text: 'Zkusit hokejkou vypíchnout puk', difficulty: 'medium' }, { id: 'body_check', text: 'Zkusit bodyček', difficulty: 'hard' }, { id: 'position', text: 'Zaujmout dobrou pozici', difficulty: 'easy' }] },
      { type: 'rebound_opportunity', description: 'Puk se odrazil od brankáře!', options: [{ id: 'quick_shot', text: 'Rychlá dorážka', difficulty: 'hard' }, { id: 'control', text: 'Zkontrolovat puk', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát lépe postavenému', difficulty: 'easy' }] }
    ];

    const selectedAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];

    const fullAction = {
      ...selectedAction,
      time: currentTime,
      player,
      playerTeamColor,
      playerFatigue,
      opposingGoalie,
      opposingDefender,
      teammate,
      gameContext: {
        score, // Aktuální skóre z vnějšího stavu
        period: currentPeriod, // Aktuální perioda z vnějšího stavu
        timeRemaining: GAME_DURATION_SECONDS - currentTime
      }
    };

    setSpecialAction(fullAction);

  }, [teamState, score, currentPeriod, GAME_DURATION_SECONDS]); // Závislost na teamState místo setTeamState

   // --- handleSpecialActionResult ---
   const handleSpecialActionResult = useCallback((option) => {
    if (!specialAction) return;

    const player = specialAction.player;
    const playerLevel = player.level || 1;
    const playerFatigue = specialAction.playerFatigue;
    const fatigueImpact = playerFatigue / MAX_FATIGUE; // 0-1

    let successChance;
    switch (option.difficulty) {
      case 'easy': successChance = 0.8; break;
      case 'medium': successChance = 0.6; break;
      case 'hard': successChance = 0.4; break;
      default: successChance = 0.5;
    }

    successChance += (playerLevel - 1) * 0.05;
    successChance -= fatigueImpact * 0.3;
    successChance = Math.max(0.1, Math.min(0.9, successChance));

    const isSuccess = Math.random() < successChance;
    let resultMessage, eventDescription, eventType;
    const teamName = specialAction.playerTeamColor === 'white' ? 'Bílí' : 'Černí';
    const opposingTeamColor = specialAction.playerTeamColor === 'white' ? 'black' : 'white';
    let generatedEvent = null; // Zde uložíme událost pro statistiky

    if (isSuccess) {
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          if (option.id.includes('shoot') || option.id === 'quick_shot' || option.id === 'deke') {
            const goalChance = option.id === 'deke' ? 0.7 : 0.5;
            const isGoal = Math.random() < goalChance;
            if (isGoal) {
              resultMessage = `Výborně! Tvoje akce skončila gólem!`;
              eventDescription = `🚨 GÓÓÓL! ${player.name} ${player.surname} (Ty!) (${teamName}) skóruje po speciální akci!`;
              eventType = 'goal';
              setScore(prev => ({ ...prev, [specialAction.playerTeamColor]: prev[specialAction.playerTeamColor] + 1 }));
              generatedEvent = { 
                type: 'goal', 
                player: player, 
                assistant: null, 
                goalieKey: specialAction.opposingGoalie?.key, 
                team: specialAction.playerTeamColor,
                id: `${specialAction.time}-special-goal-${player.key}-${Math.random()}`
              }; // Vytvoříme event pro statistiky
              console.log(`🥅 Special Action created GOAL event:`, generatedEvent);
            } else {
              resultMessage = `Dobrá střela, ale ${specialAction.opposingGoalie ? specialAction.opposingGoalie.surname : 'brankář'} ji chytil.`;
              eventDescription = `🧤 Zákrok! ${specialAction.opposingGoalie ? specialAction.opposingGoalie.name + ' ' + specialAction.opposingGoalie.surname : 'Brankář'} chytá tvoji střelu po speciální akci.`;
              eventType = 'save';
              generatedEvent = { 
                type: 'save', 
                player: specialAction.opposingGoalie, 
                shooter: player, 
                team: opposingTeamColor,
                id: `${specialAction.time}-special-save-${player.key}-${Math.random()}`
              };
              console.log(`🧤 Special Action created SAVE event:`, generatedEvent);
            }
          } else if (option.id === 'pass' && specialAction.teammate) {
            resultMessage = `Tvoje přihrávka byla přesná.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) přesně přihrává na ${specialAction.teammate.name} ${specialAction.teammate.surname} po speciální akci.`;
            eventType = 'pass'; // Nebo 'assist_attempt'? Nemá přímý dopad na standardní statistiky.
          } else { // control, deke (no shot) etc.
            resultMessage = `Akce se podařila! Získal jsi kontrolu nad pukem.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci (${option.text}).`;
            eventType = 'success'; // Obecný úspěch
          }
          break;
        case 'defensive_challenge':
          resultMessage = `Úspěšně jsi zastavil útok soupeře!`;
          eventDescription = `🛡️ Dobrá obrana! ${player.name} ${player.surname} (Ty!) (${teamName}) zastavil útok soupeře po speciální akci.`;
          eventType = 'defense';
          generatedEvent = { 
            type: 'defense', 
            player: player, 
            attacker: null, 
            team: specialAction.playerTeamColor,
            id: `${specialAction.time}-special-defense-${player.key}-${Math.random()}`
          }; // Započítáme blok? Možná.
          console.log(`🛡️ Special Action created DEFENSE event:`, generatedEvent);
          break;
        default:
          resultMessage = `Akce byla úspěšná!`;
          eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`;
          eventType = 'success';
      }
    } else { // Neúspěch
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          // Neúspěšná střela / klička -> ztráta puku nebo střela mimo
          resultMessage = `Bohužel, akce se nepovedla podle plánu.`;
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí (${option.text}).`;
          eventType = 'miss'; // Nebo 'turnover'
          if (option.id.includes('shoot') || option.id === 'quick_shot') {
             generatedEvent = { 
               type: 'miss', 
               player: player, 
               team: specialAction.playerTeamColor,
               id: `${specialAction.time}-special-miss-${player.key}-${Math.random()}`
              }; // Počítáme jako střelu mimo
             console.log(`💨 Special Action created MISS event:`, generatedEvent);
          } else {
             eventType = 'turnover';
          }
          break;
        case 'defensive_challenge':
          const opponentGoalChance = option.id === 'body_check' ? 0.4 : 0.2;
          const isOpponentGoal = Math.random() < opponentGoalChance;
          if (isOpponentGoal) {
            resultMessage = `Nepodařilo se ti zastavit útok a soupeř skóroval!`;
            eventDescription = `🚨 Gól soupeře! ${player.name} ${player.surname} (Ty!) nedokázal zastavit útok a soupeř skóroval.`;
            eventType = 'goal'; // Soupeřův gól
            setScore(prev => ({ ...prev, [opposingTeamColor]: prev[opposingTeamColor] + 1 }));
             // Zde nemáme info o střelci soupeře, takže nemůžeme vytvořit plný event pro statistiky
             // Ale můžeme vytvořit event pro log
             const opponentEvent = {
                time: specialAction.time, 
                type: 'goal', 
                team: opposingTeamColor,
                description: `Gól soupeře po neúspěšné obraně hráče ${player.name} ${player.surname}.`,
                id: `${specialAction.time}-goal-${opposingTeamColor}-${Math.random()}`
             };
             console.log(`🚨 Special Action created OPPONENT GOAL event:`, opponentEvent);
             setEvents(prev => [opponentEvent, ...prev]);
             setLastEvent(opponentEvent); // Nastavíme i jako poslední event
             processedEventRef.current = null; // Umožníme zpracování statistik tohoto gólu, pokud efekt zachytí tento event
          } else {
            resultMessage = `Nepodařilo se ti zastavit útok, ale naštěstí soupeř neskóroval.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl s obranou při speciální akci.`;
            eventType = 'turnover';
          }
          break;
        default:
          resultMessage = `Akce nebyla úspěšná.`;
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí.`;
          eventType = 'miss';
      }
    }

    // Přidáme hlavní událost popisující akci hráče (pokud nevznikl soupeřův gól)
    if (eventType !== 'goal' || specialAction.playerTeamColor === lastEvent?.team) { // Přidáme jen pokud to nebyl gól soupeře
        const actionEvent = {
          type: eventType, // Použijeme určený typ (goal, save, miss, defense, pass, turnover, success)
          time: specialAction.time,
          player: specialAction.player, // Vždy je to akce našeho hráče
          team: specialAction.playerTeamColor,
          description: eventDescription, // Popis výsledku akce
          id: `${specialAction.time}-${eventType}-${player.key}-${Math.random()}` // Unikátní ID
        };
        
        // Přidáme další vlastnosti pro správné statistiky podle typu události
        if (eventType === 'goal') {
            actionEvent.goalieKey = specialAction.opposingGoalie?.key;
            console.log(`🥅 Adding goalieKey to actionEvent:`, actionEvent.goalieKey);
        } else if (eventType === 'save') {
            actionEvent.shooter = player;
            console.log(`🧤 Adding shooter to actionEvent:`, actionEvent.shooter);
        } else if (eventType === 'defense') {
            actionEvent.attacker = null; // Nemáme konkrétního útočníka
        }
        
        console.log(`🎮 Special Action created user action event:`, actionEvent);
        setEvents(prev => [actionEvent, ...prev]);
        setLastEvent(actionEvent); // Nastavíme jako poslední událost pro zobrazení a případné statistiky
        processedEventRef.current = null; // Umožníme zpracování statistik této nové události
    }


    // Zvýrazníme hráče
    triggerHighlight(specialAction.player.key);

    // Vytvoříme výsledek pro zobrazení v UI speciální akce
    const actionResult = { success: isSuccess, message: resultMessage, eventType };

    // Zavřeme okno speciální akce a pokračujeme ve hře po krátké pauze
    setTimeout(() => {
      setSpecialAction(null);
      if (gameState === 'paused') { // Pokračujeme jen pokud jsme hru pozastavili kvůli akci
          setGameState('playing');
      }
    }, 2500); // Delší pauza pro přečtení výsledku

    return actionResult; // Vrátíme výsledek pro UI

  }, [specialAction, triggerHighlight, setEvents, setLastEvent, setScore, gameState]); // Přidány závislosti


  // --- handleStartPause ---
  const handleStartPause = () => {
    if (gameState === 'playing') {
        setGameState('paused');
    } else if (gameState === 'paused' || gameState === 'warmup') {
        setGameState('playing');
    }
    // Pokud je hra 'finished', tlačítko by nemělo být aktivní pro start/pause
  };

  // --- changeSpeed ---
  const changeSpeed = (delta) => {
    setGameSpeed(prev => {
      let newSpeed = prev;
      if (delta > 0) {
        if (prev < 8) newSpeed = prev + 1;
        else if (prev === 8) newSpeed = 16;
        else if (prev === 16) newSpeed = 32;
        else if (prev === 32) newSpeed = 64;
        else newSpeed = 64;
      } else {
        if (prev > 32) newSpeed = 32;
        else if (prev > 16) newSpeed = 16;
        else if (prev > 8) newSpeed = 8;
        else newSpeed = Math.max(1, prev - 1);
      }
      console.log(`Changing speed from ${prev} to ${newSpeed}`);
      return newSpeed;
    });
  };

  // --- handlePlayerSubstitution ---
  const handlePlayerSubstitution = useCallback((teamColor) => {
      const currentTime = gameTime; // Aktuální herní čas

      console.log(`🔄 Manual SUB attempted for team ${teamColor} at ${currentTime}`);
      // Použijeme přímo stav teamState bez volání setTeamState
      const currentTeamState = teamState;

      if (!currentTeamState || !currentTeamState[teamColor]) {
          console.error("❌ SUB ERROR: Invalid team state for", teamColor);
          return;
      }

      const team = currentTeamState[teamColor];
      const player = teams[teamColor]?.players.find(p => p.isPlayer); // Najdeme objekt hráče v hlavním seznamu

      if (!player) {
          console.error("❌ SUB ERROR: Player object not found in team list for", teamColor);
          return;
      }

      const playerKey = player.key;
      const isOnIce = team.onIce.some(p => p && p.key === playerKey);
      const isOnBench = team.bench.some(p => p && p.key === playerKey);

      console.log(`Player ${playerName} (${playerKey}) - On Ice: ${isOnIce}, On Bench: ${isOnBench}`);

      if (isOnIce) { // Hráč jde z ledu na lavičku
          const playerOnIceObject = team.onIce.find(p => p.key === playerKey);
          if (!playerOnIceObject) { console.error("Consistency error: Player key on ice but object not found."); return; }

          // Najdeme nejméně unaveného AI hráče na lavičce (ne brankáře)
          const restedBenchPlayer = [...team.bench]
              .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
              .sort((a, b) => (team.fatigue[a.key] ?? MAX_FATIGUE) - (team.fatigue[b.key] ?? MAX_FATIGUE))[0];

          if (!restedBenchPlayer) {
              console.warn("❌ SUB WARN: No rested AI players on bench to swap with.");
              // Můžeme hráče jen stáhnout, pokud je to žádoucí? Prozatím ne.
              return; // Nelze provést výměnu
          }

          // Provedeme výměnu
          const newOnIce = team.onIce.filter(p => p.key !== playerKey);
          newOnIce.push(restedBenchPlayer);
          const newBench = team.bench.filter(p => p.key !== restedBenchPlayer.key);
          newBench.push(playerOnIceObject); // Přidáme objekt hráče na lavičku

          updateTeamState(teamColor, {
              onIce: newOnIce,
              bench: newBench,
              lastShiftChange: currentTime // Manuální střídání resetuje časovač automatického
          });

          const subEvent = {
              time: currentTime, type: 'substitution', team: teamColor,
              description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️`,
              id: `${currentTime}-sub-${playerKey}-off`
          };
          setEvents(prev => [subEvent, ...prev]);
          // setLastEvent(subEvent); // Nepřepisujeme poslední akci
          triggerHighlight([playerKey, restedBenchPlayer.key]);
          processedEventRef.current = null;
          console.log(`✅ Player ${playerName} substituted OFF ice for ${restedBenchPlayer.surname}`);

      } else if (isOnBench) { // Hráč jde z lavičky na led
          const playerOnBenchObject = team.bench.find(p => p.key === playerKey);
           if (!playerOnBenchObject) { console.error("Consistency error: Player key on bench but object not found."); return; }

          // Najdeme nejvíce unaveného AI hráče na ledě (ne brankáře)
          const tiredOnIcePlayer = [...team.onIce]
              .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
              .sort((a, b) => (team.fatigue[b.key] ?? 0) - (team.fatigue[a.key] ?? 0))[0];

          if (!tiredOnIcePlayer) {
              console.warn("❌ SUB WARN: No tired AI players on ice to swap with.");
              // Můžeme hráče jen přidat, pokud je místo? Prozatím ne.
              return; // Nelze provést výměnu
          }

           // Provedeme výměnu
          const newBench = team.bench.filter(p => p.key !== playerKey);
          newBench.push(tiredOnIcePlayer);
          const newOnIce = team.onIce.filter(p => p.key !== tiredOnIcePlayer.key);
          newOnIce.push(playerOnBenchObject); // Přidáme objekt hráče na led

           updateTeamState(teamColor, {
              onIce: newOnIce,
              bench: newBench,
              lastShiftChange: currentTime // Manuální střídání resetuje časovač
          });

          const subEvent = {
              time: currentTime, type: 'substitution', team: teamColor,
              description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️`,
              id: `${currentTime}-sub-${playerKey}-on`
          };
          setEvents(prev => [subEvent, ...prev]);
          // setLastEvent(subEvent);
          triggerHighlight([playerKey, tiredOnIcePlayer.key]);
          processedEventRef.current = null;
          console.log(`✅ Player ${playerName} substituted ON ice for ${tiredOnIcePlayer.surname}`);

      } else {
          console.error("❌ SUB ERROR: Player is neither on ice nor on bench.");
      }
  }, [gameTime, teams, playerName, triggerHighlight, updateTeamState, teamState, setEvents]);


   // --- handleExit ---
   const handleExit = useCallback(() => {
    if (gameState === 'finished') {
      if (onGameComplete) onGameComplete({ score, events, playerStats });
    } else {
      setShowExitConfirm(true);
      if (gameState === 'playing') setGameState('paused');
    }
  }, [gameState, score, events, playerStats, onGameComplete]);

  // --- handleConfirmExit ---
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    if (onGameComplete) onGameComplete({
      score,
      events,
      playerStats,
      abandoned: true // Indikátor předčasného ukončení
    });
  }, [score, events, playerStats, onGameComplete]);

  // --- handleCancelExit ---
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
    // Pokud byla hra pauznuta kvůli dialogu, můžeme ji chtít obnovit,
    // ale je bezpečnější nechat ji pauznutou a uživatel si ji musí znovu spustit.
  }, []);


  // --- Scroll event log --- (Beze změny)
   useEffect(() => { if (eventLogRef.current) eventLogRef.current.scrollTop = 0; }, [events]);

  // --- Render Helper: getEventIcon --- (Beze změny)
  const getEventIcon = (type) => {
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

  // --- Render Helper: PlayerStatus --- (Beze změny)
  const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey }) => {
     if (!player || !player.key) return <div className="flex items-center gap-2 p-2 rounded-lg bg-red-900/50 border border-red-700"><div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div><div className="text-xs text-red-300">Chyba: Data hráče</div></div>;
     const fatigue = Math.round(fatigueValue || 0);
     
     // DEBUG: Logování výchozí cesty k obrázkům pro detekci problému
     const debugImagePath = player.isPlayer ? '/Images/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
     console.log(`🖼️ DEBUG PLAYER IMAGE [${player.name} ${player.surname}]: Using path: ${debugImagePath}, isPlayer: ${player.isPlayer}`);
     
     const playerPhotoUrl = player.isPlayer ? '/Images/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
     // Použijeme přímo teamState místo setTeamState
     const isPlayerOnIce = teamState[teamColor]?.onIce?.some(p => p.key === playerKey) ?? false;

     // DEBUG: Funkce pro detekci, zda obrázek existuje
     const checkImageExists = (url) => {
       const img = new Image();
       img.onload = () => console.log(`✅ Image loaded successfully: ${url}`);
       img.onerror = () => console.error(`❌ Image failed to load: ${url}`);
       img.src = url;
     };
     
     // DEBUG: Zkusíme ověřit, jestli obrázek existuje
     React.useEffect(() => {
       if (playerPhotoUrl) {
         checkImageExists(playerPhotoUrl);
         // Pro každého hráče také zkontrolujeme existenci fallback obrázku
         if (player.isPlayer) {
           checkImageExists('/Images/default_player.png');
           // Otestujeme i alternativní cestu pro případ, že by to byl problém
           checkImageExists('/public/Images/default_player.png');
         }
       }
     }, [playerPhotoUrl, player.isPlayer]);

     return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border ${isPlayerOnIce ? 'bg-green-800/40 border-green-600/50 shadow-md' : 'bg-gray-800/40 border-gray-700/50'} ${highlightedPlayerKey?.[player.key] ? (teamColor === 'white' ? 'bg-white/20 scale-105 ring-2 ring-white' : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') : ''}`}>
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
              // Zkusíme i alternativní cestu, pokud by první selhala
              e.currentTarget.onerror = () => {
                console.error(`❌ Fallback image also failed. Trying alternative path.`);
                e.currentTarget.src = '/public/Images/default_player.png';
                // Pokud i tato selže, zabráníme nekonečné smyčce
                e.currentTarget.onerror = null;
              };
            }} 
          />
           {isPlayerOnIce && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" title="Na ledě"></div>}
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


  // --- Render Helper: TeamTable --- (Formátování času opraveno)
  const TeamTable = React.memo(({ teamData, teamColor }) => {
    const [selectedTeamColor, setSelectedTeamColor] = useState(teamColor);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
      setSelectedTeamColor(teamColor); // Aktualizujeme, pokud se změní prop
    }, [teamColor]);

    const currentTeam = teamData[selectedTeamColor];
    if (!currentTeam || !currentTeam.players) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Načítání...</div>;
    if (currentTeam.players.length === 0) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Žádní hráči.</div>;

    // OPRAVENO: Formátování času na ledě (MM:SS)
    const formatTimeOnIce = (totalSeconds) => {
        const seconds = Math.floor(totalSeconds || 0); // Zaokrouhlíme dolů
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          <button onClick={() => {setSelectedTeamColor('white'); setShowStats(false);}} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20')}>Bílí ({teamData.white.players?.length ?? 0})</button>
          <button onClick={() => {setSelectedTeamColor('black'); setShowStats(false);}} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50')}>Černí ({teamData.black.players?.length ?? 0})</button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-colors text-center ml-1',
              showStats ? 'bg-yellow-500 text-black shadow-md' : 'bg-gray-700 text-gray-200 hover:bg-gray-600')}
            // Zabráníme přepnutí na statistiky, pokud není vybrán žádný tým (nemělo by nastat)
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
                  // Použijeme aktuální playerStats
                  const stats = playerStats[player.key] || { timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0, shots: 0, saves: 0, savePercentage: 0, shotsAgainst: 0 };

                  return (
                    <tr key={player.key} className={`border-b border-gray-700/50 hover:bg-indigo-900/30 ${player.isPlayer ? 'font-bold text-cyan-300' : 'text-gray-200'}`}>
                      <td className="p-1 font-medium">
                        <div className="flex items-center">
                          <span className="truncate max-w-[90px]">
                            {player.surname} {player.isPlayer ? '' : ''} {/* Netřeba (Ty), je zvýrazněno jinak */}
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
              
              // DEBUG: Logování výchozí cesty k obrázkům pro detekci problému
              const debugImagePath = player.isPlayer ? '/Images/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
              console.log(`🖼️ DEBUG TEAM TABLE IMAGE [${player.name} ${player.surname}]: Using path: ${debugImagePath}, isPlayer: ${player.isPlayer}`);
              
              const playerPhotoUrl = player.isPlayer ? '/Images/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
              return (
                <div key={player.key} className={`p-2 text-sm ${index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'} hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0`}>
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
                        // Zkusíme i alternativní cestu, pokud by první selhala
                        e.currentTarget.onerror = () => {
                          console.error(`❌ TEAM TABLE: Fallback image also failed. Trying alternative path.`);
                          e.currentTarget.src = '/public/Images/default_player.png';
                          // Pokud i tato selže, zkusíme absolutní cestu
                          e.currentTarget.onerror = () => {
                            console.error(`❌ TEAM TABLE: All paths failed.`);
                            e.currentTarget.onerror = null; // Zamezíme nekonečné smyčce
                          };
                        };
                      }} 
                    />
                  </div>
                  <div className="flex-1 min-w-0"><div className={`truncate font-medium ${player.isPlayer ? 'text-cyan-300' : 'text-gray-200'}`}>{player.name} {player.surname} {player.isPlayer ? '(Ty)' : ''}</div><div className="text-xs text-indigo-300">{player.position}</div></div>
                  <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/30 rounded-md">L{player.level || 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  });
  TeamTable.displayName = 'TeamTable';


  // --- Main Render --- (Většinou beze změny, jen drobnosti)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={handleExit}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium",
              "bg-red-600/80 hover:bg-red-600 text-white",
               (gameState === 'finished') && "animate-pulse" // Pulzuje když je konec
            )}
            title={gameState === 'finished' ? "Zobrazit výsledky" : "Opustit zápas"}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">{gameState === 'finished' ? 'Výsledky' : 'Opustit zápas'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">Lancers Simulátor Zápasu</h2>
          <div className="w-20 sm:w-28 flex justify-end"> {/* Trochu širší pro status */}
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
                {/* Zde předáváme aktuální playerStats */}
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
              ) : (
                <div className='text-center flex flex-col items-center gap-2'>
                    <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                    {/* Tlačítko pro odchod je teď vlevo nahoře */}
                    {/* <button onClick={handleExit} className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"><TrophyIcon className="h-5 w-5"/> Zobrazit výsledky</button> */}
                </div>
              )}
            </div>
            {/* Manual Substitution Buttons */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                // Použijeme přímo stav teamState bez volání setTeamState
                const currentTeamState = teamState;
                const player = teams[teamColor]?.players.find(p => p.isPlayer);

                if (!player || !currentTeamState || !currentTeamState[teamColor]) return null; // Hráč nebo stav týmu neexistuje

                const playerKey = player.key;
                const isOnIce = currentTeamState[teamColor].onIce.some(p => p.key === playerKey);
                const fatigue = Math.round(currentTeamState[teamColor].fatigue[playerKey] ?? 0);

                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)}
                    // Povoleno i při pauze, aby hráč mohl střídat, než znovu spustí hru
                    disabled={gameState === 'finished' || (!isOnIce && currentTeamState[teamColor].onIce.filter(p => p.position !== 'brankář').length >= 5)} // Nelze naskočit, pokud je plno
                    className={clsx(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                      isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                      (gameState === 'finished' || (!isOnIce && currentTeamState[teamColor].onIce.filter(p => p.position !== 'brankář').length >= 5)) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={isOnIce ? `Jít střídat (únava: ${fatigue}%)` : (currentTeamState[teamColor].onIce.filter(p => p.position !== 'brankář').length >= 5 ? `Nelze naskočit (plno na ledě)` :`Naskočit na led (únava: ${fatigue}%)`)}
                  >
                    {isOnIce ? (
                        <> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Střídat <span className='hidden md:inline'>({fatigue}%)</span> </>
                    ) : (
                        <> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Na led <span className='hidden md:inline'>({fatigue}%)</span> </>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Player Status (Fatigue) */}
             <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                  {/* White Team Status */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">Bílý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                      {teams.white.players?.map(player => {
                          if (!player?.key) return null;
                          // Použijeme přímo teamState
                          const currentFatigue = teamState.white?.fatigue?.[player.key] ?? 0;
                          const isPlayerOnIce = teamState.white?.onIce?.some(p => p.key === player.key) ?? false;
                          return <PlayerStatus key={player.key} player={player} teamColor="white" fatigueValue={currentFatigue} isOnIce={isPlayerOnIce} playerKey={player.key}/>;
                       })}
                      {teams.white.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Prázdná.</p>}
                    </div>
                  </div>
                  {/* Black Team Status */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">Černý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                       {teams.black.players?.map(player => {
                          if (!player?.key) return null;
                          // Použijeme přímo teamState
                          const currentFatigue = teamState.black?.fatigue?.[player.key] ?? 0;
                          const isPlayerOnIce = teamState.black?.onIce?.some(p => p.key === player.key) ?? false;
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
              {/* Používáme PŮVODNÍ formát času */}
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
                    <div key={`${event.id || event.time + '-' + index}`} className="bg-black/30 p-1.5 sm:p-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      {/* Používáme PŮVODNÍ formát času pro zobrazení události */}
                      <span className="text-cyan-500 font-mono flex-shrink-0 w-20 sm:w-24 text-right">
                          {formatGameTime(event.time, PERIOD_DURATION_SECONDS).split('|')[1]?.trim() ?? "??:??:??"}
                      </span>
                      <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                      <span className="flex-grow text-gray-300">{event.description}</span>
                    </div>
                  ))}
                 {gameState === 'finished' && (<div className="mt-4 p-3 bg-gradient-to-r from-green-800/50 to-blue-800/50 rounded-lg text-center border border-green-600/50"><TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-1" /><p className="text-lg sm:text-xl font-bold text-white">KONEC ZÁPASU!</p><p className="text-base sm:text-lg text-gray-200">{teams.white.name} {score.white} - {score.black} {teams.black.name}</p></div>)}
               </div>
            </div>
          </div> {/* Konec pravého sloupce */}
        </div> {/* Konec hlavní obsahové oblasti */}

        {/* Special Action Dialog */}
        {specialAction && (
          <PlayerSpecialAction
            action={specialAction}
            onOptionSelect={handleSpecialActionResult}
          />
        )}

        {/* Potvrzovací dialog pro opuštění zápasu */}
        {showExitConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 max-w-md mx-auto border border-red-700 shadow-lg animate-fadeIn">
              <h3 className="text-xl text-center font-bold text-red-400 mb-3">Opravdu chceš opustit zápas?</h3>
              <p className="text-gray-300 mb-5 text-center">Aktuální stav zápasu nebude uložen a přijdeš o případné odměny.</p> {/* Upřesnění důsledků */}

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleCancelExit}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Zůstat
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Opustit zápas
                </button>
              </div>
            </div>
          </div>
        )}
      </div> {/* Konec hlavního kontejneru zápasu */}

      {/* Styles (Beze změny) */}
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); background-clip: padding-box; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); } .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; } `}</style>
    </div>
  );
};

export default OldaHockeyMatch;