'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { litvinovLancers } from '../data/LitvinovLancers';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowLeftOnRectangleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

// Importujeme komponenty z nového souboru
import { PlayerStatus, TeamTable, PlayerSpecialAction, formatTimeOnIce, getEventIcon } from './HockeyComponents';

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 90; // 90 minut (od 16:30 do 18:00)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 64;
const EVENT_CHECK_INTERVAL = 15; // V sekundách herního času

// Konstanty pro střídání a únavu
const SHIFT_DURATION = 60;
const BASE_FATIGUE_INCREASE_RATE = 1.25;
const BASE_RECOVERY_RATE = 1.5;
const MAX_FATIGUE = 100;
const FATIGUE_IMPACT_FACTOR = 0.0015;

// Konstanty pro speciální akce
const SPECIAL_ACTION_CHANCE = 0.1;
const SPECIAL_ACTION_INTERVAL = 30;
const MIN_TIME_BETWEEN_ACTIONS = 120;

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

  // Ošetření pro případ, kdyby hra přesáhla 18:00 (i když by neměla)
  if (currentHour >= 18 && (currentMinute > 0 || seconds > 0)) {
    currentHour = 18;
    currentMinute = 0;
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
};

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

// Pomocná funkce pro porovnání setů
const areSetsSame = (set1, set2) => {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
};

// --- Team State Hook ---
const useTeamState = (initialTeamsData) => {
  const [teams, setTeams] = useState(() => ({
    white: { name: initialTeamsData.white.name, players: [] },
    black: { name: initialTeamsData.black.name, players: [] }
  }));
  
  const [teamState, setTeamState] = useState(() => {
    const initializeSingleTeamState = () => ({
      onIce: [], 
      bench: [], 
      fatigue: {}, 
      lastShiftChange: 0
    });
    return { 
      white: initializeSingleTeamState(), 
      black: initializeSingleTeamState() 
    };
  });

  const updateTeam = useCallback((teamColor, updates) => {
    setTeams(prev => ({ 
      ...prev, 
      [teamColor]: { ...prev[teamColor], ...updates } 
    }));
  }, []);

  // NOVÁ FUNKCE: Přímý přístup k hráčům na ledě
  const getOnIcePlayers = useCallback((teamColor) => {
    return teamState?.[teamColor]?.onIce || [];
  }, [teamState]);

  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => {
      // Vytvoříme kopii předchozího stavu
      const prevStateForTeam = prev[teamColor];
      let newStateForTeam;

      // Aplikujeme změny (buď z funkce nebo přímo objekt)
      if (typeof updates === 'function') {
        newStateForTeam = updates(prevStateForTeam);
      } else {
        newStateForTeam = { ...prevStateForTeam, ...updates };
      }

      // Pokud se stav pro daný tým nezměnil, vrátíme původní celkový stav
      if (newStateForTeam === prevStateForTeam) {
        return prev;
      }

      // Vytvoříme nový objekt pro celý teamState
      return {
        ...prev,
        [teamColor]: newStateForTeam
      };
    });
  }, []);

  return [teams, updateTeam, teamState, updateTeamState, getOnIcePlayers];
};

// --- Main Component ---
const HockeyMatch = ({ onBack, onGameComplete, assignedJerseys, playerName = 'Nový hráč', playerLevel = 1 }) => {
  // --- Refs ---
  const substitutionTimesRef = useRef(new Set());
  const eventLogRef = useRef(null);
  const lastEventRef = useRef(null);
  const processedEventRef = useRef(null);
  const processedEventIdsRef = useRef(new Set());
  const recentlySubstitutedRef = useRef(new Set());

  // --- State ---
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
  
  // KLÍČOVÁ OPRAVA: Separátní state pro sledování hráčů na ledě 
  // Ten budeme používat VÝHRADNĚ pro UI rendering
  const [playersOnIceState, setPlayersOnIceState] = useState({
    white: new Set(),
    black: new Set()
  });

  // --- Team State ---
  const [teams, updateTeam, teamState, updateTeamState, getOnIcePlayers] = useTeamState({
    white: { name: 'Bílý tým' },
    black: { name: 'Černý tým' }
  });

  // --- Highlight Player Effect ---
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

  // --- NOVÁ funkce pro sync playersOnIceState a teamState ---
  const updatePlayersOnIceState = useCallback(() => {
    const whiteOnIcePlayers = getOnIcePlayers('white');
    const blackOnIcePlayers = getOnIcePlayers('black');
    
    // Použijeme pouze validní klíče
    const whiteKeys = whiteOnIcePlayers.filter(p => p && p.key).map(p => p.key);
    const blackKeys = blackOnIcePlayers.filter(p => p && p.key).map(p => p.key);
    
    // Vytvoříme nové sety
    const newWhiteSet = new Set(whiteKeys);
    const newBlackSet = new Set(blackKeys);
    
    // DEBUG: Výpis aktuálního stavu pro obě struktury
    console.log('%c[SUB] 🧪 DEBUG STAV HRÁČŮ NA LEDĚ', 'color: orange; font-weight: bold');
    console.log('%c[SUB] teamState.white.onIce:', 'color: skyblue', 
      whiteOnIcePlayers.map(p => p.surname));
    console.log('%c[SUB] teamState.black.onIce:', 'color: skyblue', 
      blackOnIcePlayers.map(p => p.surname));
    console.log('%c[SUB] playersOnIceState.white:', 'color: yellow', 
      [...playersOnIceState.white].map(k => {
        const player = teams.white.players.find(p => p.key === k);
        return player ? player.surname : k;
      }));
    console.log('%c[SUB] playersOnIceState.black:', 'color: yellow', 
      [...playersOnIceState.black].map(k => {
        const player = teams.black.players.find(p => p.key === k);
        return player ? player.surname : k;
      }));
    
    // Porovnáme s aktuálním stavem, abychom zjistili, jestli došlo ke změně
    const whiteChanged = !areSetsSame(playersOnIceState.white, newWhiteSet);
    const blackChanged = !areSetsSame(playersOnIceState.black, newBlackSet);
    
    if (whiteChanged || blackChanged) {
      // Logování změn
      if (whiteChanged) {
        console.log("%c[SUB] ⚪ ZMĚNA bílého týmu na ledě:", "color: lime; font-weight: bold", {
          před: [...playersOnIceState.white].map(k => {
            const player = teams.white.players.find(p => p.key === k);
            return player ? player.surname : k;
          }),
          po: whiteOnIcePlayers.map(p => p.surname)
        });
      }
      if (blackChanged) {
        console.log("%c[SUB] ⚫ ZMĚNA černého týmu na ledě:", "color: lime; font-weight: bold", {
          před: [...playersOnIceState.black].map(k => {
            const player = teams.black.players.find(p => p.key === k);
            return player ? player.surname : k;
          }),
          po: blackOnIcePlayers.map(p => p.surname)
        });
      }
      
      // Aktualizujeme state pro zobrazení
      setPlayersOnIceState({
        white: newWhiteSet,
        black: newBlackSet
      });
      
      // Force render - způsobí překreslení i když by se React normálně nepřekreslil
      setGameTime(t => t);
    } else {
      console.log("%c[SUB] 🟰 Žádná změna v týmech na ledě", "color: gray");
    }
  }, [getOnIcePlayers, playersOnIceState.white, playersOnIceState.black, teams]);

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

    // Rozdělení dle dresů
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

    // Zajistíme brankáře
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
            name: 'Náhradník', 
            surname: 'Gólman', 
            position: 'brankář', 
            level: 3, 
            attendance: 75,
            key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})
          };
          while (teamPlayers.some(p => p.key === backupGoalie.key) || 
                 otherTeamPlayers.some(p => p.key === backupGoalie.key)) {
            backupGoalie.key += '_';
          }
          teamPlayers.push(backupGoalie);
        }
      }
    };
    
    ensureGoalie(whiteAssignedPlayers, blackAssignedPlayers);
    ensureGoalie(blackAssignedPlayers, whiteAssignedPlayers);

    // Seřadíme hráče podle pozice
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
        penalties: 0,
        blocks: 0,
        shots: 0,
        saves: 0,
        savePercentage: 0,
        shotsAgainst: 0,
        isPlayer: player.isPlayer || false
      };
    });
    setPlayerStats(initialStats);

    // Inicializace dynamického stavu
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

    // Inicializace bude provedena po načtení týmů a jejich stavu
    setTimeout(() => {
      // KLÍČOVÉ: Nastavíme počáteční stav hráčů na ledě pro UI
      if (teamState?.white?.onIce && teamState?.black?.onIce) {
        const whiteOnIceSet = new Set(teamState.white.onIce.map(p => p.key));
        const blackOnIceSet = new Set(teamState.black.onIce.map(p => p.key));
        
        setPlayersOnIceState({
          white: whiteOnIceSet,
          black: blackOnIceSet
        });
        
        console.log("✅ Initial players on ice state:", {
          white: Array.from(whiteOnIceSet),
          black: Array.from(blackOnIceSet)
        });
      }
    }, 100);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys]);

  // --- NOVÝ efekt pro automatickou aktualizaci playersOnIceState ---
  useEffect(() => {
    // Když se změní teamState, aktualizujeme i playersOnIceState
    updatePlayersOnIceState();
  }, [
    updatePlayersOnIceState,
    teamState?.white?.onIce, 
    teamState?.black?.onIce
  ]);

  // --- Find Player Team Color ---
  const findPlayerTeamColor = useCallback(() => {
    if (teams.white.players?.some(p => p.isPlayer)) return 'white';
    if (teams.black.players?.some(p => p.isPlayer)) return 'black';
    return null;
  }, [teams]);

  // --- Is Player On Ice ---
  const isPlayerOnIce = useCallback((teamColor) => {
    if (!teamColor) return false;
    
    // OPRAVA: Používáme playersOnIceState místo teamState
    if (!teams[teamColor]) return false;
    
    const player = teams[teamColor].players.find(p => p.isPlayer);
    if (!player || !player.key) return false;
    
    return playersOnIceState[teamColor].has(player.key);
  }, [teams, playersOnIceState]);

  // --- Generate Special Action ---
  const generateSpecialAction = useCallback((playerTeamColor, currentTime) => {
    if (!teamState) return;
    
    const currentTeamState = teamState;
    const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';

    const player = currentTeamState[playerTeamColor]?.onIce.find(p => p.isPlayer);
    if (!player) return;

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
        score,
        period: currentPeriod,
        timeRemaining: GAME_DURATION_SECONDS - currentTime
      }
    };

    setSpecialAction(fullAction);
  }, [teamState, score, currentPeriod]);

  // --- Handle Special Action Result ---
  const handleSpecialActionResult = useCallback((option) => {
    if (!specialAction) return;

    const player = specialAction.player;
    const playerLevel = player.level || 1;
    const playerFatigue = specialAction.playerFatigue;
    const fatigueImpact = playerFatigue / MAX_FATIGUE;

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
    let generatedEvent = null;

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
              setScore(prev => ({ 
                ...prev, 
                [specialAction.playerTeamColor]: prev[specialAction.playerTeamColor] + 1 
              }));
              generatedEvent = { 
                type: 'goal', 
                player: player, 
                assistant: null, 
                goalieKey: specialAction.opposingGoalie?.key, 
                team: specialAction.playerTeamColor,
                id: `${specialAction.time}-special-goal-${player.key}-${Math.random()}`
              };
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
            eventType = 'pass';
          } else {
            resultMessage = `Akce se podařila! Získal jsi kontrolu nad pukem.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci (${option.text}).`;
            eventType = 'success';
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
          };
          console.log(`🛡️ Special Action created DEFENSE event:`, generatedEvent);
          break;
        default:
          resultMessage = `Akce byla úspěšná!`;
          eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`;
          eventType = 'success';
      }
    } else {
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          resultMessage = `Bohužel, akce se nepovedla podle plánu.`;
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí (${option.text}).`;
          eventType = 'miss';
          if (option.id.includes('shoot') || option.id === 'quick_shot') {
            generatedEvent = { 
              type: 'miss', 
              player: player, 
              team: specialAction.playerTeamColor,
              id: `${specialAction.time}-special-miss-${player.key}-${Math.random()}`
            };
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
            eventType = 'goal';
            setScore(prev => ({ 
              ...prev, 
              [opposingTeamColor]: prev[opposingTeamColor] + 1 
            }));
            const opponentEvent = {
              time: specialAction.time, 
              type: 'goal', 
              team: opposingTeamColor,
              description: `Gól soupeře po neúspěšné obraně hráče ${player.name} ${player.surname}.`,
              id: `${specialAction.time}-goal-${opposingTeamColor}-${Math.random()}`
            };
            console.log(`🚨 Special Action created OPPONENT GOAL event:`, opponentEvent);
            setEvents(prev => [opponentEvent, ...prev]);
            setLastEvent(opponentEvent);
            processedEventRef.current = null;
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

    // Přidáme hlavní událost popisující akci hráče
    if (eventType !== 'goal' || specialAction.playerTeamColor === lastEvent?.team) {
      const actionEvent = {
        type: eventType,
        time: specialAction.time,
        player: specialAction.player,
        team: specialAction.playerTeamColor,
        description: eventDescription,
        id: `${specialAction.time}-${eventType}-${player.key}-${Math.random()}`
      };
      
      if (eventType === 'goal') {
        actionEvent.goalieKey = specialAction.opposingGoalie?.key;
      } else if (eventType === 'save') {
        actionEvent.shooter = player;
      } else if (eventType === 'defense') {
        actionEvent.attacker = null;
      }
      
      console.log(`🎮 Special Action created user action event:`, actionEvent);
      setEvents(prev => [actionEvent, ...prev]);
      setLastEvent(actionEvent);
      processedEventRef.current = null;
    }

    // Zvýrazníme hráče
    triggerHighlight(specialAction.player.key);

    // Vytvoříme výsledek pro zobrazení v UI speciální akce
    const actionResult = { success: isSuccess, message: resultMessage, eventType };

    // Zavřeme okno speciální akce a pokračujeme ve hře po krátké pauze
    setTimeout(() => {
      setSpecialAction(null);
      if (gameState === 'paused') {
        setGameState('playing');
      }
    }, 2500);

    return actionResult;
  }, [specialAction, triggerHighlight, setEvents, setLastEvent, setScore, gameState]);

  // --- Handle Start/Pause ---
  const handleStartPause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused' || gameState === 'warmup') {
      setGameState('playing');
    }
  };

  // --- Change Game Speed ---
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

  // --- Handle Player Substitution ---
  const handlePlayerSubstitution = useCallback((teamColor) => {
    const currentTime = gameTime;

    console.log(`%c[SUB] 🔄 MANUÁLNÍ střídání pro tým ${teamColor} (čas: ${currentTime})`, 'color: yellow; font-weight: bold');
    const currentTeamState = teamState;

    if (!currentTeamState || !currentTeamState[teamColor]) {
      console.error(`%c[SUB] ❌ Chyba střídání: Neexistuje stav týmu ${teamColor}`, 'color: red; font-weight: bold');
      return;
    }

    const team = currentTeamState[teamColor];
    const player = teams[teamColor]?.players.find(p => p.isPlayer);

    if (!player) {
      console.error(`%c[SUB] ❌ Chyba střídání: Nenalezen objekt hráče v seznamu týmu ${teamColor}`, 'color: red; font-weight: bold');
      return;
    }

    const playerKey = player.key;
    // KONTROLA: odkud bereme informaci o hráči na ledě
    const isOnIce = team.onIce.some(p => p && p.key === playerKey);
    const isInPlayersOnIce = playersOnIceState[teamColor].has(playerKey);
    const isOnBench = team.bench.some(p => p && p.key === playerKey);

    console.log(`%c[SUB] 📊 Stav hráče ${playerName} (${teamColor}):`, 'color: cyan; font-weight: bold', {
      isOnIceTeamState: isOnIce, 
      isOnIceUIState: isInPlayersOnIce,
      isOnBench, 
      fatigue: Math.round(team.fatigue[playerKey] || 0)
    });

    if (isOnIce !== isInPlayersOnIce) {
      console.log(`%c[SUB] ⚠️ NESOULAD STAVŮ: teamState (${isOnIce}) vs playersOnIceState (${isInPlayersOnIce})`, 
        'color: red; font-weight: bold');
    }

    if (isOnIce) {
      const playerOnIceObject = team.onIce.find(p => p.key === playerKey);
      if (!playerOnIceObject) { 
        console.error(`%c[SUB] ❌ Chyba konzistence: Hráč na ledě, ale objekt nenalezen`, 'color: red; font-weight: bold'); 
        return; 
      }

      // Hráči na ledě a lavičce v tepové formě
      console.log(`%c[SUB] 🏒 Hráči na ledě (${team.onIce.length}):`, 'color: lightgreen', 
        team.onIce.map(p => p.surname));
      console.log(`%c[SUB] 🪑 Hráči na lavičce (${team.bench.length}):`, 'color: orange', 
        team.bench.map(p => p.surname));

      // Najdeme nejméně unaveného AI hráče na lavičce (ne brankáře)
      const restedBenchPlayer = [...team.bench]
        .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
        .sort((a, b) => (team.fatigue[a.key] ?? MAX_FATIGUE) - (team.fatigue[b.key] ?? MAX_FATIGUE))[0];

      if (!restedBenchPlayer) {
        console.warn(`%c[SUB] ⚠️ Na lavičce nejsou žádní odpočatí AI hráči pro výměnu`, 'color: orange; font-weight: bold');
        return;
      }

      console.log(`%c[SUB] ➡️ Hráč ${playerName} jde z LEDU, ${restedBenchPlayer.surname} jde NA LED`, 'color: purple; font-weight: bold');

      // Provedeme výměnu
      const newOnIce = team.onIce.filter(p => p.key !== playerKey);
      newOnIce.push(restedBenchPlayer);
      const newBench = team.bench.filter(p => p.key !== restedBenchPlayer.key);
      newBench.push(playerOnIceObject);

      console.log(`%c[SUB] 📊 Nové složení:`, 'color: pink');
      console.log(`%c[SUB] 🏒 Nově na ledě (${newOnIce.length}):`, 'color: lightgreen', newOnIce.map(p => p.surname));
      console.log(`%c[SUB] 🪑 Nově na lavičce (${newBench.length}):`, 'color: orange', newBench.map(p => p.surname));

      updateTeamState(teamColor, {
        onIce: newOnIce,
        bench: newBench,
        lastShiftChange: currentTime
      });

      const subEvent = {
        time: currentTime, 
        type: 'substitution', 
        team: teamColor,
        description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️`,
        id: `${currentTime}-sub-${playerKey}-off`
      };
      setEvents(prev => [subEvent, ...prev]);
      triggerHighlight([playerKey, restedBenchPlayer.key]);
      processedEventRef.current = null;
      console.log(`%c[SUB] ✅ Událost střídání vytvořena`, 'color: green; font-weight: bold');
      
      // KLÍČOVÉ: Aktualizujeme stav hráčů na ledě pro UI
      // Po vystřídání manuálního hráče
      setTimeout(() => {
        console.log(`%c[SUB] 📡 Aktualizace UI po manuálním střídání (hráč jde z ledu)`, 'color: deepskyblue; font-weight: bold');
        updatePlayersOnIceState();
      }, 50);

    } else if (isOnBench) {
      const playerOnBenchObject = team.bench.find(p => p.key === playerKey);
      if (!playerOnBenchObject) { 
        console.error(`%c[SUB] ❌ Chyba konzistence: Hráč na lavičce, ale objekt nenalezen`, 'color: red; font-weight: bold'); 
        return; 
      }

      // Hráči na ledě a lavičce v tepové formě
      console.log(`%c[SUB] 🏒 Hráči na ledě (${team.onIce.length}):`, 'color: lightgreen', 
        team.onIce.map(p => p.surname));
      console.log(`%c[SUB] 🪑 Hráči na lavičce (${team.bench.length}):`, 'color: orange', 
        team.bench.map(p => p.surname));

      // Najdeme nejvíce unaveného AI hráče na ledě (ne brankáře)
      const tiredOnIcePlayer = [...team.onIce]
        .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
        .sort((a, b) => (team.fatigue[b.key] ?? 0) - (team.fatigue[a.key] ?? 0))[0];

      if (!tiredOnIcePlayer) {
        console.warn(`%c[SUB] ⚠️ Na ledě nejsou žádní unavení AI hráči pro výměnu`, 'color: orange; font-weight: bold');
        return;
      }

      console.log(`%c[SUB] ➡️ Hráč ${playerName} jde NA LED, ${tiredOnIcePlayer.surname} jde z LEDU`, 'color: green; font-weight: bold');

      // Provedeme výměnu
      const newBench = team.bench.filter(p => p.key !== playerKey);
      newBench.push(tiredOnIcePlayer);
      const newOnIce = team.onIce.filter(p => p.key !== tiredOnIcePlayer.key);
      newOnIce.push(playerOnBenchObject);

      console.log(`%c[SUB] 📊 Nové složení:`, 'color: pink');
      console.log(`%c[SUB] 🏒 Nově na ledě (${newOnIce.length}):`, 'color: lightgreen', newOnIce.map(p => p.surname));
      console.log(`%c[SUB] 🪑 Nově na lavičce (${newBench.length}):`, 'color: orange', newBench.map(p => p.surname));

      updateTeamState(teamColor, {
        onIce: newOnIce,
        bench: newBench,
        lastShiftChange: currentTime
      });

      const subEvent = {
        time: currentTime, 
        type: 'substitution', 
        team: teamColor,
        description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️`,
        id: `${currentTime}-sub-${playerKey}-on`
      };
      setEvents(prev => [subEvent, ...prev]);
      triggerHighlight([playerKey, tiredOnIcePlayer.key]);
      processedEventRef.current = null;
      console.log(`%c[SUB] ✅ Událost střídání vytvořena`, 'color: green; font-weight: bold');
      
      // KLÍČOVÉ: Aktualizujeme stav hráčů na ledě pro UI 
      // Po vystřídání manuálního hráče
      setTimeout(() => {
        console.log(`%c[SUB] 📡 Aktualizace UI po manuálním střídání (hráč jde na led)`, 'color: deepskyblue; font-weight: bold');
        updatePlayersOnIceState();
      }, 50);

    } else {
      console.error(`%c[SUB] ❌ Hráč není ani na ledě ani na lavičce!`, 'color: red; font-weight: bold');
    }
  }, [gameTime, teams, playerName, triggerHighlight, updateTeamState, teamState, setEvents, updatePlayersOnIceState, playersOnIceState]);

  // --- Handle Exit ---
  const handleExit = useCallback(() => {
    if (gameState === 'finished') {
      if (onGameComplete) onGameComplete({ score, events, playerStats });
    } else {
      setShowExitConfirm(true);
      if (gameState === 'playing') setGameState('paused');
    }
  }, [gameState, score, events, playerStats, onGameComplete]);

  // --- Handle Confirm Exit ---
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    if (onGameComplete) onGameComplete({
      score,
      events,
      playerStats,
      abandoned: true
    });
  }, [score, events, playerStats, onGameComplete]);

  // --- Handle Cancel Exit ---
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // --- Scroll event log ---
  useEffect(() => { 
    if (eventLogRef.current) eventLogRef.current.scrollTop = 0; 
  }, [events]);

  // --- Update stats for each event ---
  useEffect(() => {
    events.forEach((ev) => {
      if (ev.id && !processedEventIdsRef.current.has(ev.id)) {
        processedEventIdsRef.current.add(ev.id);
  
        setPlayerStats(prevStats => {
          // Provádíme hlubokou kopii stávajících statistik
          const newStats = JSON.parse(JSON.stringify(prevStats));
  
          // Pomocná funkce pro aktualizaci statistiky
          const updateStat = (playerKey, statName, value = 1) => {
            if (playerKey && newStats[playerKey]) {
              newStats[playerKey][statName] = (newStats[playerKey][statName] || 0) + value;
              console.log(`🔹 Updated stat ${statName} for ${playerKey} to ${newStats[playerKey][statName]}`);
            } else if (playerKey) {
              console.warn(`⚠️ Player key ${playerKey} not found in stats for event type ${ev.type}`);
            }
          };
  
          // Pomocná funkce pro aktualizaci statistik brankáře
          const updateGoalieStats = (goalieKey, isGoal) => {
            if (goalieKey && newStats[goalieKey]) {
              newStats[goalieKey].shotsAgainst = (newStats[goalieKey].shotsAgainst || 0) + 1;
              if (!isGoal) {
                newStats[goalieKey].saves = (newStats[goalieKey].saves || 0) + 1;
              }
              newStats[goalieKey].savePercentage = newStats[goalieKey].shotsAgainst > 0
                ? Math.round((newStats[goalieKey].saves / newStats[goalieKey].shotsAgainst) * 100)
                : 0;
              console.log(`🧤 Updated goalie ${goalieKey}: SA=${newStats[goalieKey].shotsAgainst}, S=${newStats[goalieKey].saves}, %=${newStats[goalieKey].savePercentage}, isGoal=${isGoal}`);
            } else if (goalieKey) {
              console.warn(`⚠️ Goalie key ${goalieKey} not found in stats for event type ${ev.type}`);
            }
          };
  
          // Na základě typu události aktualizujeme statistiky
          switch (ev.type) {
            case 'goal':
              if (ev.player?.key) {
                updateStat(ev.player.key, 'goals', 1);
                updateStat(ev.player.key, 'shots', 1);
              }
              if (ev.assistant?.key) {
                updateStat(ev.assistant.key, 'assists', 1);
              }
              if (ev.goalieKey) {
                updateGoalieStats(ev.goalieKey, true);
              }
              break;
  
            case 'save':
              if (ev.player?.key) {
                updateGoalieStats(ev.player.key, false);
              }
              if (ev.shooter?.key) {
                updateStat(ev.shooter.key, 'shots', 1);
              }
              break;
  
            case 'miss':
              if (ev.player?.key) {
                updateStat(ev.player.key, 'shots', 1);
              }
              break;
  
            case 'defense':
              if (ev.attacker?.key) {
                updateStat(ev.attacker.key, 'shots', 1);
              }
              if (ev.player?.key) {
                // Obránci mají vyšší šanci na zapsání bloku
                const blockChance = ev.player.position === 'obránce' ? 0.6 : 0.3;
                if (Math.random() < blockChance) {
                  updateStat(ev.player.key, 'blocks', 1);
                }
              }
              break;
  
            case 'penalty':
              if (ev.player?.key && ev.penaltyMinutes) {
                updateStat(ev.player.key, 'penalties', ev.penaltyMinutes);
              }
              break;
  
            default:
              // Pro ostatní typy událostí se statistiky nezpracovávají
              break;
          }
  
          return newStats;
        });
      }
    });
  }, [events]);

  // --- Fatigue Update Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    
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
                newFatigue[player.key] = Math.round(updatedFatigue);
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
                newFatigue[player.key] = Math.round(updatedFatigue);
                fatigueChanged = true;
              }
            }
          });

          return fatigueChanged ? { ...prevTeamState, fatigue: newFatigue } : prevTeamState;
        });
      };

      updateFatigueForTeam('white');
      updateFatigueForTeam('black');
    }, 1000);

    return () => {
      clearInterval(fatigueInterval);
    };
  }, [gameState, gameSpeed, updateTeamState]);

  // --- Aktualizace času na ledě ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const toiInterval = setInterval(() => {
      setPlayerStats(prevStats => {
        const newStats = { ...prevStats };
        let statsChanged = false;

        if (!teamState) return prevStats;

        ['white', 'black'].forEach(teamColor => {
          const playersOnIceKeys = new Set(
            teamState[teamColor]?.onIce?.map(p => p?.key).filter(Boolean) || []
          );

          playersOnIceKeys.forEach(playerKey => {
            if (newStats[playerKey]) {
              newStats[playerKey].timeOnIce = (newStats[playerKey].timeOnIce || 0) + gameSpeed;
              statsChanged = true;
            }
          });
        });

        return statsChanged ? newStats : prevStats;
      });
    }, 1000);

    return () => clearInterval(toiInterval);
  }, [gameState, gameSpeed, teamState]);
  
  // --- Game Simulation Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    let intervalId;

    const gameTick = () => {
      setGameTime(prevTime => {
        const timeIncrement = gameSpeed;
        const newTime = Math.min(GAME_DURATION_SECONDS, prevTime + timeIncrement);

        if (newTime >= GAME_DURATION_SECONDS && prevTime < GAME_DURATION_SECONDS) {
          setGameState('finished');
          console.log("🏁 Game finished!");
          return GAME_DURATION_SECONDS;
        }
        
        if (gameState !== 'playing') return prevTime;

        // --- Změna periody ---
        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        const oldPeriod = Math.min(3, Math.floor(prevTime / PERIOD_DURATION_SECONDS) + 1);
        
        if (newPeriod > oldPeriod) {
          setCurrentPeriod(newPeriod);
          const periodStartTime = oldPeriod * PERIOD_DURATION_SECONDS;
          const periodChangeEvent = { 
            type: 'period_change', 
            time: periodStartTime, 
            description: `Začala ${newPeriod}. třetina!`, 
            period: newPeriod 
          };
          setEvents(prev => [periodChangeEvent, ...prev]);
          setLastEvent(periodChangeEvent);
          processedEventRef.current = null;
        }

        // --- Event Generation Logic ---
        const currentIntervalCount = Math.floor(newTime / EVENT_CHECK_INTERVAL);
        const prevIntervalCount = Math.floor(prevTime / EVENT_CHECK_INTERVAL);

        if (currentIntervalCount > prevIntervalCount) {
          const intervalsPassed = currentIntervalCount - prevIntervalCount;
          for (let i = 1; i <= intervalsPassed; i++) {
            const checkTime = (prevIntervalCount + i) * EVENT_CHECK_INTERVAL;
            if (checkTime > GAME_DURATION_SECONDS) break;
            if (events.some(e => e.time === checkTime)) continue;

            // Získání aktuálního stavu týmů pro rozhodování
            const currentTeamState = teamState;
            if (!currentTeamState) continue;

            const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
            const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';

            const attackingTeamState = currentTeamState[attackingTeamId];
            const defendingTeamState = currentTeamState[defendingTeamId];
            const attackingTeamOnIce = attackingTeamState?.onIce ?? [];
            const defendingTeamOnIce = defendingTeamState?.onIce ?? [];
            const fatigueData = { 
              ...currentTeamState.white.fatigue, 
              ...currentTeamState.black.fatigue 
            };

            if (attackingTeamOnIce.length < 5 || defendingTeamOnIce.length < 5) continue;

            const eventRoll = Math.random();
            let eventType = 'attack';
            if (eventRoll < 0.08) eventType = 'penalty';

            let newEvent = { 
              time: checkTime, 
              team: attackingTeamId, 
              id: `${checkTime}-${attackingTeamId}-${Math.random()}` 
            };

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
              const defender = defendersOnIce.length > 0 
                ? defendersOnIce[Math.floor(Math.random() * defendersOnIce.length)] 
                : null;

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
              if (outcomeRoll < goalChance) {
                setScore(prev => ({ 
                  ...prev, 
                  [attackingTeamId]: prev[attackingTeamId] + 1 
                }));
                const possibleAssists = attackingTeamOnIce.filter(p => p && p.key !== attacker.key && p.position !== 'brankář');
                const assistant = possibleAssists.length > 0 
                  ? possibleAssists[Math.floor(Math.random() * possibleAssists.length)] 
                  : null;

                newEvent.type = 'goal';
                newEvent.player = attacker;
                newEvent.assistant = assistant;
                newEvent.goalieKey = goalie?.key;
                newEvent.description = `🚨 GÓÓÓL! ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) skóruje${assistant ? ` po přihrávce od ${assistant.name} ${assistant.surname}${assistant.isPlayer ? ' (Tvoje asistence!)' : ''}` : ''}!`;
                console.log(`🚨 Generated GOAL event with goalieKey=${goalie?.key}:`, attacker.key, assistant?.key);
                triggerHighlight([attacker.key, assistant?.key].filter(Boolean));
              } else if (outcomeRoll < goalChance + 0.35 || !goalie) {
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
              } else if (defender) {
                newEvent.type = 'defense';
                newEvent.player = defender;
                newEvent.attacker = attacker;
                newEvent.description = `🛡️ Blok! ${defender.name} ${defender.surname} (${defendingTeamId === 'white' ? 'Bílí' : 'Černí'}) zastavil střelu ${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Tebe!)' : ''}!`;
                console.log(`🛡️ Generated DEFENSE event:`, defender.key, attacker.key);
                triggerHighlight([defender.key, attacker.key]);
              } else {
                newEvent.type = 'turnover';
                newEvent.player = attacker;
                newEvent.description = `🔄 Ztráta puku týmem ${attackingTeamId === 'white' ? 'Bílých' : 'Černých'}.`;
              }
            }
            setLastEvent(newEvent);
            setEvents(prev => [newEvent, ...prev]);
            processedEventRef.current = null;
          }
        }

        // --- AUTOMATICKÉ STŘÍDÁNÍ LOGIC ---
        const currentShiftIntervalCount = Math.floor(newTime / SHIFT_DURATION);
        const prevShiftIntervalCount = Math.floor(prevTime / SHIFT_DURATION);

        if (currentShiftIntervalCount > prevShiftIntervalCount) {
          for (let i = prevShiftIntervalCount + 1; i <= currentShiftIntervalCount; i++) {
            const substitutionCheckTime = i * SHIFT_DURATION;
            if (substitutionCheckTime > GAME_DURATION_SECONDS) break;

            // Clear recently substituted players
            recentlySubstitutedRef.current.clear();

            ['white', 'black'].forEach(teamColor => {
              const subKey = `${substitutionCheckTime}-${teamColor}`;

              if (substitutionTimesRef.current.has(subKey)) {
                return;
              }

              const performSubstitution = async () => {
                if (substitutionTimesRef.current.has(subKey)) {
                  return;
                }

                updateTeamState(teamColor, prevTeamState => {
                  if (substitutionTimesRef.current.has(subKey) || 
                      !prevTeamState || 
                      !prevTeamState.onIce || 
                      !prevTeamState.bench || 
                      !prevTeamState.fatigue) {
                    return prevTeamState;
                  }

                  const timeSinceLastChange = substitutionCheckTime - (prevTeamState.lastShiftChange || 0);

                  const tiredOnIce = prevTeamState.onIce
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer && !recentlySubstitutedRef.current.has(p.key))
                    .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));

                  const restedOnBench = prevTeamState.bench
                    .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer && !recentlySubstitutedRef.current.has(p.key))
                    .sort((a, b) => (prevTeamState.fatigue[a.key] ?? MAX_FATIGUE) - (prevTeamState.fatigue[b.key] ?? MAX_FATIGUE));

                  // DEBUG: Vypíšeme stav před střídáním
                  console.log(`%c[SUB] 📊 ${teamColor} STAV před střídáním:`, 'color: #ff9900; font-weight: bold');
                  console.log(`%c[SUB] Na ledě (${prevTeamState.onIce.length})`, 'color: #33ccff', 
                    prevTeamState.onIce.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));
                  console.log(`%c[SUB] Unavení na ledě (${tiredOnIce.length})`, 'color: #ff6666', 
                    tiredOnIce.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));
                  console.log(`%c[SUB] Na lavičce (${prevTeamState.bench.length})`, 'color: #33cc33', 
                    prevTeamState.bench.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));
                  console.log(`%c[SUB] Odpočatí na lavičce (${restedOnBench.length})`, 'color: #00cc00', 
                    restedOnBench.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));

                  const hasHighlyTiredPlayer = tiredOnIce.length > 0 && (prevTeamState.fatigue[tiredOnIce[0].key] ?? 0) > 80;
                  const shouldChange = (timeSinceLastChange >= SHIFT_DURATION || hasHighlyTiredPlayer) && restedOnBench.length > 0 && tiredOnIce.length > 0;

                  // DEBUG: Vypíšeme rozhodovací podmínky
                  console.log(`%c[SUB] 🔍 Rozhodnutí o střídání:`, 'color: #cc66ff; font-weight: bold', {
                    timeSinceLastChange,
                    SHIFT_DURATION,
                    hasHighlyTiredPlayer,
                    tiredOnIceCount: tiredOnIce.length,
                    restedOnBenchCount: restedOnBench.length,
                    shouldChange
                  });

                  if (!shouldChange) {
                    if (restedOnBench.length === 0 || tiredOnIce.length === 0) {
                      substitutionTimesRef.current.add(subKey);
                      console.log(`%c[SUB] ⏭️ Nelze střídat - nejsou hráči`, 'color: #ff6600');
                      return { ...prevTeamState, lastShiftChange: substitutionCheckTime };
                    }
                    console.log(`%c[SUB] ⏭️ Stále ne je čas na střídání`, 'color: #ff6600');
                    return prevTeamState;
                  }

                  const numToChange = Math.min(
                    tiredOnIce.length,
                    restedOnBench.length,
                    hasHighlyTiredPlayer ? Math.max(1, Math.ceil(tiredOnIce.length / 2)) : 3
                  );

                  if (numToChange <= 0) { 
                    console.log(`%c[SUB] ⚠️ numToChange <= 0, nebude stridat!`, 'color: red; font-weight: bold');
                    return prevTeamState; 
                  }

                  const playersOut = tiredOnIce.slice(0, numToChange);
                  const playersOutKeys = new Set(playersOut.map(p => p.key));
                  const playersIn = restedOnBench.slice(0, numToChange);
                  const playersInKeys = new Set(playersIn.map(p => p.key));

                  console.log(`%c[SUB] 🔀 Hráči ke střídání:`, 'color: #ff00ff; font-weight: bold');
                  console.log(`%c[SUB] NA LED nastoupí (${playersIn.length}):`, 'color: #00cc00', 
                    playersIn.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));
                  console.log(`%c[SUB] Z LEDU odejdou (${playersOut.length}):`, 'color: #ff6666', 
                    playersOut.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key] || 0)}%)`));

                  // Vytvoříme nové pole hráčů na ledě a na lavičce
                  const newOnIce = [
                    ...prevTeamState.onIce.filter(p => p && !playersOutKeys.has(p.key)),
                    ...playersIn
                  ];
                  
                  const newBench = [
                    ...prevTeamState.bench.filter(p => p && !playersInKeys.has(p.key)),
                    ...playersOut
                  ];

                  // Ověření, že velikosti polí jsou správné
                  console.log(`%c[SUB] 📏 Kontrola změn:`, 'color: magenta;');
                  console.log(`%c[SUB] Počet hráčů na ledě před: ${prevTeamState.onIce.length}, po: ${newOnIce.length}`, 
                              prevTeamState.onIce.length === newOnIce.length ? 'color: green;' : 'color: red; font-weight: bold');
                  console.log(`%c[SUB] Počet hráčů na lavičce před: ${prevTeamState.bench.length}, po: ${newBench.length}`, 
                              prevTeamState.bench.length === newBench.length ? 'color: green;' : 'color: red; font-weight: bold');
                  
                  // Zajistíme, aby každý hráč byl pouze jednou buď na ledě, nebo na lavičce
                  const allPlayersSet = new Set([...newOnIce.map(p => p.key), ...newBench.map(p => p.key)]);
                  console.log(`%c[SUB] Celkem unikátních hráčů po střídání: ${allPlayersSet.size}`, 
                    allPlayersSet.size === (prevTeamState.onIce.length + prevTeamState.bench.length) 
                      ? 'color: green' : 'color: red; font-weight: bold');

                  // Add players to "quarantine" for this tick
                  playersOut.forEach(p => { if(p && p.key) recentlySubstitutedRef.current.add(p.key) });
                  playersIn.forEach(p => { if(p && p.key) recentlySubstitutedRef.current.add(p.key) });

                  const playersInNames = playersIn.map(p => p.surname).join(", ");
                  const playersOutNames = playersOut.map(p => p.surname).join(", ");

                  if (playersInNames || playersOutNames) {
                    // Vytvoříme událost střídání
                    const subEvent = {
                      time: substitutionCheckTime,
                      type: 'substitution',
                      team: teamColor,
                      description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames || 'Nikdo'} ⬆️ | ${playersOutNames || 'Nikdo'} ⬇️`,
                      id: `${substitutionCheckTime}-sub-${teamColor}-${Math.random()}`
                    };
                    
                    // Přidáme událost a vyvoláme zvýraznění
                    setEvents(prev => [subEvent, ...prev]);
                    triggerHighlight([...playersInKeys, ...playersOutKeys]);
                    processedEventRef.current = null;

                    // Logování pro lepší debugování
                    console.log(`%c[SUB] ✅ ${teamColor.toUpperCase()} STŘÍDÁNÍ PROVEDENO:`, 'color: lime; font-weight: bold');
                    console.log(`%c[SUB] ${playersInNames}`, 'color: green', 'na led ⬆️');
                    console.log(`%c[SUB] ${playersOutNames}`, 'color: red', 'z ledu ⬇️');
                    
                    // DEBUG: Výpis složení týmu po střídání
                    console.log(`%c[SUB] 🏒 Složení ${teamColor} na ledě PO střídání:`, 'color: cyan', 
                      newOnIce.map(p => p.surname));
                    console.log(`%c[SUB] 🪑 Složení ${teamColor} na lavičce PO střídání:`, 'color: orange', 
                      newBench.map(p => p.surname));
                    
                    // DEBUG: Ověříme, že pole jsou správná 
                    const onIceCheck = new Set(newOnIce.map(p => p.key));
                    const onBenchCheck = new Set(newBench.map(p => p.key));
                    
                    // Kontrolujeme, že žádný hráč není současně na ledě i na lavičce
                    const intersection = [...onIceCheck].filter(key => onBenchCheck.has(key));
                    if (intersection.length > 0) {
                      console.log(`%c[SUB] ⚠️ CHYBA: Někteří hráči jsou současně na ledě i na lavičce!`, 'color: red; font-weight: bold', 
                        intersection.map(key => {
                          const player = [...newOnIce, ...newBench].find(p => p.key === key);
                          return player ? player.surname : key;
                        }));
                    }
                  } else {
                    console.warn(`%c[SUB] ⚠️ Nelze vytvořit událost střídání - chybí jména hráčů.`, 'color: orange; font-weight: bold');
                  }

                  // Označíme toto střídání jako provedené
                  substitutionTimesRef.current.add(subKey);

                  // Vrátíme nový stav týmu
                  console.log(`%c[SUB] 🔄 Vracíme nový stav týmu ${teamColor} po střídání`, 'color: #9933ff');
                  return {
                    ...prevTeamState,
                    onIce: newOnIce,
                    bench: newBench,
                    lastShiftChange: substitutionCheckTime
                  };
                });
                
                // KLÍČOVÁ ZMĚNA: Explicitní aktualizace UI stavu pro hráče na ledě po AUTO střídání 
                setTimeout(() => {
                  // Kontrolní výpis - co ukazuje teamState PŘED aktualizací UI
                  if (teamState && teamState[teamColor]) {
                    console.log(`%c[SUB] 🔍 Kontrola teamState.${teamColor}.onIce před aktualizací UI:`, 'color: gold; font-weight: bold',
                      teamState[teamColor].onIce.map(p => p.surname));
                  }
                  
                  // Při automatickém střídání musíme aktualizovat UI stav
                  updatePlayersOnIceState();
                  console.log(`%c[SUB] 🔄 updatePlayersOnIceState() volán po střídání`, 'color: magenta; font-weight: bold');
                }, 50);
                
                // Pro jistotu ještě jedno vynucené překreslení s delším zpožděním
                setTimeout(() => {
                  // Kontrolní výpis - co ukazuje teamState po čase 150ms
                  if (teamState && teamState[teamColor]) {
                    console.log(`%c[SUB] 🧐 Kontrola teamState.${teamColor}.onIce po 150ms:`, 'color: gold; font-weight: bold',
                      teamState[teamColor].onIce.map(p => p.surname));
                    
                    // Porovnání s playersOnIceState
                    console.log(`%c[SUB] 🔍 Porovnání playersOnIceState.${teamColor} s teamState po 150ms:`, 'color: orange');
                    const onIceKeys = new Set(teamState[teamColor].onIce.map(p => p.key));
                    const playersMatch = areSetsSame(onIceKeys, playersOnIceState[teamColor]);
                    console.log(`%c[SUB] Stav se ${playersMatch ? 'SHODUJE ✅' : 'NESHODUJE ❌'}`, 
                      playersMatch ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
                    
                    if (!playersMatch) {
                      console.log(`%c[SUB] 📋 Detail rozdílů:`, 'color: darkred');
                      console.log(`%c[SUB] V teamState, ale ne v playersOnIceState:`, 'color: red', 
                        [...onIceKeys].filter(k => !playersOnIceState[teamColor].has(k)).map(k => {
                          const player = teamState[teamColor].onIce.find(p => p.key === k);
                          return player ? player.surname : k;
                        }));
                      console.log(`%c[SUB] V playersOnIceState, ale ne v teamState:`, 'color: orange', 
                        [...playersOnIceState[teamColor]].filter(k => !onIceKeys.has(k)).map(k => {
                          const player = teams[teamColor].players.find(p => p.key === k);
                          return player ? player.surname : k;
                        }));
                    }
                  }
                  
                  // Vynucené překreslení
                  setGameTime(prev => prev);
                  console.log(`%c[SUB] 🔄 Vynucené překreslení po 150ms`, 'color: fuchsia');
                }, 150);
              };

              performSubstitution();
            });
          }
        }
        
        // --- Kontrola speciálních akcí pro hráče ---
        const currentActionIntervalCount = Math.floor(newTime / SPECIAL_ACTION_INTERVAL);
        const prevActionIntervalCount = Math.floor(prevTime / SPECIAL_ACTION_INTERVAL);

        if (currentActionIntervalCount > prevActionIntervalCount && newTime - lastSpecialActionTime >= MIN_TIME_BETWEEN_ACTIONS) {
          const actionCheckTime = currentActionIntervalCount * SPECIAL_ACTION_INTERVAL;
          if (actionCheckTime <= GAME_DURATION_SECONDS) {
            const playerTeamColor = findPlayerTeamColor();
            if (playerTeamColor && Math.random() < SPECIAL_ACTION_CHANCE) {
              // Použijeme playersOnIceState místo teamState pro kontrolu, zda je hráč na ledě
              const playerOnIce = isPlayerOnIce(playerTeamColor);

              if (playerOnIce) {
                generateSpecialAction(playerTeamColor, actionCheckTime);
                setLastSpecialActionTime(actionCheckTime);
                setGameState('paused');
              }
            }
          }
        }

        return newTime;
      });
    };

    // Spustíme interval, který volá gameTick každou sekundu
    intervalId = setInterval(gameTick, 1000);

    // Funkce pro vyčištění intervalu
    return () => clearInterval(intervalId);
  }, [
    gameState, 
    gameSpeed, 
    events, 
    teamState, 
    findPlayerTeamColor, 
    generateSpecialAction, 
    triggerHighlight, 
    lastSpecialActionTime, 
    updateTeamState,
    updatePlayersOnIceState,
    isPlayerOnIce
  ]);

  // --- Přidaná pomocná funkce k debugování ---
  const forceCompleteUIUpdate = useCallback(() => {
    console.log(`%c[SUB] 🚨 VYNUCENÁ KOMPLETNÍ AKTUALIZACE UI`, 'color: red; font-weight: bold; background-color: yellow; padding: 3px');
    
    // 1. Explicitně aktualizujeme playersOnIceState
    if (teamState) {
      const whiteOnIce = new Set(teamState.white.onIce.map(p => p.key));
      const blackOnIce = new Set(teamState.black.onIce.map(p => p.key));
      
      setPlayersOnIceState({
        white: whiteOnIce,
        black: blackOnIce
      });
      
      console.log(`%c[SUB] ⚪ playersOnIceState.white aktualizováno: ${teamState.white.onIce.length} hráčů`, 'color: white; background-color: green');
      console.log(`%c[SUB] ⚫ playersOnIceState.black aktualizováno: ${teamState.black.onIce.length} hráčů`, 'color: white; background-color: blue');
    }
    
    // 2. Vynucené překreslení
    setGameTime(gt => gt);
    
    // 3. Vynutíme nové renderování s krátkým zpožděním a postupně
    const timeouts = [100, 200, 500, 1000];
    timeouts.forEach(timeout => {
      setTimeout(() => {
        setGameTime(gt => gt);
        console.log(`%c[SUB] 🔄 Vynucené překreslení po ${timeout}ms`, 'color: purple');
      }, timeout);
    });
  }, [teamState]);

  // --- Tlačítko pro vynucené překreslení UI ---
  const renderDebugButton = () => {
    if (gameState === 'finished') return null;
    
    return (
      <button
        onClick={forceCompleteUIUpdate}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white"
      >
        Vynutit aktualizaci UI
      </button>
    );
  };

  // --- Main Render ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">{renderDebugButton()}

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={handleExit}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium",
              "bg-red-600/80 hover:bg-red-600 text-white",
              (gameState === 'finished') && "animate-pulse"
            )}
            title={gameState === 'finished' ? "Zobrazit výsledky" : "Opustit zápas"}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">{gameState === 'finished' ? 'Výsledky' : 'Opustit zápas'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">Lancers Simulátor Zápasu</h2>
          <div className="w-20 sm:w-28 flex justify-end">
            <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-md text-center w-full ${ 
              gameState === 'playing' 
                ? 'bg-green-600/70 text-green-100 animate-pulse' 
                : gameState === 'paused' 
                  ? 'bg-yellow-600/70 text-yellow-100' 
                  : gameState === 'finished' 
                    ? 'bg-blue-600/70 text-blue-100' 
                    : 'bg-gray-600/70 text-gray-200' 
            }`}>
              {gameState === 'playing' 
                ? 'Hraje se' 
                : gameState === 'paused' 
                  ? 'Pauza' 
                  : gameState === 'finished' 
                    ? 'Konec' 
                    : 'Start'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Left Column */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Team Table */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
              <TeamTable 
                teamData={teams} 
                teamColor="white" 
                teamState={teamState} 
                playerStats={playerStats} 
                playersOnIceState={playersOnIceState}
                litvinovLancers={litvinovLancers} 
              />
            </div>
            
            {/* Game Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? (
                <>
                  <button 
                    onClick={() => changeSpeed(-1)} 
                    disabled={gameSpeed <= 1 || gameState !== 'playing'} 
                    className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" 
                    title="Zpomalit"
                  >
                    <BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </button>
                  <button 
                    onClick={handleStartPause} 
                    className="px-4 py-1.5 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    {gameState === 'playing' 
                      ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> 
                      : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    } 
                    {gameState === 'playing' 
                      ? 'Pauza' 
                      : (gameState === 'paused' ? 'Pokračovat' : 'Start')
                    }
                  </button>
                  <button 
                    onClick={() => changeSpeed(1)} 
                    disabled={gameSpeed >= MAX_SPEED || gameState !== 'playing'} 
                    className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 rounded-full transition-colors" 
                    title="Zrychlit"
                  >
                    <ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </button>
                  <div className={`text-xs sm:text-sm ${gameSpeed > 8 ? 'text-yellow-400 font-bold' : 'text-gray-400'} ml-2 sm:ml-4 whitespace-nowrap`}>
                    Rychlost: {gameSpeed}x
                  </div>
                </>
              ) : (
                <div className='text-center flex flex-col items-center gap-2'>
                  <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                </div>
              )}
            </div>
            
            {/* Manual Substitution Buttons */}
            <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
              {['white', 'black'].map(teamColor => {
                if (!teamState || !teamState[teamColor]) return null;
                
                const player = teams[teamColor]?.players.find(p => p.isPlayer);
                if (!player) return null;

                const playerKey = player.key;
                // ZMĚNA: Používáme playersOnIceState pro určení, zda je hráč na ledě
                const isOnIce = playersOnIceState[teamColor].has(playerKey);
                const fatigue = Math.round(teamState[teamColor].fatigue[playerKey] ?? 0);

                return (
                  <button
                    key={teamColor}
                    onClick={() => handlePlayerSubstitution(teamColor)}
                    disabled={gameState === 'finished'}
                    className={clsx(
                      "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                      isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                      (gameState === 'finished' || (!isOnIce && teamState[teamColor].onIce.filter(p => p.position !== 'brankář').length >= 5)) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={isOnIce 
                      ? `Jít střídat (únava: ${fatigue}%)` 
                      : (teamState[teamColor].onIce.filter(p => p.position !== 'brankář').length >= 5 
                        ? `Nelze naskočit (plno na ledě)` 
                        : `Naskočit na led (únava: ${fatigue}%)`
                      )
                    }
                  >
                    {isOnIce ? (
                      <> 
                        <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> 
                        Střídat <span className='hidden md:inline'>({fatigue}%)</span> 
                      </>
                    ) : (
                      <> 
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" /> 
                        Na led <span className='hidden md:inline'>({fatigue}%)</span> 
                      </>
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
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">
                    Bílý tým - Stav
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                    {teams.white?.players?.map(player => {
                      if (!player?.key) return null;
                      const currentFatigue = teamState?.white?.fatigue?.[player.key] ?? 0;
                      // KLÍČOVÁ ZMĚNA: Používáme playersOnIceState pro UI
                      const isPlayerOnIce = playersOnIceState.white.has(player.key);
                      
                      return (
                        <PlayerStatus 
                          key={`white-${player.key}-${isPlayerOnIce ? 'on' : 'off'}`}
                          player={player} 
                          teamColor="white" 
                          fatigueValue={currentFatigue} 
                          isOnIce={isPlayerOnIce} 
                          playerKey={player.key}
                          highlightedPlayerKey={highlightedPlayerKey}
                          litvinovLancers={litvinovLancers}
                        />
                      );
                    })}
                    {(!teams.white?.players || teams.white.players.length === 0) && (
                      <p className="text-gray-500 text-center italic p-4">Prázdná.</p>
                    )}
                  </div>
                </div>
                
                {/* Black Team Status */}
                <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-gray-300 border-b border-gray-600 pb-1.5 flex-shrink-0">
                    Černý tým - Stav
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                    {teams.black?.players?.map(player => {
                      if (!player?.key) return null;
                      const currentFatigue = teamState?.black?.fatigue?.[player.key] ?? 0;
                      // KLÍČOVÁ ZMĚNA: Používáme playersOnIceState pro UI
                      const isPlayerOnIce = playersOnIceState.black.has(player.key);
                      
                      return (
                        <PlayerStatus 
                          key={`black-${player.key}-${isPlayerOnIce ? 'on' : 'off'}`}
                          player={player} 
                          teamColor="black" 
                          fatigueValue={currentFatigue} 
                          isOnIce={isPlayerOnIce} 
                          playerKey={player.key}
                          highlightedPlayerKey={highlightedPlayerKey}
                          litvinovLancers={litvinovLancers}
                        />
                      );
                    })}
                    {(!teams.black?.players || teams.black.players.length === 0) && (
                      <p className="text-gray-500 text-center italic p-4">Prázdná.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 overflow-hidden flex flex-col gap-3 sm:gap-4">
            {/* Game Visualization & Log */}
            <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 flex-grow overflow-hidden">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-cyan-400 border-b border-gray-600 pb-1.5 flex-shrink-0">
                Dění v zápase
              </h3>
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1" ref={eventLogRef}>
                {events.length > 0 ? (
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div 
                        key={event.id || index} 
                        className={`p-2 rounded-lg ${
                          event.type === 'goal' 
                            ? 'bg-green-900/30 border-l-4 border-green-500' 
                            : event.type === 'penalty' 
                              ? 'bg-red-900/30 border-l-4 border-red-500' 
                              : event.type === 'period_change' 
                                ? 'bg-indigo-900/30 border-l-4 border-indigo-500' 
                                : 'bg-gray-800/30'
                        } ${event.id === lastEvent?.id ? 'animate-pulse' : ''}`}
                        ref={event.id === lastEvent?.id ? lastEventRef : null}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm">{event.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatGameTime(event.time, PERIOD_DURATION_SECONDS)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-400 italic">
                    {gameState === 'warmup' 
                      ? 'Stiskněte Start pro zahájení zápasu' 
                      : gameState === 'finished' 
                        ? 'Zápas byl ukončen' 
                        : 'Zápasové zprávy se zobrazí zde'
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Game Statistics */}
            <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 h-1/3 overflow-hidden">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-cyan-400 border-b border-gray-600 pb-1.5 flex-shrink-0">
                Statistiky zápasu
              </h3>
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                <div className="flex justify-between items-center mb-4 p-2 bg-gray-900/50 rounded-lg">
                  <div className="text-center w-1/3 text-white text-2xl font-bold">{score.white}</div>
                  <div className="text-center w-1/3 text-gray-400">Skóre</div>
                  <div className="text-center w-1/3 text-gray-300 text-2xl font-bold">{score.black}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Čas zápasu</div>
                    <div className="text-sm font-semibold">
                      {formatGameTime(gameTime, PERIOD_DURATION_SECONDS)}
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Třetina</div>
                    <div className="text-sm font-semibold">
                      {currentPeriod}. / 3
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Tempo</div>
                    <div className="text-sm font-semibold">
                      {gameSpeed}x
                    </div>
                  </div>
                </div>
                
                {/* Team statistics */}
                <div className="mt-4 bg-gray-900/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-center text-gray-300 mb-2">
                    Týmové statistiky
                  </h4>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                    <div className="text-center text-gray-200">Bílí</div>
                    <div className="text-center text-gray-400">Kategorie</div>
                    <div className="text-center text-gray-200">Černí</div>
                    
                    <div className="text-center">
                      {events.filter(e => e.type === 'goal' && e.team === 'white').length}
                    </div>
                    <div className="text-center text-gray-400">Góly</div>
                    <div className="text-center">
                      {events.filter(e => e.type === 'goal' && e.team === 'black').length}
                    </div>
                    
                    <div className="text-center">
                      {events.filter(e => e.type === 'penalty' && e.team === 'white').length}
                    </div>
                    <div className="text-center text-gray-400">Tresty</div>
                    <div className="text-center">
                      {events.filter(e => e.type === 'penalty' && e.team === 'black').length}
                    </div>
                    
                    <div className="text-center">
                      {events.filter(e => (e.type === 'shot' || e.type === 'goal' || e.type === 'save' || e.type === 'miss') && e.team === 'white').length}
                    </div>
                    <div className="text-center text-gray-400">Střely</div>
                    <div className="text-center">
                      {events.filter(e => (e.type === 'shot' || e.type === 'goal' || e.type === 'save' || e.type === 'miss') && e.team === 'black').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              <h3 className="text-xl text-center font-bold text-red-400 mb-3">
                Opravdu chceš opustit zápas?
              </h3>
              <p className="text-gray-300 mb-5 text-center">
                Aktuální stav zápasu nebude uložen a přijdeš o případné odměny.
              </p>

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
      </div>

      {/* Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(56, 189, 248, 0.6);
          border-radius: 10px;
          border: 1px solid rgba(30, 41, 59, 0.7);
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(56, 189, 248, 0.9);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HockeyMatch;