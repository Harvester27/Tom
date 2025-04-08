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
const GAME_DURATION_SECONDS = 60 * 90; // 90 minut (od 16:30 do 18:00)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 64; // Změněno z 8 na 64 pro podporu vyšších rychlostí
const EVENT_CHECK_INTERVAL = 15; // V sekundách herního času

// Konstanty pro střídání a únavu
const SHIFT_DURATION = 60; // Délka střídání v sekundách herního času
const BASE_FATIGUE_INCREASE_RATE = 1.25; // Sníženo na polovinu (původně 2.5)
const BASE_RECOVERY_RATE = 1.5; // Základní regenerace na střídačce (bez zrychlení) - ponecháno
const MAX_FATIGUE = 100;
// const FATIGUE_PERFORMANCE_IMPACT = 0.5; // Původní konstanta, nahrazena FATIGUE_IMPACT_FACTOR
// NOVÉ: Faktor vlivu únavy na šanci na gól (0.001 = 0.1% změna šance za 1% rozdílu průměrné únavy)
const FATIGUE_IMPACT_FACTOR = 0.0015; // 0.15% změna za 1% rozdílu únavy

// Nové konstanty pro speciální akce
const SPECIAL_ACTION_CHANCE = 0.1; // 10% šance na speciální akci v každém intervalu kontroly
const SPECIAL_ACTION_INTERVAL = 30; // Interval kontroly pro speciální akce (v sekundách herního času)
const MIN_TIME_BETWEEN_ACTIONS = 120; // Minimální čas mezi speciálními akcemi (v sekundách)

// --- Helper Functions ---
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

// NOVÉ: Funkce pro výpočet průměrné únavy hráčů v poli na ledě
const calculateAverageOnIceFatigue = (playersOnIce = [], fatigueState = {}) => {
    const fieldPlayers = playersOnIce.filter(p => p && p.position !== 'brankář');
    if (fieldPlayers.length === 0) {
        return 0; // Není kdo, průměrná únava 0
    }
    const totalFatigue = fieldPlayers.reduce((sum, player) => {
        return sum + (fatigueState[player.key] ?? 0); // Sečteme únavu, default 0 pokud chybí
    }, 0);
    return totalFatigue / fieldPlayers.length;
};


// Optimalizovaný hook pro správu stavu týmů a jejich interního stavu (onIce, bench, fatigue)
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
  }, []);

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
  
  // Nové stavy pro statistiky
  const [playerStats, setPlayerStats] = useState({});
  
  // Nové stavy pro speciální akce
  const [specialAction, setSpecialAction] = useState(null);
  const [lastSpecialActionTime, setLastSpecialActionTime] = useState(0);
  
  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);

  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Team Initialization Effect ---
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
      initialStats[player.key] = {
        timeOnIce: 0,
        goals: 0,
        assists: 0,
        penalties: 0,
        blocks: 0,
        shots: 0,
        saves: 0, // pro brankáře
        savePercentage: 100, // pro brankáře
        shotsAgainst: 0 // pro brankáře
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

    const timerInterval = setInterval(() => {
      setGameTime(prevTime => {
        const newTime = prevTime + 1;

        if (newTime >= GAME_DURATION_SECONDS) {
          setGameState('finished');
          if (onGameComplete) onGameComplete({ score, events });
          clearInterval(timerInterval);
          return GAME_DURATION_SECONDS;
        }

        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        if (newPeriod !== currentPeriod) {
          setCurrentPeriod(newPeriod);
          const periodChangeEvent = { type: 'period_change', time: newTime, description: `Začala ${newPeriod}. třetina!`, period: newPeriod };
           setEvents(prev => [periodChangeEvent, ...prev]);
           setLastEvent(periodChangeEvent);
        }

        // --- Event Generation Logic ---
        if (newTime > 0 && newTime % EVENT_CHECK_INTERVAL === 0) {
            const currentWhiteTeam = teams.white;
            const currentBlackTeam = teams.black;
            if (!currentWhiteTeam?.players?.length || !currentBlackTeam?.players?.length) return newTime;

            const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
            const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';

            // Použijeme aktuální teamState pro hráče na ledě a únavu
            const attackingTeamState = teamState[attackingTeamId];
            const defendingTeamState = teamState[defendingTeamId];
            const attackingTeamOnIce = attackingTeamState?.onIce ?? [];
            const defendingTeamOnIce = defendingTeamState?.onIce ?? [];
            const fatigueData = { ...teamState.white.fatigue, ...teamState.black.fatigue }; // Sloučená únava pro snazší přístup

            if (attackingTeamOnIce.length === 0 || defendingTeamOnIce.length === 0) {
                console.warn("Event Gen Skip: Empty team on ice.");
                return newTime; // Přeskočíme, pokud je některý tým prázdný na ledě
            }

            // --- Faul ---
            const eventRoll = Math.random();
            let eventType = 'attack';
            if (eventRoll < 0.08) eventType = 'penalty';

            let newEvent = { time: newTime, team: attackingTeamId };

            if (eventType === 'penalty') {
                const possibleFoulers = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                 if (possibleFoulers.length === 0) return newTime;
                 const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                 newEvent.type = 'penalty';
                 newEvent.player = fouler;
                 newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává 2 minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}`;
                 triggerHighlight(fouler.key);
            } else {
                 // --- Útok ---
                 const attackersOnIce = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                 if (attackersOnIce.length === 0) return newTime;
                 const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];

                 const goalie = defendingTeamOnIce.find(p => p.position === 'brankář');
                 const defendersOnIce = defendingTeamOnIce.filter(p => p.position === 'obránce');
                 const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;

                 // --- Výpočet šance na gól ---
                 let goalChance = 0.25; // Základ
                 goalChance += (attacker.level || 1) * 0.04; // Skill útočníka
                 if (attacker.isPlayer) goalChance += 0.10; // Bonus pro hráče
                 if (defender) goalChance -= (defender.level || 1) * 0.03; // Skill obránce
                 if (goalie) goalChance -= (goalie.level || 1) * 0.06; // Skill brankáře

                 // --- NOVÉ: Vliv únavy ---
                 const attackingAvgFatigue = calculateAverageOnIceFatigue(attackingTeamOnIce, fatigueData);
                 const defendingAvgFatigue = calculateAverageOnIceFatigue(defendingTeamOnIce, fatigueData);
                 // Rozdíl: Kladná hodnota = útočník je méně unavený než obrana
                 const fatigueDifference = defendingAvgFatigue - attackingAvgFatigue;
                 // Aplikujeme faktor únavy na šanci
                 const fatigueBonus = fatigueDifference * FATIGUE_IMPACT_FACTOR;
                 goalChance += fatigueBonus;
                 // console.log(`Fatigue Impact: AttF=${attackingAvgFatigue.toFixed(1)} DefF=${defendingAvgFatigue.toFixed(1)} Diff=${fatigueDifference.toFixed(1)} Bonus=${fatigueBonus.toFixed(3)}`);

                 // Omezení šance
                 goalChance = Math.max(0.05, Math.min(0.85, goalChance));

                 // --- Výsledek akce ---
                 const outcomeRoll = Math.random();
                 if (outcomeRoll < goalChance) { // GÓL
                     setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                     const possibleAssists = attackingTeamOnIce.filter(p => p.key !== attacker.key && p.position !== 'brankář');
                     const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;
                     newEvent.type = 'goal';
                     newEvent.player = attacker;
                     newEvent.assistant = assistant;
                     newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}` : ''}!`;
                     triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
                 } else if (outcomeRoll < goalChance + 0.35 || !goalie) { // ZÁKROK / VEDLE
                     if (goalie) {
                         newEvent.type = 'save';
                         newEvent.player = goalie; newEvent.shooter = attacker;
                         newEvent.description = `🧤 Zákrok! ${goalie.name} ${goalie.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) chytá střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.`;
                         triggerHighlight([goalie.key, attacker.key].filter(Boolean));
                     } else {
                         newEvent.type = 'miss'; newEvent.player = attacker;
                         newEvent.description = `💨 Střela vedle od ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}).`;
                         triggerHighlight(attacker.key);
                     }
                 } else if (defender) { // BLOK
                     newEvent.type = 'defense'; newEvent.player = defender; newEvent.attacker = attacker;
                     newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                     triggerHighlight([defender.key, attacker.key].filter(Boolean));
                 } else { // ZTRÁTA PUKU
                      newEvent.type = 'turnover'; newEvent.player = attacker;
                      newEvent.description = `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.`;
                 }
            }
            setLastEvent(newEvent);
            setEvents(prev => [newEvent, ...prev]);
        }
        
        // --- Kontrola střídání podle herního času ---
        // Zkontrolujeme, jestli je potřeba střídat na základě herního času
        ['white', 'black'].forEach(teamColor => {
            updateTeamState(teamColor, prevTeamState => {
                if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) {
                    return prevTeamState;
                }

                // Časová kontrola - herní čas místo reálného
                const timeSinceLastChange = newTime - prevTeamState.lastShiftChange;
                
                // Střídání podle herního času nebo když je někdo unavený
                const tiredOnIce = prevTeamState.onIce
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));
                
                // Má někdo z hráčů na ledě únavu nad 80%?
                const hasHighlyTiredPlayer = tiredOnIce.length > 0 && (prevTeamState.fatigue[tiredOnIce[0].key] ?? 0) > 80;
                
                // Střídat když uplynul čas nebo když má někdo vysokou únavu
                if (timeSinceLastChange < SHIFT_DURATION && !hasHighlyTiredPlayer) {
                    return prevTeamState;
                }

                // Hráči na lavičce (AI, ne G) seřazení dle odpočinku
                const restedOnBench = prevTeamState.bench
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100));

                // Kolik hráčů můžeme reálně vyměnit (max 3 najednou)
                const numToChange = Math.min(
                    tiredOnIce.length, 
                    restedOnBench.length, 
                    hasHighlyTiredPlayer ? Math.max(1, Math.min(3, tiredOnIce.length)) : 3
                );

                console.log(`🔄 CHECK SUB (${teamColor}): GameTime=${newTime}, LastChange=${prevTeamState.lastShiftChange}, Tired=${tiredOnIce.length}, Rested=${restedOnBench.length}, NumToChange=${numToChange}, HasHighlyTired=${hasHighlyTiredPlayer}`);

                if (numToChange <= 0) {
                    console.log(`🔄 SUB NO CHANGE (${teamColor}): No valid players to swap.`);
                    return { ...prevTeamState, lastShiftChange: newTime };
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
                console.log(`✅ AUTO SUB EXECUTED (${teamColor}): ${playersInNames} IN <-> ${playersOutNames} OUT`);
                const subEvent = {
                    time: newTime, type: 'substitution', team: teamColor,
                    description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}`
                };
                setEvents(prev => [subEvent, ...prev]);
                triggerHighlight([...playersInKeys, ...playersOutKeys]);

                // Vrátíme nový stav
                return {
                    ...prevTeamState,
                    onIce: newOnIce,
                    bench: newBench,
                    lastShiftChange: newTime
                };
            });
        });
        
        // --- Kontrola speciálních akcí pro hráče ---
        if (newTime > 0 && newTime % SPECIAL_ACTION_INTERVAL === 0 && newTime - lastSpecialActionTime >= MIN_TIME_BETWEEN_ACTIONS) {
          const playerTeamColor = findPlayerTeamColor();
          
          if (playerTeamColor && Math.random() < SPECIAL_ACTION_CHANCE) {
            // Hráč musí být na ledě pro speciální akci
            const playerOnIce = isPlayerOnIce(playerTeamColor);
            
            if (playerOnIce) {
              generateSpecialAction(playerTeamColor, newTime);
              setLastSpecialActionTime(newTime);
              // Pozastavíme hru, když se objeví speciální akce
              setGameState('paused');
            }
          }
        }
        
        return newTime;
      });
    }, 1000 / gameSpeed);

    return () => clearInterval(timerInterval);
  }, [gameState, gameSpeed, teams, score, currentPeriod, onGameComplete, triggerHighlight, teamState, updateTeamState, lastSpecialActionTime]); // Přidáno lastSpecialActionTime

  // Pomocná funkce pro zjištění, ve kterém týmu je hráč
  const findPlayerTeamColor = useCallback(() => {
    if (teams.white.players?.some(p => p.isPlayer)) return 'white';
    if (teams.black.players?.some(p => p.isPlayer)) return 'black';
    return null;
  }, [teams]);
  
  // Pomocná funkce pro kontrolu, zda je hráč na ledě
  const isPlayerOnIce = useCallback((teamColor) => {
    if (!teamColor || !teamState[teamColor]?.onIce) return false;
    return teamState[teamColor].onIce.some(p => p.isPlayer);
  }, [teamState]);
  
  // Generování speciální akce
  const generateSpecialAction = useCallback((playerTeamColor, currentTime) => {
    const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';
    
    // Získáme hráče a jeho data
    const player = teamState[playerTeamColor].onIce.find(p => p.isPlayer);
    const playerFatigue = teamState[playerTeamColor].fatigue[player.key] || 0;
    
    // Získáme nejblíže stojící protihráče
    const opposingGoalie = teamState[opposingTeamColor].onIce.find(p => p.position === 'brankář');
    const opposingDefenders = teamState[opposingTeamColor].onIce.filter(p => p.position === 'obránce');
    const opposingDefender = opposingDefenders.length > 0 
      ? opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)]
      : null;
    
    // Získáme spoluhráče
    const teammates = teamState[playerTeamColor].onIce.filter(p => p.position !== 'brankář' && !p.isPlayer);
    const teammate = teammates.length > 0 
      ? teammates[Math.floor(Math.random() * teammates.length)]
      : null;
    
    // Typy speciálních akcí
    const actionTypes = [
      {
        type: 'shot_opportunity',
        description: 'Máš šanci na přímou střelu!',
        options: [
          { id: 'shoot', text: 'Vystřelit', difficulty: 'medium' },
          { id: 'pass', text: 'Přihrát spoluhráči', difficulty: 'easy' },
          { id: 'deke', text: 'Kličkovat a zkusit obejít', difficulty: 'hard' }
        ]
      },
      {
        type: 'one_on_one',
        description: 'Jsi sám před brankářem!',
        options: [
          { id: 'shoot_high', text: 'Vystřelit nahoru', difficulty: 'medium' },
          { id: 'shoot_low', text: 'Vystřelit dolů', difficulty: 'medium' },
          { id: 'deke', text: 'Kličkovat brankáři', difficulty: 'hard' }
        ]
      },
      {
        type: 'defensive_challenge',
        description: 'Protihráč se blíží k bráně a ty ho můžeš zastavit!',
        options: [
          { id: 'stick_check', text: 'Zkusit hokejkou vypíchnout puk', difficulty: 'medium' },
          { id: 'body_check', text: 'Zkusit bodyček', difficulty: 'hard' },
          { id: 'position', text: 'Zaujmout dobrou pozici', difficulty: 'easy' }
        ]
      },
      {
        type: 'rebound_opportunity',
        description: 'Puk se odrazil od brankáře!',
        options: [
          { id: 'quick_shot', text: 'Rychlá dorážka', difficulty: 'hard' },
          { id: 'control', text: 'Zkontrolovat puk', difficulty: 'medium' },
          { id: 'pass', text: 'Přihrát lépe postavenému', difficulty: 'easy' }
        ]
      }
    ];
    
    // Výběr náhodné akce
    const selectedAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    
    // Vytvoření kompletní speciální akce
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
        score,
        period: currentPeriod,
        timeRemaining: GAME_DURATION_SECONDS - currentTime
      }
    };
    
    setSpecialAction(fullAction);
    
  }, [teamState, score, currentPeriod]);
  
  // Zpracování výsledku speciální akce
  const handleSpecialActionResult = useCallback((option) => {
    if (!specialAction) return;
    
    // Vyhodnocení úspěšnosti akce
    const player = specialAction.player;
    const playerLevel = player.level || 1;
    const playerFatigue = specialAction.playerFatigue;
    const fatigueImpact = playerFatigue / 100; // 0-1, vyšší hodnota znamená negativní dopad
    
    // Základní pravděpodobnost úspěchu podle obtížnosti
    let successChance;
    switch (option.difficulty) {
      case 'easy': successChance = 0.8; break;
      case 'medium': successChance = 0.6; break;
      case 'hard': successChance = 0.4; break;
      default: successChance = 0.5;
    }
    
    // Úprava šance podle úrovně hráče (každá úroveň +5%)
    successChance += (playerLevel - 1) * 0.05;
    
    // Úprava šance podle únavy (při 100% únavě -30%)
    successChance -= fatigueImpact * 0.3;
    
    // Zajistíme, že šance je v rozmezí 10-90%
    successChance = Math.max(0.1, Math.min(0.9, successChance));
    
    // Určení výsledku
    const isSuccess = Math.random() < successChance;
    
    // Vytvoření zprávy o výsledku
    let resultMessage, eventDescription, eventType;
    const teamName = specialAction.playerTeamColor === 'white' ? 'Bílí' : 'Černí';
    
    if (isSuccess) {
      // Zpracování úspěchu podle typu akce a zvolené možnosti
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          if (option.id.includes('shoot') || option.id === 'quick_shot' || option.id === 'deke') {
            // Šance na gól při úspěšné střelbě
            const goalChance = option.id === 'deke' ? 0.7 : 0.5;
            const isGoal = Math.random() < goalChance;
            
            if (isGoal) {
              // Gól!
              resultMessage = `Výborně! Tvoje akce skončila gólem!`;
              eventDescription = `🚨 GÓÓÓL! ${player.name} ${player.surname} (Ty!) (${teamName}) skóruje po speciální akci!`;
              eventType = 'goal';
              // Přidáme skóre
              setScore(prev => ({ 
                ...prev, 
                [specialAction.playerTeamColor]: prev[specialAction.playerTeamColor] + 1 
              }));
            } else {
              resultMessage = `Dobrá střela, ale brankář ji chytil.`;
              eventDescription = `🧤 Zákrok! ${specialAction.opposingGoalie.name} ${specialAction.opposingGoalie.surname} chytá tvoji střelu po speciální akci.`;
              eventType = 'save';
            }
          } else if (option.id === 'pass') {
            resultMessage = `Tvoje přihrávka byla přesná.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) přesně přihrává na ${specialAction.teammate.name} ${specialAction.teammate.surname} po speciální akci.`;
            eventType = 'pass';
          } else {
            resultMessage = `Akce se podařila!`;
            eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`;
            eventType = 'success';
          }
          break;
        case 'defensive_challenge':
          resultMessage = `Úspěšně jsi zastavil útok soupeře!`;
          eventDescription = `🛡️ Dobrá obrana! ${player.name} ${player.surname} (Ty!) (${teamName}) zastavil útok soupeře po speciální akci.`;
          eventType = 'defense';
          break;
        default:
          resultMessage = `Akce byla úspěšná!`;
          eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`;
          eventType = 'success';
      }
    } else {
      // Neúspěch
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          resultMessage = `Bohužel, akce se nepovedla podle plánu.`;
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí.`;
          eventType = 'miss';
          break;
        case 'defensive_challenge':
          // Při neúspěšné obraně může být šance na gól soupeře
          const opponentGoalChance = option.id === 'body_check' ? 0.4 : 0.2;
          const isOpponentGoal = Math.random() < opponentGoalChance;
          
          if (isOpponentGoal) {
            resultMessage = `Nepodařilo se ti zastavit útok a soupeř skóroval!`;
            eventDescription = `🚨 Gól soupeře! ${player.name} ${player.surname} (Ty!) nedokázal zastavit útok a soupeř skóroval.`;
            eventType = 'goal';
            // Přidáme skóre soupeři
            const opposingTeamColor = specialAction.playerTeamColor === 'white' ? 'black' : 'white';
            setScore(prev => ({ 
              ...prev, 
              [opposingTeamColor]: prev[opposingTeamColor] + 1 
            }));
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
    
    // Přidáme událost
    const newEvent = {
      type: eventType,
      time: specialAction.time,
      player: specialAction.player,
      team: specialAction.playerTeamColor,
      description: eventDescription
    };
    
    setEvents(prev => [newEvent, ...prev]);
    setLastEvent(newEvent);
    
    // Zvýrazníme hráče
    triggerHighlight(specialAction.player.key);
    
    // Vytvoříme výsledek akce a vrátíme ho
    const actionResult = {
      success: isSuccess,
      message: resultMessage,
      eventType
    };
    
    // Zavřeme speciální akci
    setTimeout(() => {
      setSpecialAction(null);
      // Pokračujeme ve hře
      setGameState('playing');
    }, 2000);
    
    return actionResult;
  }, [specialAction, triggerHighlight]);

  // --- Event Handlers --- (Beze změny)
  const handleStartPause = () => {
    if (gameState === 'playing') setGameState('paused');
    else if (gameState === 'paused' || gameState === 'warmup') setGameState('playing');
  };
  
  // Upravená funkce pro změnu rychlosti - přidána podpora pro rychlejší přepínání
  const changeSpeed = (delta) => {
    setGameSpeed(prev => {
      // Pro kladný delta (zrychlení)
      if (delta > 0) {
        if (prev < 8) return prev + 1; // Standardní zvýšení o 1 pro rychlosti 1-8
        else if (prev === 8) return 16; // Skok z 8 na 16
        else if (prev === 16) return 32; // Skok z 16 na 32
        else if (prev === 32) return 64; // Skok z 32 na 64
        else return 64; // Max
      }
      // Pro záporný delta (zpomalení)
      else {
        if (prev > 32) return 32; // Z 64 na 32
        else if (prev > 16) return 16; // Z 32 na 16
        else if (prev > 8) return 8; // Z 16 na 8
        else return Math.max(1, prev - 1); // Standardní snížení pro 1-8
      }
    });
  };

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
     const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
     return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border ${isOnIce ? 'bg-green-800/40 border-green-600/50 shadow-md' : 'bg-gray-800/40 border-gray-700/50'} ${highlightedPlayerKey?.[player.key] ? (teamColor === 'white' ? 'bg-white/20 scale-105 ring-2 ring-white' : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') : ''}`}>
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

  // --- Render Helper: TeamTable --- (Updated with stats)
  const TeamTable = React.memo(({ teamData, teamColor }) => {
    const [selectedTeamColor, setSelectedTeamColor] = useState(teamColor);
    const [showStats, setShowStats] = useState(false);
    
    // Přidáme useEffect, který aktualizuje selectedTeamColor když se změní teamColor
    useEffect(() => {
      setSelectedTeamColor(teamColor);
    }, [teamColor]);

    const currentTeam = teamData[selectedTeamColor];
    if (!currentTeam || !currentTeam.players) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Načítání...</div>;
    if (currentTeam.players.length === 0) return <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">Žádní hráči.</div>;
    
    // Formátování času
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          <button onClick={() => setSelectedTeamColor('white')} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20')}>Bílí ({teamData.white.players?.length ?? 0})</button>
          <button onClick={() => setSelectedTeamColor('black')} className={clsx('px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1', selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50')}>Černí ({teamData.black.players?.length ?? 0})</button>
          <button 
            onClick={() => setShowStats(!showStats)} 
            className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-colors text-center ml-1', 
              showStats ? 'bg-yellow-500 text-black shadow-md' : 'bg-gray-700 text-gray-200 hover:bg-gray-600')}
          >
            {showStats ? 'Info' : 'Statistiky'}
          </button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {showStats ? (
            // Zobrazení statistik
            <table className="w-full text-xs">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="p-1 text-left">Hráč</th>
                  <th className="p-1 text-center">Čas</th>
                  <th className="p-1 text-center">G</th>
                  <th className="p-1 text-center">A</th>
                  <th className="p-1 text-center">TM</th>
                  <th className="p-1 text-center" title="Bloky/Zásahy">{/* Bloky nebo zásahy */}B/Z</th>
                  <th className="p-1 text-center" title="Střely/Úspěšnost">{/* Střely nebo úspěšnost */}S/Ú</th>
                </tr>
              </thead>
              <tbody>
                {currentTeam.players.map((player) => {
                  if (!player || !player.key) return null;
                  const isGoalie = player.position === 'brankář';
                  const stats = playerStats[player.key] || {
                    timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0, shots: 0,
                    saves: 0, savePercentage: 100, shotsAgainst: 0
                  };
                  
                  return (
                    <tr key={player.key} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-1 font-medium">
                        <div className="flex items-center">
                          <span className="truncate max-w-[90px]">
                            {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-1 text-center text-gray-400">{formatTime(stats.timeOnIce)}</td>
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
              const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
              return (
                <div key={player.key} className={`p-2 text-sm ${index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'} hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-600"><Image src={playerPhotoUrl} alt={player.name} width={32} height={32} className="w-full h-full object-cover" unoptimized={true} onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }} /></div>
                  <div className="flex-1 min-w-0"><div className="truncate font-medium text-gray-200">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div><div className="text-xs text-indigo-300">{player.position}</div></div>
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

  // --- Fatigue Update Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    console.log("🚀 Starting fatigue update interval.");
    const fatigueInterval = setInterval(() => {
      // Upravíme rychlost únavy podle rychlosti hry
      const fatigueIncreaseRate = BASE_FATIGUE_INCREASE_RATE * gameSpeed;
      const recoveryRate = BASE_RECOVERY_RATE * gameSpeed;
      
      updateTeamState('white', prevWhiteState => {
        if (!prevWhiteState?.fatigue || !prevWhiteState.onIce || !prevWhiteState.bench) return prevWhiteState;
        const newFatigue = { ...prevWhiteState.fatigue }; let fatigueChanged = false;
        prevWhiteState.onIce.forEach(player => {
          if (player?.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + fatigueIncreaseRate);
            if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = updatedFatigue; fatigueChanged = true; }
          }
        });
        prevWhiteState.bench.forEach(player => {
          if (player?.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.max(0, currentFatigue - recoveryRate);
             if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = updatedFatigue; fatigueChanged = true; }
          }
        });
        return fatigueChanged ? { ...prevWhiteState, fatigue: newFatigue } : prevWhiteState;
      });
      updateTeamState('black', prevBlackState => {
         if (!prevBlackState?.fatigue || !prevBlackState.onIce || !prevBlackState.bench) return prevBlackState;
        const newFatigue = { ...prevBlackState.fatigue }; let fatigueChanged = false;
        prevBlackState.onIce.forEach(player => {
           if (player?.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + fatigueIncreaseRate);
            if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = updatedFatigue; fatigueChanged = true; }
           }
        });
        prevBlackState.bench.forEach(player => {
           if (player?.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.max(0, currentFatigue - recoveryRate);
            if (newFatigue[player.key] !== updatedFatigue) { newFatigue[player.key] = updatedFatigue; fatigueChanged = true; }
           }
        });
        return fatigueChanged ? { ...prevBlackState, fatigue: newFatigue } : prevBlackState;
      });
    }, 1000);
    return () => { console.log("🛑 Stopping fatigue update interval."); clearInterval(fatigueInterval); };
  }, [gameState, updateTeamState, gameSpeed]); // Přidána závislost na gameSpeed

  // Aktualizace statistik při událostech
  useEffect(() => {
    if (!lastEvent || !lastEvent.type) return;
    
    setPlayerStats(prevStats => {
      const newStats = { ...prevStats };
      
      // Aktualizace statistik podle typu události
      switch (lastEvent.type) {
        case 'goal':
          if (lastEvent.player && lastEvent.player.key) {
            newStats[lastEvent.player.key] = {
              ...newStats[lastEvent.player.key],
              goals: (newStats[lastEvent.player.key]?.goals || 0) + 1,
              shots: (newStats[lastEvent.player.key]?.shots || 0) + 1
            };
          }
          if (lastEvent.assistant && lastEvent.assistant.key) {
            newStats[lastEvent.assistant.key] = {
              ...newStats[lastEvent.assistant.key],
              assists: (newStats[lastEvent.assistant.key]?.assists || 0) + 1
            };
          }
          if (lastEvent.team) {
            // Aktualizovat brankáře soupeře
            const defTeam = lastEvent.team === 'white' ? 'black' : 'white';
            const goalie = teamState[defTeam]?.onIce?.find(p => p.position === 'brankář');
            if (goalie && goalie.key) {
              const currentShotsAgainst = (newStats[goalie.key]?.shotsAgainst || 0) + 1;
              const currentSaves = newStats[goalie.key]?.saves || 0;
              const savePercentage = currentShotsAgainst > 0 
                ? Math.round((currentSaves / currentShotsAgainst) * 100) 
                : 100;
              
              newStats[goalie.key] = {
                ...newStats[goalie.key],
                shotsAgainst: currentShotsAgainst,
                savePercentage
              };
            }
          }
          break;
          
        case 'save':
          if (lastEvent.player && lastEvent.player.key) { // Brankář
            const currentShotsAgainst = (newStats[lastEvent.player.key]?.shotsAgainst || 0) + 1;
            const currentSaves = (newStats[lastEvent.player.key]?.saves || 0) + 1;
            const savePercentage = currentShotsAgainst > 0 
              ? Math.round((currentSaves / currentShotsAgainst) * 100) 
              : 100;
            
            newStats[lastEvent.player.key] = {
              ...newStats[lastEvent.player.key],
              saves: currentSaves,
              shotsAgainst: currentShotsAgainst,
              savePercentage
            };
          }
          if (lastEvent.shooter && lastEvent.shooter.key) { // Střelec
            newStats[lastEvent.shooter.key] = {
              ...newStats[lastEvent.shooter.key],
              shots: (newStats[lastEvent.shooter.key]?.shots || 0) + 1
            };
          }
          break;
          
        case 'miss':
          if (lastEvent.player && lastEvent.player.key) {
            newStats[lastEvent.player.key] = {
              ...newStats[lastEvent.player.key],
              shots: (newStats[lastEvent.player.key]?.shots || 0) + 1
            };
          }
          break;
          
        case 'defense':
          if (lastEvent.player && lastEvent.player.key) { // Obránce
            newStats[lastEvent.player.key] = {
              ...newStats[lastEvent.player.key],
              blocks: (newStats[lastEvent.player.key]?.blocks || 0) + 1
            };
          }
          if (lastEvent.attacker && lastEvent.attacker.key) { // Útočník
            newStats[lastEvent.attacker.key] = {
              ...newStats[lastEvent.attacker.key],
              shots: (newStats[lastEvent.attacker.key]?.shots || 0) + 1
            };
          }
          break;
          
        case 'penalty':
          if (lastEvent.player && lastEvent.player.key) {
            newStats[lastEvent.player.key] = {
              ...newStats[lastEvent.player.key],
              penalties: (newStats[lastEvent.player.key]?.penalties || 0) + 1
            };
          }
          break;
          
        default:
          break;
      }
      
      return newStats;
    });
    
  }, [lastEvent, teamState]);

  // Aktualizace času na ledě
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const timeUpdateInterval = setInterval(() => {
      setPlayerStats(prevStats => {
        const newStats = { ...prevStats };
        
        // Aktualizujeme čas na ledě pro hráče, kteří jsou aktuálně na ledě
        ['white', 'black'].forEach(teamColor => {
          const playersOnIce = teamState[teamColor]?.onIce || [];
          playersOnIce.forEach(player => {
            if (player && player.key) {
              newStats[player.key] = {
                ...newStats[player.key],
                timeOnIce: (newStats[player.key]?.timeOnIce || 0) + 1
              };
            }
          });
        });
        
        return newStats;
      });
    }, 1000);
    
    return () => clearInterval(timeUpdateInterval);
  }, [gameState, teamState]);

  // --- Main Render ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button onClick={onBack} className={clsx("flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium", gameState === 'playing' ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-red-600/80 hover:bg-red-600 text-white")} disabled={gameState === 'playing'} title={gameState === 'playing' ? "Nelze opustit během hry" : "Zpět do kabiny"}>
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span className="hidden sm:inline">Zpět</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">Lancers Simulátor Zápasu</h2>
          <div className="w-16 sm:w-24 flex justify-end">
            <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-md ${ gameState === 'playing' ? 'bg-green-600/70 text-green-100 animate-pulse' : gameState === 'paused' ? 'bg-yellow-600/70 text-yellow-100' : gameState === 'finished' ? 'bg-blue-600/70 text-blue-100' : 'bg-gray-600/70 text-gray-200' }`}>
                {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Left Column */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Team Table */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
                <TeamTable teamData={teams} teamColor="white" />
            </div>
            {/* Game Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? (
                 <>
                   <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zpomalit"><BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   <button onClick={handleStartPause} className="px-4 py-1.5 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
                     {gameState === 'playing' ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />} {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                   </button>
                   <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zrychlit"><ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   <div className={`text-xs sm:text-sm ${gameSpeed > 8 ? 'text-yellow-400 font-bold' : 'text-gray-400'} ml-2 sm:ml-4 whitespace-nowrap`}>Rychlost: {gameSpeed}x</div>
                 </>
              ) : (
                <div className='text-center flex flex-col items-center gap-2'>
                    <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                    <button onClick={onBack} className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"><TrophyIcon className="h-5 w-5"/> Výsledky a zpět</button>
                </div>
              )}
            </div>
            {/* Manual Substitution Buttons */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                const currentTeamState = teamState[teamColor];
                if (!currentTeamState || !currentTeamState.onIce || !currentTeamState.bench || !currentTeamState.fatigue) return null;
                const playerInTeam = [...currentTeamState.onIce, ...currentTeamState.bench].find(p => p.isPlayer);
                if (!playerInTeam) return null;

                const isOnIce = currentTeamState.onIce.some(p => p.key === playerInTeam.key);
                const fatigue = currentTeamState.fatigue[playerInTeam.key] ?? 0;

                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)}
                    disabled={gameState !== 'playing'}
                    className={clsx(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                      isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                      gameState !== 'playing' && 'opacity-50 cursor-not-allowed'
                    )}
                    // UPRAVENO: Změna title a textu, když je hráč na lavičce
                    title={isOnIce ? `Jít střídat (únava: ${Math.round(fatigue)}%)` : `Naskočit na led (únava: ${Math.round(fatigue)}%)`}
                  >
                    {isOnIce ? (
                        <> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Střídat <span className='hidden md:inline'>({Math.round(fatigue)}%)</span> </>
                    ) : (
                        // UPRAVENO: Zobrazení únavy i pro tlačítko "Na led"
                        <> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Na led <span className='hidden md:inline'>({Math.round(fatigue)}%)</span> </>
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
                      {(teams.white.players || []).map(player => player.key ? <PlayerStatus key={player.key} player={player} teamColor="white" fatigueValue={teamState.white?.fatigue?.[player.key]} isOnIce={teamState.white?.onIce?.some(p => p.key === player.key)} playerKey={player.key}/> : null)}
                      {teams.white.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Prázdná.</p>}
                    </div>
                  </div>
                  {/* Black Team Status */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">Černý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                       {(teams.black.players || []).map(player => player.key ? <PlayerStatus key={player.key} player={player} teamColor="black" fatigueValue={teamState.black?.fatigue?.[player.key]} isOnIce={teamState.black?.onIce?.some(p => p.key === player.key)} playerKey={player.key}/> : null)}
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
              <div className="text-lg sm:text-xl font-mono text-yellow-400 tracking-wider">{gameState === 'finished' ? 'Konec zápasu' : formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}</div>
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
                 {events.map((event, index) => (<div key={`${event.time}-${index}`} className="bg-black/30 p-1.5 sm:p-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><span className="text-cyan-500 font-mono flex-shrink-0 w-16 sm:w-20 text-right">{formatGameTime(event.time, PERIOD_DURATION_SECONDS).split('|')[1].trim()}</span><span className="flex-shrink-0">{getEventIcon(event.type)}</span><span className="flex-grow text-gray-300">{event.description}</span></div>))}
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
      </div> {/* Konec hlavního kontejneru zápasu */}

      {/* Styles (Beze změny) */}
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); background-clip: padding-box; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); } .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } `}</style>
    </div>
  );
};

export default OldaHockeyMatch;