'use client';

import React, { useState, useEffect } from 'react';

  // Definice týmů pro turnaj
  const teamGinTonic = {
    name: "Gin Tonic",
    goalkeeper: { 
      id: 'gin_gk', 
      name: "Martina 'Kočka' Chytilová", 
      number: "1", 
      level: 5, 
      image: "/Images/question_mark.png" 
    },
    defenders: [
      { 
        id: 'gin_def1', 
        name: "Tereza 'Skála' Tvrdá", 
        number: "4", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gin_def2', 
        name: "Lucie 'Tygr' Dravá", 
        number: "8", 
        level: 4, 
        image: "/Images/question_mark.png" 
      }
    ],
    forwards: [
      { 
        id: 'gin_fw1', 
        name: "Karolína 'Blesk' Rychlá", 
        number: "9", 
        level: 5, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gin_fw2', 
        name: "Veronika 'Střela' Přesná", 
        number: "19", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gin_fw3', 
        name: "Jana 'Vítr' Létající", 
        number: "91", 
        level: 4, 
        image: "/Images/question_mark.png" 
      }
    ]
  };

  const teamGurmaniZatec = {
    name: "Gurmáni Žatec",
    goalkeeper: { 
      id: 'gurmani_gk', 
      name: "Michal 'Šéfkuchař' Kuchařský", 
      number: "33", 
      level: 4, 
      image: "/Images/question_mark.png" 
    },
    defenders: [
      { 
        id: 'gurmani_def1', 
        name: "Petr 'Řízek' Smažený", 
        number: "55", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gurmani_def2', 
        name: "Jan 'Svíčková' Omáčka", 
        number: "66", 
        level: 3, 
        image: "/Images/question_mark.png" 
      }
    ],
    forwards: [
      { 
        id: 'gurmani_fw1', 
        name: "Tomáš 'Guláš' Masový", 
        number: "11", 
        level: 5, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gurmani_fw2', 
        name: "David 'Knedlík' Moučný", 
        number: "22", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'gurmani_fw3', 
        name: "Filip 'Rohlík' Pekařský", 
        number: "99", 
        level: 3, 
        image: "/Images/question_mark.png" 
      }
    ]
  };

  const teamKafacBilina = {
    name: "Kafáč Bílina",
    goalkeeper: { 
      id: 'kafac_gk', 
      name: "Josef 'Legenda' Káva", 
      number: "1", 
      level: 10, 
      image: "/Images/question_mark.png" 
    },
    defenders: [
      { 
        id: 'kafac_def1', 
        name: "Pavel 'Nováček' Novák", 
        number: "4", 
        level: 2, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'kafac_def2', 
        name: "Martin 'Veterán' Starý", 
        number: "8", 
        level: 5, 
        image: "/Images/question_mark.png" 
      }
    ],
    forwards: [
      { 
        id: 'kafac_fw1', 
        name: "Jan 'Espresso' Rychlý", 
        number: "9", 
        level: 3, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'kafac_fw2', 
        name: "Petr 'Latté' Mléčný", 
        number: "19", 
        level: 3, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'kafac_fw3', 
        name: "Tomáš 'Piccolo' Malý", 
        number: "91", 
        level: 2, 
        image: "/Images/question_mark.png" 
      }
    ]
  };

  const teamPredatorsNymburk = {
    name: "Predátors Nymburk",
    goalkeeper: { 
      id: 'predators_gk', 
      name: "David 'Nováček' Novotný", 
      number: "31", 
      level: 1, 
      image: "/Images/question_mark.png" 
    },
    defenders: [
      { 
        id: 'predators_def1', 
        name: "Martin 'Zeď' Železný", 
        number: "5", 
        level: 5, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'predators_def2', 
        name: "Jakub 'Tank' Tvrdý", 
        number: "2", 
        level: 5, 
        image: "/Images/question_mark.png" 
      }
    ],
    forwards: [
      { 
        id: 'predators_fw1', 
        name: "Tomáš 'Sniper' Střelecký", 
        number: "88", 
        level: 7, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'predators_fw2', 
        name: "Petr 'Raketa' Rychlý", 
        number: "71", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'predators_fw3', 
        name: "Jan 'Mladej' Mladý", 
        number: "97", 
        level: 1, 
        image: "/Images/question_mark.png" 
      }
    ]
  };

  const teamNorthBlades = {
    name: "North Blades",
    goalkeeper: { 
      id: 'north_gk', 
      name: "Erik 'Ledovec' Andersson", 
      number: "30", 
      level: 1, 
      image: "/Images/question_mark.png" 
    },
    defenders: [
      { 
        id: 'north_def1', 
        name: "Martin 'Štít' Štít", 
        number: "44", 
        level: 5, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'north_def2', 
        name: "Jan 'Kříž' Kříž", 
        number: "77", 
        level: 4, 
        image: "/Images/question_mark.png" 
      }
    ],
    forwards: [
      { 
        id: 'north_fw1', 
        name: "Tomáš 'Guláš' Masový", 
        number: "11", 
        level: 5, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'north_fw2', 
        name: "David 'Knedlík' Moučný", 
        number: "22", 
        level: 4, 
        image: "/Images/question_mark.png" 
      },
      { 
        id: 'north_fw3', 
        name: "Filip 'Rohlík' Pekařský", 
        number: "99", 
        level: 3, 
        image: "/Images/question_mark.png" 
      }
    ]
  };

  const opponentTeam = {
    name: "HC Lopaty Praha",
    goalkeeper: {
      id: 'opp_gk',
      name: "Kolečko 'Betonář' Vozíkový",
      number: "1",
      level: 3,
      image: "/Images/question_mark.png"
    },
    defenders: [
      {
        id: 'opp_def1',
        name: "Hrábě 'Zeď' Zahradnický",
        number: "44",
        level: 3,
        image: "/Images/question_mark.png"
      },
      {
        id: 'opp_def2',
        name: "Sekera 'Drtič' Štípačový",
        number: "77",
        level: 2,
        image: "/Images/question_mark.png"
      }
    ],
    forwards: [
      {
        id: 'opp_fw1',
        name: "Lopatka 'Rychlík' Rýčový",
        number: "13",
        level: 1,
        image: "/Images/question_mark.png"
      },
      {
        id: 'opp_fw2',
        name: "Krumpáč 'Střela' Kopáčový",
        number: "88",
        level: 1,
        image: "/Images/question_mark.png"
      },
      {
        id: 'opp_fw3',
        name: "Motyka 'Tank' Hrabalský",
        number: "91",
        level: 1,
        image: "/Images/question_mark.png"
      }
    ]
  };

const ConfettiParticle = ({ color }) => {
  const style = {
    position: 'fixed',
    width: '8px',
    height: '8px',
    backgroundColor: color,
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
    left: `${Math.random() * 100}vw`,
    top: '-10px',
  };

  return <div style={style} />;
};

const CardGame = () => {
  const [unlockedCards, setUnlockedCards] = useState([]);
  const [showCollection, setShowCollection] = useState(false);
  const [currentCards, setCurrentCards] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [money, setMoney] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState({
    name: "Litvínov Lancers",
    goalkeeper: null,
    defenders: [],
    forwards: []
  });
  const [activePosition, setActivePosition] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [tournamentState, setTournamentState] = useState({
    groups: {
      A: [],
      B: []
    },
    matches: {
      groups: [],
      playoff: [],
      current: null
    },
    phase: 'groups',
    currentMatchIndex: 0
  });
  const [cardLevels, setCardLevels] = useState({});
  const [matchState, setMatchState] = useState({
    period: 1,
    time: 1200,
    score: { home: 0, away: 0 },
    events: [],
    isPlaying: false,
    gameSpeed: 1,
    playerStats: {
      goals: {},
      assists: {},
      saves: {},
      saveAccuracy: {},
      shots: {}
    },
    penalties: [],
    scheduledEvents: []
  });

  useEffect(() => {
    // Načtení levelů karet z localStorage při prvním načtení
    const savedLevels = localStorage.getItem('cardLevels');
    if (savedLevels) {
      setCardLevels(JSON.parse(savedLevels));
    }
  }, []);

  // Uložení levelů karet do localStorage při změně
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cardLevels', JSON.stringify(cardLevels));
    }
  }, [cardLevels]);

  const getCardLevel = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    return (cardLevels[cardId] || 0) + (card?.baseLevel || 1);
  };

  const getUpgradeCost = (currentLevel) => {
    return currentLevel * 50; // Každý level stojí o 50 Kč více
  };

  const upgradeCard = (cardId) => {
    const currentLevel = getCardLevel(cardId);
    const cost = getUpgradeCost(currentLevel);
    
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setCardLevels(prev => ({
        ...prev,
        [cardId]: currentLevel + 1
      }));
    } else {
      alert('Nemáte dostatek peněz na vylepšení karty!');
    }
  };

  const cards = [
    { id: 1, name: "Štěpánovský", image: "/Images/Stepanovsky1.jpg", rarity: "common", position: "defender", baseLevel: 1 },
    { id: 2, name: "Nováková", image: "/Images/Novakova1.jpg", rarity: "common", position: "goalkeeper", baseLevel: 1 },
    { id: 3, name: "Coufal", image: "/Images/Coufal3.jpg", rarity: "legendary", position: "defender", baseLevel: 10 },
    { id: 4, name: "Dlugopolský", image: "/Images/Dlugopolsky1.jpg", rarity: "rare", position: "forward", baseLevel: 1 },
    { id: 5, name: "Petrov", image: "/Images/Petrov1.jpg", rarity: "common", position: "forward", baseLevel: 1 },
    { id: 6, name: "Nistor", image: "/Images/Nistor1.jpg", rarity: "rare", position: "goalkeeper", baseLevel: 1 },
    { id: 7, name: "Materna", image: "/Images/Materna1.jpg", rarity: "epic", position: "forward", baseLevel: 1 },
    { id: 8, name: "Coufal", image: "/Images/Coufal1.jpg", rarity: "common", position: "defender", baseLevel: 1 },
    { id: 9, name: "Sommer", image: "/Images/Sommer1.jpg", rarity: "rare", position: "forward", baseLevel: 1 }
  ];

  const rarityProbabilities = {
    common: 0.6,
    rare: 0.25,
    epic: 0.1,
    legendary: 0.05
  };

  const packPrices = {
    3: 30,
    5: 50,
    7: 70
  };

  const gameSpeedOptions = [1, 2, 4, 8, 16, 32, 64];

  const setGameSpeed = (speed) => {
    setMatchState(prev => ({ ...prev, gameSpeed: speed }));
  };

  const createConfetti = () => {
    const colors = ['#FFD700', '#FFA500', '#FF4500'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: `confetti-${Date.now()}-${i}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setConfetti(particles);
    
    setTimeout(() => {
      setConfetti([]);
    }, 4000);
  };

  const openPack = (size) => {
    if (currentCards.length > 0) {
      alert('Nejdřív přesuňte rozbalené karty do sbírky!');
      return;
    }

    if (money < packPrices[size]) {
      alert('Nemáte dostatek peněz!');
      return;
    }

    setMoney(prev => prev - packPrices[size]);
    const drawnCards = [];
    
    for (let i = 0; i < size; i++) {
      const random = Math.random();
      let selectedRarity;
      let sum = 0;
      
      for (const [rarity, probability] of Object.entries(rarityProbabilities)) {
        sum += probability;
        if (random <= sum) {
          selectedRarity = rarity;
          break;
        }
      }

      const cardsOfRarity = cards.filter(card => card.rarity === selectedRarity);
      const randomCard = {...cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)]};
      randomCard.uniqueId = Date.now() + i; // Přidáme unikátní ID pro každou kartu
      drawnCards.push(randomCard);
    }

    setCurrentCards(drawnCards);
    createConfetti();
  };

  const collectCards = () => {
    if (currentCards.length > 0) {
      setUnlockedCards(prev => [...prev, ...currentCards]);
      setCurrentCards([]);
    }
  };

  const canPlayMatch = () => {
    const unlockedPlayersByPosition = unlockedCards
      .reduce((acc, card) => {
        acc[card.position] = (acc[card.position] || 0) + 1;
        return acc;
      }, {});

    return (unlockedPlayersByPosition.goalkeeper >= 1 &&
            unlockedPlayersByPosition.defender >= 2 &&
            unlockedPlayersByPosition.forward >= 3);
  };

  const startTeamSelection = () => {
    if (canPlayMatch()) {
      setShowTeamSelection(true);
    } else {
      alert('Pro zápas potřebujete: 1 brankáře, 2 obránce a 3 útočníky!');
    }
  };

  const selectPlayer = (card) => {
    if (!showTeamSelection) return;

    if (activePosition === 'goalkeeper') {
      setSelectedTeam(prev => ({ ...prev, goalkeeper: card.id }));
    } else if (activePosition?.startsWith('defender')) {
      const index = parseInt(activePosition.split('-')[1]);
      const newDefenders = [...selectedTeam.defenders];
      newDefenders[index] = card.id;
      setSelectedTeam(prev => ({ ...prev, defenders: newDefenders }));
    } else if (activePosition?.startsWith('forward')) {
      const index = parseInt(activePosition.split('-')[1]);
      const newForwards = [...selectedTeam.forwards];
      newForwards[index] = card.id;
      setSelectedTeam(prev => ({ ...prev, forwards: newForwards }));
    }
    setActivePosition(null);
  };

  const isTeamComplete = () => {
    return selectedTeam.goalkeeper !== null && 
           selectedTeam.defenders.length === 2 && 
           selectedTeam.forwards.length === 3;
  };

  const formatTime = (seconds) => {
    // Převedeme čas na formát 00:00-60:00 podle třetiny
    const period = Math.floor((1200 - seconds) / 1200) + 1;
    const periodSeconds = (period - 1) * 1200 + (1200 - seconds);
    const mins = Math.floor(periodSeconds / 60);
    const secs = periodSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateGameEvent = (eventTime) => {
    const isHomeTeam = Math.random() < 0.5;
    const team = isHomeTeam ? selectedTeam : matchState.currentOpponent;
    
    const activePlayers = {
      forwards: isHomeTeam 
        ? selectedTeam.forwards.filter(id => !matchState.penalties.some(p => p.playerId === id))
        : matchState.currentOpponent.forwards.filter(p => !matchState.penalties.some(pen => pen.playerId === p.id)),
      defenders: isHomeTeam
        ? selectedTeam.defenders.filter(id => !matchState.penalties.some(p => p.playerId === id))
        : matchState.currentOpponent.defenders.filter(p => !matchState.penalties.some(pen => pen.playerId === p.id)),
      goalkeeper: isHomeTeam ? selectedTeam.goalkeeper : matchState.currentOpponent.goalkeeper
    };

    // Přidáme čas události
    const period = Math.floor(eventTime / 1200) + 1;
    const totalSeconds = eventTime;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const eventTimeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const powerPlay = matchState.penalties.length > 0;
    const baseChance = powerPlay 
      ? (isHomeTeam === matchState.penalties[0].isHomeTeam ? 0.4 : 0.6)
      : 0.5;

    // Rozšířený seznam typů událostí
    const eventTypes = [
      { type: 'shot', weight: 40 },
      { type: 'penalty', weight: 10 },
      { type: 'hit', weight: 15 },
      { type: 'block', weight: 15 },
      { type: 'pass', weight: 20 }
    ];

    // Vážený výběr typu události
    const totalWeight = eventTypes.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedEventType;
    
    for (const eventType of eventTypes) {
      random -= eventType.weight;
      if (random <= 0) {
        selectedEventType = eventType.type;
        break;
      }
    }

    if (selectedEventType === 'shot') {
      const shooter = activePlayers.forwards[Math.floor(Math.random() * activePlayers.forwards.length)];
      const assist = activePlayers.forwards.concat(activePlayers.defenders)
        .filter(p => p !== shooter)[Math.floor(Math.random() * (activePlayers.forwards.length + activePlayers.defenders.length - 1))];
      
      const shooterLevel = isHomeTeam ? getCardLevel(shooter) : shooter.level;
      const assistLevel = isHomeTeam ? getCardLevel(assist) : assist.level;
      const opposingGoalieLevel = isHomeTeam 
        ? matchState.currentOpponent.goalkeeper.level 
        : getCardLevel(selectedTeam.goalkeeper);

      // Aktualizujeme statistiky střel
      setMatchState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          shots: {
            ...prev.playerStats.shots,
            [isHomeTeam ? matchState.currentOpponent.goalkeeper.id : selectedTeam.goalkeeper]: 
              (prev.playerStats.shots[isHomeTeam ? matchState.currentOpponent.goalkeeper.id : selectedTeam.goalkeeper] || 0) + 1
          }
        }
      }));

      const goalChance = baseChance + 
        (shooterLevel * 0.05) + 
        (assistLevel * 0.02) - 
        (opposingGoalieLevel * 0.03);

      const shotTypes = [
        "střela zápěstím",
        "golfák",
        "příklepem",
        "backhandem",
        "mezi betony",
        "pod víko"
      ];
      const selectedShotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];

      if (Math.random() < goalChance) {
        // Aktualizujeme statistiky
        setMatchState(prev => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            goals: {
              ...prev.playerStats.goals,
              [shooter]: (prev.playerStats.goals[shooter] || 0) + 1
            },
            assists: assist ? {
              ...prev.playerStats.assists,
              [assist]: (prev.playerStats.assists[assist] || 0) + 1
            } : prev.playerStats.assists
          }
        }));

        return {
          type: 'goal',
          isHomeTeam,
          player: isHomeTeam ? cards.find(c => c.id === shooter).name : shooter.name,
          assist: assist ? (isHomeTeam ? cards.find(c => c.id === assist).name : assist.name) : null,
          level: shooterLevel,
          assistLevel: assist ? assistLevel : null,
          message: `Góóól! Střelec: ${isHomeTeam ? cards.find(c => c.id === shooter).name : shooter.name} ${selectedShotType}${assist ? `, asistence: ${isHomeTeam ? cards.find(c => c.id === assist).name : assist.name}` : ''}!`,
          time: eventTimeFormatted,
          id: Date.now()
        };
      } else {
        // Aktualizujeme statistiky zákroků
        setMatchState(prev => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            saves: {
              ...prev.playerStats.saves,
              [isHomeTeam ? matchState.currentOpponent.goalkeeper.id : selectedTeam.goalkeeper]: 
                (prev.playerStats.saves[isHomeTeam ? matchState.currentOpponent.goalkeeper.id : selectedTeam.goalkeeper] || 0) + 1
            }
          }
        }));

        const saveTypes = [
          "fantastický zákrok lapačkou",
          "pohotový zákrok betony",
          "bleskový přesun a zákrok",
          "skvělý zákrok vyrážečkou",
          "neuvěřitelný rozklek"
        ];
        const selectedSaveType = saveTypes[Math.floor(Math.random() * saveTypes.length)];

        return {
          type: 'save',
          isHomeTeam: !isHomeTeam,
          player: isHomeTeam ? matchState.currentOpponent.goalkeeper.name : cards.find(c => c.id === selectedTeam.goalkeeper).name,
          level: opposingGoalieLevel,
          message: `${selectedSaveType.charAt(0).toUpperCase() + selectedSaveType.slice(1)} předvedl ${isHomeTeam ? matchState.currentOpponent.goalkeeper.name : cards.find(c => c.id === selectedTeam.goalkeeper).name}!`,
          time: eventTimeFormatted,
          id: Date.now()
        };
      }
    } else if (selectedEventType === 'hit') {
      const hitter = [...activePlayers.forwards, ...activePlayers.defenders][
        Math.floor(Math.random() * (activePlayers.forwards.length + activePlayers.defenders.length))
      ];
      const hitterLevel = isHomeTeam ? getCardLevel(hitter) : hitter.level;
      
      const hitTypes = [
        "tvrdý bodyček u mantinelu",
        "čistý hit na modré čáře",
        "drtivý střet ve středním pásmu",
        "důrazný souboj v rohu kluziště"
      ];
      const selectedHitType = hitTypes[Math.floor(Math.random() * hitTypes.length)];

      return {
        type: 'hit',
        isHomeTeam,
        player: isHomeTeam ? cards.find(c => c.id === hitter).name : hitter.name,
        level: hitterLevel,
        message: `${isHomeTeam ? cards.find(c => c.id === hitter).name : hitter.name} předvádí ${selectedHitType}!`,
        time: eventTimeFormatted,
        id: Date.now()
      };
    } else if (selectedEventType === 'block') {
      const blocker = activePlayers.defenders[Math.floor(Math.random() * activePlayers.defenders.length)];
      const blockerLevel = isHomeTeam ? getCardLevel(blocker) : blocker.level;
      
      const blockTypes = [
        "obětavě blokuje střelu",
        "skvěle čte hru a zachycuje přihrávku",
        "výborně brání v přečíslení",
        "chytře vystupuje proti útočníkovi"
      ];
      const selectedBlockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];

      return {
        type: 'block',
        isHomeTeam,
        player: isHomeTeam ? cards.find(c => c.id === blocker).name : blocker.name,
        level: blockerLevel,
        message: `${isHomeTeam ? cards.find(c => c.id === blocker).name : blocker.name} ${selectedBlockType}!`,
        time: eventTimeFormatted,
        id: Date.now()
      };
    } else if (selectedEventType === 'pass') {
      const passer = [...activePlayers.forwards, ...activePlayers.defenders][
        Math.floor(Math.random() * (activePlayers.forwards.length + activePlayers.defenders.length))
      ];
      const passerLevel = isHomeTeam ? getCardLevel(passer) : passer.level;
      
      const passTypes = [
        "krásnou přihrávku do jízdy",
        "chytrou nahrávku do volného prostoru",
        "rychlou kombinaci na jeden dotek",
        "přesnou přihrávku přes celé kluziště"
      ];
      const selectedPassType = passTypes[Math.floor(Math.random() * passTypes.length)];

      return {
        type: 'pass',
        isHomeTeam,
        player: isHomeTeam ? cards.find(c => c.id === passer).name : passer.name,
        level: passerLevel,
        message: `${isHomeTeam ? cards.find(c => c.id === passer).name : passer.name} předvádí ${selectedPassType}!`,
        time: eventTimeFormatted,
        id: Date.now()
      };
    } else if (selectedEventType === 'penalty') {
      const penalizedPlayer = [...activePlayers.forwards, ...activePlayers.defenders][
        Math.floor(Math.random() * (activePlayers.forwards.length + activePlayers.defenders.length))
      ];
      
      const penalties = [
        { text: "Vyloučení na 2 minuty za hákování", desc: "po souboji u mantinelu" },
        { text: "Vyloučení na 2 minuty za sekání", desc: "při snaze zastavit útok" },
        { text: "Vyloučení na 2 minuty za držení", desc: "při bránění protiútoku" },
        { text: "Vyloučení na 2 minuty za nedovolené bránění", desc: "ve středním pásmu" },
        { text: "Vyloučení na 2 minuty za krosček", desc: "v souboji před brankou" },
        { text: "Vyloučení na 2 minuty za podražení", desc: "při snaze získat puk" }
      ];
      
      const penalty = penalties[Math.floor(Math.random() * penalties.length)];
      
      return {
        type: 'penalty',
        isHomeTeam,
        player: isHomeTeam ? cards.find(c => c.id === penalizedPlayer).name : penalizedPlayer.name,
        level: isHomeTeam ? getCardLevel(penalizedPlayer) : penalizedPlayer.level,
        message: `${penalty.text} - ${isHomeTeam ? cards.find(c => c.id === penalizedPlayer).name : penalizedPlayer.name} ${penalty.desc}`,
        time: eventTimeFormatted,
        duration: 120,
        playerId: isHomeTeam ? penalizedPlayer : penalizedPlayer.id,
        timeLeft: 120,
        startTime: Date.now()
      };
    }
  };

  const generateSpecialEvent = (selectedTeam) => {
    const specialEvents = [
      {
        type: 'breakaway',
        title: 'Samostatný únik!',
        description: 'Váš hráč se dostal do samostatného úniku!',
        options: [
          { id: 'shoot', text: 'Vystřelit', successRate: 0.4 },
          { id: 'deke', text: 'Kličkovat', successRate: 0.3 }
        ]
      },
      {
        type: 'powerplay',
        title: 'Přesilová hra!',
        description: 'Máte výhodu přesilové hry!',
        options: [
          { id: 'shot', text: 'Střela od modré', successRate: 0.35 },
          { id: 'pass', text: 'Kombinace do prázdné', successRate: 0.45 }
        ]
      },
      {
        type: 'defense',
        title: 'Protiútok soupeře!',
        description: 'Soupeř se řítí do protiútoku!',
        options: [
          { id: 'block', text: 'Blokovat střelu', successRate: 0.5 },
          { id: 'hit', text: 'Bodyček', successRate: 0.4 }
        ]
      }
    ];

    // Vybereme náhodnou speciální událost
    const randomEvent = specialEvents[Math.floor(Math.random() * specialEvents.length)];
    
    // Vybereme vhodného hráče pro událost
    const availablePlayers = [
      ...selectedTeam.forwards,
      ...selectedTeam.defenders,
      selectedTeam.goalkeeper
    ].filter(id => !matchState.penalties.find(p => p.playerId === id));
    
    if (availablePlayers.length === 0) return null;
    
    const randomId = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    const player = cards.find(card => card.id === randomId);
    if (!player) return null;

    // Přidáme bonus k úspěšnosti podle levelu hráče
    const playerLevel = getCardLevel(player.id);
    const levelBonus = (playerLevel - 1) * 0.1;

    return {
      ...randomEvent,
      player,
      options: randomEvent.options.map(option => ({
        ...option,
        successRate: option.successRate * (1 + levelBonus)
      }))
    };
  };

  const handleDecision = (option) => {
    const success = Math.random() < option.successRate;
    
    if (success) {
      if (currentDecision.type === 'breakaway' || currentDecision.type === 'powerplay') {
        // Přidáme gól domácímu týmu
        setMatchState(prev => ({
          ...prev,
          score: {
            home: prev.score.home + 1,
            away: prev.score.away
          },
          events: [...prev.events, {
            type: 'goal',
            isHomeTeam: true,
            player: currentDecision.player.name,
            level: getCardLevel(currentDecision.player.id),
            message: `Góóól! ${currentDecision.player.name} využívá ${currentDecision.type === 'breakaway' ? 'samostatný únik' : 'přesilovou hru'}!`,
            time: formatTime(matchState.time),
            id: Date.now()
          }]
        }));
      }
    } else {
      if (currentDecision.type === 'breakaway' || currentDecision.type === 'powerplay') {
        // Přidáme zákrok brankáři soupeře
        setMatchState(prev => ({
          ...prev,
          events: [...prev.events, {
            type: 'save',
            isHomeTeam: false,
            player: matchState.currentOpponent.goalkeeper.name,
            level: matchState.currentOpponent.goalkeeper.level,
            message: `${matchState.currentOpponent.goalkeeper.name} chytá pokus ${currentDecision.player.name}!`,
            time: formatTime(matchState.time),
            id: Date.now()
          }]
        }));
      } else if (currentDecision.type === 'defense') {
        // Přidáme gól soupeři
        setMatchState(prev => ({
          ...prev,
          score: {
            home: prev.score.home,
            away: prev.score.away + 1
          },
          events: [...prev.events, {
            type: 'goal',
            isHomeTeam: false,
            player: "Útočník HC Lopaty Praha",
            level: 1,
            message: `Góóól! Útočník HC Lopaty Praha využívá neúspěšnou obranu!`,
            time: formatTime(matchState.time),
            id: Date.now()
          }]
        }));
      }
    }
  };

  const startMatch = () => {
    if (isTeamComplete()) {
      setShowMatch(true);
      setShowTeamSelection(false);
      
      // Pokud jsme v turnaji, nastavíme soupeře podle aktuálního zápasu
      const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
      if (currentMatch) {
        const isHomeTeam = currentMatch.home === selectedTeam.name;
        const opponentName = isHomeTeam ? currentMatch.away : currentMatch.home;
        const opponent = getTeamByName(opponentName);
        
        setMatchState(prev => {
          const initialEventTimes = [];
          const numEvents = Math.floor(Math.random() * (12 - 5 + 1)) + 5;
          for (let i = 0; i < numEvents; i++) {
            initialEventTimes.push(Math.floor(Math.random() * (1200 - 5) + 5));
          }
          return { 
            ...prev, 
            isPlaying: true,
            score: { home: 0, away: 0 },
            playerStats: {
              goals: {},
              assists: {},
              saves: {
                [selectedTeam.goalkeeper]: 0,
                [opponent.goalkeeper.id]: 0
              },
              shots: {
                [selectedTeam.goalkeeper]: 0,
                [opponent.goalkeeper.id]: 0
              }
            },
            penalties: [],
            scheduledEvents: initialEventTimes.sort((a, b) => b - a),
            currentOpponent: opponent
          };
        });
      } else {
        // Standardní zápas mimo turnaj
        setMatchState(prev => {
          const initialEventTimes = [];
          const numEvents = Math.floor(Math.random() * (12 - 5 + 1)) + 5;
          for (let i = 0; i < numEvents; i++) {
            initialEventTimes.push(Math.floor(Math.random() * (1200 - 5) + 5));
          }
          return { 
            ...prev, 
            isPlaying: true,
            score: { home: 0, away: 0 },
            playerStats: {
              goals: {},
              assists: {},
              saves: {
                [selectedTeam.goalkeeper]: 0,
                [opponentTeam.goalkeeper.id]: 0
              },
              shots: {
                [selectedTeam.goalkeeper]: 0,
                [opponentTeam.goalkeeper.id]: 0
              }
            },
            penalties: [],
            scheduledEvents: initialEventTimes.sort((a, b) => b - a),
            currentOpponent: opponentTeam
          };
        });
      }
    }
  };

  useEffect(() => {
    if (matchState.isPlaying) {
      // Funkce pro generování náhodných časů pro události v třetině
      const generateEventTimes = () => {
        const numEvents = Math.floor(Math.random() * (12 - 5 + 1)) + 5; // 5-12 událostí
        const times = [];
        for (let i = 0; i < numEvents; i++) {
          // Generujeme časy v sekundách pro aktuální třetinu
          const minTime = matchState.period === 1 ? 5 : (matchState.period - 1) * 1200 + 5;
          const maxTime = matchState.period * 1200;
          times.push(Math.floor(Math.random() * (maxTime - minTime) + minTime));
        }
        return times.sort((a, b) => b - a); // Seřadíme sestupně pro snadnější kontrolu
      };

      // Generujeme časy pro střely pro celý zápas dopředu
      const generateShotTimes = () => {
        const shotTimes = {
          home: [],
          away: []
        };

        // Vypočítáme sílu týmů (součet levelů útočníků a obránců)
        const homeTeamStrength = selectedTeam.forwards.reduce((sum, id) => sum + getCardLevel(id), 0) +
                                selectedTeam.defenders.reduce((sum, id) => sum + getCardLevel(id), 0);
        
        const awayTeamStrength = opponentTeam.forwards.reduce((sum, p) => sum + p.level, 0) +
                                opponentTeam.defenders.reduce((sum, p) => sum + p.level, 0);

        // Pro každou třetinu
        for (let period = 1; period <= 3; period++) {
          const minTime = (period - 1) * 1200 + 5;
          const maxTime = period * 1200;
          
          // Základní počet střel je 8-12, plus bonus podle síly týmu
          const homeBaseShots = Math.floor(Math.random() * 5) + 8; // 8-12 střel
          const awayBaseShots = Math.floor(Math.random() * 5) + 8; // 8-12 střel

          // Přidáme bonus střel podle síly týmu (každých 5 bodů síly = +1 střela)
          const homeShots = homeBaseShots + Math.floor(homeTeamStrength / 5);
          const awayShots = awayBaseShots + Math.floor(awayTeamStrength / 5);

          // Přidáme náhodné časy pro domácí tým
          for (let i = 0; i < homeShots; i++) {
            shotTimes.home.push(Math.floor(Math.random() * (maxTime - minTime) + minTime));
          }

          // Přidáme náhodné časy pro hostující tým
          for (let i = 0; i < awayShots; i++) {
            shotTimes.away.push(Math.floor(Math.random() * (maxTime - minTime) + minTime));
          }
        }

        // Seřadíme časy vzestupně
        shotTimes.home.sort((a, b) => a - b);
        shotTimes.away.sort((a, b) => a - b);

        return shotTimes;
      };

      // Vygenerujeme časy střel na začátku zápasu
      const shotTimes = generateShotTimes();

      // Hlavní herní timer
      const gameTimer = setInterval(() => {
        setMatchState(prev => {
          const timeDecrease = prev.gameSpeed;
          const newTime = prev.time - timeDecrease;
          const currentTime = (prev.period - 1) * 1200 + (1200 - newTime);

          // Kontrola střel
          const newStats = { ...prev.playerStats };
          
          // Kontrola střel domácího týmu
          while (shotTimes.home.length > 0 && shotTimes.home[0] <= currentTime) {
            shotTimes.home.shift();
            newStats.shots[opponentTeam.goalkeeper.id] = (newStats.shots[opponentTeam.goalkeeper.id] || 0) + 1;
            newStats.saves[opponentTeam.goalkeeper.id] = (newStats.saves[opponentTeam.goalkeeper.id] || 0) + 1;
          }

          // Kontrola střel hostujícího týmu
          while (shotTimes.away.length > 0 && shotTimes.away[0] <= currentTime) {
            shotTimes.away.shift();
            newStats.shots[selectedTeam.goalkeeper] = (newStats.shots[selectedTeam.goalkeeper] || 0) + 1;
            newStats.saves[selectedTeam.goalkeeper] = (newStats.saves[selectedTeam.goalkeeper] || 0) + 1;
          }

          // Aktualizace penalt
          const updatedPenalties = prev.penalties.map(penalty => ({
            ...penalty,
            timeLeft: penalty.timeLeft - timeDecrease
          })).filter(penalty => penalty.timeLeft > 0);

          if (newTime <= 0) {
            if (prev.period < 3) {
              return {
                ...prev,
                period: prev.period + 1,
                time: 1200,
                penalties: updatedPenalties,
                scheduledEvents: generateEventTimes(),
                events: [...prev.events, { 
                  type: 'period',
                  message: `Konec ${prev.period}. třetiny!`,
                  time: `${prev.period === 1 ? '20' : prev.period === 2 ? '40' : '60'}:00`,
                  id: Date.now()
                }],
                playerStats: newStats
              };
            } else {
              clearInterval(gameTimer);
              const result = prev.score.home > prev.score.away ? 'victory' : 'defeat';
              setMatchResult(result);
              setShowRewards(true);
              
              return {
                ...prev,
                isPlaying: false,
                penalties: [],
                events: [...prev.events, {
                  type: 'end',
                  message: 'Konec zápasu!',
                  time: '60:00',
                  id: Date.now()
                }],
                playerStats: newStats
              };
            }
          }

          // Kontrola událostí
          while (prev.scheduledEvents.length > 0 && prev.scheduledEvents[prev.scheduledEvents.length - 1] <= currentTime) {
            const eventTime = prev.scheduledEvents[prev.scheduledEvents.length - 1];
            const event = generateGameEvent(eventTime);
            prev.scheduledEvents.pop();

            if (event) {
              if (event.type === 'penalty') {
                return {
                  ...prev,
                  time: newTime,
                  events: [...prev.events, event],
                  penalties: [...updatedPenalties, {
                    playerId: event.playerId,
                    timeLeft: event.duration,
                    isHomeTeam: event.isHomeTeam,
                    startTime: Date.now()
                  }],
                  scheduledEvents: prev.scheduledEvents,
                  playerStats: newStats
                };
              } else if (event.type === 'goal') {
                return {
                  ...prev,
                  time: newTime,
                  score: {
                    home: prev.score.home + (event.isHomeTeam ? 1 : 0),
                    away: prev.score.away + (!event.isHomeTeam ? 1 : 0)
                  },
                  events: [...prev.events, event],
                  penalties: updatedPenalties,
                  scheduledEvents: prev.scheduledEvents,
                  playerStats: newStats
                };
              } else {
                return {
                  ...prev,
                  time: newTime,
                  events: [...prev.events, event],
                  penalties: updatedPenalties,
                  scheduledEvents: prev.scheduledEvents,
                  playerStats: newStats
                };
              }
            }
          }

          return {
            ...prev,
            time: newTime,
            penalties: updatedPenalties,
            playerStats: newStats
          };
        });
      }, 1000);

      return () => {
        clearInterval(gameTimer);
      };
    } else if (showMatch && !matchState.isPlaying && tournamentState.currentMatchIndex !== undefined) {
      // Po skončení zápasu v turnaji aktualizujeme výsledky
      const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
      if (currentMatch) {
        const homeTeam = getTeamByName(currentMatch.home);
        const awayTeam = getTeamByName(currentMatch.away);
        const score = { home: matchState.score.home, away: matchState.score.away };
        
        updateTournamentStandings(homeTeam, awayTeam, score);
        
        setTournamentState(prev => ({
          ...prev,
          matches: {
            ...prev.matches,
            groups: prev.matches.groups.map((match, index) => 
              index === prev.currentMatchIndex ? { ...match, score } : match
            )
          },
          currentMatchIndex: prev.currentMatchIndex + 1
        }));

        // Po skončení zápasu se vrátíme do turnajového menu
        setTimeout(() => {
          setShowMatch(false);
          setShowTournament(true);
          
          // Kontrola, jestli jsme dokončili skupinovou fázi
          if (tournamentState.currentMatchIndex === tournamentState.matches.groups.length - 1) {
            generatePlayoffMatches();
          }
        }, 2000);
      }
    }
  }, [matchState.isPlaying]);

  // Ceny prodeje karet podle vzácnosti
  const sellPrices = {
    common: 15,    // Polovina ceny balíčku se 3 kartami
    rare: 35,
    epic: 60,
    legendary: 100
  };

  const getSellPrice = (card) => {
    return sellPrices[card.rarity];
  };

  const sellCard = (cardToSell) => {
    // Najdeme všechny stejné karty
    const sameCards = unlockedCards.filter(c => c.id === cardToSell.id);
    
    if (sameCards.length <= 1) {
      alert('Toto je vaše poslední karta tohoto typu!');
      return;
    }

    // Přidáme peníze a odstraníme kartu
    setMoney(prev => prev + getSellPrice(cardToSell));
    setUnlockedCards(prev => prev.filter((_, index) => 
      index !== prev.findIndex(c => c.id === cardToSell.id)
    ));
  };

  // Funkce pro navigaci mezi duplikáty
  const navigateCards = (direction) => {
    if (!selectedCard) return;

    const sameCards = unlockedCards.filter(c => c.id === selectedCard.id);
    if (sameCards.length <= 1) return;

    const currentIndex = sameCards.findIndex(c => c === selectedCard);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % sameCards.length;
    } else {
      newIndex = (currentIndex - 1 + sameCards.length) % sameCards.length;
    }

    setSelectedCard(sameCards[newIndex]);
  };

  const startTournament = () => {
    if (canPlayMatch()) {
      setShowTournament(true);
      // Nastavíme týmy do skupin
      setTournamentState(prev => ({
        ...prev,
        groups: {
          A: [
            { team: teamKafacBilina, points: 0, score: { for: 0, against: 0 } },
            { team: teamNorthBlades, points: 0, score: { for: 0, against: 0 } },
            { team: selectedTeam, points: 0, score: { for: 0, against: 0 } }
          ],
          B: [
            { team: teamGinTonic, points: 0, score: { for: 0, against: 0 } },
            { team: teamGurmaniZatec, points: 0, score: { for: 0, against: 0 } },
            { team: teamPredatorsNymburk, points: 0, score: { for: 0, against: 0 } }
          ]
        }
      }));

      // Vygenerujeme zápasy ve skupinách
      setTimeout(() => {
        setTournamentState(prev => {
          const groupMatches = [];
          
          // Skupina A
          for (let i = 0; i < prev.groups.A.length; i++) {
            for (let j = i + 1; j < prev.groups.A.length; j++) {
              groupMatches.push({
                home: prev.groups.A[i].team.name,
                away: prev.groups.A[j].team.name,
                group: 'A',
                score: null
              });
            }
          }
          
          // Skupina B
          for (let i = 0; i < prev.groups.B.length; i++) {
            for (let j = i + 1; j < prev.groups.B.length; j++) {
              groupMatches.push({
                home: prev.groups.B[i].team.name,
                away: prev.groups.B[j].team.name,
                group: 'B',
                score: null
              });
            }
          }
          
          return {
            ...prev,
            matches: {
              ...prev.matches,
              groups: groupMatches
            }
          };
        });
      }, 100);
    }
  };

  // Funkce pro získání týmu podle jména
  const getTeamByName = (name) => {
    switch(name) {
      case "Kafáč Bílina": return teamKafacBilina;
      case "North Blades": return teamNorthBlades;
      case "Gin Tonic": return teamGinTonic;
      case "Gurmáni Žatec": return teamGurmaniZatec;
      case "Predátors Nymburk": return teamPredatorsNymburk;
      case "Litvínov Lancers": return selectedTeam;
      default: return null;
    }
  };

  // Funkce pro simulaci turnajového zápasu
  const playTournamentMatch = (homeTeam, awayTeam) => {
    // Vypočítáme sílu týmů
    const getTeamStrength = (team) => {
      const goalkeeperStrength = team.goalkeeper.level;
      const defenseStrength = team.defenders.reduce((sum, def) => sum + def.level, 0);
      const forwardStrength = team.forwards.reduce((sum, fw) => sum + fw.level, 0);
      return goalkeeperStrength + defenseStrength + forwardStrength;
    };

    const homeStrength = getTeamStrength(homeTeam);
    const awayStrength = getTeamStrength(awayTeam);

    // Generujeme góly podle síly týmů
    const generateGoals = (strength) => {
      const baseGoals = Math.floor(Math.random() * 4); // 0-3 základní góly
      const strengthBonus = Math.floor(strength / 20); // Bonus podle síly týmu
      return baseGoals + strengthBonus;
    };

    const homeGoals = generateGoals(homeStrength);
    const awayGoals = generateGoals(awayStrength);

    return { home: homeGoals, away: awayGoals };
  };

  // Funkce pro aktualizaci bodů a skóre po zápase
  const updateTournamentStandings = (homeTeam, awayTeam, score) => {
    setTournamentState(prev => {
      const newState = { ...prev };
      const updateTeam = (team, goalsFor, goalsAgainst) => {
        team.score.for += goalsFor;
        team.score.against += goalsAgainst;
        if (goalsFor > goalsAgainst) team.points += 3;
        else if (goalsFor === goalsAgainst) team.points += 1;
      };

      // Najdeme a aktualizujeme týmy v obou skupinách
      for (const group of ['A', 'B']) {
        for (const teamData of newState.groups[group]) {
          if (teamData.team.name === homeTeam.name) {
            updateTeam(teamData, score.home, score.away);
          } else if (teamData.team.name === awayTeam.name) {
            updateTeam(teamData, score.away, score.home);
          }
        }
      }

      return newState;
    });
  };

  // Funkce pro spuštění dalšího zápasu v turnaji
  const startNextTournamentMatch = () => {
    const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
    if (!currentMatch) return;

    // Pokud hraje hráčův tým, zobrazíme výběr sestavy
    if (currentMatch.home === selectedTeam.name || currentMatch.away === selectedTeam.name) {
      setShowTournament(false);
      setShowTeamSelection(true);
      return;
    }

    const homeTeam = getTeamByName(currentMatch.home);
    const awayTeam = getTeamByName(currentMatch.away);
    
    const score = playTournamentMatch(homeTeam, awayTeam);
    updateTournamentStandings(homeTeam, awayTeam, score);

    setTournamentState(prev => ({
      ...prev,
      matches: {
        ...prev.matches,
        groups: prev.matches.groups.map((match, index) => 
          index === prev.currentMatchIndex ? { ...match, score } : match
        )
      },
      currentMatchIndex: prev.currentMatchIndex + 1
    }));

    if (tournamentState.currentMatchIndex === tournamentState.matches.groups.length - 1) {
      generatePlayoffMatches();
    }
  };

  // Funkce pro generování playoff zápasů
  const generatePlayoffMatches = () => {
    // Seřadíme týmy v každé skupině podle bodů
    const sortTeams = (teams) => {
      return [...teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aGoalDiff = a.score.for - a.score.against;
        const bGoalDiff = b.score.for - b.score.against;
        return bGoalDiff - aGoalDiff;
      });
    };

    const groupA = sortTeams(tournamentState.groups.A);
    const groupB = sortTeams(tournamentState.groups.B);

    // Vytvoříme zápasy playoff
    const playoffMatches = [
      // Předkolo
      { home: groupA[1].team.name, away: groupB[2].team.name, round: 'preliminary' },
      { home: groupB[1].team.name, away: groupA[2].team.name, round: 'preliminary' },
      // Semifinále (první týmy ze skupin už čekají)
      { home: groupA[0].team.name, away: 'Winner P2', round: 'semifinal' },
      { home: groupB[0].team.name, away: 'Winner P1', round: 'semifinal' }
    ];

    setTournamentState(prev => ({
      ...prev,
      phase: 'playoff',
      matches: {
        ...prev.matches,
        playoff: playoffMatches
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-900 via-blue-950 to-black text-white p-8">
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shine {
          animation: shine 1.5s linear infinite;
        }
      `}</style>

      {confetti.map((particle) => (
        <ConfettiParticle key={particle.id} color={particle.color} />
      ))}

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12 animate-[float_4s_ease-in-out_infinite]">
          <div className="inline-block bg-black/30 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-yellow-500/20">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-transparent bg-clip-text mb-4">
              Sbírka karet
            </h1>
            <div className="flex justify-center gap-8 mb-4">
              <div className="bg-black/40 px-6 py-3 rounded-xl border border-yellow-500/20">
                <p className="text-yellow-100 text-xl">
                  Získáno: <span className="font-bold text-yellow-400">{unlockedCards.length}</span> / <span className="font-bold text-yellow-400">{cards.length}</span>
                </p>
              </div>
              <div className="bg-black/40 px-6 py-3 rounded-xl border border-yellow-500/20">
                <p className="text-yellow-100 text-xl">
                  Peníze: <span className="font-bold text-yellow-400">{money} Kč</span>
                </p>
              </div>
            </div>
            {!showCollection && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => canPlayMatch() ? alert('Můžete začít zápas!') : alert('Pro zápas potřebujete: 1 brankáře, 2 obránce a 3 útočníky!')}
                  className={`bg-gradient-to-r ${canPlayMatch() ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                    text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                    ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''} border-2 border-white/20`}
                  disabled={!canPlayMatch()}
                >
                  Hrát zápas {!canPlayMatch() && '(Neúplná sestava)'}
                </button>
                <button
                  onClick={() => canPlayMatch() ? startTournament() : alert('Pro turnaj potřebujete: 1 brankáře, 2 obránce a 3 útočníky!')}
                  className={`bg-gradient-to-r ${canPlayMatch() ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                    text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                    ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''} border-2 border-white/20`}
                  disabled={!canPlayMatch()}
                >
                  Hrát turnaj {!canPlayMatch() && '(Neúplná sestava)'}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center mb-8">
          {!showCollection && !showMatch && !showTeamSelection && (
            <>
              {[3, 5, 7].map((packSize) => (
                <div
                  key={packSize}
                  className="transform transition-transform hover:scale-105 active:scale-95"
                  onClick={() => openPack(packSize)}
                >
                  <div className={`cursor-pointer rounded-lg overflow-hidden shadow-xl relative group ${
                    currentCards.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-yellow-700/30 group-hover:opacity-75 transition-opacity"></div>
                    <img
                      src="/Images/LancersBalicek.jpg"
                      alt={`Balíček ${packSize} karet`}
                      className="w-64 h-80 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                      <h3 className="text-xl font-bold text-yellow-400 text-center mb-1">
                        Balíček {packSize} karet
                      </h3>
                      <p className="text-white text-center">
                        Cena: {packPrices[packSize]} Kč
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {currentCards.length > 0 && !showCollection && !showMatch && !showTeamSelection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            {currentCards.map((card) => (
              <div
                key={card.uniqueId || card.id}
                className="relative group cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() => setSelectedCard(card)}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold shadow-lg">
                  {getCardLevel(card.id)}
                </div>
              </div>
            ))}
            <div className="col-span-full flex justify-center mt-4">
              <button
                onClick={collectCards}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                  text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                  hover:scale-105 active:scale-95"
              >
                Přesunout do sbírky
              </button>
            </div>
          </div>
        )}

        {selectedCard && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedCard(null);
              }
            }}
          >
            <div className="transform transition-all duration-300">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 p-0.5 rounded-lg shadow-2xl">
                <div className="relative">
                  <img
                    src={selectedCard.image}
                    alt={selectedCard.name}
                    className="w-auto h-[70vh] object-contain rounded"
                  />
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-300 shadow-lg">
                    <span className="text-black font-bold text-lg">{getCardLevel(selectedCard.id)}</span>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2 space-y-2">
                <p className="text-yellow-400 text-xl font-bold">{selectedCard.name}</p>
                <p className="text-yellow-200 text-lg capitalize">{selectedCard.rarity}</p>
                {unlockedCards.some(c => c.id === selectedCard.id) && (
                  <div className="flex flex-col items-center gap-2">
                    {/* Počet stejných karet */}
                    <p className="text-white">
                      Počet karet: <span className="text-yellow-400">
                        {unlockedCards.filter(c => c.id === selectedCard.id).length}x
                      </span>
                    </p>

                    {/* Navigační tlačítka pro duplikáty */}
                    {unlockedCards.filter(c => c.id === selectedCard.id).length > 1 && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => navigateCards('prev')}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => navigateCards('next')}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          →
                        </button>
                      </div>
                    )}

                    {/* Tlačítka pro vylepšení a prodej */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => upgradeCard(selectedCard.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                          text-white font-bold py-2 px-6 rounded-lg transform transition-all duration-300 
                          hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={money < getUpgradeCost(getCardLevel(selectedCard.id))}
                      >
                        Vylepšit ({getUpgradeCost(getCardLevel(selectedCard.id))} Kč)
                      </button>

                      <button
                        onClick={() => sellCard(selectedCard)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                          text-white font-bold py-2 px-6 rounded-lg transform transition-all duration-300 
                          hover:scale-105 active:scale-95"
                        disabled={unlockedCards.filter(c => c.id === selectedCard.id).length <= 1}
                      >
                        Prodat ({getSellPrice(selectedCard)} Kč)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentCards.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-7 gap-4 justify-items-center">
                {currentCards.map(card => (
                  <div key={card.id} className="transform transition-all duration-300 hover:scale-105">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-xl p-0.5">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-56 object-contain rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={collectCards}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded-full transform transition-transform hover:scale-105 active:scale-95"
                >
                  Přesunout do sbírky
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed top-4 right-4 flex flex-col gap-4">
          <button
            onClick={() => setShowCollection(!showCollection)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-yellow-400/20"
          >
            {showCollection ? 'Zpět na balíčky' : 'Zobrazit sbírku'}
          </button>
          {!showCollection && (
            <>
              <button
                onClick={startTeamSelection}
                className={`bg-gradient-to-r ${canPlayMatch() ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                  text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 
                  ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''}`}
                disabled={!canPlayMatch()}
              >
                Hrát zápas {!canPlayMatch() && '(Neúplná sestava)'}
              </button>
              <button
                onClick={() => canPlayMatch() ? startTournament() : alert('Pro turnaj potřebujete: 1 brankáře, 2 obránce a 3 útočníky!')}
                className={`bg-gradient-to-r ${canPlayMatch() ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                  text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 
                  ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''}`}
                disabled={!canPlayMatch()}
              >
                Hrát turnaj {!canPlayMatch() && '(Neúplná sestava)'}
              </button>
            </>
          )}
        </div>

        {showTeamSelection && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-8">Vyberte svou sestavu</h2>
            <div className="grid grid-cols-3 gap-8 mb-8">
              {/* Brankář */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Brankář ({selectedTeam.goalkeeper ? '1/1' : '0/1'})</h3>
                <div 
                  className={`w-32 h-40 mx-auto cursor-pointer rounded-lg ${!selectedTeam.goalkeeper ? 'border-2 border-dashed border-yellow-500/50' : ''}`}
                  onClick={() => setActivePosition('goalkeeper')}
                >
                  {selectedTeam.goalkeeper ? (
                    <div className="relative">
                      <img 
                        src={cards.find(card => card.id === selectedTeam.goalkeeper)?.image} 
                        alt="Brankář" 
                        className="w-32 h-40 object-contain rounded-lg"
                      />
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <span className="text-black text-xs font-bold">{getCardLevel(selectedTeam.goalkeeper)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-yellow-500/50 text-4xl">+</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Obránci */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Obránci ({selectedTeam.defenders.length}/2)</h3>
                <div className="grid gap-4">
                  {[0, 1].map((index) => (
                    <div
                      key={index}
                      className={`w-32 h-40 mx-auto cursor-pointer rounded-lg ${!selectedTeam.defenders[index] ? 'border-2 border-dashed border-yellow-500/50' : ''}`}
                      onClick={() => setActivePosition(`defender-${index}`)}
                    >
                      {selectedTeam.defenders[index] ? (
                        <div className="relative">
                          <img 
                            src={cards.find(card => card.id === selectedTeam.defenders[index])?.image} 
                            alt="Obránce" 
                            className="w-32 h-40 object-contain rounded-lg"
                          />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-black text-xs font-bold">{getCardLevel(selectedTeam.defenders[index])}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-yellow-500/50 text-4xl">+</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Útočníci */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Útočníci ({selectedTeam.forwards.length}/3)</h3>
                <div className="grid gap-4">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`w-32 h-40 mx-auto cursor-pointer rounded-lg ${!selectedTeam.forwards[index] ? 'border-2 border-dashed border-yellow-500/50' : ''}`}
                      onClick={() => setActivePosition(`forward-${index}`)}
                    >
                      {selectedTeam.forwards[index] ? (
                        <div className="relative">
                          <img 
                            src={cards.find(card => card.id === selectedTeam.forwards[index])?.image} 
                            alt="Útočník" 
                            className="w-32 h-40 object-contain rounded-lg"
                          />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-black text-xs font-bold">{getCardLevel(selectedTeam.forwards[index])}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-yellow-500/50 text-4xl">+</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seznam dostupných karet pro vybranou pozici */}
            {activePosition && (
              <div className="bg-black/50 p-4 rounded-xl">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Dostupné karty</h3>
                <div className="grid grid-cols-5 gap-4">
                  {cards
                    .filter(card => {
                      if (activePosition === 'goalkeeper') return card.position === 'goalkeeper';
                      if (activePosition.startsWith('defender')) return card.position === 'defender';
                      if (activePosition.startsWith('forward')) return card.position === 'forward';
                      return false;
                    })
                    .filter(card => unlockedCards.some(c => c.id === card.id))
                    .map(card => (
                      <div
                        key={card.id}
                        onClick={() => selectPlayer(card)}
                        className="cursor-pointer transform transition-all duration-300 hover:scale-105"
                      >
                        <div className="relative">
                          <img src={card.image} alt={card.name} className="w-32 h-40 object-contain rounded-lg" />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-black text-xs font-bold">{getCardLevel(card.id)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowTeamSelection(false);
                  setActivePosition(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Zrušit
              </button>
              <button
                onClick={() => {
                  startMatch();
                  setActivePosition(null);
                }}
                disabled={!isTeamComplete()}
                className={`bg-gradient-to-r ${isTeamComplete() ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                  text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                  ${isTeamComplete() ? 'hover:scale-105 active:scale-95' : ''}`}
              >
                Spustit zápas
              </button>
            </div>
          </div>
        )}

        {showMatch && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
            <div className="w-full max-w-[95vw] mx-auto"> {/* Změněno z w-[90%] na w-full a max-w-[95vw] */}
              <div className="flex gap-4">
                {/* Levá část - časomíra a hřiště */}
                <div className="flex-1">
                  {/* Horní panel s logy, časomírou a ovládáním rychlosti */}
                  <div className="flex justify-between items-center mb-4 bg-black/50 p-4 rounded-xl">
                    <div className="flex items-center gap-8">
                      <img src="/Images/Litvinov_Lancers.png" alt="Litvínov Lancers" className="h-20 object-contain" />
                      {matchState.penalties.filter(p => p.isHomeTeam).map(penalty => {
                        const player = cards.find(c => c.id === penalty.playerId);
                        return (
                          <div key={`${penalty.playerId}-${penalty.startTime}`} className="relative">
                            <img 
                              src={player?.image}
                              alt={player?.name}
                              className="w-24 h-32 object-contain rounded-lg shadow-lg border-2 border-red-600"
                            />
                            <div className="absolute -bottom-2 left-0 right-0 text-center">
                              <div className="bg-red-900/80 text-white text-sm px-2 py-1 rounded-lg font-mono">
                                {Math.floor(penalty.timeLeft / 60)}:
                                {(penalty.timeLeft % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-400 mb-2">
                        {matchState.score.home} : {matchState.score.away}
                      </div>
                      <div className="text-3xl font-mono text-white">
                        {formatTime(matchState.time)}
                      </div>
                      <div className="text-xl text-yellow-200 mt-2">
                        {matchState.period}. třetina
                      </div>
                      {/* Ovládání rychlosti */}
                      <div className="flex justify-center gap-2 mt-4">
                        {gameSpeedOptions.map(speed => (
                          <button
                            key={speed}
                            onClick={() => setGameSpeed(speed)}
                            className={`px-3 py-1 rounded ${
                              matchState.gameSpeed === speed
                                ? 'bg-yellow-500 text-black font-bold'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } text-sm transition-colors`}
                          >
                            {speed}×
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      {matchState.penalties.filter(p => !p.isHomeTeam).map(penalty => {
                        const player = matchState.currentOpponent.forwards.concat(matchState.currentOpponent.defenders)
                          .find(p => p.id === penalty.playerId);
                        return (
                          <div key={`${penalty.playerId}-${penalty.startTime}`} className="relative">
                            <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 relative overflow-hidden border-2 border-red-600">
                              <div className="text-5xl font-bold mb-2">?</div>
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <span className="text-black text-xs font-bold">{player.level}</span>
                              </div>
                              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 p-1">
                                <p className="text-[8px] text-center text-gray-300 font-bold leading-tight">
                                  {player.name}
                                </p>
                              </div>
                            </div>
                            <div className="absolute -bottom-2 left-0 right-0 text-center">
                              <div className="bg-red-900/80 text-white text-sm px-2 py-1 rounded-lg font-mono">
                                {Math.floor(penalty.timeLeft / 60)}:
                                {(penalty.timeLeft % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <img src={matchState.currentOpponent ? `/Images/${matchState.currentOpponent.name.replace(/\s+/g, '_')}.png` : "/Images/HC_Lopaty_Praha.png"} alt={matchState.currentOpponent ? matchState.currentOpponent.name : "HC Lopaty Praha"} className="h-20 object-contain" />
                    </div>
                  </div>

                  {/* Vylepšená ledová plocha */}
                  <div className="relative w-full h-[calc(90vh-200px)] bg-[#e8f0f0] rounded-[200px] overflow-hidden border-8 border-blue-900/30">
                    {/* Červené čáry */}
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-red-600 transform -translate-y-1/2"></div>
                    <div className="absolute left-1/3 right-1/3 top-0 bottom-0 border-l-2 border-r-2 border-red-600"></div>
                    
                    {/* Modré čáry */}
                    <div className="absolute w-1 h-full bg-blue-600 left-1/4"></div>
                    <div className="absolute w-1 h-full bg-blue-600 right-1/4"></div>
                    
                    {/* Kruhy na vhazování */}
                    <div className="absolute left-1/6 top-1/4 w-24 h-24 border-2 border-red-600 rounded-full"></div>
                    <div className="absolute left-1/6 bottom-1/4 w-24 h-24 border-2 border-red-600 rounded-full"></div>
                    <div className="absolute right-1/6 top-1/4 w-24 h-24 border-2 border-red-600 rounded-full"></div>
                    <div className="absolute right-1/6 bottom-1/4 w-24 h-24 border-2 border-red-600 rounded-full"></div>
                    <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-red-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Brankoviště */}
                    <div className="absolute left-8 top-1/2 w-16 h-32 border-2 border-red-600 rounded-r-lg transform -translate-y-1/2"></div>
                    <div className="absolute right-8 top-1/2 w-16 h-32 border-2 border-red-600 rounded-l-lg transform -translate-y-1/2"></div>

                    {/* Domácí tým */}
                    <div className="absolute left-0 right-1/2 top-0 bottom-0 grid grid-cols-3 gap-4 p-8">
                      {/* Brankář */}
                      <div className="flex justify-center items-center">
                        <div className="relative">
                          <img 
                            src={cards.find(card => card.id === selectedTeam.goalkeeper)?.image}
                            alt="Brankář"
                            className={`w-24 h-32 object-contain transform hover:scale-110 transition-transform rounded-lg shadow-lg
                              ${matchState.penalties.some(p => p.playerId === selectedTeam.goalkeeper) ? 'opacity-50' : ''}`}
                          />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-black text-xs font-bold">{getCardLevel(selectedTeam.goalkeeper)}</span>
                          </div>
                          {/* Statistiky brankáře */}
                          {matchState.playerStats.saves[selectedTeam.goalkeeper] > 0 && (
                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                              <div className="bg-blue-900/80 text-white text-sm px-2 py-1 rounded-lg">
                                {matchState.playerStats.saves[selectedTeam.goalkeeper]} zákroků
                                <br />
                                Úspěšnost: {matchState.playerStats.shots[selectedTeam.goalkeeper] > 0 
                                  ? Math.round((matchState.playerStats.saves[selectedTeam.goalkeeper] / matchState.playerStats.shots[selectedTeam.goalkeeper]) * 100)
                                  : 100}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Obránci */}
                      <div className="grid grid-rows-2 gap-8">
                        {selectedTeam.defenders.map(id => (
                          <div key={id} className="flex justify-center items-center">
                            <div className="relative">
                              <img 
                                src={cards.find(card => card.id === id)?.image}
                                alt="Obránce"
                                className={`w-24 h-32 object-contain transform hover:scale-110 transition-transform rounded-lg shadow-lg
                                  ${matchState.penalties.some(p => p.playerId === id) ? 'opacity-50' : ''}`}
                              />
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <span className="text-black text-xs font-bold">{getCardLevel(id)}</span>
                              </div>
                              {/* Góly a asistence */}
                              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
                                {Array.from({ length: matchState.playerStats.goals[id] || 0 }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {matchState.playerStats.assists[id] > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.playerStats.assists[id]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Útočníci */}
                      <div className="grid grid-rows-3 gap-4">
                        {selectedTeam.forwards.map(id => (
                          <div key={id} className="flex justify-center items-center">
                            <div className="relative">
                              <img 
                                src={cards.find(card => card.id === id)?.image}
                                alt="Útočník"
                                className={`w-24 h-32 object-contain transform hover:scale-110 transition-transform rounded-lg shadow-lg
                                  ${matchState.penalties.some(p => p.playerId === id) ? 'opacity-50' : ''}`}
                              />
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <span className="text-black text-xs font-bold">{getCardLevel(id)}</span>
                              </div>
                              {/* Góly a asistence */}
                              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
                                {Array.from({ length: matchState.playerStats.goals[id] || 0 }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {matchState.playerStats.assists[id] > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.playerStats.assists[id]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soupeřův tým */}
                    <div className="absolute left-1/2 right-0 top-0 bottom-0 grid grid-cols-3 gap-4 p-8">
                      {/* Útočníci */}
                      <div className="grid grid-rows-3 gap-4">
                        {matchState.currentOpponent.forwards.map(player => (
                          <div key={player.name} className="flex justify-center items-center">
                            <div className="relative">
                              <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 transform hover:scale-110 transition-transform relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-red-600 to-red-800 py-1">
                                  <span className="text-white text-xs font-bold">{player.number}</span>
                                </div>
                                <div className="text-5xl font-bold mb-2">?</div>
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                  <span className="text-black text-xs font-bold">{player.level}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 p-1">
                                  <p className="text-[8px] text-center text-gray-300 font-bold leading-tight">
                                    {player.name}
                                  </p>
                                </div>
                              </div>
                              {/* Góly a asistence pro útočníky Lopat */}
                              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
                                {Array.from({ length: matchState.playerStats.goals[player.id] || 0 }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {matchState.playerStats.assists[player.id] > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.playerStats.assists[player.id]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Obránci */}
                      <div className="grid grid-rows-2 gap-8">
                        {matchState.currentOpponent.defenders.map(player => (
                          <div key={player.name} className="flex justify-center items-center">
                            <div className="relative">
                              <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 transform hover:scale-110 transition-transform relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-blue-600 to-blue-800 py-1">
                                  <span className="text-white text-xs font-bold">{player.number}</span>
                                </div>
                                <div className="text-5xl font-bold mb-2">?</div>
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                  <span className="text-black text-xs font-bold">{player.level}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 p-1">
                                  <p className="text-[8px] text-center text-gray-300 font-bold leading-tight">
                                    {player.name}
                                  </p>
                                </div>
                              </div>
                              {/* Góly a asistence pro obránce Lopat */}
                              <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
                                {Array.from({ length: matchState.playerStats.goals[player.id] || 0 }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {matchState.playerStats.assists[player.id] > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.playerStats.assists[player.id]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Brankář */}
                      <div className="flex justify-center items-center">
                        <div className="relative">
                          <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 transform hover:scale-110 transition-transform relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-600 to-yellow-800 py-1">
                              <span className="text-white text-xs font-bold">{matchState.currentOpponent.goalkeeper.number}</span>
                            </div>
                            <div className="text-5xl font-bold mb-2">?</div>
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                              <span className="text-black text-xs font-bold">{matchState.currentOpponent.goalkeeper.level}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 p-1">
                              <p className="text-[8px] text-center text-gray-300 font-bold leading-tight">
                                {matchState.currentOpponent.goalkeeper.name}
                              </p>
                            </div>
                          </div>
                          {/* Statistiky brankáře Lopat */}
                          {matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] > 0 && (
                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                              <div className="bg-blue-900/80 text-white text-sm px-2 py-1 rounded-lg">
                                {matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id]} zákroků
                                <br />
                                Úspěšnost: {matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id] > 0 
                                  ? Math.round((matchState.playerStats.saves[matchState.currentOpponent.goalkeeper.id] / matchState.playerStats.shots[matchState.currentOpponent.goalkeeper.id]) * 100)
                                  : 100}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pravá část - události */}
                <div className="w-[500px] flex flex-col">
                  <div className="bg-gradient-to-b from-black/50 to-black/30 rounded-xl p-8 h-full">
                    <h3 className="text-3xl font-bold text-yellow-400 sticky top-0 bg-black/50 backdrop-blur-sm p-4 rounded-lg mb-6 border-b border-yellow-500/20">
                      Průběh zápasu
                    </h3>
                    <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto pr-4">
                      {[...matchState.events].reverse().map(event => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg ${
                            event.type === 'goal'
                              ? 'bg-green-900/40 border-l-4 border-green-500'
                              : event.type === 'penalty'
                              ? 'bg-red-900/40 border-l-4 border-red-500'
                              : event.type === 'save'
                              ? 'bg-blue-900/40 border-l-4 border-blue-500'
                              : event.type === 'period'
                              ? 'bg-white/10'
                              : 'bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-mono">{event.time}</span>
                              {event.type !== 'period' && (
                                <img 
                                  src={event.isHomeTeam ? "/Images/Litvinov_Lancers.png" : "/Images/HC_Lopaty_Praha.png"} 
                                  alt={event.isHomeTeam ? "Litvínov Lancers" : "HC Lopaty Praha"}
                                  className="h-6 object-contain"
                                />
                              )}
                            </div>
                            {event.type === 'goal' && (
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                  <span className="text-yellow-400 font-bold">
                                    {event.player} (Level {event.level})
                                  </span>
                                  {event.assist && (
                                    <span className="text-yellow-400/80 text-sm">
                                      Asistence: {event.assist} (Level {event.assistLevel})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-lg text-white">{event.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRewards && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-yellow-900/50 to-yellow-800/30 p-8 rounded-2xl max-w-md w-full mx-4 border border-yellow-500/20">
              <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text">
                {matchResult === 'victory' ? 'Vítězství!' : 'Prohra'}
              </h2>
              
              <div className="space-y-6">
                <div className="bg-black/30 p-4 rounded-xl">
                  <h3 className="text-yellow-400 text-xl mb-2">Odměny:</h3>
                  <div className="space-y-2">
                    <p className="text-white">
                      Peníze: <span className="text-yellow-400 animate-bounce">+{matchResult === 'victory' ? '50' : '20'} Kč</span>
                    </p>
                    <p className="text-white">
                      Zkušenosti: <span className="text-yellow-400 animate-bounce">+{matchResult === 'victory' ? '20' : '5'} XP</span>
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-yellow-400 text-xl mb-2 flex items-center justify-between">
                      <span>Level {level}</span>
                      {xp >= 20 && (
                        <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded-full animate-pulse">
                          Level Up!
                        </span>
                      )}
                    </h3>
                    <div className="bg-gray-900 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${(xp / 20) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-yellow-200 mt-2">{xp}/20 XP</p>
                  </div>
                  {xp >= 20 && (
                    <div className="absolute inset-0 animate-shine pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" style={{ transform: 'translateX(-100%)' }}></div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowRewards(false);
                    setShowMatch(false);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Pokračovat
                </button>
              </div>
            </div>
          </div>
        )}

        {showCollection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`transform transition-all duration-300 hover:scale-105 cursor-pointer ${
                  unlockedCards.some(c => c.id === card.id) ? '' : 'opacity-50'
                }`}
                onClick={() => unlockedCards.some(c => c.id === card.id) && setSelectedCard(card)}
              >
                <div className={`
                  relative overflow-hidden rounded-lg shadow-xl
                  ${unlockedCards.some(c => c.id === card.id) 
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 p-0.5' 
                    : 'bg-zinc-800 p-0.5'}
                `}>
                  {unlockedCards.some(c => c.id === card.id) ? (
                    <div className="relative">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-56 object-contain rounded"
                      />
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-300 shadow-lg">
                        <span className="text-black font-bold text-sm">{getCardLevel(card.id)}</span>
                      </div>
                      {unlockedCards.filter(c => c.id === card.id).length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-full text-yellow-400 text-sm font-bold">
                          {unlockedCards.filter(c => c.id === card.id).length}×
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-4xl text-gray-500">
                      ?
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showTournament && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8">
            <div className="w-full max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Hokejový turnaj</h2>
              
              {/* Skupiny */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Skupina A */}
                <div className="bg-black/50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Skupina A</h3>
                  <div className="space-y-4">
                    {tournamentState.groups.A.map((team, index) => (
                      <div key={team.team.name} className="flex justify-between items-center bg-black/30 p-4 rounded-lg">
                        <span className="text-white">{team.team.name}</span>
                        <div className="flex gap-4">
                          <span className="text-yellow-400">{team.points} bodů</span>
                          <span className="text-gray-400">{team.score.for}:{team.score.against}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skupina B */}
                <div className="bg-black/50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Skupina B</h3>
                  <div className="space-y-4">
                    {tournamentState.groups.B.map((team, index) => (
                      <div key={team.team.name} className="flex justify-between items-center bg-black/30 p-4 rounded-lg">
                        <span className="text-white">{team.team.name}</span>
                        <div className="flex gap-4">
                          <span className="text-yellow-400">{team.points} bodů</span>
                          <span className="text-gray-400">{team.score.for}:{team.score.against}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Následující zápas */}
              {tournamentState.matches.groups.length > 0 && tournamentState.currentMatchIndex < tournamentState.matches.groups.length && (
                <div className="bg-black/50 p-6 rounded-xl mb-8">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Následující zápas</h3>
                  <div className="flex justify-between items-center bg-black/30 p-6 rounded-lg">
                    <div className="text-xl text-white">{tournamentState.matches.groups[tournamentState.currentMatchIndex].home}</div>
                    <div className="text-2xl text-yellow-400 font-bold">vs</div>
                    <div className="text-xl text-white">{tournamentState.matches.groups[tournamentState.currentMatchIndex].away}</div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={startNextTournamentMatch}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                        text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                        hover:scale-105 active:scale-95"
                    >
                      Hrát zápas
                    </button>
                  </div>
                </div>
              )}

              {/* Playoff pavouk (bude zobrazen později) */}
              {tournamentState.phase === 'playoff' && (
                <div className="bg-black/50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Playoff</h3>
                  {/* Zde bude struktura playoff */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGame;