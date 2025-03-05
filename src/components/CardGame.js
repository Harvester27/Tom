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
  const [money, setMoney] = useState(100000);
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
    phase: 'groups',
    groups: {
      A: [],
      B: []
    },
    matches: {
      groups: [],
      playoff: []
    },
    goalies: [], // Inicializace goalies jako prázdné pole
    scorers: [], // Nové pole pro kanadské bodování
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
    scheduledEvents: [],
    currentOpponent: null,
    completed: false
  });
  const [coins, setCoins] = useState(100);
  const [selectedPackSize, setSelectedPackSize] = useState(3);
  const [showPack, setShowPack] = useState(false);
  // Nový stav pro kontrolu, zda zápas skončil a čeká na potvrzení hráče
  const [matchCompleteAwaitingConfirmation, setMatchCompleteAwaitingConfirmation] = useState(false);

  // Definice typů gólových akcí
  const goalTypes = [
    { 
      type: "Rychlý brejk",
      template: "***** zachytí nepřesnou přihrávku na modré, okamžitě postupuje vpřed a technickou střelou překonává brankáře"
    },
    { 
      type: "Křižná nahrávka",
      template: "útočník z rohu brankoviště přesně nahrává před bránu, ***** pohotově zakončuje"
    },
    { 
      type: "Gól z otočky",
      template: "***** přijme přihrávku za brankou, prudce se otočí a tvrdou střelou překonává brankáře"
    },
    { 
      type: "Teč před brankou",
      template: "tvrdá střela od modré, ***** tečuje puk před brankovištěm a mění jeho směr"
    },
    { 
      type: "Individuální akce",
      template: "***** obbruslí tři soupeře, najde si prostor a přesně zakončuje do horního rohu"
    },
    { 
      type: "Dorážka zblízka",
      template: "první střela brankářem vyražena, ***** pohotově doklepává odražený puk"
    },
    { 
      type: "Gól z prudkého úhlu",
      template: "***** objíždí branku, prudkou krátkodobou nahrávkou si najde mezeru"
    },
    { 
      type: "Sólový průnik",
      template: "***** překonává obránce kličkou, postupuje na brankáře a chladnokrevně zakončuje"
    },
    { 
      type: "Přesná kombinace",
      template: "rychlý přechod středem hřiště, ***** přijímá nahrávku a okamžitě zakončuje"
    },
    { 
      type: "Únik po mezinárodní přihrávce",
      template: "***** přebírá přesnou přihrávku a samostatným únikem překonává brankáře"
    },
    // Nové gólové akce
    {
      type: "Střela z první",
      template: "přihrávka od mantinelu, ***** bez přípravy pálí z první a překvapuje gólmana"
    },
    {
      type: "Blafák do bekhendu",
      template: "***** se řítí sám na branku, naznačí střelu a elegantním blafákem do bekhendu skóruje"
    },
    {
      type: "Dělovka od modré",
      template: "***** napřahuje od modré čáry a jeho tvrdá střela končí v síti"
    },
    {
      type: "Kombinace do prázdné",
      template: "rychlá kombinace dvou na jednoho, ***** zakončuje do odkryté branky"
    },
    {
      type: "Průnik po křídle",
      template: "***** uniká po křídle, stahuje si puk do středu a přesnou střelou k tyči skóruje"
    },
    {
      type: "Teč před brankou",
      template: "střela od modré čáry, ***** šikovně nastavuje hůl a tečuje puk do branky"
    },
    {
      type: "Gól z dorážky",
      template: "střela z dálky vyražena, ***** je na správném místě a z dorážky skóruje"
    },
    {
      type: "Akce za brankou",
      template: "***** objíždí branku, vyveze puk zpoza branky a zasunuje ho u tyčky"
    },
    {
      type: "Střela mezi betony",
      template: "***** využívá clonění před brankou a propálí gólmana střelou mezi betony"
    },
    {
      type: "Nájezd po kličce",
      template: "***** se dostává do samostatného úniku, kličkou položí gólmana a zakončuje do prázdné branky"
    }
  ];

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
    }, 6000);
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
    // Pro hokejový formát, kde 1200 sekund = 20:00 a 0 sekund = 00:00
    // Musíme přepočítat zbývající čas na minuty a sekundy
    
    // Výpočet minut zbývajících do konce třetiny (20 minut celkem)
    const minutesRemaining = Math.floor(seconds / 60);
    // Výpočet sekund zbývajících do konce aktuální minuty
    const secondsRemaining = seconds % 60;
    
    // Formátování s leading zeros
    return `${minutesRemaining.toString().padStart(2, '0')}:${secondsRemaining.toString().padStart(2, '0')}`;
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
    const periodMinutes = Math.floor((eventTime % 1200) / 60);
    const totalMinutes = (period - 1) * 20 + periodMinutes;
    const secs = eventTime % 60;
    const eventTimeFormatted = `${totalMinutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

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
      const assistLevel = assist ? (isHomeTeam ? getCardLevel(assist) : assist.level) : 0;
      const opposingGoalieLevel = isHomeTeam 
        ? matchState.currentOpponent.goalkeeper.level 
        : getCardLevel(selectedTeam.goalkeeper);

      const goalChance = baseChance + 
        (shooterLevel * 0.05) + 
        (assistLevel * 0.02) - 
        (opposingGoalieLevel * 0.03);

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

        const selectedGoalType = goalTypes[Math.floor(Math.random() * goalTypes.length)];
        const shooterName = isHomeTeam ? cards.find(c => c.id === shooter)?.name : shooter.name;
        const goalMessage = selectedGoalType.template.replace("*****", shooterName);

        return {
          type: 'goal',
          isHomeTeam,
          player: shooterName,
          assist: assist ? (isHomeTeam ? cards.find(c => c.id === assist)?.name : assist.name) : null,
          level: shooterLevel,
          assistLevel: assist ? assistLevel : null,
          message: `${selectedGoalType.type} - ${goalMessage}${assist ? ` (Asistence: ${isHomeTeam ? cards.find(c => c.id === assist)?.name : assist.name} [${assistLevel}])` : ''} [${shooterLevel}]`,
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
      
      let opponent;
      let isHomeTeam = true;  // Vždy budeme domácí tým
      
      // Určení soupeře podle typu zápasu
      if (tournamentState.phase === 'playoff') {
        const currentMatch = tournamentState.matches.playoff.find(match => !match.score);
        if (currentMatch) {
          isHomeTeam = currentMatch.home === selectedTeam.name;  // Tady byl problém
          const opponentName = isHomeTeam ? currentMatch.away : currentMatch.home;
          opponent = getTeamByName(opponentName);
        }
      } else if (tournamentState.phase === 'groups') {
        const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
        if (currentMatch) {
          isHomeTeam = currentMatch.home === selectedTeam.name;  // A tady taky
          const opponentName = isHomeTeam ? currentMatch.away : currentMatch.home;
          opponent = getTeamByName(opponentName);
        }
      }
      
      // Pokud není turnajový soupeř, použijeme výchozího
      if (!opponent) {
        opponent = opponentTeam;
      }

      // Generování časů střel pro oba týmy
      const shotTimes = generateShotTimes(selectedTeam, opponent);
      
      // Inicializace stavu zápasu
      setMatchState(prev => ({
        ...prev,
        period: 1,
        time: 1200,
        isPlaying: true,
        score: { home: 0, away: 0 },
        events: [],
        playerStats: {
          goals: {},
          assists: {},
          saves: {},
          saveAccuracy: {},
          shots: {}
        },
        penalties: [],
        scheduledEvents: generateEventsForAllPeriods(),
        currentOpponent: opponent,
        shotTimes: shotTimes,
        isHomeTeam: true  // Vždy budeme domácí tým
      }));
    }
  };

  // Funkce pro generování časů střel
  const generateShotTimes = (homeTeam, awayTeam) => {
    const shotTimes = {
      home: [],
      away: []
    };

    // Výpočet síly týmů
    const homeTeamStrength = homeTeam.forwards.reduce((sum, id) => sum + getCardLevel(id), 0) +
                            homeTeam.defenders.reduce((sum, id) => sum + getCardLevel(id), 0);
    
    const awayTeamStrength = awayTeam.forwards.reduce((sum, p) => sum + (typeof p === 'string' ? getCardLevel(p) : p.level), 0) +
                            awayTeam.defenders.reduce((sum, p) => sum + (typeof p === 'string' ? getCardLevel(p) : p.level), 0);

    // Pro každou třetinu
    for (let period = 1; period <= 3; period++) {
      const minTime = (period - 1) * 1200 + 5;
      const maxTime = period * 1200;
      
      // Základní počet střel je 8-12, plus bonus podle síly týmu
      const homeBaseShots = Math.floor(Math.random() * 5) + 8;
      const awayBaseShots = Math.floor(Math.random() * 5) + 8;

      // Bonus střel podle síly týmu (každých 5 bodů síly = +1 střela)
      const homeShots = homeBaseShots + Math.floor(homeTeamStrength / 5);
      const awayShots = awayBaseShots + Math.floor(awayTeamStrength / 5);

      // Přidání náhodných časů pro oba týmy
      for (let i = 0; i < homeShots; i++) {
        shotTimes.home.push(Math.floor(Math.random() * (maxTime - minTime) + minTime));
      }
      for (let i = 0; i < awayShots; i++) {
        shotTimes.away.push(Math.floor(Math.random() * (maxTime - minTime) + minTime));
      }
    }

    // Seřazení časů
    shotTimes.home.sort((a, b) => a - b);
    shotTimes.away.sort((a, b) => a - b);

    return shotTimes;
  };

  // Funkce pro generování událostí pro všechny třetiny
  const generateEventsForAllPeriods = () => {
    const events = [];
    // Pro každou třetinu
    for (let period = 1; period <= 3; period++) {
      const periodStart = (period - 1) * 1200;
      const periodEnd = period * 1200;
      // Generujeme 5-12 událostí pro každou třetinu
      const numEvents = Math.floor(Math.random() * (12 - 5 + 1)) + 5;
      for (let i = 0; i < numEvents; i++) {
        // Generujeme čas v rámci dané třetiny
        const eventTime = Math.floor(Math.random() * (periodEnd - periodStart - 5)) + periodStart + 5;
        events.push(eventTime);
      }
    }
    // Seřadíme události sestupně (od největšího času po nejmenší)
    return events.sort((a, b) => b - a);
  };

  // Herní timer
  useEffect(() => {
    if (matchState.isPlaying) {
      const gameTimer = setInterval(() => {
        setMatchState(prev => {
          const timeDecrease = prev.gameSpeed;
          const newTime = prev.time - timeDecrease;
          const currentTime = (prev.period - 1) * 1200 + (1200 - newTime);

          // Kontrola střel
          const newStats = { ...prev.playerStats };
          const newScore = { ...prev.score };
          const newEvents = [...prev.events];
          
          // Kontrola střel domácího týmu
          while (prev.shotTimes.home.length > 0 && prev.shotTimes.home[0] <= currentTime) {
            prev.shotTimes.home.shift();
            const goalkeeper = prev.currentOpponent?.goalkeeper?.id;  // Střílí domácí, takže chytá hostující brankář
            if (goalkeeper) {
              const goalkeeperId = typeof goalkeeper === 'string' ? goalkeeper : goalkeeper;
              newStats.shots[goalkeeperId] = (newStats.shots[goalkeeperId] || 0) + 1;
              newStats.saves[goalkeeperId] = (newStats.saves[goalkeeperId] || 0) + 1;
              console.log('Domácí střela - Statistiky brankáře:', {
                brankář: goalkeeperId,
                střely: newStats.shots[goalkeeperId],
                zákroky: newStats.saves[goalkeeperId],
                úspěšnost: Math.round((newStats.saves[goalkeeperId] / newStats.shots[goalkeeperId]) * 100)
              });
            }
          }

          // Kontrola střel hostujícího týmu
          while (prev.shotTimes.away.length > 0 && prev.shotTimes.away[0] <= currentTime) {
            prev.shotTimes.away.shift();
            const goalkeeper = selectedTeam.goalkeeper;  // Střílí hosté, takže chytá domácí brankář
            if (goalkeeper) {
              const goalkeeperId = typeof goalkeeper === 'string' ? goalkeeper : goalkeeper;
              newStats.shots[goalkeeperId] = (newStats.shots[goalkeeperId] || 0) + 1;
              newStats.saves[goalkeeperId] = (newStats.saves[goalkeeperId] || 0) + 1;
              console.log('Hostující střela - Statistiky brankáře:', {
                brankář: goalkeeperId,
                střely: newStats.shots[goalkeeperId],
                zákroky: newStats.saves[goalkeeperId],
                úspěšnost: Math.round((newStats.saves[goalkeeperId] / newStats.shots[goalkeeperId]) * 100)
              });
            }
          }

          // Aktualizace penalt
          const updatedPenalties = prev.penalties.map(penalty => ({
            ...penalty,
            timeLeft: penalty.timeLeft - timeDecrease
          })).filter(penalty => penalty.timeLeft > 0);

          // Kontrola naplánovaných událostí
          while (prev.scheduledEvents.length > 0 && prev.scheduledEvents[prev.scheduledEvents.length - 1] <= currentTime) {
            const eventTime = prev.scheduledEvents.pop();
            const gameEvent = generateGameEvent(eventTime);
            if (gameEvent) {
              // Přidáme novou událost na začátek pole (nejnovější události budou nahoře)
              newEvents.unshift(gameEvent);
              
              // Aktualizace skóre a statistik pokud je to gól
              if (gameEvent.type === 'goal') {
                if (gameEvent.isHomeTeam) {
                  newScore.home += 1;
                  // Snížíme počet zákroků brankáře soupeře, protože dostal gól
                  const goalkeeperId = prev.currentOpponent?.goalkeeper?.id;  // Hostující brankář dostal gól
                  if (goalkeeperId) {
                    newStats.saves[goalkeeperId] = Math.max(0, (newStats.saves[goalkeeperId] || 0) - 1);
                    console.log('Gól domácích - Statistiky brankáře po gólu:', {
                      brankář: goalkeeperId,
                      střely: newStats.shots[goalkeeperId],
                      zákroky: newStats.saves[goalkeeperId],
                      úspěšnost: Math.round((newStats.saves[goalkeeperId] / newStats.shots[goalkeeperId]) * 100)
                    });
                  }
                } else {
                  newScore.away += 1;
                  // Snížíme počet zákroků brankáře soupeře, protože dostal gól
                  const goalkeeperId = selectedTeam.goalkeeper;  // Domácí brankář dostal gól
                  if (goalkeeperId) {
                    newStats.saves[goalkeeperId] = Math.max(0, (newStats.saves[goalkeeperId] || 0) - 1);
                    console.log('Gól hostů - Statistiky brankáře po gólu:', {
                      brankář: goalkeeperId,
                      střely: newStats.shots[goalkeeperId],
                      zákroky: newStats.saves[goalkeeperId],
                      úspěšnost: Math.round((newStats.saves[goalkeeperId] / newStats.shots[goalkeeperId]) * 100)
                    });
                  }
                }
              }
            }
          }

          if (newTime <= 0) {
            if (prev.period < 3) {
              return {
                ...prev,
                period: prev.period + 1,
                time: 1200,
                score: newScore,
                events: newEvents,
                playerStats: newStats,
                scheduledEvents: prev.scheduledEvents,
                penalties: updatedPenalties
              };
            } else {
              clearInterval(gameTimer);
              // Zobrazíme odměny pouze pokud nejsme v turnaji
              if (!tournamentState.phase) {
                const result = newScore.home > newScore.away ? 'victory' : 'defeat';
                setShowRewards(true);
              } else {
                // Nastavíme příznak čekání na potvrzení
                setMatchCompleteAwaitingConfirmation(true);
              }
              return {
                ...prev,
                isPlaying: false,
                completed: true,
                time: 0,
                score: newScore,
                events: newEvents,
                playerStats: newStats,
                scheduledEvents: prev.scheduledEvents,
                penalties: updatedPenalties
              };
            }
          }
          
          return {
            ...prev,
            time: newTime,
            score: newScore,
            events: newEvents,
            playerStats: newStats,
            scheduledEvents: prev.scheduledEvents,
            penalties: updatedPenalties
          };
        });
      }, 1000);

      return () => clearInterval(gameTimer);
    }
  }, [matchState.isPlaying, tournamentState.phase]);

  // Po skončení zápasu
  useEffect(() => {
    if (!matchState.isPlaying && matchState.completed) {
      if (tournamentState.phase === 'playoff') {
        const currentMatch = tournamentState.matches.playoff.find(match => !match.score);
        if (currentMatch) {
          setTournamentState(prev => ({
            ...prev,
            matches: {
              ...prev.matches,
              playoff: prev.matches.playoff.map(match => {
                if (match === currentMatch) {
                  return { ...match, score: matchState.score };
                }
                
                if (currentMatch.id) {
                  const isWinner = matchState.score.home > matchState.score.away ? currentMatch.home : currentMatch.away;
                  const isLoser = matchState.score.home > matchState.score.away ? currentMatch.away : currentMatch.home;
                  
                  if (match.home === `Winner ${currentMatch.id}`) {
                    return { ...match, home: isWinner };
                  }
                  if (match.away === `Winner ${currentMatch.id}`) {
                    return { ...match, away: isWinner };
                  }
                  if (match.home === `Loser ${currentMatch.id}`) {
                    return { ...match, home: isLoser };
                  }
                  if (match.away === `Loser ${currentMatch.id}`) {
                    return { ...match, away: isLoser };
                  }
                }
                return match;
              })
            }
          }));
        }
      } else if (tournamentState.phase === 'groups') {
        const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
        if (currentMatch) {
          const homeTeam = getTeamByName(currentMatch.home);
          const awayTeam = getTeamByName(currentMatch.away);
          
          updateTournamentStandings(homeTeam, awayTeam, matchState.score);

          setTournamentState(prev => {
            // Aktualizujeme výsledek aktuálního zápasu
            const updatedMatches = prev.matches.groups.map((match, index) => 
              index === prev.currentMatchIndex ? { 
                ...match, 
                score: { 
                  home: matchState.score.away,  // Otočíme skóre v rozpisu
                  away: matchState.score.home 
                }
              } : match
            );

            // Vytvoříme nový stav s aktualizovanými zápasy
            const newState = {
              ...prev,
              matches: {
                ...prev.matches,
                groups: updatedMatches
              }
            };

            // Kontrolujeme, jestli je toto poslední zápas ve skupinách
            const isLastMatch = prev.currentMatchIndex === prev.matches.groups.length - 1;
            
            // Pokud je to poslední zápas, přepneme do playoff fáze
            if (isLastMatch) {
              const playoffMatches = generatePlayoffMatches(newState);
              return {
                ...newState,
                phase: 'playoff',
                matches: {
                  ...newState.matches,
                  playoff: playoffMatches
                },
                currentMatchIndex: 0
              };
            }

            // Jinak jen posuneme index na další zápas
            return {
              ...newState,
              currentMatchIndex: prev.currentMatchIndex + 1
            };
          });
        }
      }

      // Resetujeme stav zápasu pouze pokud není potřeba čekat na potvrzení
      if (!matchCompleteAwaitingConfirmation) {
        setTimeout(() => {
          setMatchState(prev => ({
            ...prev,
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
            scheduledEvents: [],
            currentOpponent: null,
            completed: false
          }));
          
          // Vždy zůstaň v turnajovém menu po zápase
          if (tournamentState.phase) {
            setShowMatch(false);
            setShowTournament(true);
            setShowRewards(false);
          }
        }, 2000);
      }
    }
  }, [matchState.isPlaying, matchState.completed, tournamentState.phase, matchCompleteAwaitingConfirmation]);

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

  // Funkce pro potvrzení odchodu ze zápasu
  const confirmMatchExit = () => {
    // Pokud jsme v turnaji, přeneseme statistiky brankářů do turnajové tabulky
    if (tournamentState.phase && matchState.completed) {
      // Získání ID brankářů z obou týmů
      const homeGoalkeeper = selectedTeam.goalkeeper;
      const awayGoalkeeper = matchState.currentOpponent.goalkeeper.id;
      
      // Získání jmen brankářů
      const homeGoalieName = cards.find(card => card.id === homeGoalkeeper)?.name || 'Neznámý brankář';
      const awayGoalieName = matchState.currentOpponent.goalkeeper.name || 'Neznámý brankář';
      
      // Statistiky domácího brankáře
      const homeShots = matchState.playerStats.shots[homeGoalkeeper] || 0;
      const homeSaves = matchState.playerStats.saves[homeGoalkeeper] || 0;
      const homeSavePercentage = homeShots > 0 ? Math.round((homeSaves / homeShots) * 100) : 100;
      
      // Statistiky hostujícího brankáře
      const awayShots = matchState.playerStats.shots[awayGoalkeeper] || 0;
      const awaySaves = matchState.playerStats.saves[awayGoalkeeper] || 0;
      const awaySavePercentage = awayShots > 0 ? Math.round((awaySaves / awayShots) * 100) : 100;
      
      // Aktualizace statistik brankářů v turnajovém stavu
      setTournamentState(prev => {
        // Aktualizace domácího brankáře
        let updatedGoalies = [...prev.goalies]; // Kopie stávajícího pole
        
        // Najdeme brankáře podle ID, pokud existuje
        const homeGoalieIndex = updatedGoalies.findIndex(g => g.id === homeGoalkeeper);
        if (homeGoalieIndex >= 0) {
          // Aktualizace existujícího brankáře
          const updatedHomeGoalie = {
            ...updatedGoalies[homeGoalieIndex],
            shots: updatedGoalies[homeGoalieIndex].shots + homeShots,
            saves: updatedGoalies[homeGoalieIndex].saves + homeSaves,
            shutouts: updatedGoalies[homeGoalieIndex].shutouts + (matchState.score.away === 0 ? 1 : 0),
            gamesPlayed: updatedGoalies[homeGoalieIndex].gamesPlayed + 1
          };
          updatedGoalies[homeGoalieIndex] = updatedHomeGoalie;
        } else {
          // Přidání nového brankáře
          updatedGoalies.push({
            id: homeGoalkeeper,
            name: homeGoalieName,
            team: selectedTeam.name,
            shots: homeShots,
            saves: homeSaves,
            shutouts: matchState.score.away === 0 ? 1 : 0,
            gamesPlayed: 1
          });
        }
        
        // Aktualizace hostujícího brankáře
        const awayGoalieIndex = updatedGoalies.findIndex(g => g.id === awayGoalkeeper);
        if (awayGoalieIndex >= 0) {
          // Aktualizace existujícího brankáře
          const updatedAwayGoalie = {
            ...updatedGoalies[awayGoalieIndex],
            shots: updatedGoalies[awayGoalieIndex].shots + awayShots,
            saves: updatedGoalies[awayGoalieIndex].saves + awaySaves,
            shutouts: updatedGoalies[awayGoalieIndex].shutouts + (matchState.score.home === 0 ? 1 : 0),
            gamesPlayed: updatedGoalies[awayGoalieIndex].gamesPlayed + 1
          };
          updatedGoalies[awayGoalieIndex] = updatedAwayGoalie;
        } else {
          // Přidání nového brankáře
          updatedGoalies.push({
            id: awayGoalkeeper,
            name: awayGoalieName,
            team: matchState.currentOpponent.name,
            shots: awayShots,
            saves: awaySaves,
            shutouts: matchState.score.home === 0 ? 1 : 0,
            gamesPlayed: 1
          });
        }
        
        // Aktualizace kanadského bodování
        let updatedScorers = [...prev.scorers];
        
        // Procházíme všechny hráče, kteří dali gól nebo asistenci
        const homePlayerIds = [
          ...selectedTeam.forwards,
          ...selectedTeam.defenders,
          selectedTeam.goalkeeper
        ];
        
        // Zpracování domácích hráčů
        homePlayerIds.forEach(playerId => {
          const goals = matchState.events.filter(
            event => event.type === 'goal' && 
            event.isHomeTeam && 
            event.player === cards.find(c => c.id === playerId)?.name
          ).length;
          
          const assists = matchState.events.filter(
            event => event.type === 'goal' && 
            event.isHomeTeam && 
            event.assist === cards.find(c => c.id === playerId)?.name
          ).length;
          
          if (goals > 0 || assists > 0) {
            const player = cards.find(c => c.id === playerId);
            if (player) {
              const scorerIndex = updatedScorers.findIndex(s => s.id === playerId);
              if (scorerIndex >= 0) {
                // Aktualizace existujícího hráče
                updatedScorers[scorerIndex] = {
                  ...updatedScorers[scorerIndex],
                  goals: updatedScorers[scorerIndex].goals + goals,
                  assists: updatedScorers[scorerIndex].assists + assists
                };
              } else {
                // Přidání nového hráče
                updatedScorers.push({
                  id: playerId,
                  name: player.name,
                  team: selectedTeam.name,
                  position: player.position,
                  goals: goals,
                  assists: assists
                });
              }
            }
          }
        });
        
        // Zpracování hostujících hráčů
        const awayPlayersIds = {
          forwards: matchState.currentOpponent.forwards.map(p => p.id),
          defenders: matchState.currentOpponent.defenders.map(p => p.id),
          goalkeeper: matchState.currentOpponent.goalkeeper.id
        };
        
        // Pomocná funkce pro získání jména a pozice hostujícího hráče
        const getAwayPlayerInfo = (playerId) => {
          const forwardPlayer = matchState.currentOpponent.forwards.find(p => p.id === playerId);
          if (forwardPlayer) return { name: forwardPlayer.name, position: 'forward' };
          
          const defenderPlayer = matchState.currentOpponent.defenders.find(p => p.id === playerId);
          if (defenderPlayer) return { name: defenderPlayer.name, position: 'defender' };
          
          if (playerId === matchState.currentOpponent.goalkeeper.id)
            return { name: matchState.currentOpponent.goalkeeper.name, position: 'goalkeeper' };
          
          return { name: 'Neznámý hráč', position: 'unknown' };
        };
        
        // Projdeme všechny góly a asistence hostujícího týmu
        matchState.events.forEach(event => {
          if (event.type === 'goal' && !event.isHomeTeam) {
            // Najdeme hráče podle jména
            const awayPlayerIds = [
              ...awayPlayersIds.forwards,
              ...awayPlayersIds.defenders,
              awayPlayersIds.goalkeeper
            ];
            
            const scorerId = awayPlayerIds.find(id => {
              const info = getAwayPlayerInfo(id);
              return info.name === event.player;
            });
            
            if (scorerId) {
              const { name, position } = getAwayPlayerInfo(scorerId);
              const scorerIndex = updatedScorers.findIndex(s => s.id === scorerId);
              
              if (scorerIndex >= 0) {
                updatedScorers[scorerIndex] = {
                  ...updatedScorers[scorerIndex],
                  goals: updatedScorers[scorerIndex].goals + 1
                };
              } else {
                updatedScorers.push({
                  id: scorerId,
                  name: name,
                  team: matchState.currentOpponent.name,
                  position: position,
                  goals: 1,
                  assists: 0
                });
              }
            }
            
            // Zpracování asistencí
            if (event.assist) {
              const assistId = awayPlayerIds.find(id => {
                const info = getAwayPlayerInfo(id);
                return info.name === event.assist;
              });
              
              if (assistId) {
                const { name, position } = getAwayPlayerInfo(assistId);
                const assistIndex = updatedScorers.findIndex(s => s.id === assistId);
                
                if (assistIndex >= 0) {
                  updatedScorers[assistIndex] = {
                    ...updatedScorers[assistIndex],
                    assists: updatedScorers[assistIndex].assists + 1
                  };
                } else {
                  updatedScorers.push({
                    id: assistId,
                    name: name,
                    team: matchState.currentOpponent.name,
                    position: position,
                    goals: 0,
                    assists: 1
                  });
                }
              }
            }
          }
        });
        
        console.log('Statistiky brankářů a hráčů byly přeneseny do turnajové tabulky', updatedGoalies, updatedScorers);
        
        return {
          ...prev,
          goalies: updatedGoalies,
          scorers: updatedScorers
        };
      });
    }
    
    setMatchCompleteAwaitingConfirmation(false);
    // Resetujeme stav zápasu
    setMatchState(prev => ({
      ...prev,
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
      scheduledEvents: [],
      currentOpponent: null,
      completed: false
    }));
    
    // Vždy zůstaň v turnajovém menu po zápase
    if (tournamentState.phase) {
      setShowMatch(false);
      setShowTournament(true);
      setShowRewards(false);
    }
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
        phase: 'groups',
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
            // Pro domácí tým použijeme skóre tak jak je
            updateTeam(teamData, score.away, score.home);  // Tady to otočíme
          } else if (teamData.team.name === awayTeam.name) {
            // Pro hostující tým použijeme opačné skóre
            updateTeam(teamData, score.home, score.away);  // A tady taky
          }
        }
      }

      return newState;
    });
  };

  // Funkce pro spuštění dalšího zápasu v turnaji
  const startNextTournamentMatch = () => {
    if (tournamentState.phase === 'playoff') {
      // Playoff logika zůstává stejná
      const nextMatch = tournamentState.matches.playoff.find(match => !match.score);
      if (!nextMatch) return;

      if (nextMatch.home === selectedTeam.name || nextMatch.away === selectedTeam.name) {
        setShowTournament(false);
        setShowTeamSelection(true);
      } else {
        const homeTeam = getTeamByName(nextMatch.home);
        const awayTeam = getTeamByName(nextMatch.away);
        
        if (homeTeam && awayTeam) {
          const score = playTournamentMatch(homeTeam, awayTeam);
          
          setTournamentState(prev => ({
            ...prev,
            matches: {
              ...prev.matches,
              playoff: prev.matches.playoff.map(match => {
                if (match === nextMatch) {
                  return { ...match, score };
                }
                
                if (nextMatch.id) {
                  const isWinner = score.home > score.away ? nextMatch.home : nextMatch.away;
                  const isLoser = score.home > score.away ? nextMatch.away : nextMatch.home;
                  
                  if (match.home === `Winner ${nextMatch.id}`) {
                    return { ...match, home: isWinner };
                  }
                  if (match.away === `Winner ${nextMatch.id}`) {
                    return { ...match, away: isWinner };
                  }
                  if (match.home === `Loser ${nextMatch.id}`) {
                    return { ...match, home: isLoser };
                  }
                  if (match.away === `Loser ${nextMatch.id}`) {
                    return { ...match, away: isLoser };
                  }
                }
                return match;
              })
            }
          }));
        }
      }
    } else {
      // Základní skupina
      const currentMatch = tournamentState.matches.groups[tournamentState.currentMatchIndex];
      if (!currentMatch) return;

      if (currentMatch.home === selectedTeam.name || currentMatch.away === selectedTeam.name) {
        setShowTournament(false);
        setShowTeamSelection(true);
      } else {
        const homeTeam = getTeamByName(currentMatch.home);
        const awayTeam = getTeamByName(currentMatch.away);
        const result = playTournamentMatch(homeTeam, awayTeam);
        
        updateTournamentStandings(homeTeam, awayTeam, result);

        setTournamentState(prev => {
          // Aktualizujeme výsledek aktuálního zápasu
          const updatedMatches = prev.matches.groups.map((match, index) => 
            index === prev.currentMatchIndex ? { 
              ...match, 
              score: { 
                home: result.away,  // Otočíme skóre v rozpisu
                away: result.home 
              }
            } : match
          );

          // Kontrolujeme, jestli je toto poslední zápas ve skupinách
          const isLastMatch = prev.currentMatchIndex === prev.matches.groups.length - 1;
          
          // Pokud je to poslední zápas, přepneme do playoff fáze
          if (isLastMatch) {
            // Nejdřív vytvoříme nový stav s aktualizovanými zápasy
            const newState = {
              ...prev,
              matches: {
                ...prev.matches,
                groups: updatedMatches
              }
            };

            // Pak vygenerujeme playoff zápasy s aktuálním stavem
            const playoffMatches = generatePlayoffMatches(newState);
            
            console.log('Generuji playoff zápasy:', playoffMatches);
            
            // Vrátíme kompletně aktualizovaný stav
            return {
              ...newState,
              phase: 'playoff',
              matches: {
                ...newState.matches,
                playoff: playoffMatches
              },
              currentMatchIndex: 0
            };
          }

          // Jinak jen posuneme index na další zápas
          return {
            ...prev,
            matches: {
              ...prev.matches,
              groups: updatedMatches
            },
            currentMatchIndex: prev.currentMatchIndex + 1
          };
        });
      }
    }
  };

  // Funkce pro seřazení týmů podle bodů a skóre
  const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
      // 1. Porovnání podle bodů
      if (b.points !== a.points) return b.points - a.points;
      
      // 2. Porovnání podle skóre (rozdíl vstřelených a obdržených gólů)
      const aGoalDiff = a.score.for - a.score.against;
      const bGoalDiff = b.score.for - b.score.against;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
      
      // 3. Porovnání podle počtu vstřelených gólů
      if (b.score.for !== a.score.for) return b.score.for - a.score.for;
      
      // 4. Náhodné pořadí při shodě všech kritérií
      return Math.random() - 0.5;
    });
  };

  // Funkce pro generování playoff zápasů
  const generatePlayoffMatches = (currentState) => {
    // Seřadíme týmy ve skupinách
    const groupA = sortTeams([...currentState.groups.A]);
    const groupB = sortTeams([...currentState.groups.B]);

    // Vytvoříme playoff zápasy
    const playoffMatches = [
      // Čtvrtfinále
      { 
        home: groupA[1].team.name, 
        away: groupB[2].team.name, 
        round: 'quarterfinal', 
        id: 'QF1' 
      },
      { 
        home: groupB[1].team.name, 
        away: groupA[2].team.name, 
        round: 'quarterfinal', 
        id: 'QF2' 
      },
      // Semifinále
      { 
        home: groupA[0].team.name, 
        away: 'Winner QF1', 
        round: 'semifinal', 
        id: 'SF1' 
      },
      { 
        home: groupB[0].team.name, 
        away: 'Winner QF2', 
        round: 'semifinal', 
        id: 'SF2' 
      },
      // O 5. místo
      { 
        home: 'Loser QF1', 
        away: 'Loser QF2', 
        round: 'fifth_place' 
      },
      // O 3. místo
      { 
        home: 'Loser SF1', 
        away: 'Loser SF2', 
        round: 'third_place' 
      },
      // Finále
      { 
        home: 'Winner SF1', 
        away: 'Winner SF2', 
        round: 'final' 
      }
    ];

    return playoffMatches;
  };

  const updateMatch = () => {
    setMatchState(prev => {
      const newTime = prev.time - prev.gameSpeed;
      
      if (newTime <= 0) {
        if (prev.period < 3) {
          return {
            ...prev,
            period: prev.period + 1,
            time: 1200,
            score: prev.score,
            events: prev.events,
            playerStats: prev.playerStats,
            scheduledEvents: prev.scheduledEvents,
            penalties: prev.penalties
          };
        } else {
          clearInterval(gameTimer);
          // Zobrazíme odměny pouze pokud nejsme v turnaji
          if (!tournamentState.phase) {
            const result = prev.score.home > prev.score.away ? 'victory' : 'defeat';
            setShowRewards(true);
          }
          return {
            ...prev,
            isPlaying: false,
            completed: true,
            time: 0,
            score: prev.score,
            events: prev.events,
            playerStats: prev.playerStats,
            scheduledEvents: prev.scheduledEvents,
            penalties: prev.penalties
          };
        }
      }
      
      return {
        ...prev,
        time: newTime
      };
    });
  };

  // Funkce pro automatické doplnění sestavy
  const autoFillTeam = () => {
    // Seřadíme karty podle úrovně
    const sortedCards = [...cards].sort((a, b) => b.level - a.level);
    
    // Najdeme nejlepšího dostupného brankáře
    const bestGoalie = sortedCards.find(card => 
      card.position === 'goalkeeper' && 
      !selectedTeam.goalkeeper
    );
    if (bestGoalie) {
      setSelectedTeam(prev => ({
        ...prev,
        goalkeeper: bestGoalie.id
      }));
    }

    // Najdeme nejlepší dostupné obránce
    const defenders = sortedCards.filter(card => 
      card.position === 'defender' && 
      !selectedTeam.defenders.includes(card.id)
    ).slice(0, 2 - selectedTeam.defenders.length);
    
    if (defenders.length > 0) {
      setSelectedTeam(prev => ({
        ...prev,
        defenders: [...prev.defenders, ...defenders.map(d => d.id)]
      }));
    }

    // Najdeme nejlepší dostupné útočníky
    const forwards = sortedCards.filter(card => 
      card.position === 'forward' && 
      !selectedTeam.forwards.includes(card.id)
    ).slice(0, 3 - selectedTeam.forwards.length);
    
    if (forwards.length > 0) {
      setSelectedTeam(prev => ({
        ...prev,
        forwards: [...prev.forwards, ...forwards.map(f => f.id)]
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-900 via-blue-950 to-black text-white p-8">
      {/* Version number */}
      <div className="fixed top-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-sm text-yellow-400">
        v1.0.7
      </div>
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
            <button
              onClick={autoFillTeam}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 mb-8"
            >
              Automaticky doplnit sestavu
            </button>
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
                                {/* Góly - opraveno na event.player */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === cards.find(card => card.id === id)?.name
                                ).length > 0 && Array.from({ length: matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === cards.find(card => card.id === id)?.name
                                ).length }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {/* Asistence */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.assist === cards.find(card => card.id === id)?.name
                                ).length > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.events.filter(event => 
                                      event.type === 'goal' && event.assist === cards.find(card => card.id === id)?.name
                                    ).length}
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
                                {/* Góly - opraveno na event.player */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === cards.find(card => card.id === id)?.name
                                ).length > 0 && Array.from({ length: matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === cards.find(card => card.id === id)?.name
                                ).length }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {/* Asistence */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.assist === cards.find(card => card.id === id)?.name
                                ).length > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.events.filter(event => 
                                      event.type === 'goal' && event.assist === cards.find(card => card.id === id)?.name
                                    ).length}
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
                              <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
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
                                {/* Góly - opraveno na event.player */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === player.name
                                ).length > 0 && Array.from({ length: matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === player.name
                                ).length }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {/* Asistence */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.assist === player.name
                                ).length > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.events.filter(event => 
                                      event.type === 'goal' && event.assist === player.name
                                    ).length}
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
                              <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
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
                                {/* Góly - opraveno na event.player */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === player.name
                                ).length > 0 && Array.from({ length: matchState.events.filter(event => 
                                  event.type === 'goal' && event.player === player.name
                                ).length }).map((_, i) => (
                                  <img key={i} src="/Images/puck.png" alt="Gól" className="w-4 h-4" />
                                ))}
                                {/* Asistence */}
                                {matchState.events.filter(event => 
                                  event.type === 'goal' && event.assist === player.name
                                ).length > 0 && (
                                  <span className="bg-yellow-500/80 text-black font-bold text-sm px-2 rounded-lg">
                                    A: {matchState.events.filter(event => 
                                      event.type === 'goal' && event.assist === player.name
                                    ).length}
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
                    
                    {/* Tlačítko pro odchod ze zápasu - zobrazí se jen po dokončení zápasu */}
                    {!matchState.isPlaying && matchState.completed && matchCompleteAwaitingConfirmation && (
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={confirmMatchExit}
                          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 
                            text-white font-bold py-3 px-6 rounded-lg transform transition-all duration-300 
                            hover:scale-105 active:scale-95 text-xl shadow-lg"
                        >
                          Odejít ze zápasu
                        </button>
                      </div>
                    )}
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
                    setMatchState(prev => ({
                      ...prev,
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
                      scheduledEvents: [],
                      currentOpponent: null
                    }));
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

        {/* Turnaj */}
        {showTournament && tournamentState.phase && (
          <div className="fixed inset-0 bg-black/90 text-white p-8 overflow-y-auto">
            <div className="max-w-[1800px] mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Turnaj
              </h2>

              <div className="grid grid-cols-[350px_1fr_400px] gap-8">
                {/* Levý sloupec - Skupiny */}
                <div className="space-y-8">
                  {/* Skupina A */}
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-xl p-6 border border-blue-500/20">
                    <h3 className="text-2xl font-bold text-blue-400 mb-4">Skupina A</h3>
                    <div className="space-y-2">
                      {tournamentState.groups.A.map((teamData, index) => (
                        <div key={index} className="bg-black/30 p-3 rounded-lg border border-blue-500/10">
                          <div className="flex justify-between items-center">
                            <span className="text-white">{teamData.team.name}</span>
                            <span className="text-yellow-400 font-bold">{teamData.points} b.</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Skóre: {teamData.score.for}:{teamData.score.against}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skupina B */}
                  <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/20 rounded-xl p-6 border border-purple-500/20">
                    <h3 className="text-2xl font-bold text-purple-400 mb-4">Skupina B</h3>
                    <div className="space-y-2">
                      {tournamentState.groups.B.map((teamData, index) => (
                        <div key={index} className="bg-black/30 p-3 rounded-lg border border-purple-500/10">
                          <div className="flex justify-between items-center">
                            <span className="text-white">{teamData.team.name}</span>
                            <span className="text-yellow-400 font-bold">{teamData.points} b.</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Skóre: {teamData.score.for}:{teamData.score.against}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prostřední sloupec - Statistiky */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Úspěšnost brankářů */}
                  <div className="bg-gradient-to-br from-green-900/50 to-green-800/20 rounded-xl p-6 border border-green-500/20">
                    <h3 className="text-xl font-bold text-green-400 mb-4">Úspěšnost brankářů</h3>
                    <div className="overflow-x-auto"> {/* Přidáno pro horizontální posuv */}
                      <table className="min-w-full text-left">
                        <thead className="border-b border-green-500/30">
                          <tr>
                            <th className="py-2 text-white text-sm font-semibold">Brankář</th>
                            <th className="py-2 text-white text-sm font-semibold">Tým</th>
                            <th className="py-2 text-white text-sm font-semibold">Zákroky</th>
                            <th className="py-2 text-white text-sm font-semibold">Střely</th>
                            <th className="py-2 text-white text-sm font-semibold">Úspěšnost</th>
                            <th className="py-2 text-white text-sm font-semibold">Vychytané nuly</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tournamentState.goalies && Array.isArray(tournamentState.goalies) && tournamentState.goalies.map((goalie, index) => {
                            const savePercentage = goalie.shots > 0 ? ((goalie.saves / goalie.shots) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={index} className="border-b border-green-500/10">
                                <td className="py-2 text-white text-sm">{goalie.name}</td>
                                <td className="py-2 text-white text-sm">{goalie.team}</td>
                                <td className="py-2 text-yellow-400 text-sm">{goalie.saves}</td>
                                <td className="py-2 text-yellow-400 text-sm">{goalie.shots}</td>
                                <td className="py-2 text-yellow-400 text-sm">{savePercentage}%</td>
                                <td className="py-2 text-yellow-400 text-sm">{goalie.shutouts}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Kanadské bodování */}
                  <div className="bg-gradient-to-br from-red-900/50 to-red-800/20 rounded-xl p-6 border border-red-500/20">
                    <h3 className="text-xl font-bold text-red-400 mb-4">Kanadské bodování</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="border-b border-red-500/30">
                          <tr>
                            <th className="py-2 text-white text-sm font-semibold">Hráč</th>
                            <th className="py-2 text-white text-sm font-semibold">Tým</th>
                            <th className="py-2 text-white text-sm font-semibold">Pozice</th>
                            <th className="py-2 text-white text-sm font-semibold">G</th>
                            <th className="py-2 text-white text-sm font-semibold">A</th>
                            <th className="py-2 text-white text-sm font-semibold">B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tournamentState.scorers && tournamentState.scorers
                            .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
                            .map((scorer, index) => (
                              <tr key={index} className="border-b border-red-500/10">
                                <td className="py-2 text-white text-sm">{scorer.name}</td>
                                <td className="py-2 text-white text-sm">{scorer.team}</td>
                                <td className="py-2 text-white text-sm">
                                  {scorer.position === 'goalkeeper' ? 'Brankář' : 
                                   scorer.position === 'defender' ? 'Obránce' : 
                                   scorer.position === 'forward' ? 'Útočník' : 'Neznámá'}
                                </td>
                                <td className="py-2 text-yellow-400 text-sm">{scorer.goals}</td>
                                <td className="py-2 text-yellow-400 text-sm">{scorer.assists}</td>
                                <td className="py-2 text-yellow-400 text-sm font-bold">{scorer.goals + scorer.assists}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Střelci */}
                  <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/20 rounded-xl p-6 border border-yellow-500/20">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Střelci</h3>
                    <div className="space-y-2">
                      {Object.entries(matchState.playerStats.goals).map(([playerId, goals], index) => (
                        <div key={index} className="bg-black/30 p-2 rounded-lg border border-yellow-500/10">
                          <div className="flex justify-between items-center">
                            <span className="text-white">{playerId}</span>
                            <span className="text-yellow-400">{goals}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Obránci */}
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-xl p-6 border border-blue-500/20">
                    <h3 className="text-xl font-bold text-blue-400 mb-4">Obránci</h3>
                    <div className="space-y-2">
                      {Object.entries(matchState.playerStats.assists).map(([playerId, assists], index) => (
                        <div key={index} className="bg-black/30 p-2 rounded-lg border border-blue-500/10">
                          <div className="flex justify-between items-center">
                            <span className="text-white">{playerId}</span>
                            <span className="text-yellow-400">{assists}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pravý sloupec - Rozpis zápasů */}
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/20 rounded-xl p-6 border border-gray-500/20">
                    <h3 className="text-2xl font-bold text-gray-400 mb-4">Rozpis zápasů</h3>
                    
                    {/* Zápasy skupiny A */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Skupina A</h4>
                      <div className="space-y-2">
                        {tournamentState.matches.groups
                          .filter(match => match.group === 'A')
                          .map((match, index) => (
                            <div key={index} className="bg-black/30 p-3 rounded-lg text-sm border border-blue-500/10">
                              <div className="flex justify-between items-center">
                                <span className="text-white">{match.home}</span>
                                <span className="text-yellow-400 font-bold mx-2">
                                  {match.score ? `${match.score.home} : ${match.score.away}` : 'vs'}
                                </span>
                                <span className="text-white">{match.away}</span>
                              </div>
                              {!match.score && (
                                <div className="flex justify-center gap-2 mt-2">
                                  {(match.home === selectedTeam.name || match.away === selectedTeam.name) ? (
                                    <button
                                      onClick={() => startNextTournamentMatch()}
                                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                        text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                        hover:scale-105 active:scale-95">
                                      Hrát zápas
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => startNextTournamentMatch()}
                                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                                        text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                        hover:scale-105 active:scale-95">
                                      Simulovat zápas
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Zápasy skupiny B */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-purple-400 mb-2">Skupina B</h4>
                      <div className="space-y-2">
                        {tournamentState.matches.groups
                          .filter(match => match.group === 'B')
                          .map((match, index) => (
                            <div key={index} className="bg-black/30 p-3 rounded-lg text-sm border border-purple-500/10">
                              <div className="flex justify-between items-center">
                                <span className="text-white">{match.home}</span>
                                <span className="text-yellow-400 font-bold mx-2">
                                  {match.score ? `${match.score.home} : ${match.score.away}` : 'vs'}
                                </span>
                                <span className="text-white">{match.away}</span>
                              </div>
                              {!match.score && (
                                <div className="flex justify-center gap-2 mt-2">
                                  {(match.home === selectedTeam.name || match.away === selectedTeam.name) ? (
                                    <button
                                      onClick={() => startNextTournamentMatch()}
                                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                        text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                        hover:scale-105 active:scale-95">
                                      Hrát zápas
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => startNextTournamentMatch()}
                                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                                        text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                        hover:scale-105 active:scale-95">
                                      Simulovat zápas
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Play-off */}
                    <div>
                      <h4 className="text-lg font-semibold text-red-400 mb-2">Play-off</h4>
                      <div className="space-y-4">
                        {/* Čtvrtfinále */}
                        <div className="space-y-2">
                          <div className="text-sm text-red-400">Čtvrtfinále</div>
                          {tournamentState.matches.playoff
                            .filter(match => match.round === 'quarterfinal')
                            .map((match, index) => (
                              <div key={index} className="bg-black/30 p-3 rounded-lg text-sm border border-red-500/10">
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{match.home}</span>
                                  <span className="text-yellow-400 font-bold mx-2">
                                    {match.score ? `${match.score.home} : ${match.score.away}` : 'vs'}
                                  </span>
                                  <span className="text-white">{match.away}</span>
                                </div>
                                {!match.score && (
                                  <div className="flex justify-center gap-2 mt-2">
                                    {(match.home === selectedTeam.name || match.away === selectedTeam.name) ? (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Hrát zápas
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Simulovat zápas
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* Semifinále */}
                        <div className="space-y-2">
                          <div className="text-sm text-red-400">Semifinále</div>
                          {tournamentState.matches.playoff
                            .filter(match => match.round === 'semifinal')
                            .map((match, index) => (
                              <div key={index} className="bg-black/30 p-3 rounded-lg text-sm border border-red-500/10">
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{match.home}</span>
                                  <span className="text-yellow-400 font-bold mx-2">
                                    {match.score ? `${match.score.home} : ${match.score.away}` : 'vs'}
                                  </span>
                                  <span className="text-white">{match.away}</span>
                                </div>
                                {!match.score && (
                                  <div className="flex justify-center gap-2 mt-2">
                                    {(match.home === selectedTeam.name || match.away === selectedTeam.name) ? (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Hrát zápas
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Simulovat zápas
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* O umístění */}
                        <div className="space-y-2">
                          <div className="text-sm text-red-400">O umístění</div>
                          {tournamentState.matches.playoff
                            .filter(match => ['fifth_place', 'third_place', 'final'].includes(match.round))
                            .map((match, index) => (
                              <div key={index} className="bg-black/30 p-3 rounded-lg text-sm border border-red-500/10">
                                <div className="text-xs text-red-400 mb-1">
                                  {match.round === 'fifth_place' ? 'O 5. místo' :
                                   match.round === 'third_place' ? 'O 3. místo' : 'Finále'}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{match.home}</span>
                                  <span className="text-yellow-400 font-bold mx-2">
                                    {match.score ? `${match.score.home} : ${match.score.away}` : 'vs'}
                                  </span>
                                  <span className="text-white">{match.away}</span>
                                </div>
                                {!match.score && (
                                  <div className="flex justify-center gap-2 mt-2">
                                    {(match.home === selectedTeam.name || match.away === selectedTeam.name) ? (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Hrát zápas
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => startNextTournamentMatch()}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                                          text-white text-sm font-bold py-1 px-4 rounded-lg transform transition-all duration-300 
                                          hover:scale-105 active:scale-95">
                                        Simulovat zápas
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGame;