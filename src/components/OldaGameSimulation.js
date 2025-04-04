'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers, personalityTypes } from '../data/LitvinovLancers';

const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState('enter'); // 'enter', 'greeting', 'locker_room', 'game'
  const [currentTime, setCurrentTime] = useState(16 * 60 + 30); // 16:30 v minutách
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showPlayerInteraction, setShowPlayerInteraction] = useState(false);
  const [interactingPlayer, setInteractingPlayer] = useState(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [showGreetPrompt, setShowGreetPrompt] = useState(true);
  const [playerGreetings, setPlayerGreetings] = useState({});
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [usedDialogOptions, setUsedDialogOptions] = useState(new Set());
  const [playerResponses, setPlayerResponses] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [activePlayers, setActivePlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Možnosti promluvy k týmu
  const teamDialogOptions = [
    {
      id: 'humble',
      text: "Hoši, buďte na mě hodní, dlouho jsem na tom nestál...",
      response: "Neboj, všichni jsme tady začínali. Pomůžeme ti! 👍",
      personality: "humble"
    },
    {
      id: 'practical',
      text: "Jaký dres si mám vzít? Světlý nebo tmavý?",
      response: "Pro začátek si vezmi tmavý, rozdělíme týmy až před zápasem. 👕",
      personality: "practical"
    },
    {
      id: 'positive',
      text: "Doufám, že si dobře zahrajeme!",
      response: "To si piš, že jo! Hlavně v klidu a s úsměvem. 😊",
      personality: "positive"
    },
    {
      id: 'nervous',
      text: "Jsem trochu nervózní...",
      response: "To je normální, za chvíli to opadne. Jsme v pohodě parta! 💪",
      personality: "honest"
    }
  ];

  // Definice otázek a odpovědí
  const questions = [
    {
      id: 'dresy',
      text: "Jaký dres si mám vzít? Světlý nebo tmavý?",
      getResponses: (activePlayers) => {
        // Najdeme Oldu
        const olda = activePlayers.find(p => p.name === "Oldřich" && p.surname === "Štěpanovský");
        
        // Najdeme všechny vtipkaře v kabině
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        
        // Náhodně vybereme dva vtipkaře (pokud jsou k dispozici)
        const shuffledJokers = jokers.sort(() => Math.random() - 0.5);
        const firstJoker = shuffledJokers[0];
        const secondJoker = shuffledJokers[1];

        const responses = [
          {
            playerId: `${olda.name} ${olda.surname}`,
            text: "Hele, to si ještě rozmyslím. Uvidíme, kolik nás přijde a jak to rozdělíme... 🤔",
            delay: 500
          }
        ];

        // Přidáme odpovědi vtipkařů, pokud jsou k dispozici
        if (firstJoker) {
          responses.push({
            playerId: `${firstJoker.name} ${firstJoker.surname}`,
            text: "Klasika! Olda si to rozmyslí až na ledě, jako vždycky. Jednou jsme čekali tak dlouho, že jsme málem hráli všichni proti mantinelu! 😂",
            delay: 2000
          });
        }

        if (secondJoker) {
          responses.push({
            playerId: `${secondJoker.name} ${secondJoker.surname}`,
            text: "To je pravda! A minule jsme se přeřazovali ještě v polovině zápasu, protože Olda zjistil, že má jeden tým samé rychlíky! 🏃‍♂️💨",
            delay: 3500
          });
        }

        // Oldova závěrečná odpověď
        responses.push({
          playerId: `${olda.name} ${olda.surname}`,
          text: "No jo no... Ale vždycky z toho byl nakonec super hokej, ne? 😅 Vem si oba dresy, ať můžeš případně přebíhat.",
          delay: 5000
        });

        return responses;
      }
    },
    {
      id: 'humble',
      text: "Hoši, buďte na mě hodní, dlouho jsem na tom nestál...",
      getResponses: (activePlayers) => {
        // Najdeme mentora (pokud je v kabině)
        const mentor = activePlayers.find(p => p.personality === "mentor");
        
        // Najdeme všechny vtipkaře v kabině
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        
        // Náhodně vybereme vtipkaře
        const joker = jokers[Math.floor(Math.random() * jokers.length)];

        // Najdeme přátelského hráče
        const friendly = activePlayers.find(p => p.personality === "pratelsky");

        const responses = [];

        // Přidáme odpověď mentora (pokud je k dispozici)
        if (mentor) {
          responses.push({
            playerId: `${mentor.name} ${mentor.surname}`,
            text: "Neboj se, každý někdy začínal. Pomůžeme ti se do toho dostat. Hlavně se soustřeď na základy a užij si to! 👊",
            delay: 500
          });
        }

        // Přidáme odpověď přátelského hráče (pokud je k dispozici)
        if (friendly) {
          responses.push({
            playerId: `${friendly.name} ${friendly.surname}`,
            text: "Jasně, v pohodě! Jsme tu od toho, abychom si zahráli a pobavili se. Nikdo tě soudit nebude. 😊",
            delay: 2000
          });
        }

        // Přidáme vtipnou poznámku od vtipkaře (pokud je k dispozici)
        if (joker) {
          responses.push({
            playerId: `${joker.name} ${joker.surname}`,
            text: "Hele, já jsem minule spadl tak šikovně, že jsem si málem dal vlastňáka... a to hraju pravidelně! Takže klídek. 😂",
            delay: 3500
          });
        }

        return responses;
      }
    },
    {
      id: 'positive',
      text: "Doufám, že si dobře zahrajeme!",
      getResponses: (activePlayers) => {
        // Najdeme všechny vtipkaře v kabině
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        
        // Náhodně vybereme dva vtipkaře (pokud jsou k dispozici)
        const shuffledJokers = jokers.sort(() => Math.random() - 0.5);
        const firstJoker = shuffledJokers[0];
        const secondJoker = shuffledJokers[1];

        const responses = [];

        // Přidáme odpovědi vtipkařů, pokud jsou k dispozici
        if (firstJoker) {
          responses.push({
            playerId: `${firstJoker.name} ${firstJoker.surname}`,
            text: "To si piš! Hlavně se drž u mantinelu, ať tě nepřejedeme jako minule Frantu! Ten se pak týden nemohl posadit! 😂",
            delay: 500
          });
        }

        if (secondJoker) {
          responses.push({
            playerId: `${secondJoker.name} ${secondJoker.surname}`,
            text: "Jo, a když budeš mít štěstí, možná ti i nahraju! Teda... pokud trefím... Minule jsem nahrál rozhodčímu a ten se tak lekl, že odpískal faul sám na sebe! 🤣",
            delay: 2000
          });
        }

        return responses;
      }
    },
    {
      id: 'nervous',
      text: "Jsem trochu nervózní...",
      getResponses: (activePlayers) => {
        // Najdeme mentora (pokud je v kabině)
        const mentor = activePlayers.find(p => p.personality === "mentor");
        
        // Najdeme přátelského hráče
        const friendly = activePlayers.find(p => p.personality === "pratelsky");
        
        // Najdeme všechny vtipkaře v kabině
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        
        // Náhodně vybereme vtipkaře
        const joker = jokers[Math.floor(Math.random() * jokers.length)];

        const responses = [];

        // Přidáme odpověď mentora (pokud je k dispozici)
        if (mentor) {
          responses.push({
            playerId: `${mentor.name} ${mentor.surname}`,
            text: "Každý začátek je těžký, ale neboj. Drž se v obraně, přihrávej volným spoluhráčům a hlavně si to užij! 💪",
            delay: 500
          });
        }

        // Přidáme odpověď přátelského hráče (pokud je k dispozici)
        if (friendly) {
          responses.push({
            playerId: `${friendly.name} ${friendly.surname}`,
            text: "Klídek, jsme tu všichni kamarádi. Nikdo tě za nic kritizovat nebude, hlavně si zahrajeme a pobavíme se! 😊",
            delay: 2000
          });
        }

        // Přidáme vtipnou poznámku od vtipkaře (pokud je k dispozici)
        if (joker) {
          responses.push({
            playerId: `${joker.name} ${joker.surname}`,
            text: "Nervózní? Počkej až uvidíš Frantu v bráně, ten je tak nervózní, že minule chytal puky i když jsme byli na střídačce! 🤣",
            delay: 3500
          });
        }

        return responses;
      }
    }
    // Další otázky můžeme přidat později
  ];

  // Funkce pro kontrolu, zda lze ještě mluvit
  const canStillTalk = () => {
    const timeLimit = 16 * 60 + 45; // 16:45
    const hasUnusedOptions = usedDialogOptions.size < teamDialogOptions.length;
    return currentTime < timeLimit && hasUnusedOptions;
  };

  // Funkce pro zpracování výběru promluvy
  const handleTeamDialog = (option) => {
    // Přidáme možnost do použitých
    setUsedDialogOptions(prev => new Set([...prev, option.id]));

    // Přidáme zprávu hráče do událostí
    setEvents(prev => [...prev, {
      type: 'player_speech',
      text: option.text,
      time: currentTime
    }]);

    // Po krátké pauze přidáme odpověď týmu
    setTimeout(() => {
      setEvents(prev => [...prev, {
        type: 'team_response',
        text: option.response,
        time: currentTime
      }]);
      setShowTeamDialog(false);
    }, 1500);
  };

  // Funkce pro zpracování výběru otázky
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setShowTeamDialog(false);
    setPlayerResponses([]);

    // Získáme odpovědi pro aktuální sestavu hráčů
    const responses = question.getResponses(activePlayers);

    // Postupně přidáváme odpovědi hráčů
    responses.forEach((response) => {
      setTimeout(() => {
        setPlayerResponses(prev => [...prev, response]);
      }, response.delay);
    });
  };

  // Funkce pro náhodný výběr hráčů podle jejich docházky
  const selectPlayersByChance = (players) => {
    return players.filter(player => {
      // Vygenerujeme náhodné číslo 0-100
      const chance = Math.random() * 100;
      // Hráč přijde, pokud je náhodné číslo menší než jeho docházka
      return chance < player.attendance;
    });
  };

  // Funkce pro zajištění minimálního počtu hráčů
  const ensureMinimumPlayers = (selectedPlayers, allPlayers, minCount, position) => {
    let players = [...selectedPlayers];
    
    // Pokud nemáme dost hráčů, přidáme ty s nejvyšší docházkou
    if (players.length < minCount) {
      const remainingPlayers = allPlayers
        .filter(p => !players.includes(p))
        .sort((a, b) => b.attendance - a.attendance);
      
      while (players.length < minCount && remainingPlayers.length > 0) {
        players.push(remainingPlayers.shift());
      }
    }
    
    return players;
  };

  // Funkce pro omezení maximálního počtu hráčů
  const limitMaxPlayers = (players, maxCount) => {
    // Seřadíme podle docházky a vezmeme jen maxCount hráčů
    return [...players].sort((a, b) => b.attendance - a.attendance).slice(0, maxCount);
  };

  // Výběr aktivních hráčů
  useEffect(() => {
    // Filtrujeme hráče s docházkou nad 75%
    const activePlayersList = litvinovLancers.players.filter(
      player => player.attendance >= 75
    );
    setActivePlayers(activePlayersList);
  }, []);

  // Rozdělení hráčů podle pozic pro lepší organizaci
  const groupedPlayers = activePlayers.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {});

  // Formátování času
  const formatGameTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Efekt pro simulaci času v kabině
  useEffect(() => {
    if (gameState !== 'locker_room') return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + (1 * gameSpeed);
        // Když je 17:00, začneme zápas
        if (newTime >= 17 * 60) {
          setGameState('warmup');
          return 0; // Reset času pro zápas
        }
        return newTime;
      });
    }, 60000 / gameSpeed); // Upraveno na minutové intervaly (60000ms = 1 minuta)

    return () => clearInterval(interval);
  }, [gameState, gameSpeed]);

  // Funkce pro získání náhodného pozdravu
  const getRandomGreeting = () => {
    const greetings = [
      "Ahoj! 👋",
      "Čau! 😊",
      "Nazdar! 💪",
      "Vítej! 🏒",
      "Zdravím! 👍",
      "Čus! 😄",
      "Ahoj, vítej mezi námi! 🤝",
      "Čau, rád tě poznávám! 😊",
      "Nazdar, nová posilo! 💪"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Funkce pro zpracování pozdravu od hráče
  const handleGreet = () => {
    setHasGreeted(true);
    setShowGreetPrompt(false);

    // Vezmeme všechny aktivní hráče
    const vsichniHraci = [...activePlayers];
    
    // Náhodně zamícháme pořadí hráčů
    const zamichaniHraci = vsichniHraci.sort(() => Math.random() - 0.5);

    // Rozdělíme hráče do několika skupin pro přirozenější pozdravy
    const pocetSkupin = 5;
    const hraci_ve_skupine = Math.ceil(zamichaniHraci.length / pocetSkupin);
    const skupiny = Array.from({ length: pocetSkupin }, (_, i) => 
      zamichaniHraci.slice(i * hraci_ve_skupine, (i + 1) * hraci_ve_skupine)
    );

    // Pro každou skupinu nastavíme náhodné zpoždění v rámci časového okna
    skupiny.forEach((skupina, index) => {
      // Časové okno pro skupinu (0-2000ms)
      const baseDelay = index * 400; // 400ms mezi skupinami

      skupina.forEach(player => {
        // Náhodné zpoždění v rámci skupiny (+-200ms)
        const randomOffset = Math.random() * 400 - 200;
        const delay = baseDelay + randomOffset;

        setTimeout(() => {
          setPlayerGreetings(prev => ({
            ...prev,
            [`${player.name}${player.surname}`]: getRandomGreeting()
          }));

          // Každá bublina zmizí po 1.5 sekundách
          setTimeout(() => {
            setPlayerGreetings(prev => {
              const newGreetings = { ...prev };
              delete newGreetings[`${player.name}${player.surname}`];
              return newGreetings;
            });
          }, 1500);
        }, delay);
      });
    });

    // Přejdeme do stavu locker_room po všech pozdravech
    const maxDelay = pocetSkupin * 400 + 2000;
    setTimeout(() => {
      setGameState('locker_room');
    }, maxDelay);
  };

  // Komponenta pro zobrazení hráče v kabině
  const LockerRoomPlayer = ({ player, playerGreetings }) => {
    // Najdeme pozdrav tohoto hráče (pokud nějaký je)
    const greeting = playerGreetings[`${player.name}${player.surname}`];
    
    return (
      <div className={`relative flex items-center gap-4 bg-black/30 p-3 rounded-xl hover:bg-black/40 transition-colors
        ${player.name === "Oldřich" && player.surname === "Štěpanovský" ? 'border-2 border-yellow-500/50' : ''}`}>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/50">
          <Image
            src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
            alt={player.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            unoptimized={true}
          />
        </div>
        <div>
          <div className="text-base font-bold text-white">
            {player.name} {player.surname}
            <span className="ml-2 text-xs text-indigo-400">({player.attendance}%)</span>
          </div>
          <div className="text-sm text-indigo-300">
            {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
            <span className="mx-2">•</span>
            {personalityTypes[player.personality].name}
          </div>
        </div>
        {/* Bublina s pozdravem */}
        {greeting && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 
                        bg-white text-black px-4 py-2 rounded-xl
                        animate-messageBubble whitespace-normal max-w-[250px] text-sm">
            {greeting}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 
                          w-4 h-4 bg-white rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  // Komponenta pro ovládání času
  const TimeControl = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 p-2 rounded-xl">
      <div className="text-xl font-bold text-indigo-400 mr-4">
        {formatGameTime(currentTime)}
      </div>
      {[1, 2, 4, 8, 16].map(speed => (
        <button
          key={speed}
          onClick={() => setGameSpeed(speed)}
          className={`px-3 py-1 rounded-lg ${
            gameSpeed === speed 
              ? 'bg-indigo-500 text-white' 
              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
          } transition-colors`}
        >
          {speed}×
        </button>
      ))}
    </div>
  );

  // Komponenta pro tlačítko interakce s týmem
  const TeamInteractionButton = () => {
    if (!canStillTalk()) return null;

    const unusedOptions = teamDialogOptions.filter(option => !usedDialogOptions.has(option.id));
    if (unusedOptions.length === 0) return null;

    return (
      <div className="absolute top-1/2 -right-48 transform -translate-y-1/2 z-20">
        <button
          onClick={() => setShowTeamDialog(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl 
                    transition-colors flex items-center gap-2 shadow-lg
                    animate-pulse-button relative overflow-hidden"
        >
          <span className="text-xl">💬</span>
          Promluvit na tým
          {/* Pulzující efekt */}
          <div className="absolute inset-0 bg-white/20 animate-button-glow"></div>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-7xl w-full mx-4 relative">
        {gameState === 'entering' ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8 animate-fadeIn">
              Vstupuješ do kabiny...
            </h2>
            <button
              onClick={() => {
                setGameState('greeting');
                setShowGreetPrompt(true);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl
                        transition-all duration-300 transform hover:scale-105"
            >
              Vstoupit do kabiny
            </button>
          </div>
        ) : gameState === 'greeting' ? (
          <>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8">
              Kabina Lancers
            </h2>
            
            <TeamInteractionButton />

            {/* Dialog pro výběr otázky */}
            {showTeamDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-6 rounded-xl border border-indigo-500/30 max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold text-indigo-300 mb-4">Co chceš říct?</h3>
                  <div className="space-y-2">
                    {questions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionSelect(question)}
                        className="w-full text-left px-4 py-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-white transition-colors"
                      >
                        {question.text}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTeamDialog(false)}
                    className="mt-4 px-4 py-2 bg-gray-500/50 hover:bg-gray-500/70 text-white rounded-lg transition-colors"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            )}

            {/* Seznam událostí (zprávy a odpovědi) */}
            <div className="fixed bottom-4 right-4 max-w-md w-full space-y-2 pointer-events-none z-30">
              {events.slice(-3).map((event, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-white animate-fadeIn ${
                    event.type === 'player_speech' 
                      ? 'bg-indigo-600 ml-12' 
                      : 'bg-gray-600/50 mr-12'
                  }`}
                >
                  {event.text}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Brankáři */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Brankáři <span className="text-sm text-indigo-400">({groupedPlayers['brankář']?.length || 0} / 2)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {groupedPlayers['brankář']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>

              {/* Obránci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Obránci <span className="text-sm text-indigo-400">({groupedPlayers['obránce']?.length || 0} / 6)</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {groupedPlayers['obránce']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>

              {/* Útočníci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Útočníci <span className="text-sm text-indigo-400">({groupedPlayers['útočník']?.length || 0} / 11)</span>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {groupedPlayers['útočník']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>
            </div>

            {showGreetPrompt && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-indigo-900/90 p-8 rounded-xl border border-indigo-500/30 text-center">
                  <h3 className="text-2xl font-bold text-indigo-300 mb-4">
                    Pozdravit ostatní?
                  </h3>
                  <div className="space-x-4">
                    <button
                      onClick={handleGreet}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Pozdravit
                    </button>
                    <button
                      onClick={() => {
                        setShowGreetPrompt(false);
                        setGameState('locker_room');
                      }}
                      className="bg-gray-500/50 hover:bg-gray-500/70 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Ignorovat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : gameState === 'locker_room' ? (
          <>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8">
              Kabina Lancers
            </h2>
            
            <TeamInteractionButton />

            {/* Dialog pro výběr otázky */}
            {showTeamDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-6 rounded-xl border border-indigo-500/30 max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold text-indigo-300 mb-4">Co chceš říct?</h3>
                  <div className="space-y-2">
                    {questions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionSelect(question)}
                        className="w-full text-left px-4 py-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-white transition-colors"
                      >
                        {question.text}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTeamDialog(false)}
                    className="mt-4 px-4 py-2 bg-gray-500/50 hover:bg-gray-500/70 text-white rounded-lg transition-colors"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            )}

            {/* Seznam událostí (zprávy a odpovědi) */}
            <div className="fixed bottom-4 right-4 max-w-md w-full space-y-2 pointer-events-none z-30">
              {events.slice(-3).map((event, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-white animate-fadeIn ${
                    event.type === 'player_speech' 
                      ? 'bg-indigo-600 ml-12' 
                      : 'bg-gray-600/50 mr-12'
                  }`}
                >
                  {event.text}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Brankáři */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Brankáři <span className="text-sm text-indigo-400">({groupedPlayers['brankář']?.length || 0} / 2)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {groupedPlayers['brankář']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>

              {/* Obránci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Obránci <span className="text-sm text-indigo-400">({groupedPlayers['obránce']?.length || 0} / 6)</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {groupedPlayers['obránce']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>

              {/* Útočníci */}
              <div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">
                  Útočníci <span className="text-sm text-indigo-400">({groupedPlayers['útočník']?.length || 0} / 11)</span>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {groupedPlayers['útočník']?.map((player, index) => (
                    <LockerRoomPlayer key={index} player={player} playerGreetings={playerGreetings} />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-indigo-300">
              Hráči se připravují na zápas...
            </div>

            <TimeControl />
          </>
        ) : (
          <div>Další stavy hry budou následovat...</div>
        )}

        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Zpět
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes greetingBubble {
          0% { opacity: 0; transform: translate(-50%, 10px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }

        @keyframes pulse-button {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes button-glow {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes messageBubble {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }

        .animate-pulse-button {
          animation: pulse-button 2s infinite;
        }

        .animate-button-glow {
          animation: button-glow 3s infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-greetingBubble {
          animation: greetingBubble 3s ease-out forwards;
        }

        .animate-messageBubble {
          animation: messageBubble 4s ease-out forwards;
        }

        /* Stylové scrollbary */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default OldaGameSimulation; 