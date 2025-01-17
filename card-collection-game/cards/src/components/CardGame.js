'use client';

import React, { useState, useEffect } from 'react';

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
    goalkeeper: null,
    defenders: [],
    forwards: []
  });
  const [showMatch, setShowMatch] = useState(false);
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
    penalties: []
  });
  const [cardLevels, setCardLevels] = useState({});
  const [showDecision, setShowDecision] = useState(false);
  const [currentDecision, setCurrentDecision] = useState(null);

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

    setSelectedTeam(prev => {
      const newTeam = { ...prev };
      
      // Pokud je hráč již vybrán, odeberte ho
      if (prev.goalkeeper === card.id || 
          prev.defenders.includes(card.id) || 
          prev.forwards.includes(card.id)) {
        if (prev.goalkeeper === card.id) newTeam.goalkeeper = null;
        if (prev.defenders.includes(card.id)) newTeam.defenders = prev.defenders.filter(id => id !== card.id);
        if (prev.forwards.includes(card.id)) newTeam.forwards = prev.forwards.filter(id => id !== card.id);
        return newTeam;
      }

      // Přidejte hráče do správné kategorie
      switch (card.position) {
        case 'goalkeeper':
          if (newTeam.goalkeeper === null) {
            newTeam.goalkeeper = card.id;
          }
          break;
        case 'defender':
          if (newTeam.defenders.length < 2 && !newTeam.defenders.includes(card.id)) {
            newTeam.defenders.push(card.id);
          }
          break;
        case 'forward':
          if (newTeam.forwards.length < 3 && !newTeam.forwards.includes(card.id)) {
            newTeam.forwards.push(card.id);
          }
          break;
      }
      return newTeam;
    });
  };

  const isTeamComplete = () => {
    return selectedTeam.goalkeeper !== null && 
           selectedTeam.defenders.length === 2 && 
           selectedTeam.forwards.length === 3;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Definice soupeřova týmu
  const opponentTeam = {
    goalkeeper: { id: 'opp_gk', name: "Kolečko 'Betonář' Vozíkový", number: "1", level: 3, image: "/Images/question_mark.png" },
    defenders: [
      { id: 'opp_def1', name: "Hrábě 'Zeď' Zahradnický", number: "44", level: 3, image: "/Images/question_mark.png" },
      { id: 'opp_def2', name: "Sekera 'Drtič' Štípačový", number: "77", level: 2, image: "/Images/question_mark.png" }
    ],
    forwards: [
      { id: 'opp_fw1', name: "Lopatka 'Rychlík' Rýčový", number: "13", level: 1, image: "/Images/question_mark.png" },
      { id: 'opp_fw2', name: "Krumpáč 'Střela' Kopáčový", number: "88", level: 1, image: "/Images/question_mark.png" },
      { id: 'opp_fw3', name: "Motyka 'Tank' Hrabalský", number: "91", level: 1, image: "/Images/question_mark.png" }
    ]
  };

  const generateGameEvent = () => {
    const isHomeTeam = Math.random() < 0.5;
    const team = isHomeTeam ? selectedTeam : opponentTeam;
    
    const activePlayers = {
      forwards: isHomeTeam 
        ? selectedTeam.forwards.filter(id => !matchState.penalties.some(p => p.playerId === id))
        : opponentTeam.forwards.filter(p => !matchState.penalties.some(pen => pen.playerId === p.id)),
      defenders: isHomeTeam
        ? selectedTeam.defenders.filter(id => !matchState.penalties.some(p => p.playerId === id))
        : opponentTeam.defenders.filter(p => !matchState.penalties.some(pen => pen.playerId === p.id)),
      goalkeeper: isHomeTeam ? selectedTeam.goalkeeper : opponentTeam.goalkeeper
    };

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
        ? opponentTeam.goalkeeper.level 
        : getCardLevel(selectedTeam.goalkeeper);

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
        return {
          type: 'goal',
          isHomeTeam,
          player: isHomeTeam ? cards.find(c => c.id === shooter).name : shooter.name,
          assist: isHomeTeam ? cards.find(c => c.id === assist).name : assist.name,
          level: shooterLevel,
          assistLevel: assistLevel,
          message: `Góóól! ${isHomeTeam ? cards.find(c => c.id === shooter).name : shooter.name} skóruje ${selectedShotType}! Asistuje ${isHomeTeam ? cards.find(c => c.id === assist).name : assist.name}!`
        };
      } else {
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
          player: isHomeTeam ? opponentTeam.goalkeeper.name : cards.find(c => c.id === selectedTeam.goalkeeper).name,
          level: opposingGoalieLevel,
          message: `${selectedSaveType.charAt(0).toUpperCase() + selectedSaveType.slice(1)} předvedl ${isHomeTeam ? opponentTeam.goalkeeper.name : cards.find(c => c.id === selectedTeam.goalkeeper).name}!`
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
        message: `${isHomeTeam ? cards.find(c => c.id === hitter).name : hitter.name} předvádí ${selectedHitType}!`
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
        message: `${isHomeTeam ? cards.find(c => c.id === blocker).name : blocker.name} ${selectedBlockType}!`
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
        message: `${isHomeTeam ? cards.find(c => c.id === passer).name : passer.name} předvádí ${selectedPassType}!`
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
        duration: 120,
        playerId: isHomeTeam ? penalizedPlayer : penalizedPlayer.id
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
    if (!currentDecision) return;

    const success = Math.random() < option.successRate;
    const event = {
      type: success ? 'goal' : 'miss',
      player: currentDecision.player.name,
      playerId: currentDecision.player.id,
      position: currentDecision.player.position,
      time: formatTime(matchState.time),
      id: Date.now(),
      level: getCardLevel(currentDecision.player.id)
    };

    if (success) {
      switch (currentDecision.type) {
        case 'breakaway':
          event.message = option.id === 'shoot' 
            ? 'GÓÓÓL! Perfektní zakončení úniku!'
            : 'GÓÓÓL! Brankář překonán kličkou!';
          break;
        case 'powerplay':
          event.message = option.id === 'shot'
            ? 'GÓÓÓL! Dělovka od modré!'
            : 'GÓÓÓL! Kombinace zakončena do prázdné branky!';
          break;
        case 'defense':
          event.message = option.id === 'block'
            ? 'Výborný blok! Protiútok zlikvidován!'
            : 'Skvělý bodyček! Soupeř přišel o puk!';
          break;
      }

      if (event.type === 'goal') {
        setMatchState(prev => ({
          ...prev,
          score: { ...prev.score, home: prev.score.home + 1 },
          events: [event, ...prev.events],
          playerStats: {
            ...prev.playerStats,
            goals: {
              ...prev.playerStats.goals,
              [currentDecision.player.id]: (prev.playerStats.goals[currentDecision.player.id] || 0) + 1
            }
          }
        }));
      } else {
        setMatchState(prev => ({
          ...prev,
          events: [event, ...prev.events]
        }));
      }
    } else {
      event.message = 'Neúspěšný pokus!';
      setMatchState(prev => ({
        ...prev,
        events: [event, ...prev.events]
      }));
    }

    setShowDecision(false);
    setCurrentDecision(null);
  };

  const startMatch = () => {
    if (isTeamComplete()) {
      setShowMatch(true);
      setShowTeamSelection(false);
      setMatchState(prev => ({ 
        ...prev, 
        isPlaying: true,
        score: { home: 0, away: 0 },
        playerStats: {
          goals: {},
          assists: {},
          saves: {},
          saveAccuracy: {},
          shots: {}
        },
        penalties: []
      }));
      
      const timer = setInterval(() => {
        setMatchState(prev => {
          const timeDecrease = prev.gameSpeed;
          
          // Aktualizace trestů
          const updatedPenalties = prev.penalties
            .map(penalty => ({
              ...penalty,
              timeLeft: Math.max(0, penalty.timeLeft - timeDecrease)
            }))
            .filter(penalty => penalty.timeLeft > 0);

          if (prev.time <= 0) {
            if (prev.period < 3) {
              return {
                ...prev,
                period: prev.period + 1,
                time: 1200,
                penalties: updatedPenalties,
                events: [...prev.events, { 
                  type: 'period',
                  message: `Konec ${prev.period}. třetiny!`,
                  time: '00:00',
                  id: Date.now()
                }]
              };
            } else {
              clearInterval(timer);
              // Určíme výsledek zápasu
              const result = prev.score.home > prev.score.away ? 'victory' : 'defeat';
              setMatchResult(result);
              setShowRewards(true);
              
              // Přidáme XP a peníze podle výsledku
              const xpReward = result === 'victory' ? 20 : 5;
              const moneyReward = result === 'victory' ? 50 : 20;
              
              setXp(currentXp => {
                const newXp = currentXp + xpReward;
                if (newXp >= 20) {
                  setLevel(currentLevel => currentLevel + 1);
                  return newXp - 20;
                }
                return newXp;
              });
              
              setMoney(current => current + moneyReward);
              
              return {
                ...prev,
                isPlaying: false,
                penalties: [],
                events: [...prev.events, {
                  type: 'end',
                  message: 'Konec zápasu!',
                  time: '00:00',
                  id: Date.now()
                }]
              };
            }
          }

          if (Math.random() < 0.03 * prev.gameSpeed) {
            const event = generateGameEvent(selectedTeam);
            if (!event) return { ...prev, time: prev.time - timeDecrease };
            
            const newStats = { ...prev.playerStats };

            if (event.type === 'goal') {
              newStats.goals[event.playerId] = (newStats.goals[event.playerId] || 0) + 1;
              if (event.assistId) {
                newStats.assists[event.assistId] = (newStats.assists[event.assistId] || 0) + 1;
              }
              newStats.shots[selectedTeam.goalkeeper] = (newStats.shots[selectedTeam.goalkeeper] || 0) + 1;
              return {
                ...prev,
                time: prev.time - timeDecrease,
                score: { ...prev.score, home: prev.score.home + 1 },
                events: [event, ...prev.events],
                playerStats: newStats,
                penalties: updatedPenalties
              };
            } else if (event.type === 'save' && event.playerId === selectedTeam.goalkeeper) {
              newStats.saves[event.playerId] = (newStats.saves[event.playerId] || 0) + 1;
              newStats.shots[selectedTeam.goalkeeper] = (newStats.shots[selectedTeam.goalkeeper] || 0) + 1;
              const saves = newStats.saves[event.playerId];
              const shots = newStats.shots[selectedTeam.goalkeeper];
              newStats.saveAccuracy[event.playerId] = Math.round((saves / shots) * 100);
              return {
                ...prev,
                time: prev.time - timeDecrease,
                events: [event, ...prev.events],
                playerStats: newStats,
                penalties: updatedPenalties
              };
            }

            return {
              ...prev,
              time: prev.time - timeDecrease,
              events: [event, ...prev.events],
              penalties: updatedPenalties
            };
          }

          // Šance na speciální událost (5% při každém tiknutí)
          if (!showDecision && Math.random() < 0.05) {
            const specialEvent = generateSpecialEvent(selectedTeam);
            if (specialEvent) {
              setCurrentDecision(specialEvent);
              setShowDecision(true);
              return {
                ...prev,
                time: prev.time - timeDecrease,
                penalties: updatedPenalties
              };
            }
          }

          return {
            ...prev,
            time: prev.time - timeDecrease,
            penalties: updatedPenalties
          };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  };

  useEffect(() => {
    if (matchState.isPlaying && !showDecision) {
      const timer = setInterval(() => {
        setMatchState(prev => {
          // Pokud se zobrazí rozhodnutí, zastavíme časovač
          if (showDecision) {
            clearInterval(timer);
            return prev;
          }

          const timeDecrease = prev.gameSpeed;
          const newTime = prev.time - timeDecrease;

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
                events: [...prev.events, { 
                  type: 'period',
                  message: `Konec ${prev.period}. třetiny!`,
                  time: '00:00',
                  id: Date.now()
                }]
              };
            } else {
              clearInterval(timer);
              // Určíme výsledek zápasu
              const result = prev.score.home > prev.score.away ? 'victory' : 'defeat';
              setMatchResult(result);
              setShowRewards(true);
              
              // Přidáme XP a peníze podle výsledku
              const xpReward = result === 'victory' ? 20 : 5;
              const moneyReward = result === 'victory' ? 50 : 20;
              
              setXp(currentXp => {
                const newXp = currentXp + xpReward;
                if (newXp >= 20) {
                  setLevel(currentLevel => currentLevel + 1);
                  return newXp - 20;
                }
                return newXp;
              });
              
              setMoney(current => current + moneyReward);
              
              return {
                ...prev,
                isPlaying: false,
                penalties: [],
                events: [...prev.events, {
                  type: 'end',
                  message: 'Konec zápasu!',
                  time: '00:00',
                  id: Date.now()
                }]
              };
            }
          }

          // Generování speciální události pouze pokud není aktivní rozhodnutí
          if (Math.random() < 0.05 && !showDecision) {
            setShowDecision(true);
            setCurrentDecision(generateSpecialEvent(selectedTeam));
            return prev; // Zachováme současný stav
          }

          return {
            ...prev,
            time: newTime,
            penalties: updatedPenalties
          };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [matchState.isPlaying, showDecision]);

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
    setSelectedCard(null);
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
              <button
                onClick={() => canPlayMatch() ? alert('Můžete začít zápas!') : alert('Pro zápas potřebujete: 1 brankáře, 2 obránce a 3 útočníky!')}
                className={`bg-gradient-to-r ${canPlayMatch() ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                  text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                  ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''} border-2 border-white/20`}
                disabled={!canPlayMatch()}
              >
                Hrát zápas {!canPlayMatch() && '(Neúplná sestava)'}
              </button>
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
            <button
              onClick={startTeamSelection}
              className={`bg-gradient-to-r ${canPlayMatch() ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'from-gray-500 to-gray-600 cursor-not-allowed'} 
                text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 
                ${canPlayMatch() ? 'hover:scale-105 active:scale-95' : ''}`}
              disabled={!canPlayMatch()}
            >
              Hrát zápas {!canPlayMatch() && '(Neúplná sestava)'}
            </button>
          )}
        </div>

        {showTeamSelection && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-8">Vyberte svou sestavu</h2>
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Brankář ({selectedTeam.goalkeeper ? '1/1' : '0/1'})</h3>
                <div className="grid gap-4">
                  {cards.filter(card => card.position === 'goalkeeper' && unlockedCards.some(c => c.id === card.id)).map(card => (
                    <div
                      key={card.id}
                      onClick={() => selectPlayer(card)}
                      className={`cursor-pointer transform transition-all duration-300 hover:scale-105 
                        ${selectedTeam.goalkeeper === card.id ? 'ring-4 ring-green-500' : ''}`}
                    >
                      <img src={card.image} alt={card.name} className="w-32 h-40 object-contain rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Obránci ({selectedTeam.defenders.length}/2)</h3>
                <div className="grid gap-4">
                  {cards.filter(card => card.position === 'defender' && unlockedCards.some(c => c.id === card.id)).map(card => (
                    <div
                      key={card.id}
                      onClick={() => selectPlayer(card)}
                      className={`cursor-pointer transform transition-all duration-300 hover:scale-105 
                        ${selectedTeam.defenders.includes(card.id) ? 'ring-4 ring-green-500' : ''}`}
                    >
                      <img src={card.image} alt={card.name} className="w-32 h-40 object-contain rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-4">Útočníci ({selectedTeam.forwards.length}/3)</h3>
                <div className="grid gap-4">
                  {cards.filter(card => card.position === 'forward' && unlockedCards.some(c => c.id === card.id)).map(card => (
                    <div
                      key={card.id}
                      onClick={() => selectPlayer(card)}
                      className={`cursor-pointer transform transition-all duration-300 hover:scale-105 
                        ${selectedTeam.forwards.includes(card.id) ? 'ring-4 ring-green-500' : ''}`}
                    >
                      <img src={card.image} alt={card.name} className="w-32 h-40 object-contain rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowTeamSelection(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Zrušit
              </button>
              <button
                onClick={startMatch}
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
            <div className="w-[90%] max-w-7xl mx-auto">
              <div className="flex gap-4">
                {/* Levá část - časomíra a hřiště */}
                <div className="flex-1">
                  {/* Horní panel s logy, časomírou a ovládáním rychlosti */}
                  <div className="flex justify-between items-center mb-4 bg-black/50 p-4 rounded-xl">
                    <div className="flex items-center gap-8">
                      <img src="/Images/Litvinov_Lancers.png" alt="Litvínov Lancers" className="h-20 object-contain" />
                      {matchState.penalties.filter(p => p.isHomeTeam).length > 0 && (
                        <div className="flex gap-4">
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
                      )}
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
                      {matchState.penalties.filter(p => !p.isHomeTeam).length > 0 && (
                        <div className="flex gap-4">
                          {matchState.penalties.filter(p => !p.isHomeTeam).map(penalty => {
                            const player = opponentTeam.forwards.concat(opponentTeam.defenders)
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
                        </div>
                      )}
                      <img src="/Images/HC_Lopaty_Praha.png" alt="HC Lopaty Praha" className="h-20 object-contain" />
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
                        {[
                          { name: "Lopatka 'Rychlík' Rýčový", number: "13", level: 1 },
                          { name: "Krumpáč 'Střela' Kopáčový", number: "88", level: 1 },
                          { name: "Motyka 'Tank' Hrabalský", number: "91", level: 1 }
                        ].map(player => (
                          <div key={player.name} className="flex justify-center items-center">
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
                          </div>
                        ))}
                      </div>
                      {/* Obránci */}
                      <div className="grid grid-rows-2 gap-8">
                        {[
                          { name: "Hrábě 'Zeď' Zahradnický", number: "44", level: 3 },
                          { name: "Sekera 'Drtič' Štípačový", number: "77", level: 2 }
                        ].map(player => (
                          <div key={player.name} className="flex justify-center items-center">
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
                          </div>
                        ))}
                      </div>
                      {/* Brankář */}
                      <div className="flex justify-center items-center">
                        <div className="w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg flex flex-col items-center justify-center text-gray-400 transform hover:scale-110 transition-transform relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-600 to-yellow-800 py-1">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <div className="text-5xl font-bold mb-2">?</div>
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-black text-xs font-bold">3</span>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 p-1">
                            <p className="text-[8px] text-center text-gray-300 font-bold leading-tight">
                              Kolečko "Betonář" Vozíkový
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pravá část - události */}
                <div className="w-[500px] flex flex-col"> {/* Zvětšená šířka pro události */}
                  {/* Seznam událostí */}
                  <div className="bg-gradient-to-b from-black/50 to-black/30 rounded-xl p-8 h-full overflow-y-auto">
                    <h3 className="text-3xl font-bold text-yellow-400 sticky top-0 bg-black/50 backdrop-blur-sm p-4 rounded-lg mb-6 border-b border-yellow-500/20">
                      Průběh zápasu
                    </h3>
                    <div className="space-y-4"> {/* Větší mezery mezi událostmi */}
                      {matchState.events.map(event => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg ${
                            event.type === 'goal'
                              ? 'bg-green-900/40 border-l-4 border-green-500'
                              : event.type === 'penalty'
                              ? 'bg-red-900/40 border-l-4 border-red-500'
                              : event.type === 'save'
                              ? 'bg-blue-900/40 border-l-4 border-blue-500'
                              : 'bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 font-mono">{event.time}</span>
                            {event.type === 'goal' && (
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400 font-bold">Level {event.level}</span>
                                {event.assistLevel && (
                                  <span className="text-yellow-400 font-bold">A: Level {event.assistLevel}</span>
                                )}
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

              {showDecision && currentDecision && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                  <div className="bg-gradient-to-br from-blue-900/90 to-blue-800/80 p-8 rounded-2xl max-w-2xl w-full mx-4 border border-blue-500/20">
                    <h2 className="text-4xl font-bold text-center mb-6 text-blue-300">
                      {currentDecision.title}
                    </h2>
                    <p className="text-white text-xl text-center mb-8">
                      {currentDecision.description}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      {currentDecision.options.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleDecision(option)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                            text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-300 
                            hover:scale-105 active:scale-95"
                        >
                          <div className="text-xl mb-2">{option.text}</div>
                          <div className="text-sm opacity-75">
                            Šance na úspěch: {Math.round(option.successRate * 100)}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
      </div>
    </div>
  );
};

export default CardGame;