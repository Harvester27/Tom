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

const SHIFT_DURATION = 45;
const FATIGUE_INCREASE_RATE = 2.5;
const RECOVERY_RATE = 1.5;
const MAX_FATIGUE = 100;
const FATIGUE_IMPACT_FACTOR = 0.0015; // Vliv únavy na šanci (0.15% / 1% rozdílu)

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
      // Použijeme timestamp a náhodný řetězec pro větší unikátnost nouzového klíče
      return `invalid-player-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  return `${player.name}-${player.surname}-${player.position}`;
}

const calculateAverageOnIceFatigue = (playersOnIce = [], fatigueState = {}) => {
    // Přidána kontrola existence klíče hráče pro robustnost
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
  // useCallback zajišťuje stabilní reference funkcí pro dependency arrays v useEffect
  const updateTeam = useCallback((teamColor, updates) => setTeams(prev => ({ ...prev, [teamColor]: { ...prev[teamColor], ...updates } })), []);
  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => {
        const newState = { ...prev };
        // Podpora funkční i objektové formy updates
        newState[teamColor] = typeof updates === 'function' ? updates(prev[teamColor]) : { ...prev[teamColor], ...updates };
        return newState;
    });
  }, []);
  return [teams, updateTeam, teamState, updateTeamState];
};

// --- Component ---
const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  // Základní stavy komponenty
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'paused', 'finished'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [highlightedPlayerKey, setHighlightedPlayerKey] = useState(null);
  const eventLogRef = useRef(null); // Pro scrollování logu
  const lastEventRef = useRef(null); // Pro případné scrollování k poslední události

  // Použití custom hooku pro správu týmů
  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Team Initialization Effect --- (S opravou rozdělení brankářů)
  useEffect(() => {
    console.log("🔄 Initializing teams...");
    // Načtení a příprava aktivních hráčů z dat
    const allActivePlayers = litvinovLancers.players
      .filter(p => p.attendance >= 75)
      .map(player => ({
        ...player,
        level: player.level || 1, // Default level 1
        key: getPlayerKey(player) // Unikátní klíč
      }));

    // Vytvoření objektu pro hráče (uživatele)
    const userPlayer = {
      name: playerName, surname: '(Ty)', position: 'útočník',
      level: playerLevel || 3, isPlayer: true,
      key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'})
    };

    // -- Rozdělení hráčů do týmů --
    let whitePlayers = [];
    let blackPlayers = [];
    let remainingPlayers = [...allActivePlayers]; // Začneme se všemi aktivními
    const assignedKeys = new Set(); // Sledujeme již přiřazené klíče

    // Pomocná funkce pro přiřazení hráče a aktualizaci remainingPlayers
    const assignPlayer = (player, team, keySet) => {
        if (!keySet.has(player.key)) { // Pouze pokud ještě není přiřazen
            team.push(player);
            keySet.add(player.key);
            remainingPlayers = remainingPlayers.filter(p => p.key !== player.key);
            return true;
        }
        return false;
    };

    // Krok 1: Přiřadíme hráče (uživatele) podle dresu
    if (assignedJerseys?.white?.has(playerName)) assignPlayer(userPlayer, whitePlayers, assignedKeys);
    else if (assignedJerseys?.black?.has(playerName)) assignPlayer(userPlayer, blackPlayers, assignedKeys);

    // Krok 2: Přiřadíme ostatní hráče podle dresů
    allActivePlayers.forEach(p => {
        if (assignedJerseys?.white?.has(`${p.name} ${p.surname}`)) assignPlayer(p, whitePlayers, assignedKeys);
        else if (assignedJerseys?.black?.has(`${p.name} ${p.surname}`)) assignPlayer(p, blackPlayers, assignedKeys);
    });

    // Krok 3: Pokud hráč (uživatel) stále není přiřazen, dáme ho do menšího týmu
    if (!assignedKeys.has(userPlayer.key)) {
        if (whitePlayers.length <= blackPlayers.length) assignPlayer(userPlayer, whitePlayers, assignedKeys);
        else assignPlayer(userPlayer, blackPlayers, assignedKeys);
    }

    // Krok 4: Rozdělíme zbývající hráče náhodně pro vyrovnání týmů
    const shuffledRemaining = [...remainingPlayers].sort(() => Math.random() - 0.5);
    shuffledRemaining.forEach(player => {
        if (whitePlayers.length <= blackPlayers.length) whitePlayers.push(player);
        else blackPlayers.push(player);
    });

    // -- OPRAVA: Kontrola a úprava brankářů --
    console.log("🔄 Goalie distribution check starting...");
    let goaliePool = []; // Dočasný seznam pro přebytečné brankáře

    // Projdeme oba týmy a identifikujeme brankáře
    [whitePlayers, blackPlayers].forEach((team, index) => {
        const teamName = index === 0 ? 'White' : 'Black';
        let goaliesInTeam = team.filter(p => p.position === 'brankář');
        console.log(`  Found ${goaliesInTeam.length} goalies in ${teamName} team (before adjustment):`, goaliesInTeam.map(g => g.name));

        // Pokud je v týmu více než jeden brankář
        if (goaliesInTeam.length > 1) {
            // Ponecháme jednoho (ideálně ne "Náhradníka", pokud je na výběr)
            let goalieToKeep = goaliesInTeam.find(g => g.name !== 'Náhradník' && g.surname !== 'Gólman') || goaliesInTeam[0];
            console.log(`  ${teamName} has >1 goalie. Keeping: ${goalieToKeep.name} (${goalieToKeep.key})`);
            // Ostatní brankáře z tohoto týmu přesuneme do poolu
            const extraGoalies = goaliesInTeam.filter(g => g.key !== goalieToKeep.key);
            goaliePool.push(...extraGoalies);
            // Odstraníme extra brankáře z původního týmového pole
            if (index === 0) whitePlayers = team.filter(p => !extraGoalies.some(eg => eg.key === p.key));
            else blackPlayers = team.filter(p => !extraGoalies.some(eg => eg.key === p.key));
            console.log(`  Moved ${extraGoalies.length} extra goalies from ${teamName} to pool.`);
        }
    });

    console.log("  Temporary goalie pool contains:", goaliePool.map(g => `${g.name} (${g.key})`));

    // -- Zajistíme, aby každý tým měl PŘESNĚ jednoho brankáře --
    const ensureSingleGoalie = (team, otherTeam, pool) => {
        const teamName = team === whitePlayers ? 'White' : 'Black'; // Pro logování
        let currentGoalie = team.find(p => p.position === 'brankář');

        if (!currentGoalie) { // Pokud tým nemá brankáře
            console.log(`  ${teamName} team needs a goalie.`);
            // 1. Zkusíme vzít z poolu
            let goalieFromPool = pool.shift(); // Vezme prvního z poolu a odstraní ho
            if (goalieFromPool) {
                console.log(`  Adding goalie from pool to ${teamName}: ${goalieFromPool.name} (${goalieFromPool.key})`);
                team.push(goalieFromPool);
                return; // Hotovo
            }
            // 2. Zkusíme najít volného aktivního brankáře
            const availableActiveGoalie = allActivePlayers.find(p =>
                p.position === 'brankář' &&
                !team.some(tp => tp.key === p.key) && // Není v tomto týmu
                !otherTeam.some(otp => otp.key === p.key) && // Není v druhém týmu
                !goaliePool.some(gp => gp.key === p.key) // Není ani v poolu (pro jistotu)
            );
            if (availableActiveGoalie) {
                 console.log(`  Adding available active goalie to ${teamName}: ${availableActiveGoalie.name} (${availableActiveGoalie.key})`);
                 team.push(availableActiveGoalie);
                 return; // Hotovo
            }
            // 3. Vytvoříme záložního brankáře
            console.log(`  No available goalie found for ${teamName}, creating backup...`);
            const backupGoalie = {
                name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75,
                key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})
            };
            // Zajistíme unikátnost klíče, kdyby náhodou...
            while (team.some(p => p.key === backupGoalie.key) || otherTeam.some(p => p.key === backupGoalie.key)) { backupGoalie.key += '_'; }
            team.push(backupGoalie);
            console.log(`  Added backup goalie to ${teamName}.`);
        } else {
             console.log(`  ${teamName} already has a goalie: ${currentGoalie.name} (${currentGoalie.key})`);
        }
    };

    // Zavoláme funkci pro oba týmy
    ensureSingleGoalie(whitePlayers, blackPlayers, goaliePool);
    ensureSingleGoalie(blackPlayers, whitePlayers, goaliePool); // Pořadí je důležité, aby si nekradli stejného z poolu

    // -- Seřazení hráčů podle pozice a finalizace --
    const sortPlayers = (players) => {
        const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
        return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };
    const finalWhitePlayers = sortPlayers(whitePlayers);
    const finalBlackPlayers = sortPlayers(blackPlayers);

    // Logování finálních brankářů pro kontrolu
    console.log("🥅 Final White Team Goalie(s):", finalWhitePlayers.filter(p => p.position === 'brankář').map(g => `${g.name} (${g.key})`));
    console.log("🥅 Final Black Team Goalie(s):", finalBlackPlayers.filter(p => p.position === 'brankář').map(g => `${g.name} (${g.key})`));

    // Aktualizace stavu základních dat týmů
    updateTeam('white', { name: 'Lancers Bílý', players: finalWhitePlayers });
    updateTeam('black', { name: 'Lancers Černý', players: finalBlackPlayers });

    // Inicializace dynamického stavu (onIce, bench, fatigue)
    const initializeDynamicState = (players) => {
       const onIce = players.slice(0, 6); // Prvních 6 hráčů (včetně brankáře) začíná na ledě
       const bench = players.slice(6);
       const fatigue = players.reduce((acc, player) => {
         if (player.key) { // Kontrola existence klíče
            acc[player.key] = 0; // Všichni začínají s 0 únavou
         } else {
             // Logování chyby, pokud hráč nemá klíč při inicializaci únavy
             console.error(`🔴 INIT FATIGUE ERR: Player ${player.name} ${player.surname} missing key! Cannot set initial fatigue.`);
         }
         return acc;
       }, {});
       return { onIce, bench, fatigue, lastShiftChange: 0 }; // lastShiftChange začíná na 0
    };
    // Nastavení dynamického stavu pro oba týmy
    updateTeamState('white', initializeDynamicState(finalWhitePlayers));
    updateTeamState('black', initializeDynamicState(finalBlackPlayers));

    console.log("✅ Teams initialized successfully. Game ready to start.");
    setGameState('paused'); // Hra je připravena, čeká na start

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]); // Závislosti zahrnují props ovlivňující inicializaci

  // --- Highlight Player Effect --- (Beze změny)
  const triggerHighlight = useCallback((playerKeys) => {
      if (!playerKeys) return;
      const keysArray = Array.isArray(playerKeys) ? playerKeys : [playerKeys];
      keysArray.forEach(key => {
          if (!key) return;
          // Nastavíme zvýraznění pro daný klíč
          setHighlightedPlayerKey(prev => ({ ...(prev ?? {}), [key]: true }));
          // Po 1.5 sekundách zvýraznění odstraníme
          setTimeout(() => {
              setHighlightedPlayerKey(prev => {
                   if (!prev) return null;
                   const newHighlights = { ...prev };
                   delete newHighlights[key];
                   return Object.keys(newHighlights).length > 0 ? newHighlights : null; // Vrátíme null, pokud je objekt prázdný
              });
          }, 1500);
      });
  }, []); // Prázdné pole = stabilní funkce

  // --- Game Simulation Effect (Time, Events) --- (Vliv únavy již zahrnut)
  useEffect(() => {
      if (gameState !== 'playing') return; // Efekt běží jen když hra běží

      const timerInterval = setInterval(() => {
          // Aktualizace herního času
          setGameTime(prevTime => {
              const newTime = prevTime + 1;

              // Kontrola konce hry
              if (newTime >= GAME_DURATION_SECONDS) {
                  setGameState('finished');
                  if (onGameComplete) onGameComplete({ score, events }); // Předání výsledků
                  clearInterval(timerInterval); // Zastavení intervalu
                  return GAME_DURATION_SECONDS; // Vrátíme konečný čas
              }

              // Kontrola změny periody
              const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
              if (newPeriod !== currentPeriod) {
                  setCurrentPeriod(newPeriod);
                  const periodChangeEvent = { type: 'period_change', time: newTime, description: `Začala ${newPeriod}. třetina!`, period: newPeriod };
                   setEvents(prev => [periodChangeEvent, ...prev]); // Nové události na začátek
                   setLastEvent(periodChangeEvent);
              }

              // --- Generování herních událostí ---
              if (newTime > 0 && newTime % EVENT_CHECK_INTERVAL === 0) {
                  // Získání aktuálních dat pro týmy a únavu
                  const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
                  const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';
                  const attackingTeamState = teamState[attackingTeamId];
                  const defendingTeamState = teamState[defendingTeamId];
                  // Zkontrolujeme, zda máme data pro oba týmy
                  if (!attackingTeamState?.onIce || !defendingTeamState?.onIce || !attackingTeamState.fatigue || !defendingTeamState.fatigue) {
                      console.warn("⚠️ Event Gen Skip: Missing team state data (onIce/fatigue).");
                      return newTime; // Přeskočíme generování, pokud data chybí
                  }
                  const attackingTeamOnIce = attackingTeamState.onIce;
                  const defendingTeamOnIce = defendingTeamState.onIce;
                  // Sloučíme únavu obou týmů pro snadnější přístup
                  const fatigueData = { ...teamState.white.fatigue, ...teamState.black.fatigue };

                  let newEvent = { time: newTime, team: attackingTeamId }; // Základ události

                  // Náhodná šance na faul
                  if (Math.random() < 0.08) {
                      // --- Logika Faulu ---
                      const possibleFoulers = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                       if (possibleFoulers.length > 0) {
                           const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                           newEvent.type = 'penalty';
                           newEvent.player = fouler;
                           newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává 2 minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}`;
                           triggerHighlight(fouler.key);
                       } else {
                            // Pokud není kdo by fauloval (např. jen brankář), přeskočíme událost
                            return newTime;
                       }
                  } else {
                      // --- Logika Útoku ---
                      // Výběr aktérů (útočník, obránce, brankář)
                      const attackersOnIce = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                      if (attackersOnIce.length === 0) return newTime; // Není kdo by útočil
                      const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];
                      const goalie = defendingTeamOnIce.find(p => p.position === 'brankář');
                      const defendersOnIce = defendingTeamOnIce.filter(p => p.position === 'obránce');
                      const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;

                      // Výpočet šance na gól (včetně levelů a únavy)
                      let goalChance = 0.25; // Základní šance
                      goalChance += (attacker.level || 1) * 0.04; // Bonus za level útočníka
                      if (attacker.isPlayer) goalChance += 0.10; // Bonus pro hráče
                      if (defender) goalChance -= (defender.level || 1) * 0.03; // Postih za level obránce
                      if (goalie) goalChance -= (goalie.level || 1) * 0.06; // Postih za level brankáře
                      // Vliv únavy
                      const attackingAvgFatigue = calculateAverageOnIceFatigue(attackingTeamOnIce, fatigueData);
                      const defendingAvgFatigue = calculateAverageOnIceFatigue(defendingTeamOnIce, fatigueData);
                      const fatigueDifference = defendingAvgFatigue - attackingAvgFatigue; // Kladný = útočník je čerstvější
                      goalChance += fatigueDifference * FATIGUE_IMPACT_FACTOR; // Aplikace faktoru únavy
                      // Omezení šance na rozumné meze
                      goalChance = Math.max(0.05, Math.min(0.85, goalChance));

                      // Určení výsledku akce na základě náhody a šance
                      const outcomeRoll = Math.random();
                      if (outcomeRoll < goalChance) {
                          // --- GÓL ---
                          setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                          const possibleAssists = attackingTeamOnIce.filter(p => p.key !== attacker.key && p.position !== 'brankář');
                          const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;
                          newEvent = { ...newEvent, type: 'goal', player: attacker, assistant: assistant, description: `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}` : ''}!` };
                          triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
                      } else if (outcomeRoll < goalChance + 0.35 || !goalie) {
                          // --- ZÁKROK / STŘELA VEDLE ---
                          if (goalie) { // Pokud je brankář, je to zákrok
                              newEvent = { ...newEvent, type: 'save', player: goalie, shooter: attacker, description: `🧤 Zákrok! ${goalie.name} ${goalie.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) chytá střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.` };
                              triggerHighlight([goalie.key, attacker.key].filter(Boolean));
                          } else { // Pokud není brankář, je to střela vedle
                              newEvent = { ...newEvent, type: 'miss', player: attacker, description: `💨 Střela vedle od ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}).` };
                              triggerHighlight(attacker.key);
                          }
                      } else if (defender) {
                          // --- BLOK OBRÁNCE ---
                          newEvent = { ...newEvent, type: 'defense', player: defender, attacker: attacker, description: `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!` };
                          triggerHighlight([defender.key, attacker.key].filter(Boolean));
                      } else {
                          // --- ZTRÁTA PUKU (fallback) ---
                          newEvent = { ...newEvent, type: 'turnover', player: attacker, description: `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.` };
                          // triggerHighlight(attacker.key); // Možná není třeba zvýrazňovat
                      }
                  }
                  // Aktualizace poslední události a přidání do seznamu
                  setLastEvent(newEvent);
                  setEvents(prev => [newEvent, ...prev]); // Přidáváme na začátek seznamu
              }
              // Vrátíme nový čas pro další iteraci intervalu
              return newTime;
          });
      }, 1000 / gameSpeed); // Interval závisí na rychlosti hry

      // Cleanup funkce - zastaví interval při změně stavu hry nebo odpojení komponenty
      return () => clearInterval(timerInterval);
  }, [gameState, gameSpeed, teams, score, currentPeriod, onGameComplete, triggerHighlight, teamState, updateTeamState]); // teamState je potřeba pro přístup k onIce a fatigue

   // --- Fatigue Update Effect --- (Beze změny)
   useEffect(() => {
       if (gameState !== 'playing') return;
       console.log("🚀 Starting fatigue update interval.");
       const fatigueInterval = setInterval(() => {
           // Aktualizace únavy pro oba týmy pomocí funkčního update
           updateTeamState('white', prevWhiteState => {
               if (!prevWhiteState?.fatigue || !prevWhiteState.onIce || !prevWhiteState.bench) return prevWhiteState;
               const newFatigue = { ...prevWhiteState.fatigue }; let fatigueChanged = false;
               prevWhiteState.onIce.forEach(player => { /* ... Zvýšení únavy ... */ });
               prevWhiteState.bench.forEach(player => { /* ... Snížení únavy ... */ });
               return fatigueChanged ? { ...prevWhiteState, fatigue: newFatigue } : prevWhiteState;
           });
           updateTeamState('black', prevBlackState => {
               if (!prevBlackState?.fatigue || !prevBlackState.onIce || !prevBlackState.bench) return prevBlackState;
               const newFatigue = { ...prevBlackState.fatigue }; let fatigueChanged = false;
               prevBlackState.onIce.forEach(player => { /* ... Zvýšení únavy ... */ });
               prevBlackState.bench.forEach(player => { /* ... Snížení únavy ... */ });
               return fatigueChanged ? { ...prevBlackState, fatigue: newFatigue } : prevBlackState;
           });
       }, 1000); // Každou sekundu reálného času
       // Cleanup
       return () => { console.log("🛑 Stopping fatigue update interval."); clearInterval(fatigueInterval); };
   }, [gameState, updateTeamState]); // Závislost jen na gameState a stabilní funkci

  // --- Automatic Substitution Effect --- (S opravou aktualizace lastShiftChange)
  useEffect(() => {
    if (gameState !== 'playing') return; // Běží jen když hra běží

    console.log("🚀 Starting automatic substitution interval.");
    const substitutionInterval = setInterval(() => {
        const currentTime = gameTime; // Aktuální herní čas

        // Projdeme oba týmy
        ['white', 'black'].forEach(teamColor => {
            // Použijeme funkční update pro práci s nejaktuálnějším stavem
            updateTeamState(teamColor, prevTeamState => {
                // Kontrola existence dat
                if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) {
                    console.error(`🔄 SUB ERR (${teamColor}): Missing team state data in interval.`);
                    return prevTeamState; // Vracíme původní stav, abychom předešli chybě
                }

                // Kontrola času od posledního střídání
                const timeSinceLastChange = currentTime - (prevTeamState.lastShiftChange || 0);
                if (timeSinceLastChange < SHIFT_DURATION) {
                    // Ještě není čas, nic neměníme
                    return prevTeamState;
                }

                // --- Logika výběru hráčů pro střídání ---
                // Hráči na ledě (AI, ne G) seřazení dle únavy (nejunavenější první)
                const tiredOnIce = prevTeamState.onIce
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer) // Filtrujeme AI hráče v poli
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0)); // Seřadíme

                // Hráči na lavičce (AI, ne G) seřazení dle odpočinku (nejodpočatější první)
                const restedOnBench = prevTeamState.bench
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer) // Filtrujeme AI hráče na lavičce
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100)); // Seřadíme

                // Kolik hráčů můžeme reálně vyměnit (omezeno počtem dostupných a max. 3)
                const numToChange = Math.min(tiredOnIce.length, restedOnBench.length, 3);

                // Logování kontroly střídání
                console.log(`🔄 CHECK SUB (${teamColor}): Time=${currentTime}, LastChange=${prevTeamState.lastShiftChange || 0}, Since=${timeSinceLastChange.toFixed(0)}s. Tired=${tiredOnIce.length}, Rested=${restedOnBench.length}, CanChange=${numToChange}`);

                // --- Provedení střídání ---
                if (numToChange > 0) { // Pouze pokud máme koho a kam střídat
                    // Vybereme hráče k výměně
                    const playersOut = tiredOnIce.slice(0, numToChange);
                    const playersOutKeys = new Set(playersOut.map(p => p.key));
                    const playersIn = restedOnBench.slice(0, numToChange);
                    const playersInKeys = new Set(playersIn.map(p => p.key));

                    // Sestavíme nová pole hráčů na ledě a na lavičce
                    const newOnIce = [
                        ...prevTeamState.onIce.filter(p => !playersOutKeys.has(p.key)), // Ponecháme ty, co nestřídají
                        ...playersIn // Přidáme nové z lavičky
                    ];
                    const newBench = [
                        ...prevTeamState.bench.filter(p => !playersInKeys.has(p.key)), // Ponecháme ty, co zůstali na lavičce
                        ...playersOut // Přidáme ty, co šli z ledu
                    ];

                    // Logování úspěšného střídání
                     const playersInNames = playersIn.map(p => p.surname).join(", ");
                     const playersOutNames = playersOut.map(p => p.surname).join(", ");
                     console.log(`✅ AUTO SUB EXECUTED (${teamColor}): ${playersInNames} IN <-> ${playersOutNames} OUT`);

                    // Vytvoření události pro log (volání setEvents mimo tento update)
                     const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}` };
                     // Plánování aktualizace událostí (může být mírně zpožděné)
                     setTimeout(() => setEvents(prev => [subEvent, ...prev]), 0);
                     // Zvýraznění hráčů
                     triggerHighlight([...playersInKeys, ...playersOutKeys]);

                    // Vrátíme NOVÝ stav s aktualizovanými sestavami a ČASEM POSLEDNÍHO STŘÍDÁNÍ
                    return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
                } else {
                    // Pokud nelze střídat (numToChange <= 0), NEAKTUALIZUJEME lastShiftChange!
                    // Jen vrátíme původní stav, aby se systém mohl pokusit znovu za 5 sekund.
                     console.log(`      SUB NO CHANGE (${teamColor}): Conditions not met or no players to swap.`);
                    return prevTeamState; // Beze změny stavu
                }
            });
        });
    }, 5000); // Kontrola každých 5 sekund reálného času

     // Cleanup intervalu
     return () => { console.log("🛑 Stopping automatic substitution interval."); clearInterval(substitutionInterval); };
  }, [gameState, gameTime, updateTeamState, triggerHighlight]); // Závislosti

   // --- Manuální střídání hráče --- (Beze změny v logice)
   const handlePlayerSubstitution = useCallback((teamColor) => {
       const currentTime = gameTime;
       updateTeamState(teamColor, prevTeamState => {
           // Kontroly existence dat...
           if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) return prevTeamState;
           const playerOnIce = prevTeamState.onIce.find(p => p.isPlayer);
           const playerOnBench = prevTeamState.bench.find(p => p.isPlayer);
           if (!playerOnIce && !playerOnBench) return prevTeamState; // Hráč není v týmu

           if (playerOnIce) { // --- Hráč jde z ledu ---
               // Najdeme nejodpočatějšího AI hráče na lavičce...
               const restedBenchPlayer = [...prevTeamState.bench].filter(p => p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100))[0];
               if (!restedBenchPlayer) return prevTeamState; // Není koho nasadit
               // Nové sestavy...
               const newOnIce = prevTeamState.onIce.filter(p => !p.isPlayer); newOnIce.push(restedBenchPlayer);
               const newBench = prevTeamState.bench.filter(p => p.key !== restedBenchPlayer.key); newBench.push(playerOnIce);
               // Událost a zvýraznění...
               const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️` };
               setEvents(prev => [subEvent, ...prev]);
               triggerHighlight([playerOnIce.key, restedBenchPlayer.key]);
               // Vrátíme nový stav s aktualizovaným časem střídání
               return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
           }

           if (playerOnBench) { // --- Hráč jde z lavičky ---
               // Najdeme nejunavenějšího AI hráče na ledě...
               const tiredOnIcePlayer = [...prevTeamState.onIce].filter(p => p.position !== 'brankář' && !p.isPlayer).sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0))[0];
               if (!tiredOnIcePlayer) return prevTeamState; // Není koho stáhnout
               // Nové sestavy...
               const newBench = prevTeamState.bench.filter(p => !p.isPlayer); newBench.push(tiredOnIcePlayer);
               const newOnIce = prevTeamState.onIce.filter(p => p.key !== tiredOnIcePlayer.key); newOnIce.push(playerOnBench);
               // Událost a zvýraznění...
               const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️` };
               setEvents(prev => [subEvent, ...prev]);
               triggerHighlight([playerOnBench.key, tiredOnIcePlayer.key]);
               // Vrátíme nový stav s aktualizovaným časem střídání
               return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
           }
           return prevTeamState; // Beze změny
       });
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [gameTime, updateTeamState, playerName, triggerHighlight]); // Závislosti

  // --- Event Handlers: Start/Pause, Změna rychlosti --- (Beze změny)
  const handleStartPause = () => {
      if (gameState === 'playing') setGameState('paused');
      else if (gameState === 'paused' || gameState === 'warmup') setGameState('playing');
  };
  const changeSpeed = (delta) => {
      setGameSpeed(prev => Math.max(1, Math.min(MAX_SPEED, prev + delta)));
  };

  // --- Efekt pro scrollování logu událostí --- (Beze změny)
   useEffect(() => {
       if (eventLogRef.current) {
           eventLogRef.current.scrollTop = 0; // Scroll na začátek při nové události
       }
   }, [events]);

  // --- Render Helper: Získání ikony události --- (Beze změny)
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

  // --- Render Helper: Komponenta pro zobrazení stavu hráče (únavy) --- (Beze změny)
  const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey }) => {
     // Kontrola platnosti dat hráče
     if (!player || !player.key) {
         return ( <div className="flex items-center gap-2 p-2 rounded-lg bg-red-900/50 border border-red-700"> <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div> <div className="text-xs text-red-300">Chyba: Neplatná data hráče</div> </div> );
     }
     const fatigue = Math.round(fatigueValue || 0); // Zaokrouhlená únava, default 0
     // Získání URL fotky nebo defaultní
     const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
     // Podmíněné třídy pro zvýraznění a stav na ledě/střídačce
     const highlightClass = highlightedPlayerKey?.[player.key] ? (teamColor === 'white' ? 'bg-white/20 scale-105 ring-2 ring-white' : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') : '';
     const onIceClass = isOnIce ? 'bg-green-800/40 border-green-600/50 shadow-md' : 'bg-gray-800/40 border-gray-700/50';

     return (
      <div className={clsx("flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border", onIceClass, highlightClass)}>
        {/* Obrázek hráče */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700 relative">
          <Image src={playerPhotoUrl} alt={`${player.name} ${player.surname}`} width={40} height={40} className="w-full h-full object-cover" unoptimized={true} onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }} />
           {/* Indikátor "Na ledě" */}
           {isOnIce && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" title="Na ledě"></div>}
        </div>
        {/* Informace o hráči */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-gray-100">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div>
          <div className="text-xs text-indigo-300">{player.position} - L{player.level || 1}</div>
        </div>
        {/* Ukazatel únavy */}
        <div className="w-20 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-1">{fatigue}%</div>
          <div className="h-2.5 bg-gray-600 rounded-full overflow-hidden relative">
            {/* Barevný pruh únavy */}
            <div className={clsx("absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full", fatigue > 80 ? 'bg-red-500' : fatigue > 50 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${fatigue}%` }} />
          </div>
        </div>
      </div>
     );
  });
  PlayerStatus.displayName = 'PlayerStatus'; // Pro React DevTools

  // --- Render Helper: Komponenta pro tabulku týmů --- (S opravou přepínání)
  const TeamTable = React.memo(({ teamData }) => {
    // Interní stav pro uchování vybraného týmu (výchozí je 'white')
    const [selectedTeamColor, setSelectedTeamColor] = useState('white');

    // Získáme data pro aktuálně vybraný tým
    const currentTeam = teamData[selectedTeamColor];

    // Kontrola, zda máme data pro oba týmy (pro zobrazení počtu hráčů v tlačítkách)
    if (!teamData.white?.players || !teamData.black?.players) {
        return <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg text-gray-500 p-4">Načítání soupisek...</div>;
    }
     // Kontrola existence dat pro aktuálně vybraný tým
     if (!currentTeam || !currentTeam.players) {
        // Může nastat krátce během inicializace
         return <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg text-gray-500 p-4">Načítání týmu {selectedTeamColor}...</div>;
     }

    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        {/* Přepínací tlačítka */}
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          {/* Tlačítko pro Bílý tým */}
          <button
            onClick={() => setSelectedTeamColor('white')} // Nastaví interní stav
            className={clsx(
                'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1',
                selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20' // Aktivní/neaktivní styl
            )}>
                Bílí ({teamData.white.players.length}) {/* Zobrazí počet hráčů */}
          </button>
          {/* Tlačítko pro Černý tým */}
          <button
            onClick={() => setSelectedTeamColor('black')} // Nastaví interní stav
            className={clsx(
                'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1',
                selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50' // Aktivní/neaktivní styl
            )}>
                Černí ({teamData.black.players.length}) {/* Zobrazí počet hráčů */}
          </button>
        </div>
        {/* Scrollvatelný seznam hráčů VYBRANÉHO týmu */}
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {/* Zobrazíme zprávu, pokud je tým prázdný */}
          {currentTeam.players.length === 0 && <p className="text-gray-500 text-center p-4 italic">Tým nemá žádné hráče.</p>}
          {/* Vykreslení jednotlivých hráčů */}
          {currentTeam.players.map((player, index) => {
             // Přeskočíme hráče bez klíče (nemělo by nastat)
             if (!player || !player.key) return null;
             // Získání fotky
             const playerPhotoUrl = player.isPlayer ? '/Images/players/default_player.png' : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);
             // Renderování řádku tabulky
             return (
                <div key={player.key} className={clsx(
                    "p-2 text-sm hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0",
                    index % 2 === 0 ? 'bg-black/30' : 'bg-black/20' // Střídání pozadí
                )}>
                  {/* Obrázek */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-600">
                    <Image src={playerPhotoUrl} alt={player.name} width={32} height={32} className="w-full h-full object-cover" unoptimized={true} onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }} />
                  </div>
                  {/* Jméno a pozice */}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-gray-200">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div>
                    <div className="text-xs text-indigo-300">{player.position}</div>
                  </div>
                  {/* Level */}
                  <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/30 rounded-md">L{player.level || 1}</span>
                </div>
             );
          })}
        </div>
      </div>
    );
  });
  TeamTable.displayName = 'TeamTable'; // Pro React DevTools


  // --- Hlavní Render komponenty ---
  return (
    // Vnější kontejner (pozadí, centrování)
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Hlavní panel zápasu */}
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Hlavička (Zpět, Název, Stav hry) */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          {/* Tlačítko Zpět */}
          <button
            onClick={onBack}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium",
                // Tlačítko je neaktivní, pokud hra běží
                gameState === 'playing' ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-red-600/80 hover:bg-red-600 text-white"
            )}
            disabled={gameState === 'playing'} // Zakázání tlačítka
            title={gameState === 'playing' ? "Nelze opustit během hry" : "Zpět do kabiny"}>
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span className="hidden sm:inline">Zpět</span>
          </button>
          {/* Název */}
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">
            Lancers Simulátor Zápasu
          </h2>
          {/* Indikátor stavu hry */}
          <div className="w-16 sm:w-24 flex justify-end">
            <span className={clsx(
                'text-xs sm:text-sm font-semibold px-2 py-1 rounded-md',
                gameState === 'playing' ? 'bg-green-600/70 text-green-100 animate-pulse' :
                gameState === 'paused' ? 'bg-yellow-600/70 text-yellow-100' :
                gameState === 'finished' ? 'bg-blue-600/70 text-blue-100' :
                'bg-gray-600/70 text-gray-200' // warmpup
            )}>
                {/* Zobrazí stav s velkým písmenem */}
                {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
            </span>
          </div>
        </div>

        {/* Hlavní obsahová oblast (rozložení sloupců) */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Levý sloupec (Týmy, Ovládání, Střídání, Stav hráčů) */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Tabulka týmů */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
                {/* Předáváme celý objekt `teams` */}
                <TeamTable teamData={teams} />
            </div>
            {/* Ovládání hry (Start/Pauza, Rychlost) */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? ( // Zobrazíme ovládání, pokud hra neskončila
                 <>
                   {/* Zpomalit */}
                   <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zpomalit"><BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   {/* Start/Pauza */}
                   <button onClick={handleStartPause} className="px-4 py-1.5 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
                     {gameState === 'playing' ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />} {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                   </button>
                   {/* Zrychlit */}
                   <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zrychlit"><ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" /></button>
                   {/* Ukazatel rychlosti */}
                   <div className="text-xs sm:text-sm text-gray-400 ml-2 sm:ml-4 whitespace-nowrap">Rychlost: {gameSpeed}x</div>
                 </>
              ) : ( // Zobrazíme info o konci hry
                <div className='text-center flex flex-col items-center gap-2'>
                    <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                    {/* Tlačítko pro návrat */}
                    <button onClick={onBack} className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"><TrophyIcon className="h-5 w-5"/> Výsledky a zpět</button>
                </div>
              )}
            </div>
            {/* Tlačítka manuálního střídání hráče */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => { // Pro oba týmy
                // Získáme data bezpečně
                const currentTeamState = teamState[teamColor];
                if (!currentTeamState?.onIce || !currentTeamState?.bench || !currentTeamState?.fatigue) return null;
                // Najdeme hráče (uživatele) v týmu
                const playerInTeam = [...currentTeamState.onIce, ...currentTeamState.bench].find(p => p.isPlayer);
                if (!playerInTeam || !playerInTeam.key) return null; // Pokud hráč není v týmu nebo nemá klíč, nezobrazíme tlačítko

                // Zjistíme stav hráče
                const isOnIce = currentTeamState.onIce.some(p => p.key === playerInTeam.key);
                const fatigue = currentTeamState.fatigue[playerInTeam.key] ?? 0; // Únava hráče

                // Vykreslíme tlačítko
                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)} // Handler pro střídání
                    disabled={gameState !== 'playing'} // Aktivní jen když hra běží
                    className={clsx(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                      // Styly podle toho, zda je hráč na ledě nebo ne
                      isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                      // Styl pro neaktivní tlačítko
                      gameState !== 'playing' && 'opacity-50 cursor-not-allowed'
                    )}
                    // Title pro tooltip
                    title={isOnIce ? `Jít střídat (únava: ${Math.round(fatigue)}%)` : `Naskočit na led (únava: ${Math.round(fatigue)}%)`}
                  >
                    {/* Text a ikona tlačítka */}
                    {isOnIce ? (
                        <> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> Střídat <span className='hidden md:inline'>({Math.round(fatigue)}%)</span> </>
                    ) : (
                        <> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> Na led <span className='hidden md:inline'>({Math.round(fatigue)}%)</span> </>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Zobrazení stavu hráčů (únava) */}
            <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
                 {/* Rozdělíme na dva sloupce */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                  {/* Stav hráčů Bílého týmu */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">Bílý tým - Stav</h3>
                    {/* Scrollvatelný seznam stavů hráčů */}
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                      {/* Mapujeme hráče a renderujeme PlayerStatus */}
                      {(teams.white.players || []).map(player => player.key ? <PlayerStatus key={player.key} player={player} teamColor="white" fatigueValue={teamState.white?.fatigue?.[player.key]} isOnIce={teamState.white?.onIce?.some(p => p.key === player.key)} playerKey={player.key}/> : null)}
                      {/* Zpráva pokud nejsou hráči */}
                      {teams.white.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Soupiska prázdná.</p>}
                    </div>
                  </div>
                  {/* Stav hráčů Černého týmu */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">Černý tým - Stav</h3>
                     <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                       {(teams.black.players || []).map(player => player.key ? <PlayerStatus key={player.key} player={player} teamColor="black" fatigueValue={teamState.black?.fatigue?.[player.key]} isOnIce={teamState.black?.onIce?.some(p => p.key === player.key)} playerKey={player.key}/> : null)}
                      {teams.black.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Soupiska prázdná.</p>}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Pravý sloupec (Skóre, Události) */}
          <div className="w-full xl:flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
            {/* Skóre a čas */}
            <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/60 to-purple-900/50 border border-indigo-700 rounded-lg p-3 sm:p-4 text-center flex-shrink-0 shadow-lg">
              {/* Řádek se jmény týmů a skóre */}
              <div className="flex justify-around items-center mb-2">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate px-2">{teams.white.name || 'Bílí'}</span>
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-cyan-300 tabular-nums tracking-tighter flex-shrink-0 mx-2">{score.white} : {score.black}</span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-300 truncate px-2">{teams.black.name || 'Černí'}</span>
              </div>
              {/* Herní čas */}
              <div className="text-lg sm:text-xl font-mono text-yellow-400 tracking-wider">{gameState === 'finished' ? 'Konec zápasu' : formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}</div>
            </div>
            {/* Poslední událost */}
             <div ref={lastEventRef} className="bg-black/40 border border-gray-700/80 rounded-lg p-3 h-16 sm:h-20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow">
               {/* Zobrazíme poslední událost nebo výchozí text */}
               {lastEvent ? (
                   <div className="animate-fadeIn flex items-center gap-2 sm:gap-3 text-center">
                       <div className="flex-shrink-0">{getEventIcon(lastEvent.type)}</div>
                       <p className="text-xs sm:text-sm md:text-base text-gray-200">{lastEvent.description}</p>
                   </div>
                ) : (
                    <p className="text-gray-500 italic text-sm sm:text-base">Očekává se úvodní buly...</p>
                )}
             </div>
            {/* Log událostí */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-2 sm:p-3 flex flex-col flex-grow overflow-hidden">
               <h3 className="text-base sm:text-lg font-semibold text-cyan-400 mb-2 flex-shrink-0 text-center border-b border-gray-600 pb-1.5">Průběh zápasu</h3>
               {/* Scrollvatelný kontejner pro události */}
               <div ref={eventLogRef} className="overflow-y-auto flex-grow space-y-1.5 sm:space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                {/* Zpráva, pokud nejsou žádné události */}
                {events.length === 0 && gameState !== 'finished' && (<p className="text-gray-500 text-center pt-4 italic text-sm">Zatím žádné události.</p>)}
                 {/* Mapování a zobrazení jednotlivých událostí */}
                 {events.map((event, index) => (
                     <div key={`${event.time}-${index}`} className="bg-black/30 p-1.5 sm:p-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                         {/* Čas události (jen čas v třetině) */}
                         <span className="text-cyan-500 font-mono flex-shrink-0 w-16 sm:w-20 text-right">
                           {formatGameTime(event.time, PERIOD_DURATION_SECONDS).split('|')[1].trim()}
                         </span>
                         {/* Ikona události */}
                         <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                         {/* Popis události */}
                         <span className="flex-grow text-gray-300">{event.description}</span>
                   </div>
                 ))}
                 {/* Zpráva o konci zápasu v logu */}
                 {gameState === 'finished' && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-800/50 to-blue-800/50 rounded-lg text-center border border-green-600/50">
                        <TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-1" />
                        <p className="text-lg sm:text-xl font-bold text-white">KONEC ZÁPASU!</p>
                        <p className="text-base sm:text-lg text-gray-200">{teams.white.name} {score.white} - {score.black} {teams.black.name}</p>
                    </div>
                 )}
               </div>
            </div>
          </div> {/* Konec pravého sloupce */}
        </div> {/* Konec hlavní obsahové oblasti */}
      </div> {/* Konec hlavního panelu zápasu */}

      {/* Globální styly pro scrollbar a animaci */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OldaHockeyMatch;