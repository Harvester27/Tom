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

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 15;
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 8;
const EVENT_CHECK_INTERVAL = 15;

const SHIFT_DURATION = 45; // AI střídá po 45s herního času (pokud je unavené)
const FATIGUE_INCREASE_RATE = 2.5; // Zvýšení únavy za sekundu na ledě
const RECOVERY_RATE = 1.5; // Snížení únavy za sekundu na lavičce
const MAX_FATIGUE = 100;
const FATIGUE_IMPACT_FACTOR = 0.0015; // Vliv rozdílu průměrné únavy na šanci gólu

// --- Helper Functions ---
const formatGameTime = (totalSeconds, periodDuration) => {
  const period = Math.min(3, Math.floor(totalSeconds / periodDuration) + 1);
  const timeInPeriod = totalSeconds % periodDuration;
  const minutes = Math.floor(timeInPeriod / 60);
  const seconds = timeInPeriod % 60;
  return `Třetina ${period} | ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getPlayerKey = (player) => {
  if (!player || !player.name || !player.surname || !player.position) {
      console.error("🔴 ERROR: Nelze generovat klíč, chybí data hráče:", player);
      return `invalid-player-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  return `${player.name}-${player.surname}-${player.position}`;
}

const calculateAverageOnIceFatigue = (playersOnIce = [], fatigueState = {}) => {
    const fieldPlayers = playersOnIce.filter(p => p && p.key && p.position !== 'brankář');
    if (fieldPlayers.length === 0) return 0;
    const totalFatigue = fieldPlayers.reduce((sum, player) => sum + (fatigueState[player.key] ?? 0), 0);
    return totalFatigue / fieldPlayers.length;
};

// Custom Hook pro správu stavu týmů
const useTeamState = (initialTeamsData) => {
  const [teams, setTeams] = useState(() => ({
    white: { name: initialTeamsData.white.name, players: [] },
    black: { name: initialTeamsData.black.name, players: [] }
  }));
  const [teamState, setTeamState] = useState(() => {
      const initializeSingleTeamState = () => ({ onIce: [], bench: [], fatigue: {}, lastShiftChange: 0 });
      return { white: initializeSingleTeamState(), black: initializeSingleTeamState() };
  });
  const updateTeam = useCallback((teamColor, updates) => setTeams(prev => ({ ...prev, [teamColor]: { ...prev[teamColor], ...updates } })), []);
  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => {
        const newState = { ...prev };
        newState[teamColor] = typeof updates === 'function' ? updates(prev[teamColor]) : { ...prev[teamColor], ...updates };
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
  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);

  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // Logování změny gameState pro kontrolu spouštění efektů
  useEffect(() => {
    console.log(`🔄 GameState changed to: ${gameState}`);
  }, [gameState]);

  // --- Team Initialization Effect --- (S opravou brankářů)
  useEffect(() => {
      console.log("🔄 Initializing teams...");
      // ... (logika načtení hráčů, přiřazení podle dresů, rozdělení zbylých) ...
       const allActivePlayers = litvinovLancers.players.filter(p => p.attendance >= 75).map(player => ({...player, level: player.level || 1, key: getPlayerKey(player) }));
       const userPlayer = { name: playerName, surname: '(Ty)', position: 'útočník', level: playerLevel || 3, isPlayer: true, key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'}) };
       let whitePlayers = []; let blackPlayers = []; let remainingPlayers = [...allActivePlayers]; const assignedKeys = new Set();
       const assignPlayer = (player, team, keySet) => { if (!keySet.has(player.key)) { team.push(player); keySet.add(player.key); remainingPlayers = remainingPlayers.filter(p => p.key !== player.key); return true; } return false; };
       if (assignedJerseys?.white?.has(playerName)) assignPlayer(userPlayer, whitePlayers, assignedKeys); else if (assignedJerseys?.black?.has(playerName)) assignPlayer(userPlayer, blackPlayers, assignedKeys);
       allActivePlayers.forEach(p => { if (assignedJerseys?.white?.has(`${p.name} ${p.surname}`)) assignPlayer(p, whitePlayers, assignedKeys); else if (assignedJerseys?.black?.has(`${p.name} ${p.surname}`)) assignPlayer(p, blackPlayers, assignedKeys); });
       if (!assignedKeys.has(userPlayer.key)) { if (whitePlayers.length <= blackPlayers.length) assignPlayer(userPlayer, whitePlayers, assignedKeys); else assignPlayer(userPlayer, blackPlayers, assignedKeys); }
       const shuffledRemaining = [...remainingPlayers].sort(() => Math.random() - 0.5);
       shuffledRemaining.forEach(player => { if (whitePlayers.length <= blackPlayers.length) whitePlayers.push(player); else blackPlayers.push(player); });

      // -- Oprava distribuce brankářů --
      console.log("🔄 Goalie distribution check starting...");
      let goaliePool = [];
      [whitePlayers, blackPlayers].forEach((team, index) => {
          const teamName = index === 0 ? 'White' : 'Black';
          let goaliesInTeam = team.filter(p => p.position === 'brankář');
          if (goaliesInTeam.length > 1) {
              let goalieToKeep = goaliesInTeam.find(g => g.name !== 'Náhradník' && g.surname !== 'Gólman') || goaliesInTeam[0];
              const extraGoalies = goaliesInTeam.filter(g => g.key !== goalieToKeep.key);
              goaliePool.push(...extraGoalies);
              if (index === 0) whitePlayers = team.filter(p => !extraGoalies.some(eg => eg.key === p.key));
              else blackPlayers = team.filter(p => !extraGoalies.some(eg => eg.key === p.key));
              console.log(`  Moved ${extraGoalies.length} extra goalies from ${teamName} to pool.`);
          }
      });
      console.log("  Temporary goalie pool contains:", goaliePool.map(g => `${g.name} (${g.key})`));
      const ensureSingleGoalie = (team, otherTeam, pool) => {
          const teamName = team === whitePlayers ? 'White' : 'Black';
          let currentGoalie = team.find(p => p.position === 'brankář');
          if (!currentGoalie) {
              console.log(`  ${teamName} team needs a goalie.`);
              let goalieFromPool = pool.shift();
              if (goalieFromPool) { console.log(`  Adding goalie from pool to ${teamName}: ${goalieFromPool.name}`); team.push(goalieFromPool); return; }
              const availableActiveGoalie = allActivePlayers.find(p => p.position === 'brankář' && !team.some(tp => tp.key === p.key) && !otherTeam.some(otp => otp.key === p.key) && !goaliePool.some(gp => gp.key === p.key));
              if (availableActiveGoalie) { console.log(`  Adding available active goalie to ${teamName}: ${availableActiveGoalie.name}`); team.push(availableActiveGoalie); return; }
              console.log(`  No available goalie found for ${teamName}, creating backup...`);
              const backupGoalie = { name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75, key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'}) };
              while (team.some(p => p.key === backupGoalie.key) || otherTeam.some(p => p.key === backupGoalie.key)) { backupGoalie.key += '_'; }
              team.push(backupGoalie); console.log(`  Added backup goalie to ${teamName}.`);
          } else { console.log(`  ${teamName} already has goalie: ${currentGoalie.name}`); }
      };
      ensureSingleGoalie(whitePlayers, blackPlayers, goaliePool);
      ensureSingleGoalie(blackPlayers, whitePlayers, goaliePool);

      // Seřazení a finalizace
      const sortPlayers = (players) => { const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 }; return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4)); };
      const finalWhitePlayers = sortPlayers(whitePlayers);
      const finalBlackPlayers = sortPlayers(blackPlayers);
      console.log("🥅 Final White Team Goalie(s):", finalWhitePlayers.filter(p => p.position === 'brankář').map(g => g.name));
      console.log("🥅 Final Black Team Goalie(s):", finalBlackPlayers.filter(p => p.position === 'brankář').map(g => g.name));

      // Aktualizace stavu
      updateTeam('white', { name: 'Lancers Bílý', players: finalWhitePlayers });
      updateTeam('black', { name: 'Lancers Černý', players: finalBlackPlayers });
      const initializeDynamicState = (players) => {
         const onIce = players.slice(0, 6); const bench = players.slice(6);
         const fatigue = players.reduce((acc, player) => { if (player.key) acc[player.key] = 0; else console.error(`🔴 INIT FATIGUE ERR: Player ${player.name} ${player.surname} missing key!`); return acc; }, {});
         return { onIce, bench, fatigue, lastShiftChange: 0 };
      };
      updateTeamState('white', initializeDynamicState(finalWhitePlayers));
      updateTeamState('black', initializeDynamicState(finalBlackPlayers));

      console.log("✅ Teams initialized successfully. Game ready to start.");
      setGameState('paused'); // Připraveno ke spuštění

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]);

  // --- Highlight Player Effect --- (Beze změny)
  const triggerHighlight = useCallback((playerKeys) => { /* ... (stejný kód) ... */ }, []);

  // --- Game Simulation Effect (Time, Events) --- (Vliv únavy již zahrnut)
  useEffect(() => {
      if (gameState !== 'playing') return;
      const timerInterval = setInterval(() => {
          setGameTime(prevTime => {
              const newTime = prevTime + 1;
              // Konec hry, změna periody... (stejný kód)
              if (newTime >= GAME_DURATION_SECONDS) { /* ... */ setGameState('finished'); clearInterval(timerInterval); return GAME_DURATION_SECONDS; }
              const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
              if (newPeriod !== currentPeriod) { /* ... */ setCurrentPeriod(newPeriod); /* ... */ }

              // Generování událostí
              if (newTime > 0 && newTime % EVENT_CHECK_INTERVAL === 0) {
                  // ... (logika výběru týmů, hráčů, faul/útok, šance na gól VČETNĚ VLIVU ÚNAVY) ...
                    const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
                    const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';
                    const attackingTeamState = teamState[attackingTeamId]; const defendingTeamState = teamState[defendingTeamId];
                    if (!attackingTeamState?.onIce || !defendingTeamState?.onIce || !attackingTeamState.fatigue || !defendingTeamState.fatigue) { console.warn("⚠️ Event Gen Skip: Missing team state data."); return newTime; }
                    const attackingTeamOnIce = attackingTeamState.onIce; const defendingTeamOnIce = defendingTeamState.onIce; const fatigueData = { ...teamState.white.fatigue, ...teamState.black.fatigue };
                    let newEvent = { time: newTime, team: attackingTeamId };
                    if (Math.random() < 0.08) { // Faul
                        const possibleFoulers = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                        if (possibleFoulers.length > 0) { const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)]; newEvent = { ...newEvent, type: 'penalty', player: fouler, description: `${fouler.name} ${fouler.surname} (...) dostává 2 minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}` }; triggerHighlight(fouler.key); }
                        else return newTime; // Není kdo by fauloval
                    } else { // Útok
                        const attackersOnIce = attackingTeamOnIce.filter(p => p.position !== 'brankář'); if (attackersOnIce.length === 0) return newTime; const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];
                        const goalie = defendingTeamOnIce.find(p => p.position === 'brankář'); const defendersOnIce = defendingTeamOnIce.filter(p => p.position === 'obránce'); const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;
                        let goalChance = 0.25; goalChance += (attacker.level || 1) * 0.04; if (attacker.isPlayer) goalChance += 0.10; if (defender) goalChance -= (defender.level || 1) * 0.03; if (goalie) goalChance -= (goalie.level || 1) * 0.06;
                        const attackingAvgFatigue = calculateAverageOnIceFatigue(attackingTeamOnIce, fatigueData); const defendingAvgFatigue = calculateAverageOnIceFatigue(defendingTeamOnIce, fatigueData); const fatigueDifference = defendingAvgFatigue - attackingAvgFatigue; goalChance += fatigueDifference * FATIGUE_IMPACT_FACTOR;
                        goalChance = Math.max(0.05, Math.min(0.85, goalChance));
                        const outcomeRoll = Math.random();
                        if (outcomeRoll < goalChance) { // Gól
                            setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 })); const possibleAssists = attackingTeamOnIce.filter(p => p.key !== attacker.key && p.position !== 'brankář'); const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null; newEvent = { ...newEvent, type: 'goal', player: attacker, assistant: assistant, description: `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} (...) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}` : ''}!` }; triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
                        } else if (outcomeRoll < goalChance + 0.35 || !goalie) { // Zákrok / Vedle
                            if (goalie) { newEvent = { ...newEvent, type: 'save', player: goalie, shooter: attacker, description: `🧤 Zákrok! ${goalie.name} ${goalie.surname} (...) chytá střelu ${attacker.name} ${attacker.surname}.` }; triggerHighlight([goalie.key, attacker.key].filter(Boolean)); }
                            else { newEvent = { ...newEvent, type: 'miss', player: attacker, description: `💨 Střela vedle od ${attacker.name} ${attacker.surname}.` }; triggerHighlight(attacker.key); }
                        } else if (defender) { // Blok
                            newEvent = { ...newEvent, type: 'defense', player: defender, attacker: attacker, description: `🛡️ Blok! ${defender.name} ${defender.surname} (...) zastavil střelu ${attacker.name} ${attacker.surname}!` }; triggerHighlight([defender.key, attacker.key].filter(Boolean));
                        } else { // Ztráta
                            newEvent = { ...newEvent, type: 'turnover', player: attacker, description: `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.` };
                        }
                    }
                  setLastEvent(newEvent);
                  setEvents(prev => [newEvent, ...prev]);
              }
              return newTime;
          });
      }, 1000 / gameSpeed);
      return () => clearInterval(timerInterval);
  }, [gameState, gameSpeed, teams, score, currentPeriod, onGameComplete, triggerHighlight, teamState, updateTeamState]);

   // --- Fatigue Update Effect --- (S PŘIDANÝMI LOGY)
   useEffect(() => {
       if (gameState !== 'playing') {
           // Pokud hra neběží, ale interval by mohl stále běžet (např. po pauze), zastavíme ho
           // Tento return by měl být dostačující, ale pro jistotu necháme log
           console.log(` Fatigue interval not starting/stopping because gameState is ${gameState}`);
           return;
       }

       console.log("🚀 Starting fatigue update interval.");
       const fatigueInterval = setInterval(() => {
           // Logujeme tick intervalu
           console.log(`💪 FATIGUE TICK @ gameTime ${gameTime}`);

           // Aktualizace pro oba týmy
           ['white', 'black'].forEach(teamColor => {
               updateTeamState(teamColor, prevTeamState => {
                   // Základní kontrola dat
                   if (!prevTeamState || !prevTeamState.fatigue || !prevTeamState.onIce || !prevTeamState.bench) {
                       console.error(`🔴 FATIGUE ERR (${teamColor}): Missing state data inside interval!`);
                       return prevTeamState; // Vrátíme původní stav
                   }

                   const newFatigue = { ...prevTeamState.fatigue }; // Kopie únavy
                   let fatigueChanged = false;

                   // Únava na ledě
                   prevTeamState.onIce.forEach(player => {
                       if (player && player.key) {
                           const oldFatigue = newFatigue[player.key] ?? 0; // Bezpečný přístup
                           const updatedFatigue = Math.min(MAX_FATIGUE, oldFatigue + FATIGUE_INCREASE_RATE);
                           if (oldFatigue !== updatedFatigue) {
                               newFatigue[player.key] = updatedFatigue;
                               fatigueChanged = true;
                               // Logování změny pro prvního hráče na ledě pro kontrolu
                               if (prevTeamState.onIce.indexOf(player) === 0) {
                                   console.log(`   Fatigue (${teamColor}, OnIce ${player.key.substring(0,5)}): ${oldFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
                               }
                           }
                       } else { console.warn(`   Fatigue Warn (${teamColor}, OnIce): Invalid player/key.`); }
                   });

                   // Regenerace na lavičce
                   prevTeamState.bench.forEach(player => {
                       if (player && player.key) {
                           const oldFatigue = newFatigue[player.key] ?? 0;
                           const updatedFatigue = Math.max(0, oldFatigue - RECOVERY_RATE);
                           if (oldFatigue !== updatedFatigue) {
                               newFatigue[player.key] = updatedFatigue;
                               fatigueChanged = true;
                                // Logování změny pro prvního hráče na lavičce pro kontrolu
                               if (prevTeamState.bench.indexOf(player) === 0) {
                                    console.log(`   Fatigue (${teamColor}, Bench ${player.key.substring(0,5)}): ${oldFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
                                }
                           }
                       } else { console.warn(`   Fatigue Warn (${teamColor}, Bench): Invalid player/key.`); }
                   });

                   // Vrátíme nový stav pouze pokud došlo ke změně
                   return fatigueChanged ? { ...prevTeamState, fatigue: newFatigue } : prevTeamState;
               });
           });

       }, 1000); // Každou sekundu reálného času

       // Cleanup funkce
       return () => {
           console.log(`🛑 Stopping fatigue update interval (gameState was ${gameState}).`);
           clearInterval(fatigueInterval);
       };
   // Závislost POUZE na gameState a stabilní update funkci
   }, [gameState, updateTeamState, gameTime]); // Přidán gameTime pro logování

  // --- Automatic Substitution Effect --- (S OPRAVOU a LOGY)
  useEffect(() => {
    if (gameState !== 'playing') {
        console.log(` Auto-sub interval not starting/stopping because gameState is ${gameState}`);
        return; // Běží jen když hra běží
    }

    console.log("🚀 Starting automatic substitution interval.");
    const substitutionInterval = setInterval(() => {
        const currentTime = gameTime; // Aktuální herní čas

        ['white', 'black'].forEach(teamColor => {
            updateTeamState(teamColor, prevTeamState => {
                if (!prevTeamState?.onIce || !prevTeamState?.bench || !prevTeamState?.fatigue) {
                    console.error(`🔄 SUB ERR (${teamColor}): Missing state data in interval!`);
                    return prevTeamState;
                }

                const lastChange = prevTeamState.lastShiftChange || 0; // Default na 0
                const timeSinceLastChange = currentTime - lastChange;

                // Logujeme základní informace PŘED kontrolou času
                console.log(`🔄 CHECK SUB (${teamColor}): Time=${currentTime}, LastChange=${lastChange}, Since=${timeSinceLastChange.toFixed(0)}s`);

                if (timeSinceLastChange < SHIFT_DURATION) {
                    // Ještě není čas, nic neděláme a NEMĚNÍME lastShiftChange
                     console.log(`      SUB SKIP (${teamColor}): Too soon.`);
                    return prevTeamState;
                }

                // Výběr hráčů k výměně (AI, ne G)
                const tiredOnIce = prevTeamState.onIce
                    .filter(p => p?.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));
                const restedOnBench = prevTeamState.bench
                    .filter(p => p?.key && p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100));

                // Logování únavy vybraných kandidátů
                if (tiredOnIce.length > 0) console.log(`      Tiredest On Ice (${teamColor}): ${tiredOnIce[0].name} (${(prevTeamState.fatigue[tiredOnIce[0].key]??0).toFixed(0)}%)`);
                if (restedOnBench.length > 0) console.log(`      Rested On Bench (${teamColor}): ${restedOnBench[0].name} (${(prevTeamState.fatigue[restedOnBench[0].key]??0).toFixed(0)}%)`);

                const numToChange = Math.min(tiredOnIce.length, restedOnBench.length, 3); // Max 3 hráči najednou
                console.log(`      Players available: Tired=${tiredOnIce.length}, Rested=${restedOnBench.length}. Can change=${numToChange}`);

                // Provedeme střídání POUZE pokud numToChange > 0
                if (numToChange > 0) {
                    const playersOut = tiredOnIce.slice(0, numToChange);
                    const playersOutKeys = new Set(playersOut.map(p => p.key));
                    const playersIn = restedOnBench.slice(0, numToChange);
                    const playersInKeys = new Set(playersIn.map(p => p.key));

                    const newOnIce = [...prevTeamState.onIce.filter(p => !playersOutKeys.has(p.key)), ...playersIn];
                    const newBench = [...prevTeamState.bench.filter(p => !playersInKeys.has(p.key)), ...playersOut];

                    const playersInNames = playersIn.map(p => p.surname).join(", ");
                    const playersOutNames = playersOut.map(p => p.surname).join(", ");
                    console.log(`✅ AUTO SUB EXECUTED (${teamColor}): ${playersInNames} IN <-> ${playersOutNames} OUT`);

                    // Událost a zvýraznění
                    const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}` };
                    setTimeout(() => setEvents(prev => [subEvent, ...prev]), 0); // Asynchronní update událostí
                    triggerHighlight([...playersInKeys, ...playersOutKeys]);

                    // !!! AKTUALIZUJEME lastShiftChange POUZE ZDE !!!
                    return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
                } else {
                    // Pokud nelze střídat, NEAKTUALIZUJEME lastShiftChange
                    console.log(`      SUB NO CHANGE (${teamColor}): Conditions not met or no players to swap.`);
                    return prevTeamState; // Vrátíme původní stav beze změny času střídání
                }
            });
        });
    }, 5000); // Kontrola každých 5 sekund

     // Cleanup intervalu
     return () => { console.log(`🛑 Stopping automatic substitution interval (gameState was ${gameState}).`); clearInterval(substitutionInterval); };
  // Přidán gameTime jako závislost, protože se používá pro currentTime
  }, [gameState, gameTime, updateTeamState, triggerHighlight]);

   // --- Manuální střídání hráče --- (Beze změny v logice)
   const handlePlayerSubstitution = useCallback((teamColor) => { /* ... (stejný kód) ... */ }, [gameTime, updateTeamState, playerName, triggerHighlight]);

  // --- Event Handlers: Start/Pause, Změna rychlosti --- (Beze změny)
  const handleStartPause = () => { /* ... */ };
  const changeSpeed = (delta) => { /* ... */ };

  // --- Efekt pro scrollování logu událostí --- (Beze změny)
   useEffect(() => { if (eventLogRef.current) eventLogRef.current.scrollTop = 0; }, [events]);

  // --- Render Helper: Získání ikony události --- (Beze změny)
  const getEventIcon = (type) => { /* ... */ };

  // --- Render Helper: Komponenta pro zobrazení stavu hráče (únavy) --- (Beze změny)
  const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey }) => { /* ... (stejný kód) ... */ });
  PlayerStatus.displayName = 'PlayerStatus';

  // --- Render Helper: Komponenta pro tabulku týmů --- (S opravou přepínání)
  const TeamTable = React.memo(({ teamData }) => {
    const [selectedTeamColor, setSelectedTeamColor] = useState('white'); // Výchozí
    const currentTeam = teamData[selectedTeamColor];
    // Kontroly dat...
    if (!teamData.white?.players || !teamData.black?.players) return <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg text-gray-500 p-4">Načítání soupisek...</div>;
    if (!currentTeam || !currentTeam.players) return <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg text-gray-500 p-4">Načítání týmu {selectedTeamColor}...</div>;

    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        {/* Přepínací tlačítka */}
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          <button onClick={() => setSelectedTeamColor('white')} className={clsx(/* ... */ selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20')}> Bílí ({teamData.white.players.length}) </button>
          <button onClick={() => setSelectedTeamColor('black')} className={clsx(/* ... */ selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50')}> Černí ({teamData.black.players.length}) </button>
        </div>
        {/* Seznam hráčů */}
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {currentTeam.players.length === 0 && <p className="text-gray-500 text-center p-4 italic">Tým nemá žádné hráče.</p>}
          {currentTeam.players.map((player, index) => {
             // Renderování řádku hráče ... (stejný kód)
             if (!player || !player.key) return null;
             const playerPhotoUrl = /* ... */;
             return ( <div key={player.key} className={clsx(/* ... */)}> {/* ... ikona, jméno, level ... */} </div> );
          })}
        </div>
      </div>
    );
  });
  TeamTable.displayName = 'TeamTable';


  // --- Hlavní Render komponenty --- (Používá opravené helpery a komponenty)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">
        {/* Hlavička */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
           {/* ... Tlačítko Zpět, Název, Stav Hry ... */}
            <button onClick={onBack} disabled={gameState === 'playing'} className={clsx(/* ... */)}> ... </button>
            <h2 className="text-xl ...">Lancers Simulátor Zápasu</h2>
            <div className="w-16 ..."><span className={clsx(/* ... */)}> {gameState.charAt(0).toUpperCase() + gameState.slice(1)} </span></div>
        </div>

        {/* Hlavní obsah */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">
          {/* Levý sloupec */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Tabulka týmů */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
                <TeamTable teamData={teams} /> {/* Použití opravené komponenty */}
            </div>
            {/* Ovládání hry */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
               {/* ... Tlačítka Start/Pauza, Rychlost / Info o konci ... */}
                {gameState !== 'finished' ? (<> ... </>) : (<> ... </>)}
            </div>
            {/* Tlačítka manuálního střídání */}
            <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                  // ... (logika pro zobrazení tlačítka a únavy - stejná) ...
                  const currentTeamState = teamState[teamColor]; if (!currentTeamState?.onIce) return null; const playerInTeam = /*...*/; if (!playerInTeam) return null; const isOnIce = /*...*/; const fatigue = /*...*/;
                  return ( <button key={teamColor} onClick={() => handlePlayerSubstitution(teamColor)} disabled={gameState !== 'playing'} className={clsx(/* ... */)}> {/* ... Ikona a text s únavou ... */} </button> );
              })}
            </div>
            {/* Stav hráčů (únava) */}
            <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                    {/* Stav Bílý tým */}
                    <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                        <h3 className="text-base ...">Bílý tým - Stav</h3>
                        <div className="space-y-1.5 ..."> {(teams.white.players || []).map(player => player.key ? <PlayerStatus key={player.key} /* ... */ /> : null)} {/* ... Zpráva pokud prázdný ... */} </div>
                    </div>
                    {/* Stav Černý tým */}
                    <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                        <h3 className="text-base ...">Černý tým - Stav</h3>
                        <div className="space-y-1.5 ..."> {(teams.black.players || []).map(player => player.key ? <PlayerStatus key={player.key} /* ... */ /> : null)} {/* ... Zpráva pokud prázdný ... */} </div>
                    </div>
                 </div>
            </div>
          </div>

          {/* Pravý sloupec */}
          <div className="w-full xl:flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
            {/* Skóre a čas */}
            <div className="bg-gradient-to-r ..."> {/* ... Skóre a čas ... */} </div>
            {/* Poslední událost */}
            <div ref={lastEventRef} className="bg-black/40 ..."> {/* ... Poslední událost nebo text ... */} </div>
            {/* Log událostí */}
            <div className="bg-gray-800/60 ...">
               <h3 className="text-base ...">Průběh zápasu</h3>
               <div ref={eventLogRef} className="overflow-y-auto ..."> {/* ... Mapování událostí a zpráva o konci ... */} </div>
            </div>
          </div>
        </div>
      </div>
      {/* Styly */}
      <style jsx global>{` /* ... Styly pro scrollbar a animaci ... */ `}</style>
    </div>
  );
};

export default OldaHockeyMatch;