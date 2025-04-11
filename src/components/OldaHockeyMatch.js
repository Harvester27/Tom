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
import { PlayerStatus, TeamTable, PlayerSpecialAction, formatTimeOnIce, getEventIcon, EventDetail } from './HockeyComponents';
import HockeyEventsGenerator from './HockeyEventsGenerator';

// --- Constants ---
const GAME_DURATION_SECONDS = 60 * 90; // 90 minut (od 16:30 do 18:00)
const PERIOD_DURATION_SECONDS = GAME_DURATION_SECONDS / 3;
const MAX_SPEED = 64;
const EVENT_CHECK_INTERVAL = 90; // Zkráceno pro častější kontroly událostí

// Konstanty pro střídání a únavu
const SHIFT_DURATION = 60; // Interval pro kontrolu automatického střídání
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

  // Funkce pro přímý přístup k hráčům na ledě (z logického stavu)
  const getOnIcePlayers = useCallback((teamColor) => {
    return teamState?.[teamColor]?.onIce || [];
  }, [teamState]);

  const updateTeamState = useCallback((teamColor, updates) => {
    setTeamState(prev => {
      const prevStateForTeam = prev[teamColor];
      let newStateForTeam;

      if (typeof updates === 'function') {
        newStateForTeam = updates(prevStateForTeam);
      } else {
        newStateForTeam = { ...prevStateForTeam, ...updates };
      }

      if (newStateForTeam === prevStateForTeam) {
        return prev; // Vracíme původní stav, pokud se nic nezměnilo
      }

      // Vracíme nový objekt celého stavu
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
  const substitutionTimesRef = useRef(new Set()); // Sleduje, zda už proběhlo střídání v daném čase pro tým
  const eventLogRef = useRef(null); // Pro scrollování logu
  const lastEventRef = useRef(null); // Pro zvýraznění poslední události
  const processedEventIdsRef = useRef(new Set()); // Aby se statistiky pro událost nezapočítaly vícekrát
  const recentlySubstitutedRef = useRef(new Set()); // Hráči, kteří právě střídali (aby nebyli hned vystřídáni zpět)
  const eventsGeneratorRef = useRef(new HockeyEventsGenerator()); // Instance generátoru událostí

  // --- State ---
  const [gameState, setGameState] = useState('warmup'); // 'warmup', 'playing', 'paused', 'finished'
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [gameTime, setGameTime] = useState(0); // Aktuální herní čas v sekundách
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1); // Násobitel rychlosti hry
  const [events, setEvents] = useState([]); // Seznam událostí zápasu
  const [lastEvent, setLastEvent] = useState(null); // Poslední vygenerovaná událost
  const [highlightedPlayerKey, setHighlightedPlayerKey] = useState(null); // Klíče hráčů k dočasnému zvýraznění
  const [playerStats, setPlayerStats] = useState({}); // Statistiky hráčů (čas na ledě, góly, atd.)
  const [showExitConfirm, setShowExitConfirm] = useState(false); // Zobrazit potvrzení opuštění
  const [specialAction, setSpecialAction] = useState(null); // Objekt speciální akce pro hráče
  const [lastSpecialActionTime, setLastSpecialActionTime] = useState(0); // Čas poslední speciální akce
  const [showDetailedStats, setShowDetailedStats] = useState(false); // Přepínač detailních statistik

  // KLÍČOVÁ OPRAVA: Separátní state pro sledování hráčů na ledě pro UI rendering
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
      }, 1500); // Zvýraznění trvá 1.5 sekundy
    });
  }, []);

  // --- Funkce pro synchronizaci playersOnIceState (UI) podle teamState (logika) ---
  const updatePlayersOnIceState = useCallback(() => {
    // Získáme aktuální hráče na ledě z logického stavu
    const whiteOnIcePlayers = getOnIcePlayers('white');
    const blackOnIcePlayers = getOnIcePlayers('black');

    // Extrahujeme klíče validních hráčů
    const whiteKeys = whiteOnIcePlayers.filter(p => p && p.key).map(p => p.key);
    const blackKeys = blackOnIcePlayers.filter(p => p && p.key).map(p => p.key);

    // Vytvoříme nové Set objekty
    const newWhiteSet = new Set(whiteKeys);
    const newBlackSet = new Set(blackKeys);

    // Porovnáme, zda došlo ke změně oproti aktuálnímu UI stavu
    const whiteChanged = !areSetsSame(playersOnIceState.white, newWhiteSet);
    const blackChanged = !areSetsSame(playersOnIceState.black, newBlackSet);

    // Pokud došlo ke změně, aktualizujeme UI state
    if (whiteChanged || blackChanged) {
      console.log("%c[UI SYNC] 🔄 Aktualizace stavu hráčů na ledě pro UI...", "color: deepskyblue; font-weight: bold");
      if (whiteChanged) {
        console.log("%c[UI SYNC] ⚪ Bílý tým změněn:", "color: lime;", [...newWhiteSet]);
      }
      if (blackChanged) {
        console.log("%c[UI SYNC] ⚫ Černý tým změněn:", "color: lime;", [...newBlackSet]);
      }

      setPlayersOnIceState({
        white: newWhiteSet,
        black: newBlackSet
      });

      // Může být potřeba vynutit překreslení, pokud React nepozná změnu
      // setGameTime(t => t); // Odkomentovat, pokud se UI neaktualizuje spolehlivě
    } else {
       // console.log("%c[UI SYNC] 🟰 Žádná změna v týmech na ledě pro UI", "color: gray");
    }
  }, [getOnIcePlayers, playersOnIceState.white, playersOnIceState.black]); // Závislost na getOnIcePlayers (který závisí na teamState) a na aktuálním playersOnIceState

  // --- Team Initialization Effect ---
  useEffect(() => {
    console.log("🔄 Initializing teams...");
    // Filtrujeme aktivní hráče a přidáme jim klíč
    const activePlayers = litvinovLancers.players
      .filter(p => p.attendance >= 75)
      .map(player => ({
        ...player,
        level: player.level || 1,
        key: getPlayerKey(player)
      }));

    // Vytvoříme objekt pro hráče ovládaného uživatelem
    const userPlayer = {
      name: playerName,
      surname: '(Ty)',
      position: 'útočník', // Může být dynamické? Prozatím útočník
      level: playerLevel || 3,
      isPlayer: true,
      key: getPlayerKey({ name: playerName, surname: '(Ty)', position: 'útočník'})
    };

    const whiteAssignedKeys = new Set();
    const blackAssignedKeys = new Set();
    const whiteAssignedPlayers = [];
    const blackAssignedPlayers = [];

    // Rozdělení podle přiřazených dresů, pokud existují
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

    // Zpracujeme zbývající hráče
    const remainingPlayers = activePlayers.filter(p =>
      !whiteAssignedKeys.has(p.key) && !blackAssignedKeys.has(p.key)
    );

    // Pokud hráč ještě není přiřazen, přidáme ho do menšího týmu
    if (!whiteAssignedKeys.has(userPlayer.key) && !blackAssignedKeys.has(userPlayer.key)) {
      if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
        whiteAssignedPlayers.push(userPlayer);
        whiteAssignedKeys.add(userPlayer.key);
      } else {
        blackAssignedPlayers.push(userPlayer);
        blackAssignedKeys.add(userPlayer.key);
      }
    }

    // Zamícháme zbývající hráče a rozdělíme je, aby týmy byly vyrovnané
    const shuffledRemaining = [...remainingPlayers].sort(() => Math.random() - 0.5);
    shuffledRemaining.forEach(player => {
      if (whiteAssignedPlayers.length <= blackAssignedPlayers.length) {
        whiteAssignedPlayers.push(player);
      } else {
        blackAssignedPlayers.push(player);
      }
    });

    // Funkce pro zajištění brankáře v týmu
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
          // Vytvoříme záložního brankáře, pokud žádný není k dispozici
          const backupGoalie = {
            name: 'Náhradník', surname: 'Gólman', position: 'brankář', level: 3, attendance: 75,
            key: getPlayerKey({ name: 'Náhradník', surname: 'Gólman', position: 'brankář'})
          };
          // Zajistíme unikátní klíč, pokud by už existoval
          while (teamPlayers.some(p => p.key === backupGoalie.key) || otherTeamPlayers.some(p => p.key === backupGoalie.key)) {
            backupGoalie.key += '_';
          }
          teamPlayers.push(backupGoalie);
        }
      }
    };
    ensureGoalie(whiteAssignedPlayers, blackAssignedPlayers);
    ensureGoalie(blackAssignedPlayers, whiteAssignedPlayers);

    // Seřadíme hráče podle pozice pro lepší přehlednost
    const sortPlayers = (players) => {
      const positionOrder = { 'brankář': 1, 'obránce': 2, 'útočník': 3 };
      return players.sort((a, b) => (positionOrder[a.position] || 4) - (positionOrder[b.position] || 4));
    };
    const finalWhitePlayers = sortPlayers(whiteAssignedPlayers);
    const finalBlackPlayers = sortPlayers(blackAssignedPlayers);

    // Aktualizujeme stav týmů
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
        timeOnIce: 0, goals: 0, assists: 0, penalties: 0, blocks: 0,
        shots: 0, saves: 0, savePercentage: 0, shotsAgainst: 0,
        isPlayer: player.isPlayer || false
      };
    });
    setPlayerStats(initialStats);

    // Inicializace dynamického stavu týmů (kdo je na ledě, na lavičce, únava)
    const initializeDynamicState = (players) => {
      const onIce = players.slice(0, 6); // Prvních 6 hráčů začíná na ledě
      const bench = players.slice(6);
      const fatigue = players.reduce((acc, player) => {
        if (player.key) acc[player.key] = 0; // Všichni začínají s nulovou únavou
        else console.error(`🔴 INIT FATIGUE: Hráč ${player.name} ${player.surname} nemá platný klíč!`);
        return acc;
      }, {});
      return { onIce, bench, fatigue, lastShiftChange: 0 };
    };
    updateTeamState('white', initializeDynamicState(finalWhitePlayers));
    updateTeamState('black', initializeDynamicState(finalBlackPlayers));

    console.log("✅ Teams initialized successfully.");
    setGameState('paused'); // Hra začíná pozastavená

    // Inicializace UI stavu hráčů na ledě po krátké prodlevě, aby se zajistilo načtení teamState
    setTimeout(() => {
      console.log("🔄 Initializing UI players on ice state...");
      updatePlayersOnIceState(); // Zavoláme synchronizační funkci
    }, 100);

  // OPRAVA: Přidány závislosti, na kterých inicializace závisí
  }, [updateTeam, updateTeamState, playerName, playerLevel, assignedJerseys, updatePlayersOnIceState]);


  // --- Efekt pro automatickou aktualizaci playersOnIceState (UI) při změně teamState ---
  useEffect(() => {
    // Kdykoliv se změní hráči na ledě v logickém stavu (teamState),
    // zavoláme funkci pro synchronizaci UI stavu.
    updatePlayersOnIceState();
  }, [
    updatePlayersOnIceState, // Funkce je závislostí
    teamState?.white?.onIce, // Pole hráčů na ledě bílého týmu
    teamState?.black?.onIce  // Pole hráčů na ledě černého týmu
  ]);

  // --- Find Player Team Color ---
  const findPlayerTeamColor = useCallback(() => {
    if (teams.white.players?.some(p => p.isPlayer)) return 'white';
    if (teams.black.players?.some(p => p.isPlayer)) return 'black';
    return null;
  }, [teams]);

  // --- Is Player On Ice (pro UI) ---
  const isPlayerOnIce = useCallback((teamColor) => {
    if (!teamColor) return false;
    if (!teams[teamColor]) return false; // Zkontrolujeme existenci týmu

    const player = teams[teamColor].players.find(p => p.isPlayer);
    if (!player || !player.key) return false; // Zkontrolujeme existenci hráče a jeho klíče

    // Klíčová změna: Kontrolujeme přítomnost v playersOnIceState (stav pro UI)
    return playersOnIceState[teamColor].has(player.key);
  }, [teams, playersOnIceState]); // Závisí na týmech a UI stavu hráčů na ledě

  // --- Generate Special Action ---
  const generateSpecialAction = useCallback((playerTeamColor, currentTime) => {
    if (!teamState) return; // Zkontrolujeme existenci teamState

    const currentTeamState = teamState; // Použijeme aktuální teamState
    const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';

    // Najdeme hráče (uživatele) na ledě v logickém stavu
    const player = currentTeamState[playerTeamColor]?.onIce.find(p => p.isPlayer);
    if (!player) return; // Hráč není na ledě (logicky)

    // Získáme relevantní data pro akci
    const playerFatigue = currentTeamState[playerTeamColor]?.fatigue[player.key] || 0;
    const opposingGoalie = currentTeamState[opposingTeamColor]?.onIce.find(p => p.position === 'brankář');
    const opposingDefenders = currentTeamState[opposingTeamColor]?.onIce.filter(p => p.position === 'obránce');
    const opposingDefender = opposingDefenders.length > 0 ? opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)] : null;
    const teammates = currentTeamState[playerTeamColor]?.onIce.filter(p => p.position !== 'brankář' && !p.isPlayer);
    const teammate = teammates.length > 0 ? teammates[Math.floor(Math.random() * teammates.length)] : null;

    // Definujeme možné typy speciálních akcí
    const actionTypes = [
      { type: 'shot_opportunity', description: 'Máš šanci na přímou střelu!', options: [ { id: 'shoot', text: 'Vystřelit', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát spoluhráči', difficulty: 'easy' }, { id: 'deke', text: 'Kličkovat a zkusit obejít', difficulty: 'hard' } ] },
      { type: 'one_on_one', description: 'Jsi sám před brankářem!', options: [ { id: 'shoot_high', text: 'Vystřelit nahoru', difficulty: 'medium' }, { id: 'shoot_low', text: 'Vystřelit dolů', difficulty: 'medium' }, { id: 'deke', text: 'Kličkovat brankáři', difficulty: 'hard' } ] },
      { type: 'defensive_challenge', description: 'Protihráč se blíží k bráně a ty ho můžeš zastavit!', options: [ { id: 'stick_check', text: 'Zkusit hokejkou vypíchnout puk', difficulty: 'medium' }, { id: 'body_check', text: 'Zkusit bodyček', difficulty: 'hard' }, { id: 'position', text: 'Zaujmout dobrou pozici', difficulty: 'easy' } ] },
      { type: 'rebound_opportunity', description: 'Puk se odrazil od brankáře!', options: [ { id: 'quick_shot', text: 'Rychlá dorážka', difficulty: 'hard' }, { id: 'control', text: 'Zkontrolovat puk', difficulty: 'medium' }, { id: 'pass', text: 'Přihrát lépe postavenému', difficulty: 'easy' } ] }
    ];

    // Náhodně vybereme typ akce
    const selectedAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];

    // Sestavíme kompletní objekt akce
    const fullAction = {
      ...selectedAction,
      time: currentTime,
      player, playerTeamColor, playerFatigue,
      opposingGoalie, opposingDefender, teammate,
      gameContext: { score, period: currentPeriod, timeRemaining: GAME_DURATION_SECONDS - currentTime }
    };

    // Nastavíme speciální akci a pozastavíme hru
    setSpecialAction(fullAction);
    setGameState('paused'); // Pozastavíme hru během speciální akce

  }, [teamState, score, currentPeriod]); // Závisí na teamState, skóre a periodě

  // --- Handle Special Action Result ---
  const handleSpecialActionResult = useCallback((option) => {
    if (!specialAction) return;

    const { player, playerTeamColor, playerFatigue, opposingGoalie, teammate, time } = specialAction;
    const playerLevel = player.level || 1;
    const fatigueImpact = playerFatigue / MAX_FATIGUE;
    const opposingTeamColor = playerTeamColor === 'white' ? 'black' : 'white';
    const teamName = playerTeamColor === 'white' ? 'Bílí' : 'Černí';

    // Výpočet šance na úspěch
    let successChance;
    switch (option.difficulty) {
      case 'easy': successChance = 0.8; break;
      case 'medium': successChance = 0.6; break;
      case 'hard': successChance = 0.4; break;
      default: successChance = 0.5;
    }
    successChance += (playerLevel - 1) * 0.05; // Bonus za úroveň hráče
    successChance -= fatigueImpact * 0.3;     // Postih za únavu
    successChance = Math.max(0.1, Math.min(0.9, successChance)); // Omezení šance

    const isSuccess = Math.random() < successChance;
    let resultMessage, eventDescription, eventType;
    let generatedEvent = null; // Událost, která se přidá do logu

    if (isSuccess) {
      resultMessage = `Akce byla úspěšná!`; // Obecná zpráva pro úspěch
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          if (option.id.includes('shoot') || option.id === 'quick_shot' || option.id === 'deke') {
            const goalChance = option.id === 'deke' ? 0.7 : 0.5; // Větší šance na gól po kličce
            const isGoal = Math.random() < goalChance;
            if (isGoal) {
              resultMessage = `Výborně! Tvoje akce (${option.text}) skončila gólem!`;
              eventDescription = `🚨 GÓÓÓL! ${player.name} ${player.surname} (Ty!) (${teamName}) skóruje po speciální akci!`;
              eventType = 'goal';
              setScore(prev => ({ ...prev, [playerTeamColor]: prev[playerTeamColor] + 1 }));
              generatedEvent = { type: 'goal', player: player, assistant: null, goalieKey: opposingGoalie?.key, team: playerTeamColor, id: `${time}-special-goal-${player.key}-${Math.random()}` };
            } else {
              resultMessage = `Dobrá střela (${option.text}), ale ${opposingGoalie ? opposingGoalie.surname : 'brankář'} ji chytil.`;
              eventDescription = `🧤 Zákrok! ${opposingGoalie ? opposingGoalie.name + ' ' + opposingGoalie.surname : 'Brankář'} chytá tvoji střelu po speciální akci.`;
              eventType = 'save';
              generatedEvent = { type: 'save', player: opposingGoalie, shooter: player, team: opposingTeamColor, id: `${time}-special-save-${player.key}-${Math.random()}` };
            }
          } else if (option.id === 'pass' && teammate) {
             resultMessage = `Přesná přihrávka (${option.text}) na ${teammate.surname}.`;
             eventDescription = `${player.name} ${player.surname} (Ty!) přesně přihrává na ${teammate.name} ${teammate.surname} po speciální akci.`;
             eventType = 'pass'; // Můžeme přidat typ události 'pass'
          } else { // Např. 'control'
             resultMessage = `Podařilo se (${option.text})! Získal jsi kontrolu nad pukem.`;
             eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci (${option.text}).`;
             eventType = 'success';
          }
          break;
        case 'defensive_challenge':
          resultMessage = `Úspěšně jsi zastavil útok soupeře (${option.text})!`;
          eventDescription = `🛡️ Dobrá obrana! ${player.name} ${player.surname} (Ty!) (${teamName}) zastavil útok soupeře po speciální akci.`;
          eventType = 'defense';
          generatedEvent = { type: 'defense', player: player, attacker: null, team: playerTeamColor, id: `${time}-special-defense-${player.key}-${Math.random()}` };
          break;
        default:
          eventDescription = `${player.name} ${player.surname} (Ty!) úspěšně zvládl speciální akci.`;
          eventType = 'success';
      }
    } else { // Neúspěch
      resultMessage = `Bohužel, akce (${option.text}) se nepovedla.`;
      switch (specialAction.type) {
        case 'shot_opportunity':
        case 'one_on_one':
        case 'rebound_opportunity':
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí (${option.text}). Ztráta puku?`;
          eventType = 'miss';
          if (option.id.includes('shoot') || option.id === 'quick_shot') {
            generatedEvent = { type: 'miss', player: player, team: playerTeamColor, id: `${time}-special-miss-${player.key}-${Math.random()}` };
          } else {
             eventType = 'turnover'; // Neúspěšná přihrávka nebo klička může být ztráta
          }
          break;
        case 'defensive_challenge':
          const opponentGoalChance = option.id === 'body_check' ? 0.4 : 0.2; // Větší šance na gól po neúspěšném bodyčeku
          const isOpponentGoal = Math.random() < opponentGoalChance;
          if (isOpponentGoal) {
            resultMessage = `Nepodařilo se ti zastavit útok (${option.text}) a soupeř skóroval!`;
            eventDescription = `🚨 Gól soupeře! ${player.name} ${player.surname} (Ty!) nedokázal zastavit útok (${option.text}) a soupeř skóroval.`;
            eventType = 'goal_against'; // Speciální typ události?
            setScore(prev => ({ ...prev, [opposingTeamColor]: prev[opposingTeamColor] + 1 }));
            // Vygenerujeme událost gólu pro soupeře
            const opponentEvent = { time: time, type: 'goal', team: opposingTeamColor, description: `Gól soupeře po neúspěšné obraně hráče ${player.name} ${player.surname} (Ty!).`, id: `${time}-goal-${opposingTeamColor}-${Math.random()}` };
            setEvents(prev => [opponentEvent, ...prev]);
            setLastEvent(opponentEvent);
            // generatedEvent může být null zde, protože hlavní událost je gól soupeře
          } else {
            resultMessage = `Nepodařilo se ti zastavit útok (${option.text}), ale naštěstí soupeř neskóroval.`;
            eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl s obranou při speciální akci (${option.text}).`;
            eventType = 'defense_fail'; // Můžeme mít typ 'defense_fail'
          }
          break;
        default:
          eventDescription = `${player.name} ${player.surname} (Ty!) neuspěl se speciální akcí.`;
          eventType = 'fail';
      }
    }

    // Přidáme událost do logu, pokud byla vygenerována
    if (generatedEvent) {
        console.log(`🎮 Special Action created event:`, generatedEvent);
        setEvents(prev => [generatedEvent, ...prev]);
        setLastEvent(generatedEvent);
        // Pokud událost nebyla gól soupeře, zvýrazníme hráče
        if (generatedEvent.type !== 'goal' || generatedEvent.team === playerTeamColor) {
            triggerHighlight(player.key);
            if (generatedEvent.type === 'goal' && teammate) triggerHighlight(teammate.key); // Zvýrazníme i asistenta (pokud bychom ho přidali)
            if (generatedEvent.type === 'save' && opposingGoalie) triggerHighlight(opposingGoalie.key);
        }
    } else if (eventType !== 'goal_against') {
        // Pokud nebyl vygenerován event (např. pass, success, fail), přidáme alespoň popisnou událost
        const fallbackEvent = {
            time: time,
            type: eventType,
            player: player,
            team: playerTeamColor,
            description: eventDescription,
            id: `${time}-special-${eventType}-${player.key}-${Math.random()}`
        };
        console.log(`🎮 Special Action created fallback event:`, fallbackEvent);
        setEvents(prev => [fallbackEvent, ...prev]);
        setLastEvent(fallbackEvent);
        triggerHighlight(player.key);
    }


    // Připravíme výsledek pro zobrazení v UI dialogu
    const actionResult = { success: isSuccess, message: resultMessage, eventType };

    // Zavřeme dialog a po krátké pauze obnovíme hru
    setTimeout(() => {
      setSpecialAction(null);
      if (gameState === 'paused') { // Obnovíme hru jen pokud byla pauznutá kvůli akci
        setGameState('playing');
      }
    }, 2500); // Zobrazíme výsledek na 2.5 sekundy

    return actionResult; // Vrátíme výsledek pro UI dialog

  }, [specialAction, triggerHighlight, setEvents, setLastEvent, setScore, gameState, setGameState]); // Přidána závislost setGameState


  // --- Handle Start/Pause ---
  const handleStartPause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused' || gameState === 'warmup') {
      // Nelze spustit hru, pokud probíhá speciální akce
      if (!specialAction) {
        setGameState('playing');
      } else {
        console.log("Nemohu spustit hru, probíhá speciální akce.");
      }
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
        else newSpeed = MAX_SPEED; // Zajistíme, aby nepřekročilo MAX_SPEED
      } else { // delta < 0
        if (prev > 32) newSpeed = 32;
        else if (prev > 16) newSpeed = 16;
        else if (prev > 8) newSpeed = 8;
        else newSpeed = Math.max(1, prev - 1); // Zajistíme, aby nekleslo pod 1
      }
      console.log(`Changing speed from ${prev} to ${newSpeed}`);
      return newSpeed;
    });
  };

  // --- Handle Player Substitution (Manual) ---
  const handlePlayerSubstitution = useCallback((teamColor) => {
    const currentTime = gameTime;
    console.log(`%c[SUB MANU] 🔄 Manuální střídání ${teamColor} (čas: ${currentTime})`, 'color: yellow; font-weight: bold');

    if (!teamState || !teamState[teamColor] || !teams[teamColor]) {
      console.error(`%c[SUB MANU] ❌ Chyba: Chybí stav týmu ${teamColor}`, 'color: red; font-weight: bold');
      return;
    }

    const teamLogicalState = teamState[teamColor];
    const teamPlayersList = teams[teamColor].players;
    const player = teamPlayersList.find(p => p.isPlayer);

    if (!player || !player.key) {
      console.error(`%c[SUB MANU] ❌ Chyba: Nenalezen hráč (Ty) v týmu ${teamColor}`, 'color: red; font-weight: bold');
      return;
    }
    const playerKey = player.key;

    // Zjišťujeme stav z logického teamState
    const isPlayerCurrentlyOnIce = teamLogicalState.onIce.some(p => p && p.key === playerKey);
    const isPlayerCurrentlyOnBench = teamLogicalState.bench.some(p => p && p.key === playerKey);

    console.log(`%c[SUB MANU] 📊 Stav hráče ${playerName} (${teamColor}) před:`, 'color: cyan;', {
      isPlayerCurrentlyOnIce, isPlayerCurrentlyOnBench,
      fatigue: Math.round(teamLogicalState.fatigue[playerKey] || 0)
    });

    if (isPlayerCurrentlyOnIce) {
      // Hráč chce jít z ledu na lavičku
      const playerOnIceObject = teamLogicalState.onIce.find(p => p.key === playerKey);
      if (!playerOnIceObject) {
        console.error(`%c[SUB MANU] ❌ Konzistence: Hráč měl být na ledě, ale objekt nenalezen.`, 'color: red; font-weight: bold');
        return;
      }

      // Najdeme nejméně unaveného AI hráče na lavičce (ne brankáře)
      const restedBenchPlayer = [...teamLogicalState.bench]
        .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
        .sort((a, b) => (teamLogicalState.fatigue[a.key] ?? MAX_FATIGUE) - (teamLogicalState.fatigue[b.key] ?? MAX_FATIGUE))[0];

      if (!restedBenchPlayer) {
        console.warn(`%c[SUB MANU] ⚠️ Nelze střídat: Žádný vhodný hráč na lavičce.`, 'color: orange;');
        return;
      }

      console.log(`%c[SUB MANU] ➡️ ${playerName} (Ty) ⬇️ | ${restedBenchPlayer.surname} ⬆️`, 'color: purple; font-weight: bold');

      // Provedeme výměnu v logickém stavu
      updateTeamState(teamColor, prevState => ({
        ...prevState,
        onIce: [...prevState.onIce.filter(p => p.key !== playerKey), restedBenchPlayer],
        bench: [...prevState.bench.filter(p => p.key !== restedBenchPlayer.key), playerOnIceObject],
        lastShiftChange: currentTime // Aktualizujeme čas poslední změny
      }));

      // Vytvoříme událost
      const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬇️, ${restedBenchPlayer.name} ${restedBenchPlayer.surname} ⬆️`, id: `${currentTime}-sub-${playerKey}-off-${Math.random()}` };
      setEvents(prev => [subEvent, ...prev]);
      setLastEvent(subEvent);
      triggerHighlight([playerKey, restedBenchPlayer.key]);

      // KLÍČOVÉ: Aktualizujeme UI stav po změně logického stavu
      setTimeout(updatePlayersOnIceState, 50); // Krátká prodleva pro jistotu
      console.log(`%c[SUB MANU] ✅ Střídání (z ledu) dokončeno. UI sync naplánován.`, 'color: green;');

    } else if (isPlayerCurrentlyOnBench) {
      // Hráč chce jít z lavičky na led
      const playerOnBenchObject = teamLogicalState.bench.find(p => p.key === playerKey);
      if (!playerOnBenchObject) {
        console.error(`%c[SUB MANU] ❌ Konzistence: Hráč měl být na lavičce, ale objekt nenalezen.`, 'color: red; font-weight: bold');
        return;
      }

      // Najdeme nejvíce unaveného AI hráče na ledě (ne brankáře)
      const tiredOnIcePlayer = [...teamLogicalState.onIce]
        .filter(p => p && p.position !== 'brankář' && !p.isPlayer)
        .sort((a, b) => (teamLogicalState.fatigue[b.key] ?? 0) - (teamLogicalState.fatigue[a.key] ?? 0))[0];

      if (!tiredOnIcePlayer) {
        console.warn(`%c[SUB MANU] ⚠️ Nelze střídat: Žádný vhodný hráč na ledě pro výměnu.`, 'color: orange;');
        // Můžeme zvážit i výměnu za nejméně unaveného, pokud není žádný unavený?
        return;
      }
      // Kontrola počtu hráčů na ledě (bez brankáře)
      if (teamLogicalState.onIce.filter(p => p.position !== 'brankář').length >= 5) {
          console.warn(`%c[SUB MANU] ⚠️ Nelze naskočit: Plný počet hráčů v poli na ledě.`, 'color: orange;');
          // Zobrazit uživateli zprávu?
          return;
      }


      console.log(`%c[SUB MANU] ➡️ ${playerName} (Ty) ⬆️ | ${tiredOnIcePlayer.surname} ⬇️`, 'color: green; font-weight: bold');

      // Provedeme výměnu v logickém stavu
      updateTeamState(teamColor, prevState => ({
        ...prevState,
        onIce: [...prevState.onIce.filter(p => p.key !== tiredOnIcePlayer.key), playerOnBenchObject],
        bench: [...prevState.bench.filter(p => p.key !== playerKey), tiredOnIcePlayer],
        lastShiftChange: currentTime
      }));

      // Vytvoříme událost
      const subEvent = { time: currentTime, type: 'substitution', team: teamColor, description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playerName} (Ty) ⬆️, ${tiredOnIcePlayer.name} ${tiredOnIcePlayer.surname} ⬇️`, id: `${currentTime}-sub-${playerKey}-on-${Math.random()}` };
      setEvents(prev => [subEvent, ...prev]);
      setLastEvent(subEvent);
      triggerHighlight([playerKey, tiredOnIcePlayer.key]);

      // KLÍČOVÉ: Aktualizujeme UI stav
      setTimeout(updatePlayersOnIceState, 50);
      console.log(`%c[SUB MANU] ✅ Střídání (na led) dokončeno. UI sync naplánován.`, 'color: green;');

    } else {
      console.error(`%c[SUB MANU] ❌ Chyba: Hráč ${playerName} není ani na ledě, ani na lavičce v teamState!`, 'color: red; font-weight: bold');
    }
  }, [gameTime, teams, teamState, playerName, triggerHighlight, updateTeamState, setEvents, setLastEvent, updatePlayersOnIceState]); // Přidána závislost setLastEvent


  // --- Handle Exit ---
  const handleExit = useCallback(() => {
    if (gameState === 'finished') {
      // Pokud hra skončila, rovnou zobrazíme výsledky
      if (onGameComplete) onGameComplete({ score, events, playerStats });
    } else {
      // Jinak zobrazíme potvrzovací dialog a pozastavíme hru
      setShowExitConfirm(true);
      if (gameState === 'playing') setGameState('paused');
    }
  }, [gameState, score, events, playerStats, onGameComplete, setGameState]); // Přidána závislost setGameState

  // --- Handle Confirm Exit ---
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    if (onGameComplete) onGameComplete({
      score,
      events,
      playerStats,
      abandoned: true // Označíme, že hra byla opuštěna
    });
  }, [score, events, playerStats, onGameComplete]);

  // --- Handle Cancel Exit ---
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
    // Můžeme zvážit obnovení hry, pokud byla pozastavena kvůli dialogu
    // if (gameStateBeforeExit === 'playing') setGameState('playing');
  }, []);

  // --- Scroll event log ---
  useEffect(() => {
    if (eventLogRef.current) {
      // Scroll na začátek logu (nejnovější události nahoře)
      eventLogRef.current.scrollTop = 0;
    }
  }, [events]); // Spustí se při každé změně v poli událostí

  // --- Update stats for each event ---
  useEffect(() => {
    // Zpracujeme pouze nové události, které ještě nebyly zpracovány
    const newEvents = events.filter(ev => ev.id && !processedEventIdsRef.current.has(ev.id));

    if (newEvents.length > 0) {
        setPlayerStats(prevStats => {
            // Vytvoříme kopii statistik pro úpravy
            const newStats = { ...prevStats };
            let statsChanged = false; // Flag pro zjištění, zda došlo ke změně

            // Pomocné funkce pro aktualizaci
            const updateStat = (playerKey, statName, value = 1) => {
                if (playerKey && newStats[playerKey]) {
                    const oldValue = newStats[playerKey][statName] || 0;
                    newStats[playerKey] = { ...newStats[playerKey], [statName]: oldValue + value };
                    statsChanged = true;
                    // console.log(`🔹 Stat updated: ${playerKey} - ${statName}: ${newStats[playerKey][statName]}`);
                } else if (playerKey) {
                    // console.warn(`⚠️ Player key ${playerKey} not found in stats for event type ${ev.type}`);
                }
            };
            const updateGoalieStats = (goalieKey, isGoal) => {
                if (goalieKey && newStats[goalieKey]) {
                    const oldStats = newStats[goalieKey];
                    const shotsAgainst = (oldStats.shotsAgainst || 0) + 1;
                    const saves = isGoal ? (oldStats.saves || 0) : (oldStats.saves || 0) + 1;
                    const savePercentage = shotsAgainst > 0 ? Math.round((saves / shotsAgainst) * 100) : 0;
                    newStats[goalieKey] = { ...oldStats, shotsAgainst, saves, savePercentage };
                    statsChanged = true;
                    // console.log(`🧤 Goalie stats updated: ${goalieKey} SA=${shotsAgainst}, S=${saves}, %=${savePercentage}`);
                } else if (goalieKey) {
                   // console.warn(`⚠️ Goalie key ${goalieKey} not found in stats for event type ${ev.type}`);
                }
            };

            newEvents.forEach(ev => {
                 processedEventIdsRef.current.add(ev.id); // Označíme jako zpracované
                 // console.log(`Processing event for stats: ${ev.id} type: ${ev.type}`);

                 switch (ev.type) {
                    case 'goal':
                      if (ev.player?.key) {
                        updateStat(ev.player.key, 'goals');
                        updateStat(ev.player.key, 'shots'); // Gól je také střela
                      }
                      if (ev.assistant?.key) updateStat(ev.assistant.key, 'assists');
                      if (ev.goalieKey) updateGoalieStats(ev.goalieKey, true);
                      break;
                    case 'save':
                      if (ev.player?.key) updateGoalieStats(ev.player.key, false); // ev.player je zde brankář
                      if (ev.shooter?.key) updateStat(ev.shooter.key, 'shots');
                      break;
                    case 'miss':
                      if (ev.player?.key) updateStat(ev.player.key, 'shots'); // I střela mimo je střela
                      break;
                    case 'defense': // Zda započítat blok?
                      if (ev.player?.key) {
                        const blockChance = ev.player.position === 'obránce' ? 0.6 : 0.3;
                        if (Math.random() < blockChance) updateStat(ev.player.key, 'blocks');
                      }
                      // Atackerova střela byla zablokována, nepočítáme jako střelu na bránu
                      // if (ev.attacker?.key) updateStat(ev.attacker.key, 'shots');
                      break;
                    case 'penalty':
                      if (ev.player?.key && ev.penaltyMinutes) updateStat(ev.player.key, 'penalties', ev.penaltyMinutes);
                      break;
                    default:
                      // Ostatní typy událostí (substitution, period_change, atd.) neovlivňují tyto statistiky
                      break;
                 }
            });

            // Vracíme nový stav pouze pokud došlo ke změně
            return statsChanged ? newStats : prevStats;
        });
    }
  }, [events]); // Závisí na poli událostí


  // --- Fatigue Update Effect ---
  useEffect(() => {
    if (gameState !== 'playing') return; // Spustí se pouze pokud hra běží

    const fatigueInterval = setInterval(() => {
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
              const rate = player.position === 'brankář' ? fatigueIncreaseRate * 0.5 : fatigueIncreaseRate; // Brankáři pomaleji
              const updatedFatigue = Math.min(MAX_FATIGUE, currentFatigue + rate);
              if (newFatigue[player.key] !== Math.round(updatedFatigue)) {
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
              if (newFatigue[player.key] !== Math.round(updatedFatigue)) {
                newFatigue[player.key] = Math.round(updatedFatigue);
                fatigueChanged = true;
              }
            }
          });

          // Vracíme nový stav pouze pokud došlo ke změně
          return fatigueChanged ? { ...prevTeamState, fatigue: newFatigue } : prevTeamState;
        });
      };

      updateFatigueForTeam('white');
      updateFatigueForTeam('black');
    }, 1000); // Únava se přepočítává každou sekundu reálného času

    return () => clearInterval(fatigueInterval); // Cleanup funkce
  }, [gameState, gameSpeed, updateTeamState]);


  // --- Aktualizace času na ledě (Time On Ice - TOI) ---
  useEffect(() => {
    if (gameState !== 'playing') return; // Pouze když hra běží

    const toiInterval = setInterval(() => {
      setPlayerStats(prevStats => {
        const newStats = { ...prevStats };
        let statsChanged = false;

        if (!teamState) return prevStats; // Pojistka

        ['white', 'black'].forEach(teamColor => {
          // Získáme klíče hráčů na ledě z logického stavu teamState
          const playersOnIceKeys = new Set(
            teamState[teamColor]?.onIce?.map(p => p?.key).filter(Boolean) || []
          );

          playersOnIceKeys.forEach(playerKey => {
            if (newStats[playerKey]) {
              // Přičteme časový přírůstek odpovídající rychlosti hry
              const timeIncrement = gameSpeed; // gameSpeed sekund herního času uplynulo za 1s reálného času
              newStats[playerKey] = {
                  ...newStats[playerKey],
                  timeOnIce: (newStats[playerKey].timeOnIce || 0) + timeIncrement
              };
              statsChanged = true;
            }
          });
        });

        return statsChanged ? newStats : prevStats;
      });
    }, 1000); // Aktualizujeme každou sekundu reálného času

    return () => clearInterval(toiInterval); // Cleanup
  }, [gameState, gameSpeed, teamState]); // Závisí na stavu hry, rychlosti a logickém stavu týmů

  // --- Game Simulation Effect (Main Loop) ---
  useEffect(() => {
    if (gameState !== 'playing') return; // Pouze když hra běží

    let intervalId;

    const gameTick = () => {
      // Aktualizace herního času
      setGameTime(prevTime => {
        const timeIncrement = gameSpeed; // Kolik herních sekund uplyne za tento tick
        const newTime = Math.min(GAME_DURATION_SECONDS, prevTime + timeIncrement);

        // --- Konec hry ---
        if (newTime >= GAME_DURATION_SECONDS && prevTime < GAME_DURATION_SECONDS) {
          setGameState('finished');
          console.log("🏁 Game finished!");
          // Vygenerujeme událost konce zápasu
          const endEvent = {
            type: 'game_end',
            time: GAME_DURATION_SECONDS,
            description: `Konec zápasu! Konečné skóre: Bílí ${score.white} - ${score.black} Černí`,
            id: `${GAME_DURATION_SECONDS}-game-end`
          };
          setEvents(prev => [endEvent, ...prev]);
          setLastEvent(endEvent);
          return GAME_DURATION_SECONDS; // Ukončíme na přesné délce hry
        }

        // Pokud se mezitím hra zastavila, neprovádíme zbytek logiky
        if (gameState !== 'playing') return prevTime;

        // --- Změna periody ---
        const newPeriod = Math.min(3, Math.floor(newTime / PERIOD_DURATION_SECONDS) + 1);
        const oldPeriod = Math.min(3, Math.floor(prevTime / PERIOD_DURATION_SECONDS) + 1);
        if (newPeriod > oldPeriod) {
          setCurrentPeriod(newPeriod);
          const periodStartTime = oldPeriod * PERIOD_DURATION_SECONDS; // Čas začátku nové periody
          const periodChangeEvent = {
            type: 'period_change',
            time: periodStartTime,
            description: `Začala ${newPeriod}. třetina!`,
            period: newPeriod,
            id: `${periodStartTime}-period-${newPeriod}`
          };
          setEvents(prev => [periodChangeEvent, ...prev]);
          setLastEvent(periodChangeEvent);
        }

        // --- Generování herních událostí ---
        const currentEventIntervalCount = Math.floor(newTime / EVENT_CHECK_INTERVAL);
        const prevEventIntervalCount = Math.floor(prevTime / EVENT_CHECK_INTERVAL);
        if (currentEventIntervalCount > prevEventIntervalCount) {
          // Projdeme všechny intervaly, které uplynuly od posledního ticku
          for (let i = prevEventIntervalCount + 1; i <= currentEventIntervalCount; i++) {
            const checkTime = i * EVENT_CHECK_INTERVAL;
            if (checkTime > newTime || checkTime > GAME_DURATION_SECONDS) break; // Nepřeskakujeme aktuální čas
            // Zabráníme generování více událostí ve stejném čase (pokud už existuje)
            if (events.some(e => e.time === checkTime && e.type !== 'substitution')) continue;

            // Připravíme aktuální stav pro generátor
            const currentSimulationState = {
              teamState: teamState, // Logický stav týmů
              teams: teams,       // Seznam hráčů atd.
              score: score,       // Aktuální skóre
              setScore: setScore, // Funkce pro změnu skóre (pro góly)
              triggerHighlight: triggerHighlight // Funkce pro zvýraznění hráčů
            };

            if (eventsGeneratorRef.current) {
              // Zavoláme generátor událostí
              const newEvent = eventsGeneratorRef.current.generateEvent(checkTime, currentSimulationState);
              if (newEvent) {
                console.log(`📝 Event generated: ${newEvent.type} at ${checkTime}s`);
                setEvents(prev => [newEvent, ...prev]);
                setLastEvent(newEvent);
              }
            }
          }
        }

        // --- AUTOMATICKÉ STŘÍDÁNÍ LOGIC ---
        const currentShiftIntervalCount = Math.floor(newTime / SHIFT_DURATION);
        const prevShiftIntervalCount = Math.floor(prevTime / SHIFT_DURATION);

        if (currentShiftIntervalCount > prevShiftIntervalCount) {
          // Projdeme všechny intervaly pro kontrolu střídání
          for (let i = prevShiftIntervalCount + 1; i <= currentShiftIntervalCount; i++) {
            const substitutionCheckTime = i * SHIFT_DURATION;
            if (substitutionCheckTime > newTime || substitutionCheckTime > GAME_DURATION_SECONDS) break;

            // Vyčistíme seznam hráčů, kteří právě střídali
            recentlySubstitutedRef.current.clear();

            // Projdeme oba týmy
            // *** OPRAVA SYNTAXE: Odstraněny uvozovky ***
            ['white', 'black'].forEach(teamColor => {
              const subKey = `${substitutionCheckTime}-${teamColor}`; // Klíč pro tento čas a tým

              // Zkontrolujeme, zda už střídání pro tento čas a tým neproběhlo
              if (substitutionTimesRef.current.has(subKey)) {
                // console.log(`%c[SUB AUTO] ⏭️ Skipping substitution check for ${teamColor} at ${substitutionCheckTime}s (already done)`, "color: gray;");
                return; // Přeskočíme, pokud už bylo provedeno
              }

              // Spustíme asynchronní funkci pro provedení střídání (i když zde není async potřeba)
              const performSubstitution = () => {
                 // Dvojí kontrola, kdyby se mezitím přidalo do Setu
                 if (substitutionTimesRef.current.has(subKey)) return;

                 // Aktualizujeme stav týmu
                 updateTeamState(teamColor, prevTeamState => {
                    // Další kontrola uvnitř update funkce (pro atomicitu)
                    if (substitutionTimesRef.current.has(subKey) || !prevTeamState || !prevTeamState.onIce || !prevTeamState.bench || !prevTeamState.fatigue) {
                        return prevTeamState; // Neměníme stav, pokud už proběhlo nebo chybí data
                    }

                    const timeSinceLastChange = substitutionCheckTime - (prevTeamState.lastShiftChange || 0);

                    // Najdeme unavené hráče na ledě (AI, ne brankář, ne ti co právě střídali)
                    const tiredOnIce = prevTeamState.onIce
                        .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer && !recentlySubstitutedRef.current.has(p.key))
                        .sort((a, b) => (prevTeamState.fatigue[b.key] ?? 0) - (prevTeamState.fatigue[a.key] ?? 0));

                    // Najdeme odpočaté hráče na lavičce (AI, ne brankář, ne ti co právě střídali)
                    const restedOnBench = prevTeamState.bench
                        .filter(p => p && p.key && p.position !== 'brankář' && !p.isPlayer && !recentlySubstitutedRef.current.has(p.key))
                        .sort((a, b) => (prevTeamState.fatigue[a.key] ?? MAX_FATIGUE) - (prevTeamState.fatigue[b.key] ?? MAX_FATIGUE));

                    // Podmínka pro střídání: Uplynul čas NEBO je někdo velmi unavený A jsou dostupní hráči
                    const hasHighlyTiredPlayer = tiredOnIce.length > 0 && (prevTeamState.fatigue[tiredOnIce[0].key] ?? 0) > 80;
                    const shouldChange = (timeSinceLastChange >= SHIFT_DURATION || hasHighlyTiredPlayer) && restedOnBench.length > 0 && tiredOnIce.length > 0;

                    // console.log(`%c[SUB AUTO] 🔍 Check ${teamColor} at ${substitutionCheckTime}s:`, 'color: #cc66ff;', { timeSinceLastChange, hasHighlyTiredPlayer, tiredCount: tiredOnIce.length, restedCount: restedOnBench.length, shouldChange });

                    if (!shouldChange) {
                        // Pokud nelze střídat kvůli nedostatku hráčů, označíme čas jako zkontrolovaný
                        if (restedOnBench.length === 0 || tiredOnIce.length === 0) {
                            substitutionTimesRef.current.add(subKey);
                            // console.log(`%c[SUB AUTO] ⏭️ Cannot substitute ${teamColor} - no players.`, 'color: #ff6600');
                        } else {
                            // console.log(`%c[SUB AUTO] ⏭️ No substitution needed for ${teamColor} yet.`, 'color: #ff6600');
                        }
                        return prevTeamState; // Neměníme stav
                    }

                    // Určíme počet hráčů ke střídání (max 3, nebo více pokud je někdo velmi unavený)
                    const numToChange = Math.min(tiredOnIce.length, restedOnBench.length, hasHighlyTiredPlayer ? Math.max(1, Math.ceil(tiredOnIce.length / 2)) : 3);

                    if (numToChange <= 0) {
                        console.warn(`%c[SUB AUTO] ⚠️ numToChange <= 0 for ${teamColor}, skipping.`, 'color: red; font-weight: bold');
                        substitutionTimesRef.current.add(subKey); // Označíme jako zkontrolované
                        return prevTeamState;
                    }

                    // Vybereme hráče pro střídání
                    const playersOut = tiredOnIce.slice(0, numToChange);
                    const playersOutKeys = new Set(playersOut.map(p => p.key));
                    const playersIn = restedOnBench.slice(0, numToChange);
                    const playersInKeys = new Set(playersIn.map(p => p.key));

                    // console.log(`%c[SUB AUTO] 🔀 Substituting ${numToChange} players for ${teamColor}:`, 'color: #ff00ff;');
                    // console.log(`%c[SUB AUTO]   IN: ${playersIn.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key]||0)}%)`).join(', ')}`, 'color: green;');
                    // console.log(`%c[SUB AUTO]   OUT: ${playersOut.map(p => `${p.surname} (${Math.round(prevTeamState.fatigue[p.key]||0)}%)`).join(', ')}`, 'color: red;');

                    // Vytvoříme nová pole pro logický stav
                    const newOnIce = [...prevTeamState.onIce.filter(p => p && !playersOutKeys.has(p.key)), ...playersIn];
                    const newBench = [...prevTeamState.bench.filter(p => p && !playersInKeys.has(p.key)), ...playersOut];

                    // Přidáme střídané hráče do dočasného setu, aby nebyli hned vráceni
                    playersOut.forEach(p => { if (p?.key) recentlySubstitutedRef.current.add(p.key); });
                    playersIn.forEach(p => { if (p?.key) recentlySubstitutedRef.current.add(p.key); });

                    const playersInNames = playersIn.map(p => p.surname).join(", ");
                    const playersOutNames = playersOut.map(p => p.surname).join(", ");

                    // Vytvoříme událost střídání (pouze pokud se někdo skutečně střídal)
                    if (numToChange > 0) {
                        const subEvent = {
                          time: substitutionCheckTime, type: 'substitution', team: teamColor,
                          description: `Střídání (${teamColor === 'white' ? 'Bílí' : 'Černí'}): ${playersInNames || 'Nikdo'} ⬆️ | ${playersOutNames || 'Nikdo'} ⬇️`,
                          id: `${substitutionCheckTime}-sub-auto-${teamColor}-${Math.random()}`
                        };
                        setEvents(prev => [subEvent, ...prev]); // Přidáme událost asynchronně
                        setLastEvent(subEvent); // Nastavíme jako poslední událost
                        triggerHighlight([...playersInKeys, ...playersOutKeys]); // Zvýrazníme hráče
                        console.log(`%c[SUB AUTO] ✅ ${teamColor.toUpperCase()} substitution performed.`, 'color: lime; font-weight: bold');
                    }

                    // Označíme tento čas a tým jako zpracovaný
                    substitutionTimesRef.current.add(subKey);

                    // Vrátíme nový logický stav týmu
                    return { ...prevTeamState, onIce: newOnIce, bench: newBench, lastShiftChange: substitutionCheckTime };
                 }); // Konec updateTeamState

                 // KLÍČOVÉ: Naplánujeme synchronizaci UI stavu po aktualizaci logického stavu
                 setTimeout(updatePlayersOnIceState, 50);

              }; // Konec performSubstitution
              performSubstitution(); // Zavoláme funkci střídání
            }); // Konec forEach teamColor
          } // Konec for loop přes intervaly střídání
        } // Konec if (currentShiftIntervalCount > prevShiftIntervalCount)


        // --- Kontrola speciálních akcí pro hráče ---
        const currentActionIntervalCount = Math.floor(newTime / SPECIAL_ACTION_INTERVAL);
        const prevActionIntervalCount = Math.floor(prevTime / SPECIAL_ACTION_INTERVAL);

        if (currentActionIntervalCount > prevActionIntervalCount && // Uplynul interval pro kontrolu akce
            newTime - lastSpecialActionTime >= MIN_TIME_BETWEEN_ACTIONS && // Uplynul minimální čas od poslední akce
            !specialAction) { // Neprobíhá už jiná akce

          const actionCheckTime = currentActionIntervalCount * SPECIAL_ACTION_INTERVAL;
          if (actionCheckTime <= GAME_DURATION_SECONDS) {
            const playerTeamColor = findPlayerTeamColor();
            if (playerTeamColor && Math.random() < SPECIAL_ACTION_CHANCE) {
              // Zkontrolujeme, zda je hráč na ledě (podle UI stavu)
              const playerIsCurrentlyOnIce = isPlayerOnIce(playerTeamColor);

              if (playerIsCurrentlyOnIce) {
                console.log(`✨ Generating special action for player at ${actionCheckTime}s`);
                generateSpecialAction(playerTeamColor, actionCheckTime);
                setLastSpecialActionTime(actionCheckTime);
                // generateSpecialAction již pozastaví hru nastavením gameState na 'paused'
              }
            }
          }
        }

        // Vrátíme nový čas pro další tick
        return newTime;
      }); // Konec setGameTime
    }; // Konec gameTick

    // Spustíme interval, který volá gameTick každou sekundu reálného času
    intervalId = setInterval(gameTick, 1000);

    // Cleanup funkce - zastaví interval, když se komponenta odmountuje nebo se změní závislosti
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [ // Závislosti hlavního herního cyklu
    gameState, gameSpeed, events, teamState, score, // Stavy ovlivňující logiku
    findPlayerTeamColor, generateSpecialAction, triggerHighlight, // Callback funkce
    lastSpecialActionTime, specialAction, // Stavy pro speciální akce
    updateTeamState, updatePlayersOnIceState, isPlayerOnIce, // Funkce pro update a kontrolu stavu
    setGameState, setGameTime, setEvents, setLastEvent, setScore, setCurrentPeriod // Setter funkce stavů
  ]);

  // --- Funkce pro vynucenou aktualizaci UI (pro debugování) ---
  const forceCompleteUIUpdate = useCallback(() => {
    console.log(`%c[DEBUG] 🚨 VYNUCENÁ KOMPLETNÍ AKTUALIZACE UI`, 'color: red; font-weight: bold; background-color: yellow; padding: 3px');
    updatePlayersOnIceState(); // Přesynchronizujeme UI state
    setGameTime(gt => gt); // Pokus o vynucení re-renderu
    // Můžeme přidat další vynucení s prodlevou
    setTimeout(() => setGameTime(gt => gt + 0.0001), 100);
    setTimeout(() => setGameTime(gt => gt - 0.0001), 200);
  }, [updatePlayersOnIceState]);

  // --- Tlačítko pro vynucené překreslení UI ---
  const renderDebugButton = () => {
    // Zobrazíme jen pokud hra není ukončená (a možná jen v dev modu)
    if (gameState === 'finished' /* && process.env.NODE_ENV === 'development' */) return null;

    return (
      <button
        onClick={forceCompleteUIUpdate}
        className="fixed bottom-4 right-4 z-[100] bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white opacity-80 hover:opacity-100"
        title="Vynutit synchronizaci a překreslení UI"
      >
        Sync UI
      </button>
    );
  };

  // --- Main Render ---
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm text-gray-200 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-screen-xl h-[96vh] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl border border-gray-700 flex flex-col">
        {/* Tlačítko pro debugování - pokud je potřeba */}
        {/* {renderDebugButton()} */}

        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={handleExit}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium",
              "bg-red-600/80 hover:bg-red-600 text-white",
              (gameState === 'finished') && "animate-pulse bg-blue-600/80 hover:bg-blue-600" // Jiná barva pro výsledky
            )}
            title={gameState === 'finished' ? "Zobrazit výsledky" : "Opustit zápas"}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">{gameState === 'finished' ? 'Výsledky' : 'Opustit'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight text-center px-2">Lancers Simulátor Zápasu</h2>
          {/* Status hry */}
          <div className="w-24 sm:w-28 flex justify-end">
             <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-md text-center w-full transition-colors ${
                gameState === 'playing' ? 'bg-green-600/80 text-green-100 animate-pulse' :
                gameState === 'paused' && specialAction ? 'bg-purple-600/80 text-purple-100 animate-pulse' : // Speciální akce
                gameState === 'paused' ? 'bg-yellow-600/80 text-yellow-100' :
                gameState === 'finished' ? 'bg-blue-600/80 text-blue-100' :
                'bg-gray-600/80 text-gray-200' // warmup
             }`}>
                {gameState === 'playing' ? 'Hra běží' :
                 gameState === 'paused' && specialAction ? 'Akce!' :
                 gameState === 'paused' ? 'Pauza' :
                 gameState === 'finished' ? 'Konec' :
                 'Start'}
             </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col xl:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">

          {/* Left Column: Týmy, Ovládání, Stav hráčů */}
          <div className="w-full xl:w-[600px] 2xl:w-[700px] flex flex-col gap-3 sm:gap-4 flex-shrink-0">
            {/* Tabulka týmů (aktuálně jen bílý pro ukázku) */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
              <TeamTable
                  teamData={teams}
                  teamColor="white" // Můžeme zobrazit oba týmy nebo přepínat
                  teamState={teamState}
                  playerStats={playerStats}
                  playersOnIceState={playersOnIceState} // Předáváme UI stav
                  litvinovLancers={litvinovLancers}
              />
              {/* Zde by mohla být druhá tabulka pro černý tým nebo přepínač */}
            </div>

            {/* Game Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 flex-shrink-0">
              {gameState !== 'finished' ? (
                <>
                  <button onClick={() => changeSpeed(-1)} disabled={gameSpeed <= 1 || gameState === 'paused'} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors" title="Zpomalit">
                    <BackwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </button>
                  <button onClick={handleStartPause} disabled={!!specialAction} className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg text-white font-bold text-base sm:text-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg ${gameState === 'playing' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} ${!!specialAction ? 'opacity-50 cursor-not-allowed' : ''}`} title={specialAction ? 'Probíhá speciální akce' : (gameState === 'playing' ? 'Pozastavit' : 'Spustit/Pokračovat')}>
                    {gameState === 'playing' ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                    {gameState === 'playing' ? 'Pauza' : (gameState === 'paused' ? 'Pokračovat' : 'Start')}
                  </button>
                  <button onClick={() => changeSpeed(1)} disabled={gameSpeed >= MAX_SPEED || gameState === 'paused'} className="p-1.5 sm:p-2 bg-cyan-600/70 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors" title="Zrychlit">
                    <ForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </button>
                  <div className={`text-xs sm:text-sm ${gameSpeed > 8 ? 'text-yellow-400 font-bold' : 'text-gray-400'} ml-2 sm:ml-4 whitespace-nowrap`}>
                    Rychlost: {gameSpeed}x
                  </div>
                </>
              ) : (
                <div className='text-center flex flex-col items-center gap-2'>
                  <p className="text-lg sm:text-xl font-semibold text-yellow-400">Zápas skončil!</p>
                  {/* Tlačítko pro zobrazení výsledků je nyní v headeru */}
                </div>
              )}
            </div>

             {/* Manual Substitution Buttons */}
             <div className="flex gap-2 sm:gap-4 justify-center flex-shrink-0">
                {['white', 'black'].map(teamColor => {
                    const playerTeam = teams[teamColor];
                    const playerLogicalState = teamState ? teamState[teamColor] : null;
                    if (!playerTeam || !playerLogicalState) return null; // Skip if team data not loaded

                    const player = playerTeam.players.find(p => p.isPlayer);
                    if (!player || !player.key) return null; // Skip if player not in this team

                    const playerKey = player.key;
                    // Používáme isPlayerOnIce (z UI stavu) pro zobrazení tlačítka
                    const isOnIce = isPlayerOnIce(teamColor);
                    const fatigue = Math.round(playerLogicalState.fatigue[playerKey] ?? 0);
                    // Podmínka pro disabled 'Naskočit': Hra skončila NEBO už je na ledě NEBO je na ledě plný počet hráčů v poli (z logického stavu)
                    const cannotGoOn = gameState === 'finished' || isOnIce || playerLogicalState.onIce.filter(p => p && p.position !== 'brankář').length >= 5;
                    // Podmínka pro disabled 'Střídat': Hra skončila NEBO už je na lavičce
                    const cannotGoOff = gameState === 'finished' || !isOnIce;

                    return (
                        <button
                            key={teamColor}
                            onClick={() => handlePlayerSubstitution(teamColor)}
                            disabled={isOnIce ? cannotGoOff : cannotGoOn}
                            className={clsx(
                                "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-1/2 justify-center",
                                // Změna: Zelené pro 'Na led', Červené pro 'Střídat'
                                isOnIce ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                                (isOnIce ? cannotGoOff : cannotGoOn) && 'opacity-50 cursor-not-allowed brightness-75'
                            )}
                            title={isOnIce
                                ? (cannotGoOff ? "Nelze střídat (hra skončila nebo jsi na lavičce)" : `Jít střídat (únava: ${fatigue}%)`)
                                : (cannotGoOn ? "Nelze naskočit (hra skončila, jsi na ledě, nebo je plno)" : `Naskočit na led (únava: ${fatigue}%)`)
                            }
                        >
                            {isOnIce ? (
                                <> <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> Střídat <span className='hidden md:inline'>({fatigue}%)</span> </>
                            ) : (
                                <> <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> Na led <span className='hidden md:inline'>({fatigue}%)</span> </>
                            )}
                        </button>
                    );
                })}
             </div>


            {/* Player Status (Fatigue) - zobrazuje stav pro oba týmy */}
            <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-grow overflow-hidden">
                {/* White Team Status */}
                <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 overflow-hidden">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-white border-b border-gray-600 pb-1.5 flex-shrink-0">
                    Bílý tým - Stav
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                    {teams.white?.players?.map(player => {
                      if (!player?.key || !teamState?.white?.fatigue) return null;
                      const currentFatigue = teamState.white.fatigue[player.key] ?? 0;
                      // Používáme UI stav pro zobrazení on/off ice
                      const isUIOnIce = playersOnIceState.white.has(player.key);
                      return (
                        <PlayerStatus
                          // KLÍČOVÁ ZMĚNA: Key se mění, když se mění isUIOnIce, vynutí re-render
                          key={`white-${player.key}-${isUIOnIce ? 'on' : 'off'}`}
                          player={player}
                          teamColor="white"
                          fatigueValue={currentFatigue}
                          isOnIce={isUIOnIce} // Předáváme UI stav
                          playerKey={player.key}
                          highlightedPlayerKey={highlightedPlayerKey}
                          litvinovLancers={litvinovLancers}
                        />
                      );
                    })}
                    {(!teams.white?.players || teams.white.players.length === 0) && (
                      <p className="text-gray-500 text-center italic p-4">Tým se načítá...</p>
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
                      if (!player?.key || !teamState?.black?.fatigue) return null;
                      const currentFatigue = teamState.black.fatigue[player.key] ?? 0;
                      const isUIOnIce = playersOnIceState.black.has(player.key);
                      return (
                        <PlayerStatus
                          key={`black-${player.key}-${isUIOnIce ? 'on' : 'off'}`}
                          player={player}
                          teamColor="black"
                          fatigueValue={currentFatigue}
                          isOnIce={isUIOnIce} // Předáváme UI stav
                          playerKey={player.key}
                          highlightedPlayerKey={highlightedPlayerKey}
                          litvinovLancers={litvinovLancers}
                        />
                      );
                    })}
                    {(!teams.black?.players || teams.black.players.length === 0) && (
                      <p className="text-gray-500 text-center italic p-4">Tým se načítá...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Log, Statistiky */}
          <div className="flex-1 overflow-hidden flex flex-col gap-3 sm:gap-4">
            {/* Game Log */}
            <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 flex-grow overflow-hidden max-h-[60%]">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-cyan-400 border-b border-gray-600 pb-1.5 flex-shrink-0">
                Dění v zápase
              </h3>
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1" ref={eventLogRef}>
                {events.length > 0 ? (
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div
                        key={event.id || `${event.time}-${index}`} // Fallback key
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          event.type === 'goal' ? 'bg-green-900/50 border-l-4 border-green-500' :
                          event.type === 'penalty' ? 'bg-red-900/50 border-l-4 border-red-500' :
                          event.type === 'period_change' || event.type === 'game_end' ? 'bg-indigo-900/50 border-l-4 border-indigo-500' :
                          event.type === 'substitution' ? 'bg-gray-800/40' : // Méně výrazné střídání
                          'bg-gray-900/30' // Ostatní události
                        } ${event.id === lastEvent?.id ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-gray-900' : ''}`} // Zvýraznění poslední události
                        ref={event.id === lastEvent?.id ? lastEventRef : null}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5 text-cyan-400">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-100">{event.description}</div>
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
                    {gameState === 'warmup' ? 'Stiskněte Start pro zahájení zápasu' :
                     gameState === 'finished' ? 'Zápas byl ukončen' :
                     'Zápasové zprávy se zobrazí zde...'}
                  </div>
                )}
              </div>
            </div>

            {/* Game Statistics */}
            <div className="bg-gray-800/40 rounded-lg p-2 sm:p-3 flex flex-col border border-gray-700/50 h-[40%] min-h-[200px] overflow-hidden">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center text-cyan-400 border-b border-gray-600 pb-1.5 flex-shrink-0">
                Statistiky zápasu
              </h3>
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                 {/* Skóre */}
                <div className="flex justify-between items-center mb-4 p-2 bg-gray-900/50 rounded-lg">
                  <div className="text-center w-1/3 text-white text-3xl font-bold">{score.white}</div>
                  <div className="text-center w-1/3 text-gray-400 uppercase text-xs tracking-wider">Skóre</div>
                  <div className="text-center w-1/3 text-gray-300 text-3xl font-bold">{score.black}</div>
                </div>

                {/* Čas, Třetina, Rychlost */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Čas</div>
                    <div className="text-sm font-semibold">
                      {/* Zobrazuje herní čas, ne reálný */}
                      {formatGameTime(gameTime, PERIOD_DURATION_SECONDS).split('|')[1]?.trim()}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Třetina</div>
                    <div className="text-sm font-semibold">
                      {currentPeriod}. / 3
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">Tempo</div>
                    <div className="text-sm font-semibold">
                      {gameSpeed}x
                    </div>
                  </div>
                </div>

                {/* Team statistics */}
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-center text-gray-300 mb-2">
                    Týmové statistiky
                  </h4>
                  {/* Výpočet statistik z playerStats */}
                  {(() => {
                       const calcTeamStat = (statName, teamColor) => {
                           return teams[teamColor]?.players.reduce((sum, player) => {
                               return sum + (playerStats[player.key]?.[statName] || 0);
                           }, 0) || 0;
                       };
                       const shotsWhite = calcTeamStat('shots', 'white');
                       const shotsBlack = calcTeamStat('shots', 'black');
                       const goalsWhite = score.white; // Jednodušší než počítat z playerStats
                       const goalsBlack = score.black;
                       const penaltiesWhite = calcTeamStat('penalties', 'white'); // Součet minut?
                       const penaltiesBlack = calcTeamStat('penalties', 'black');

                       return (
                           <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                               <div className="text-center font-semibold text-white">Bílí</div>
                               <div className="text-center text-gray-400">Kategorie</div>
                               <div className="text-center font-semibold text-gray-300">Černí</div>

                               <div className="text-center">{goalsWhite}</div>
                               <div className="text-center text-gray-400">Góly</div>
                               <div className="text-center">{goalsBlack}</div>

                               <div className="text-center">{shotsWhite}</div>
                               <div className="text-center text-gray-400">Střely</div>
                               <div className="text-center">{shotsBlack}</div>

                               <div className="text-center">{penaltiesWhite > 0 ? `${penaltiesWhite} min` : '0'}</div>
                               <div className="text-center text-gray-400">Tresty</div>
                               <div className="text-center">{penaltiesBlack > 0 ? `${penaltiesBlack} min` : '0'}</div>

                               {/* Můžeme přidat další statistiky jako bloky atd. */}
                           </div>
                       );
                   })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Special Action Dialog */}
        {specialAction && (
          <PlayerSpecialAction
            action={specialAction}
            onOptionSelect={handleSpecialActionResult} // Předáváme handler
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
                <button onClick={handleCancelExit} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  Zůstat
                </button>
                <button onClick={handleConfirmExit} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">
                  Opustit zápas
                </button>
              </div>
            </div>
          </div>
        )}
      </div> {/* Konec hlavního kontejneru */}

      {/* Styles (zůstávají stejné) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(56, 189, 248, 0.6); border-radius: 10px; border: 1px solid rgba(30, 41, 59, 0.7); background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(56, 189, 248, 0.9); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(56, 189, 248, 0.6) rgba(30, 41, 59, 0.5); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div> /* Konec vnějšího divu */
  );
};

export default HockeyMatch;