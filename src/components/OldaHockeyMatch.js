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
const GAME_DURATION_SECONDS = 60 * 15; // 15 minut pro demo
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 8;
const EVENT_CHECK_INTERVAL = 15; // V sekundách herního času

// Konstanty pro střídání a únavu
const SHIFT_DURATION = 45; // Délka střídání v sekundách (pro AI)
const FATIGUE_INCREASE_RATE = 2.5; // Rychlejší únava na ledě
const RECOVERY_RATE = 1.5; // Rychlejší regenerace na střídačce
const MAX_FATIGUE = 100;
const FATIGUE_PERFORMANCE_IMPACT = 0.5; // Jak moc únava ovlivňuje výkon (zatím nepoužito v logice eventů)

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
      console.error("🔴 ERROR: Nelze vygenerovat klíč, chybí data hráče:", player);
      // Vytvoříme nouzový unikátní klíč
      return `invalid-player-${Math.random().toString(36).substring(7)}`;
  }
  return `${player.name}-${player.surname}-${player.position}`;
}

// Optimalizovaný hook pro správu stavu týmů a jejich interního stavu (onIce, bench, fatigue)
const useTeamState = (initialTeamsData) => {
  // Stav pro základní data týmů (jméno, seznam hráčů)
  const [teams, setTeams] = useState(() => ({
    white: { name: initialTeamsData.white.name, players: [] },
    black: { name: initialTeamsData.black.name, players: [] }
  }));

  // Stav pro dynamické údaje týmů (kdo je na ledě, na lavičce, únava)
  const [teamState, setTeamState] = useState(() => {
      // Funkce pro inicializaci stavu jednoho týmu
      const initializeSingleTeamState = (teamPlayers) => ({
        onIce: [], // Bude naplněno v useEffect po načtení hráčů
        bench: [], // Bude naplněno v useEffect po načtení hráčů
        fatigue: {}, // Bude naplněno v useEffect po načtení hráčů
        lastShiftChange: 0
      });

      return {
        white: initializeSingleTeamState([]),
        black: initializeSingleTeamState([])
      };
  });

  // Funkce pro aktualizaci základních dat týmu (seznam hráčů, jméno)
  const updateTeam = useCallback((teamColor, updates) => {
    setTeams(prev => ({
      ...prev,
      [teamColor]: {
        ...prev[teamColor],
        ...updates
      }
    }));
  }, []); // Prázdné pole závislostí = stabilní funkce

  // Funkce pro aktualizaci dynamického stavu týmu (onIce, bench, fatigue)
  // Používá funkční update pro bezpečnost
  const updateTeamState = useCallback((teamColor, updates) => {
     // 'updates' může být objekt nebo funkce (prevState => newState)
    if (typeof updates === 'function') {
      setTeamState(prev => ({
        ...prev,
        [teamColor]: updates(prev[teamColor]) // Zavoláme funkci s předchozím stavem daného týmu
      }));
    } else {
      // Pokud 'updates' je objekt, sloučíme ho s předchozím stavem
       setTeamState(prev => ({
        ...prev,
        [teamColor]: {
          ...prev[teamColor],
          ...updates
        }
      }));
    }
  }, []); // Prázdné pole závislostí = stabilní funkce

  return [teams, updateTeam, teamState, updateTeamState];
};

// --- Component ---
const OldaHockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'paused', 'finished'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [highlightedPlayerKey, setHighlightedPlayerKey] = useState(null);
  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);

  // Použití custom hooku pro správu týmů
  const [teams, updateTeam, teamState, updateTeamState] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Team Initialization Effect ---
  useEffect(() => {
    console.log("🔄 Initializing teams...");
    // Získáme všechny aktivní hráče (docházka >= 75%) a přiřadíme jim klíč
    const activePlayers = litvinovLancers.players
      .filter(p => p.attendance >= 75)
      .map(player => ({
        ...player,
        level: player.level || 1, // Zajistíme, že level existuje
        key: getPlayerKey(player) // Přiřadíme klíč hned
      }));

    // Vytvoříme objekt hráče (uživatele)
    const userPlayer = {
      name: playerName,
      surname: '(Ty)',
      position: 'útočník', // Výchozí pozice, může být upravena
      level: playerLevel || 3,
      isPlayer: true,
      key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'})
    };

    // Rozdělíme hráče podle přiřazených dresů
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
      // Přidáme uživatele, pokud má bílý dres
      if (assignedJerseys.white.has(playerName)) {
          whiteAssignedPlayers.push(userPlayer);
          whiteAssignedKeys.add(userPlayer.key);
      }
    }
     if (assignedJerseys?.black) {
      activePlayers.forEach(p => {
        if (assignedJerseys.black.has(`${p.name} ${p.surname}`) && !whiteAssignedKeys.has(p.key)) { // Zajistíme, že není už v bílém
          blackAssignedPlayers.push(p);
          blackAssignedKeys.add(p.key);
        }
      });
       // Přidáme uživatele, pokud má černý dres a není už v bílém
       if (assignedJerseys.black.has(playerName) && !whiteAssignedKeys.has(userPlayer.key)) {
           blackAssignedPlayers.push(userPlayer);
           blackAssignedKeys.add(userPlayer.key);
       }
    }

    // Hráči, kteří nebyli explicitně přiřazeni
    const remainingPlayers = activePlayers.filter(p =>
      !whiteAssignedKeys.has(p.key) && !blackAssignedKeys.has(p.key)
    );

    // Přidáme uživatele, pokud ještě nebyl přiřazen
    if (!whiteAssignedKeys.has(userPlayer.key) && !blackAssignedKeys.has(userPlayer.key)) {
       // Přidáme ho do menšího týmu nebo do bílého, pokud jsou stejně velké
       if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
           whiteAssignedPlayers.push(userPlayer);
           whiteAssignedKeys.add(userPlayer.key);
       } else {
           blackAssignedPlayers.push(userPlayer);
           blackAssignedKeys.add(userPlayer.key);
       }
    }

    // Náhodně zamícháme zbývající hráče
    const shuffledRemaining = [...remainingPlayers].sort(() => Math.random() - 0.5);

    // Rozdělíme zbývající hráče mezi týmy pro vyrovnání počtu
    shuffledRemaining.forEach(player => {
      if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
        whiteAssignedPlayers.push(player);
      } else {
        blackAssignedPlayers.push(player);
      }
    });

    // Zajistíme brankáře pro každý tým
    const ensureGoalie = (teamPlayers, otherTeamPlayers) => {
      let hasGoalie = teamPlayers.some(p => p.position === 'brankář');
      if (!hasGoalie) {
        // Zkusíme najít brankáře mezi aktivními, kteří ještě nejsou v žádném týmu
        const availableGoalie = activePlayers.find(p =>
          p.position === 'brankář' &&
          !teamPlayers.some(tp => tp.key === p.key) &&
          !otherTeamPlayers.some(otp => otp.key === p.key)
        );
        if (availableGoalie) {
          teamPlayers.push(availableGoalie);
        } else {
          // Pokud není dostupný, vytvoříme náhradního
          const backupGoalie = {
            name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75,
            key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})
          };
          // Zajistíme unikátnost klíče pro případ kolize
          while (teamPlayers.some(p => p.key === backupGoalie.key) || otherTeamPlayers.some(p => p.key === backupGoalie.key)) {
             backupGoalie.key += '_';
          }
          teamPlayers.push(backupGoalie);
        }
      }
    };

    ensureGoalie(whiteAssignedPlayers, blackAssignedPlayers);
    ensureGoalie(blackAssignedPlayers, whiteAssignedPlayers);

    // Seřadíme hráče podle pozic
    const sortPlayers = (players) => {
      const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
      return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };

    const finalWhitePlayers = sortPlayers(whiteAssignedPlayers);
    const finalBlackPlayers = sortPlayers(blackAssignedPlayers);

    // Aktualizujeme základní data týmů
    updateTeam('white', { name: 'Lancers Bílý', players: finalWhitePlayers });
    updateTeam('black', { name: 'Lancers Černý', players: finalBlackPlayers });

    // Funkce pro inicializaci dynamického stavu týmu (onIce, bench, fatigue)
    const initializeDynamicState = (players) => {
       const onIce = players.slice(0, 6); // Prvních 6 hráčů jde na led (vč. brankáře)
       const bench = players.slice(6);
       const fatigue = players.reduce((acc, player) => {
         if (!player.key) {
           console.error(`🔴 INIT FATIGUE: Hráč ${player.name} ${player.surname} nemá platný klíč při inicializaci únavy!`);
         } else {
           acc[player.key] = 0; // Všichni začínají s nulovou únavou
         }
         return acc;
       }, {});
       return { onIce, bench, fatigue, lastShiftChange: 0 };
    };

    // Inicializujeme dynamický stav pro oba týmy
    updateTeamState('white', initializeDynamicState(finalWhitePlayers));
    updateTeamState('black', initializeDynamicState(finalBlackPlayers));

    console.log("✅ Teams initialized successfully.");
    console.log("⚪ White Team Players:", finalWhitePlayers.map(p => `${p.name} ${p.surname} (${p.key})`));
    console.log("⚫ Black Team Players:", finalBlackPlayers.map(p => `${p.name} ${p.surname} (${p.key})`));

    setGameState('paused'); // Připraveno ke startu

  // Závislosti: Spustí se jen jednou po mountnutí komponenty
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]); // Zahrnuli jsme props, které ovlivňují inicializaci

  // --- Highlight Player Effect ---
  const triggerHighlight = useCallback((playerKeys) => {
    if (!playerKeys) return;
    const keysArray = Array.isArray(playerKeys) ? playerKeys : [playerKeys];

    keysArray.forEach(key => {
        if (!key) return; // Přeskočíme neplatné klíče

        setHighlightedPlayerKey(prev => ({ ...(prev ?? {}), [key]: true }));

        setTimeout(() => {
            setHighlightedPlayerKey(prev => {
                 if (!prev) return null;
                 const newHighlights = { ...prev };
                 delete newHighlights[key];
                 // Vrátíme null, pokud je objekt prázdný, jinak nový objekt
                 return Object.keys(newHighlights).length > 0 ? newHighlights : null;
            });
        }, 1500); // Zvýraznění trvá 1.5 sekundy
    });
  }, []); // Stabilní funkce

  // --- Game Simulation Effect (Time, Events) ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setGameTime(prevTime => {
        const newTime = prevTime + 1;

        // Konec hry?
        if (newTime >= GAME_DURATION_SECONDS) {
          setGameState('finished');
          if (onGameComplete) {
            onGameComplete({ score, events }); // Předáme výsledky
          }
          clearInterval(timerInterval); // Zastavíme tento interval
          return GAME_DURATION_SECONDS;
        }

        // Aktualizace periody
        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        if (newPeriod !== currentPeriod) {
          setCurrentPeriod(newPeriod);
          const periodChangeEvent = {
              type: 'period_change',
              time: newTime,
              description: `Začala ${newPeriod}. třetina!`,
              period: newPeriod
           };
           setEvents(prev => [periodChangeEvent, ...prev]); // Přidáme na začátek
           setLastEvent(periodChangeEvent);
        }

        // --- Generování událostí (Gól, Zákrok, Obrana, Faul) ---
        if (newTime > 0 && newTime % EVENT_CHECK_INTERVAL === 0) {
            // Pozor: Čteme teams přímo ze stavu, nemusí být nejaktuálnější, pokud se mezitím změní
            // Pro kritické operace je lepší použít funkční update, zde pro simulaci OK
            const currentWhiteTeam = teams.white;
            const currentBlackTeam = teams.black;

            // Pokud týmy ještě nejsou načteny, přeskočíme
            if (!currentWhiteTeam?.players?.length || !currentBlackTeam?.players?.length) {
               console.warn("⏳ Teams not fully loaded yet, skipping event generation.");
               return newTime;
            }

            const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
            const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';
            // Použijeme aktuální stav teamState pro výběr hráčů na ledě
            const attackingTeamOnIce = teamState[attackingTeamId]?.onIce ?? [];
            const defendingTeamOnIce = teamState[defendingTeamId]?.onIce ?? [];

            // --- Rozhodnutí o typu události ---
            const eventRoll = Math.random();
            let eventType = 'attack'; // Výchozí
            if (eventRoll < 0.08) { // 8% šance na faul
                eventType = 'penalty';
            }

            let newEvent = { time: newTime, team: attackingTeamId };

            if (eventType === 'penalty') {
                // Vyber faulujícího hráče z útočícího týmu na ledě (ne brankáře)
                const possibleFoulers = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                 if (possibleFoulers.length === 0) return newTime; // Nikdo nemůže faulovat

                 const fouler = possibleFoulers[Math.floor(Math.random() * possibleFoulers.length)];
                 newEvent.type = 'penalty';
                 newEvent.player = fouler;
                 newEvent.description = `${fouler.name} ${fouler.surname} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává 2 minuty! 😠 ${fouler.isPlayer ? '(Ty!)' : ''}`;
                 triggerHighlight(fouler.key);

            } else { // Logika útoku
                 // Vyber útočníka z útočícího týmu na ledě (ne brankáře)
                 const attackersOnIce = attackingTeamOnIce.filter(p => p.position !== 'brankář');
                 if (attackersOnIce.length === 0) return newTime; // Nemá kdo útočit
                 const attacker = attackersOnIce[Math.floor(Math.random() * attackersOnIce.length)];

                 // Najdi brankáře a obránce v bránícím týmu na ledě
                 const goalie = defendingTeamOnIce.find(p => p.position === 'brankář');
                 const defendersOnIce = defendingTeamOnIce.filter(p => p.position === 'obránce');
                 const defender = defendersOnIce.length > 0 ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] : null;

                 // --- Výpočet šance na gól ---
                 let goalChance = 0.25; // Základní šance
                 // Bonus/postih na základě levelu (a případně únavy v budoucnu)
                 goalChance += (attacker.level || 1) * 0.04; // Skill útočníka
                 if (attacker.isPlayer) goalChance += 0.10; // Bonus pro hráče
                 if (defender) goalChance -= (defender.level || 1) * 0.03; // Skill obránce
                 if (goalie) goalChance -= (goalie.level || 1) * 0.06; // Skill brankáře
                 // Omezení šance na rozumný rozsah
                 goalChance = Math.max(0.05, Math.min(0.85, goalChance));

                 const outcomeRoll = Math.random();

                 if (outcomeRoll < goalChance) {
                     // --- GÓL ---
                     setScore(prev => ({ ...prev, [attackingTeamId]: prev[attackingTeamId] + 1 }));
                     // Najdi možného asistenta (jiný hráč útočícího týmu na ledě, ne brankář)
                     const possibleAssists = attackingTeamOnIce.filter(p => p.key !== attacker.key && p.position !== 'brankář');
                     const assistant = possibleAssists.length > 0 ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] : null;

                     newEvent.type = 'goal';
                     newEvent.player = attacker;
                     newEvent.assistant = assistant;
                     newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}` : ''}!`;
                     triggerHighlight([attacker.key, assistant?.key].filter(Boolean)); // Zvýrazní střelce a asistenta

                 } else if (outcomeRoll < goalChance + 0.35 || !goalie) { // Zvýšená šance na zákrok, pokud není gólman, je to "střela vedle"
                     // --- ZÁKROK BRANKÁŘE (nebo střela vedle) ---
                     if (goalie) {
                         newEvent.type = 'save';
                         newEvent.player = goalie; // Brankář je hlavní aktér
                         newEvent.shooter = attacker;
                         newEvent.description = `🧤 Zákrok! ${goalie.name} ${goalie.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) chytá střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tvoje střela!)' : ''}.`;
                         triggerHighlight([goalie.key, attacker.key].filter(Boolean));
                     } else {
                         newEvent.type = 'miss'; // Nový typ události pro střelu vedle
                         newEvent.player = attacker;
                         newEvent.description = `💨 Střela vedle od hráče ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}).`;
                         triggerHighlight(attacker.key);
                     }

                 } else if (defender) {
                    // --- BLOK OBRÁNCE ---
                     newEvent.type = 'defense';
                     newEvent.player = defender; // Obránce je hlavní aktér
                     newEvent.attacker = attacker;
                     newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu hráče ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                     triggerHighlight([defender.key, attacker.key].filter(Boolean));
                 } else {
                     // --- Jiná akce / ztráta puku (fallback) ---
                      newEvent.type = 'turnover'; // Ztráta puku
                      newEvent.player = attacker;
                      newEvent.description = `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'} v útočném pásmu.`;
                      // triggerHighlight(attacker.key); // Možná není nutné zvýrazňovat
                 }
            }

            // Aktualizujeme poslední událost a seznam všech událostí
            setLastEvent(newEvent);
            setEvents(prev => [newEvent, ...prev]); // Nové události na začátek seznamu
        }

        // Vrátíme nový čas pro další tik
        return newTime;
      });
    }, 1000 / gameSpeed); // Interval závisí na rychlosti hry

    // Cleanup funkce: Zastaví interval, když se změní gameState nebo se komponenta odpojí
    return () => clearInterval(timerInterval);

  }, [gameState, gameSpeed, teams, score, currentPeriod, onGameComplete, triggerHighlight, teamState, updateTeamState]); // Přidány závislosti teamState a updateTeamState pro přístup k onIce hráčům

   // --- Fatigue Update Effect ---
  useEffect(() => {
    // Spustíme interval pouze pokud hra běží
    if (gameState !== 'playing') {
      return; // Pokud hra neběží, nic neděláme
    }

    console.log("🚀 Starting fatigue update interval.");

    const fatigueInterval = setInterval(() => {
      // console.log("⏱️ Fatigue interval tick..."); // Pro ladění frekvence

      // Použijeme funkční update pro oba týmy, abychom měli jistotu,
      // že pracujeme s nejaktuálnějším stavem PŘED touto aktualizací únavy.
      updateTeamState('white', prevWhiteState => {
        // Základní kontrola, zda máme potřebná data
        if (!prevWhiteState?.fatigue || !prevWhiteState.onIce || !prevWhiteState.bench) {
            console.error("🔴 FATIGUE ERROR (White): Missing state data.", prevWhiteState);
            return prevWhiteState; // Vrátíme původní stav, abychom předešli chybě
        }

        // Vytvoříme kopii objektu únavy, abychom nemutovali původní stav
        const newFatigue = { ...prevWhiteState.fatigue };
        let fatigueChanged = false; // Flag pro zjištění, zda došlo ke změně

        // Zvýšení únavy pro hráče na ledě
        prevWhiteState.onIce.forEach(player => {
          if (player && player.key) { // Kontrola existence hráče a klíče
            const currentFatigue = newFatigue[player.key] ?? 0; // Default na 0, pokud klíč chybí (nemělo by nastat)
            const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + FATIGUE_INCREASE_RATE);
            if (newFatigue[player.key] !== updatedFatigue) {
              newFatigue[player.key] = updatedFatigue;
              fatigueChanged = true;
              // console.log(`⚪ OnIce ${player.key.substring(0,5)}: ${currentFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
            }
          } else {
              console.warn("⚪ Fatigue Warning (OnIce): Invalid player or key found", player);
          }
        });

        // Snížení únavy (regenerace) pro hráče na střídačce
        prevWhiteState.bench.forEach(player => {
          if (player && player.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.max(0, currentFatigue - RECOVERY_RATE);
             if (newFatigue[player.key] !== updatedFatigue) {
                newFatigue[player.key] = updatedFatigue;
                fatigueChanged = true;
                 // console.log(`⚪ Bench ${player.key.substring(0,5)}: ${currentFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
             }
          } else {
             console.warn("⚪ Fatigue Warning (Bench): Invalid player or key found", player);
          }
        });

        // Vrátíme nový stav pouze pokud došlo ke změně únavy
        return fatigueChanged ? { ...prevWhiteState, fatigue: newFatigue } : prevWhiteState;
      });

      // Stejná logika pro černý tým
      updateTeamState('black', prevBlackState => {
        if (!prevBlackState?.fatigue || !prevBlackState.onIce || !prevBlackState.bench) {
            console.error("🔴 FATIGUE ERROR (Black): Missing state data.", prevBlackState);
            return prevBlackState;
        }
        const newFatigue = { ...prevBlackState.fatigue };
        let fatigueChanged = false;

        prevBlackState.onIce.forEach(player => {
          if (player && player.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + FATIGUE_INCREASE_RATE);
            if (newFatigue[player.key] !== updatedFatigue) {
                newFatigue[player.key] = updatedFatigue;
                fatigueChanged = true;
                // console.log(`⚫ OnIce ${player.key.substring(0,5)}: ${currentFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
            }
          } else {
              console.warn("⚫ Fatigue Warning (OnIce): Invalid player or key found", player);
          }
        });

        prevBlackState.bench.forEach(player => {
          if (player && player.key) {
            const currentFatigue = newFatigue[player.key] ?? 0;
            const updatedFatigue = Math.max(0, currentFatigue - RECOVERY_RATE);
            if (newFatigue[player.key] !== updatedFatigue) {
                newFatigue[player.key] = updatedFatigue;
                fatigueChanged = true;
                // console.log(`⚫ Bench ${player.key.substring(0,5)}: ${currentFatigue.toFixed(1)} -> ${updatedFatigue.toFixed(1)}`);
            }
          } else {
              console.warn("⚫ Fatigue Warning (Bench): Invalid player or key found", player);
          }
        });

        return fatigueChanged ? { ...prevBlackState, fatigue: newFatigue } : prevBlackState;
      });

    }, 1000); // Aktualizujeme únavu každou sekundu reálného času

    // Cleanup funkce: Zastaví interval, když se změní gameState (např. na 'paused' nebo 'finished')
    // nebo když se komponenta odpojí.
    return () => {
      console.log("🛑 Stopping fatigue update interval.");
      clearInterval(fatigueInterval);
    };

  // --- KLÍČOVÁ ZMĚNA: Závislost POUZE na gameState a stabilní funkci updateTeamState ---
  }, [gameState, updateTeamState]); // Odebrali jsme teamState!

  // --- Automatic Substitution Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const substitutionInterval = setInterval(() => {
        const currentTime = gameTime; // Použijeme aktuální herní čas

        ['white', 'black'].forEach(teamColor => {
            // Použijeme funkční update, abychom pracovali s nejaktuálnějším stavem
            updateTeamState(teamColor, prevTeamState => {
                // Kontrola, zda je čas na střídání a zda máme data
                if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue ||
                    currentTime - prevTeamState.lastShiftChange < SHIFT_DURATION) {
                    return prevTeamState; // Bez změny
                }

                // Hráči na ledě seřazení podle únavy (nejvíce unavení první), kromě brankáře a hráče (uživatele)
                const tiredOnIce = prevTeamState.onIce
                    .filter(p => p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));

                // Hráči na střídačce seřazení podle odpočinku (nejméně unavení první), kromě brankáře a hráče
                const restedOnBench = prevTeamState.bench
                    .filter(p => p.position !== 'brankář' && !p.isPlayer)
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100));

                // Určíme, kolik hráčů vystřídáme (např. 2 nebo 3, podle toho, kolik je unavených a odpočatých)
                // Bereme max 3, aby střídání nebylo příliš masivní najednou
                const numToChange = Math.min(tiredOnIce.length, restedOnBench.length, 3);

                if (numToChange === 0) {
                    // Není koho střídat (nebo nejsou hráči na lavičce), aktualizujeme jen čas posledního pokusu
                     // Můžeme aktualizovat lastShiftChange i tak, aby se to nezkoušelo hned znovu
                     // return { ...prevTeamState, lastShiftChange: currentTime };
                     // Nebo nechat čas starý a zkusit to za chvíli znovu
                    return prevTeamState;
                }

                // Hráči, kteří jdou z ledu
                const playersOut = tiredOnIce.slice(0, numToChange);
                const playersOutKeys = new Set(playersOut.map(p => p.key));

                // Hráči, kteří jdou na led
                const playersIn = restedOnBench.slice(0, numToChange);
                const playersInKeys = new Set(playersIn.map(p => p.key));

                // Sestavíme nové pole hráčů na ledě a na střídačce
                const newOnIce = [
                    ...prevTeamState.onIce.filter(p => !playersOutKeys.has(p.key)), // Ponecháme ty, co nestřídají
                    ...playersIn // Přidáme nové z lavičky
                ];
                const newBench = [
                    ...prevTeamState.bench.filter(p => !playersInKeys.has(p.key)), // Ponecháme ty, co zůstali na lavičce
                    ...playersOut // Přidáme ty, co šli z ledu
                ];

                 // Přidáme událost o střídání do logu
                 const playersInNames = playersIn.map(p => p.surname).join(", ");
                 const playersOutNames = playersOut.map(p => p.surname).join(", ");
                 const subEvent = {
                   time: currentTime,
                   type: 'substitution',
                   team: teamColor,
                   description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames} ↔️ ${playersOutNames}`
                 };
                 setEvents(prev => [subEvent, ...prev]); // Přidáme na začátek

                // Vrátíme nový stav pro tento tým
                return {
                    ...prevTeamState,
                    onIce: newOnIce,
                    bench: newBench,
                    lastShiftChange: currentTime // Aktualizujeme čas posledního střídání
                };
            });
        });
    }, 5000); // Kontrolujeme možnost střídání každých 5 sekund reálného času

    return () => clearInterval(substitutionInterval);
  }, [gameState, gameTime, updateTeamState]); // Závislost na gameTime, aby měl aktuální čas

   // --- Manuální střídání hráče ---
  const handlePlayerSubstitution = useCallback((teamColor) => {
      const currentTime = gameTime; // Aktuální herní čas

      updateTeamState(teamColor, prevTeamState => {
          // Základní kontroly
          if (!prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) {
              console.error(`🔴 SUB ERROR (${teamColor}): Chybí data týmu.`);
              return prevTeamState;
          }

          const playerOnIce = prevTeamState.onIce.find(p => p.isPlayer);
          const playerOnBench = prevTeamState.bench.find(p => p.isPlayer);

          if (!playerOnIce && !playerOnBench) {
              console.warn(`🟡 SUB INFO (${teamColor}): Hráč (Ty) není v tomto týmu.`);
              return prevTeamState; // Hráč není v tomto týmu
          }

          // --- Hráč jde z ledu na lavičku ---
          if (playerOnIce) {
              // Najdeme nejméně unaveného hráče na lavičce (ne brankáře, ne hráče)
              const restedBenchPlayer = [...prevTeamState.bench]
                  .filter(p => p.position !== 'brankář' && !p.isPlayer)
                  .sort((a, b) => (prevTeamState.fatigue[a.key] ?? 100) - (prevTeamState.fatigue[b.key] ?? 100))[0];

              if (!restedBenchPlayer) {
                  console.warn(`🟡 SUB INFO (${teamColor}): Není koho poslat na led místo hráče.`);
                  return prevTeamState; // Není náhradník na lavičce
              }

              // Nové sestavy
              const newOnIce = prevTeamState.onIce.filter(p => !p.isPlayer); // Odstraníme hráče
              newOnIce.push(restedBenchPlayer); // Přidáme náhradníka
              const newBench = prevTeamState.bench.filter(p => p.key !== restedBenchPlayer.key); // Odstraníme náhradníka z lavičky
              newBench.push(playerOnIce); // Přidáme hráče na lavičku

              const subEvent = {
                  time: currentTime, type: 'substitution', team: teamColor,
                  description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️`
              };
               setEvents(prev => [subEvent, ...prev]);
               triggerHighlight([playerOnIce.key, restedBenchPlayer.key]);

              return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
          }

          // --- Hráč jde z lavičky na led ---
          if (playerOnBench) {
              // Najdeme nejvíce unaveného hráče na ledě (ne brankáře, ne hráče)
              const tiredOnIcePlayer = [...prevTeamState.onIce]
                  .filter(p => p.position !== 'brankář' && !p.isPlayer)
                  .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0))[0];

              if (!tiredOnIcePlayer) {
                  console.warn(`🟡 SUB INFO (${teamColor}): Není koho stáhnout z ledu pro hráče.`);
                  // Můžeme zkusit najít i brankáře, pokud není jiná možnost? Ne, raději ne.
                  // Nebo můžeme povolit hru v 5 i bez střídání? Zatím ne.
                  return prevTeamState; // Není koho vystřídat
              }

               // Nové sestavy
              const newBench = prevTeamState.bench.filter(p => !p.isPlayer); // Odstraníme hráče z lavičky
              newBench.push(tiredOnIcePlayer); // Přidáme staženého hráče na lavičku
              const newOnIce = prevTeamState.onIce.filter(p => p.key !== tiredOnIcePlayer.key); // Odstraníme staženého hráče z ledu
              newOnIce.push(playerOnBench); // Přidáme hráče na led

              const subEvent = {
                   time: currentTime, type: 'substitution', team: teamColor,
                   description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️`
               };
               setEvents(prev => [subEvent, ...prev]);
               triggerHighlight([playerOnBench.key, tiredOnIcePlayer.key]);

              return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: currentTime };
          }

          // Nemělo by nastat, ale pro jistotu
          return prevTeamState;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameTime, updateTeamState, playerName, triggerHighlight]); // Přidány gameTime a playerName

  // --- Event Handlers ---
  const handleStartPause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused' || gameState === 'warmup') {
      setGameState('playing');
    }
  };

  const changeSpeed = (delta) => {
    setGameSpeed(prev => Math.max(1, Math.min(MAX_SPEED, prev + delta)));
  };

  // --- Scroll event log to top ---
   useEffect(() => {
       if (eventLogRef.current) {
           eventLogRef.current.scrollTop = 0;
       }
   }, [events]); // Spustí se při každé změně pole událostí

  // --- Render Helper ---
  const getEventIcon = (type) => {
    switch (type) {
      case 'goal': return <FlagIcon className="h-5 w-5 text-green-400" />;
      case 'save': return <HandRaisedIcon className="h-5 w-5 text-blue-400" />;
      case 'defense': return <ShieldCheckIcon className="h-5 w-5 text-orange-400" />;
      case 'penalty': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'period_change': return <ClockIcon className="h-5 w-5 text-indigo-400" />;
      case 'substitution': return <UserGroupIcon className="h-5 w-5 text-teal-400" />; // Ikona pro střídání
      case 'miss': return <XMarkSolidIcon className="h-5 w-5 text-gray-500" />; // Ikona pro střelu vedle
      case 'turnover': return <ArrowLeftOnRectangleIcon className="h-5 w-5 text-purple-400 transform rotate-90" />; // Ikona pro ztrátu puku
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

   // Komponenta pro zobrazení stavu jednoho hráče (včetně únavy)
  const PlayerStatus = React.memo(({ player, teamColor, fatigueValue, isOnIce, playerKey }) => {
     // Kontrola validity dat
     if (!player || !player.key) {
         return (
             <div className="flex items-center gap-2 p-2 rounded-lg bg-red-900/50 border border-red-700">
                 <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
                 <div className="text-xs text-red-300">Chyba: Neplatná data hráče</div>
             </div>
         );
     }

     const fatigue = Math.round(fatigueValue || 0);
     const playerPhotoUrl = player.isPlayer
         ? '/Images/players/default_player.png'
         : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);

     // Debug log pro konkrétního hráče, pokud je potřeba
     // if (player.isPlayer) {
     //    console.log(`🔵 Rendering Player (You): Key=${player.key}, Fatigue=${fatigue}%, OnIce=${isOnIce}`);
     // }

    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border ${
        isOnIce ? 'bg-green-800/40 border-green-600/50 shadow-md' : 'bg-gray-800/40 border-gray-700/50'
      } ${highlightedPlayerKey?.[player.key] ? (teamColor === 'white' ? 'bg-white/20 scale-105 ring-2 ring-white' : 'bg-gray-600/30 scale-105 ring-2 ring-gray-400') : ''} `}
      >
        {/* Player Image */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-700 relative">
          <Image
            src={playerPhotoUrl}
            alt={`${player.name} ${player.surname}`}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized={true}
            onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }}
          />
           {isOnIce && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" title="Na ledě"></div>
           )}
        </div>
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-gray-100">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div>
          <div className="text-xs text-indigo-300">{player.position} - L{player.level || 1}</div>
          {/* Malý debug klíč pro snadnější identifikaci */}
          {/* <div className="text-[10px] text-gray-500">{player.key.substring(player.key.length - 6)}</div> */}
        </div>
        {/* Fatigue Bar */}
        <div className="w-20 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-1">{fatigue}%</div>
          <div className="h-2.5 bg-gray-600 rounded-full overflow-hidden relative">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${
                fatigue > 80 ? 'bg-red-500' :
                fatigue > 50 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${fatigue}%` }}
            />
          </div>
        </div>
      </div>
    );
  });
  PlayerStatus.displayName = 'PlayerStatus'; // Pro lepší debugování v React DevTools

  // Optimalizovaná komponenta pro tabulku se seznamem hráčů týmu
  const TeamTable = React.memo(({ teamData, teamColor }) => {
    const [selectedTeamColor, setSelectedTeamColor] = useState(teamColor); // 'white' nebo 'black'

    // Zobrazujeme vždy data předaná v props, přepínání je jen vizuální
    const currentTeam = teamData[selectedTeamColor];

    if (!currentTeam || !currentTeam.players) {
        return (
            <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">
                Načítání soupisky...
            </div>
        );
    }
     if (currentTeam.players.length === 0) {
         return (
             <div className="w-full bg-black/50 rounded-lg p-4 text-center text-gray-500 flex items-center justify-center h-full">
                 Žádní hráči v týmu.
             </div>
         );
     }

    return (
      <div className="w-full bg-gradient-to-b from-gray-800/60 to-gray-900/70 rounded-lg overflow-hidden flex flex-col h-full border border-gray-700/50">
        {/* Přepínač týmů */}
        <div className="bg-indigo-900/60 p-2 flex justify-between items-center flex-shrink-0 border-b border-indigo-700/50">
          <button
            onClick={() => setSelectedTeamColor('white')}
            className={clsx(
              'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1',
              selectedTeamColor === 'white' ? 'bg-white text-black shadow-md' : 'text-white hover:bg-white/20'
            )}
          >
            Bílí ({teamData.white.players?.length ?? 0})
          </button>
          <button
            onClick={() => setSelectedTeamColor('black')}
            className={clsx(
              'px-3 py-1 rounded-lg text-sm font-bold transition-colors flex-1 text-center mx-1',
              selectedTeamColor === 'black' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'
            )}
          >
            Černí ({teamData.black.players?.length ?? 0})
          </button>
        </div>
        {/* Seznam hráčů */}
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {currentTeam.players.map((player, index) => {
             if (!player || !player.key) {
                 console.error("🔴 TeamTable Render Error: Invalid player data at index", index, player);
                 return null; // Přeskočíme renderování neplatného hráče
             }
             const playerPhotoUrl = player.isPlayer
                ? '/Images/players/default_player.png'
                : litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`);

             return (
                <div
                  key={player.key}
                  className={`p-2 text-sm ${index % 2 === 0 ? 'bg-black/30' : 'bg-black/20'} hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border-b border-gray-700/30 last:border-b-0`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-600">
                    <Image
                      src={playerPhotoUrl}
                      alt={player.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                      onError={(e) => { e.currentTarget.src = '/Images/players/default_player.png'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-gray-200">{player.name} {player.surname} {player.isPlayer ? <span className="text-cyan-400">(Ty)</span> : ''}</div>
                    <div className="text-xs text-indigo-300">{player.position}</div>
                  </div>
                  <span className="text-xs font-semibold text-yellow-400 px-1.5 py-0.5 bg-black/30 rounded-md">
                    L{player.level || 1}
                  </span>
                </div>
             );
          })}
        </div>
      </div>
    );
  });
  TeamTable.displayName = 'TeamTable';


  // --- Main Render ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Hlavní kontejner zápasu */}
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={onBack}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium",
                gameState === 'playing'
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600/80 hover:bg-red-600 text-white"
            )}
            disabled={gameState === 'playing'}
            title={gameState === 'playing' ? "Nelze opustit během hry" : "Zpět do kabiny"}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Zpět</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">
            Lancers Simulátor Zápasu
          </h2>
          <div className="w-16 sm:w-24 flex justify-end"> {/* Placeholder pro vyvážení + zobrazení stavu */}
            <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-md ${
                gameState === 'playing' ? 'bg-green-600/70 text-green-100 animate-pulse' :
                gameState === 'paused' ? 'bg-yellow-600/70 text-yellow-100' :
                gameState === 'finished' ? 'bg-blue-600/70 text-blue-100' :
                'bg-gray-600/70 text-gray-200'
            }`}>
                {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
            </span>
          </div>
        </div>

        {/* Hlavní obsahová oblast - rozdělení na sloupce */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Levý sloupec: Týmy, Ovládání, Stav hráčů */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">

            {/* Sekce týmů (soupisky) - fixní výška */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
               {/* Passujeme celý objekt `teams` pro TeamTable */}
                <TeamTable teamData={teams} teamColor="white" />
            </div>

            {/* Sekce ovládání hry */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? (
                 <>
                   <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zpomalit">
                     <BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                   </button>

                   <button onClick={handleStartPause} className="px-4 py-1.5 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
                     {gameState === 'playing' ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                     {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                   </button>

                   <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" title="Zrychlit">
                     <ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                   </button>

                   <div className="text-xs sm:text-sm text-gray-400 ml-2 sm:ml-4 whitespace-nowrap">
                     Rychlost: {gameSpeed}x
                   </div>
                 </>
              ) : (
                <div className='text-center flex flex-col items-center gap-2'>
                    <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <TrophyIcon className="h-5 w-5"/> Výsledky a zpět
                    </button>
                </div>
              )}
            </div>

             {/* Tlačítka pro manuální střídání hráče */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                // Získáme aktuální stav týmu bezpečně
                const currentTeamState = teamState[teamColor];
                if (!currentTeamState || !currentTeamState.onIce || !currentTeamState.bench || !currentTeamState.fatigue) return null; // Pokud data nejsou, nezobrazuj

                const playerInTeam = [...currentTeamState.onIce, ...currentTeamState.bench].find(p => p.isPlayer);
                if (!playerInTeam) return null; // Hráč není v tomto týmu

                const isOnIce = currentTeamState.onIce.some(p => p.key === playerInTeam.key);
                const fatigue = currentTeamState.fatigue[playerInTeam.key] ?? 0; // Bezpečná hodnota

                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)}
                    disabled={gameState !== 'playing'} // Povolit jen když hra běží
                    className={clsx(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                      isOnIce
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white',
                      gameState !== 'playing' && 'opacity-50 cursor-not-allowed' // Styl pro neaktivní tlačítko
                    )}
                    title={isOnIce ? `Aktuální únava: ${Math.round(fatigue)}%` : "Připraven naskočit"}
                  >
                    {isOnIce ? (
                        <> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Střídat <span className='hidden md:inline'>({Math.round(fatigue)}%)</span> </>
                    ) : (
                        <> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Na led </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stav hráčů (Únava) - Flexibilní výška */}
            <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
                 {/* Rozdělení na dva sloupce pro stav hráčů */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                  {/* Bílý tým - stav */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">Bílý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                      {(teams.white.players || []).map(player => (
                        <PlayerStatus
                          key={player.key}
                          player={player}
                          teamColor="white"
                          fatigueValue={teamState.white?.fatigue?.[player.key]}
                          isOnIce={teamState.white?.onIce?.some(p => p.key === player.key)}
                          playerKey={player.key} // Předáváme pro jistotu
                        />
                      ))}
                      {teams.white.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Soupiska prázdná.</p>}
                    </div>
                  </div>
                  {/* Černý tým - stav */}
                  <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">Černý tým - Stav</h3>
                    <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                      {(teams.black.players || []).map(player => (
                        <PlayerStatus
                          key={player.key}
                          player={player}
                          teamColor="black"
                          fatigueValue={teamState.black?.fatigue?.[player.key]}
                          isOnIce={teamState.black?.onIce?.some(p => p.key === player.key)}
                          playerKey={player.key} // Předáváme pro jistotu
                        />
                      ))}
                      {teams.black.players?.length === 0 && <p className="text-gray-500 text-center italic p-4">Soupiska prázdná.</p>}
                    </div>
                  </div>
                </div>
            </div>

          </div>

          {/* Pravý sloupec: Skóre, Poslední událost, Log událostí */}
          <div className="w-full xl:flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">

            {/* Skóre a čas */}
            <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/60 to-purple-900/50 border border-indigo-700 rounded-lg p-3 sm:p-4 text-center flex-shrink-0 shadow-lg">
              <div className="flex justify-around items-center mb-2">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate px-2">{teams.white.name || 'Bílí'}</span>
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-cyan-300 tabular-nums tracking-tighter flex-shrink-0 mx-2">
                     {score.white} : {score.black}
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-300 truncate px-2">{teams.black.name || 'Černí'}</span>
              </div>
              <div className="text-lg sm:text-xl font-mono text-yellow-400 tracking-wider">
                 {gameState === 'finished' ? 'Konec zápasu' : formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}
              </div>
            </div>

             {/* Poslední událost */}
             <div ref={lastEventRef} className="bg-black/40 border border-gray-700/80 rounded-lg p-3 h-16 sm:h-20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow">
               {lastEvent ? (
                 <div className="animate-fadeIn flex items-center gap-2 sm:gap-3 text-center">
                     <div className="flex-shrink-0">{getEventIcon(lastEvent.type)}</div>
                     <p className="text-xs sm:text-sm md:text-base text-gray-200">{lastEvent.description}</p>
                     {/* Čas můžeme zobrazit zde nebo v logu */}
                     {/* <span className="text-xs text-cyan-400 font-mono ml-2">{formatGameTime(lastEvent.time, PERIOD_DURATION_SECONDS).split('|')[1].trim()}</span> */}
                 </div>
               ) : (
                 <p className="text-gray-500 italic text-sm sm:text-base">Očekává se úvodní buly...</p>
               )}
             </div>


            {/* Log událostí */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-2 sm:p-3 flex flex-col flex-grow overflow-hidden">
               <h3 className="text-base sm:text-lg font-semibold text-cyan-400 mb-2 flex-shrink-0 text-center border-b border-gray-600 pb-1.5">Průběh zápasu</h3>
               <div ref={eventLogRef} className="overflow-y-auto flex-grow space-y-1.5 sm:space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                {events.length === 0 && gameState !== 'finished' && (
                     <p className="text-gray-500 text-center pt-4 italic text-sm">Zatím žádné události.</p>
                 )}
                 {events.map((event, index) => (
                   <div key={`${event.time}-${index}`} className="bg-black/30 p-1.5 sm:p-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                     {/* Čas události */}
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

      </div> {/* Konec hlavního kontejneru zápasu */}

      {/* Inline styles for scrollbar and animation */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px; /* Tenčí scrollbar */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); /* tmavší šedá/modrá */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(56, 189, 248, 0.6); /* světlejší modrá/cyan */
          border-radius: 10px;
          border: 1px solid rgba(30, 41, 59, 0.7);
          background-clip: padding-box; /* Změna z content-box */
        }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(56, 189, 248, 0.9);
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OldaHockeyMatch;