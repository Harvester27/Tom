'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { litvinovLancers, personalityTypes } from '../data/LitvinovLancers';
import OldaHockeyMatch from './OldaHockeyMatch';

// --- Nová komponenta pro okno konverzace ---
const ConversationWindow = ({ history }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [history]); // Scroll down whenever history changes

  if (history.length === 0) {
    return null; // Nezobrazuj okno, pokud je prázdné
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900/90 via-indigo-950/90 to-black/90 border border-indigo-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
      <div className="p-3 bg-indigo-800/80 border-b border-indigo-500/30">
        <h3 className="text-lg font-semibold text-indigo-200 text-center">Konverzace v kabině</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-indigo-900/50">
        {history.map((message, index) => (
          <div key={index}>
            {message.type === 'user_question' && (
              <div className="flex justify-end">
                <div className="bg-blue-600/70 p-3 rounded-lg max-w-[80%]">
                  <p className="text-sm text-white font-semibold mb-1">Ty:</p>
                  <p className="text-sm text-blue-100">{message.text}</p>
                </div>
              </div>
            )}
            {message.type === 'player_response' && (
              <div className="flex items-start gap-3 animate-fadeInSlideUp" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-500/50 mt-1">
                  <Image
                    src={litvinovLancers.getPlayerPhotoUrl(message.playerId)}
                    alt={message.playerId}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized={true}
                  />
                </div>
                <div className="flex-1 bg-indigo-800/60 p-3 rounded-lg">
                  <p className="text-sm font-bold text-indigo-300 mb-1">{message.playerId}</p>
                  <p className="text-sm text-white/95">{message.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
// --- Konec komponenty ConversationWindow ---


const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState('enter'); // 'enter', 'greeting', 'locker_room', 'game'
  const [currentTime, setCurrentTime] = useState(16 * 60 + 30); // 16:30 v minutách
  const [gameSpeed, setGameSpeed] = useState(1);
  // const [events, setEvents] = useState([]); // Poznámka: 'events' se aktuálně nepoužívá, zvážit odstranění
  // const [currentEvent, setCurrentEvent] = useState(null); // Poznámka: 'currentEvent' se aktuálně nepoužívá, zvážit odstranění
  // const [showPlayerInteraction, setShowPlayerInteraction] = useState(false); // Poznámka: Nyní řešeno přes ConversationWindow
  // const [interactingPlayer, setInteractingPlayer] = useState(null); // Poznámka: Nyní řešeno přes ConversationWindow
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [showGreetPrompt, setShowGreetPrompt] = useState(true);
  const [playerGreetings, setPlayerGreetings] = useState({});
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  // const [usedDialogOptions, setUsedDialogOptions] = useState(new Set()); // Poznámka: Tato logika (s teamDialogOptions) se zdá být oddělená od 'questions', používáme jen 'questions'
  const [selectedQuestion, setSelectedQuestion] = useState(null); // Stále potřeba pro logiku otázek
  const [activePlayers, setActivePlayers] = useState([]);
  // const [selectedTeam, setSelectedTeam] = useState(null); // Poznámka: 'selectedTeam' se aktuálně nepoužívá, zvážit odstranění

  // --- Nový stav pro historii konverzace ---
  const [conversationHistory, setConversationHistory] = useState([]);

  // Přidám state pro použité otázky
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  // Možnosti promluvy k týmu (ponecháno, ale aktuálně se používá 'questions' níže)
  // const teamDialogOptions = [ ... ];

  // Definice otázek a odpovědí (beze změny)
  const questions = [
    {
      id: 'dresy',
      text: "Jaký dres si mám vzít? Světlý nebo tmavý?",
      getResponses: (activePlayers) => {
        const olda = activePlayers.find(p => p.name === "Oldřich" && p.surname === "Štěpanovský") || { name: 'Oldřich', surname: 'Štěpanovský' }; // Záloha, kdyby Olda nebyl aktivní
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        const shuffledJokers = jokers.sort(() => Math.random() - 0.5);
        const firstJoker = shuffledJokers[0];
        const secondJoker = shuffledJokers[1];

        const responses = [
          { playerId: `${olda.name} ${olda.surname}`, text: "Hele, to si ještě rozmyslím. Uvidíme, kolik nás přijde a jak to rozdělíme... 🤔", delay: 500 }
        ];
        if (firstJoker) responses.push({ playerId: `${firstJoker.name} ${firstJoker.surname}`, text: "Klasika! Olda si to rozmyslí až na ledě, jako vždycky. Jednou jsme čekali tak dlouho, že jsme málem hráli všichni proti mantinelu! 😂", delay: 2000 });
        if (secondJoker) responses.push({ playerId: `${secondJoker.name} ${secondJoker.surname}`, text: "To je pravda! A minule jsme se přeřazovali ještě v polovině zápasu, protože Olda zjistil, že má jeden tým samé rychlíky! 🏃‍♂️💨", delay: 3500 });
        responses.push({ playerId: `${olda.name} ${olda.surname}`, text: "No jo no... Ale vždycky z toho byl nakonec super hokej, ne? 😅 Vem si oba dresy, ať můžeš případně přebíhat.", delay: 5000 });
        return responses;
      }
    },
    {
      id: 'humble',
      text: "Hoši, buďte na mě hodní, dlouho jsem na tom nestál...",
      getResponses: (activePlayers) => {
        const mentor = activePlayers.find(p => p.personality === "mentor");
        const jokers = activePlayers.filter(p => p.personality === "vtipkar");
        const joker = jokers[Math.floor(Math.random() * jokers.length)];
        const friendly = activePlayers.find(p => p.personality === "pratelsky");
        const responses = [];
        if (mentor) responses.push({ playerId: `${mentor.name} ${mentor.surname}`, text: "Neboj se, každý někdy začínal. Pomůžeme ti se do toho dostat. Hlavně se soustřeď na základy a užij si to! 👊", delay: 500 });
        if (friendly) responses.push({ playerId: `${friendly.name} ${friendly.surname}`, text: "Jasně, v pohodě! Jsme tu od toho, abychom si zahráli a pobavili se. Nikdo tě soudit nebude. 😊", delay: 2000 });
        if (joker) responses.push({ playerId: `${joker.name} ${joker.surname}`, text: "Hele, já jsem minule spadl tak šikovně, že jsem si málem dal vlastňáka... a to hraju pravidelně! Takže klídek. 😂", delay: 3500 });
        return responses;
      }
    },
    {
        id: 'positive',
        text: "Doufám, že si dobře zahrajeme!",
        getResponses: (activePlayers) => {
          const jokers = activePlayers.filter(p => p.personality === "vtipkar");
          const shuffledJokers = jokers.sort(() => Math.random() - 0.5);
          const firstJoker = shuffledJokers[0];
          const secondJoker = shuffledJokers[1];
          const friendly = activePlayers.find(p => p.personality === "pratelsky");
          const responses = [];
          if(friendly) responses.push({ playerId: `${friendly.name} ${friendly.surname}`, text: "To si piš! Hlavně v klidu a s úsměvem. 😊", delay: 500})
          if (firstJoker) responses.push({ playerId: `${firstJoker.name} ${firstJoker.surname}`, text: "To si piš! Hlavně se drž u mantinelu, ať tě nepřejedeme jako minule Frantu! Ten se pak týden nemohl posadit! 😂", delay: 1500 });
          if (secondJoker) responses.push({ playerId: `${secondJoker.name} ${secondJoker.surname}`, text: "Jo, a když budeš mít štěstí, možná ti i nahraju! Teda... pokud trefím... Minule jsem nahrál rozhodčímu a ten se tak lekl, že odpískal faul sám na sebe! 🤣", delay: 3000 });
          return responses;
        }
      },
      {
        id: 'nervous',
        text: "Jsem trochu nervózní...",
        getResponses: (activePlayers) => {
          const mentor = activePlayers.find(p => p.personality === "mentor");
          const friendly = activePlayers.find(p => p.personality === "pratelsky");
          const jokers = activePlayers.filter(p => p.personality === "vtipkar");
          const joker = jokers[Math.floor(Math.random() * jokers.length)];
          const responses = [];
          if (mentor) responses.push({ playerId: `${mentor.name} ${mentor.surname}`, text: "Každý začátek je těžký, ale neboj. Drž se v obraně, přihrávej volným spoluhráčům a hlavně si to užij! 💪", delay: 500 });
          if (friendly) responses.push({ playerId: `${friendly.name} ${friendly.surname}`, text: "Klídek, jsme tu všichni kamarádi. Nikdo tě za nic kritizovat nebude, hlavně si zahrajeme a pobavíme se! 😊", delay: 2000 });
          if (joker) responses.push({ playerId: `${joker.name} ${joker.surname}`, text: "Nervózní? Počkej až uvidíš Frantu v bráně, ten je tak nervózní, že minule chytal puky i když jsme byli na střídačce! 🤣", delay: 3500 });
          return responses;
        }
      },
      {
        id: 'teams',
        text: "Rozdělíme týmy?",
        getResponses: (activePlayers) => {
          const olda = activePlayers.find(p => p.name === "Oldřich" && p.surname === "Štěpanovský") || { name: 'Oldřich', surname: 'Štěpanovský' };
          const responses = [];
          
          // Olda navrhne rozdělení
          responses.push({ 
            playerId: `${olda.name} ${olda.surname}`, 
            text: "Dobře, tak já to rozdělím. Bílí: Franta, Pepa, Jirka a já. Černí: Honza, Karel, Tomáš a Martin. Co vy na to? 🤔", 
            delay: 500 
          });

          // Náhodně vybereme 2-3 hráče pro reakce
          const availablePlayers = activePlayers.filter(p => 
            p.name !== "Oldřich" || p.surname !== "Štěpanovský"
          );
          const shuffledPlayers = availablePlayers.sort(() => Math.random() - 0.5);
          const respondingPlayers = shuffledPlayers.slice(0, Math.floor(Math.random() * 2) + 2);

          // Různé typy reakcí podle osobnosti hráče
          respondingPlayers.forEach((player, index) => {
            const delay = 1500 + (index * 1500);
            
            if (player.personality === "vtipkar") {
              responses.push({
                playerId: `${player.name} ${player.surname}`,
                text: "Tak to zase prohrajeme! 😅 Oldo, ty si vždycky vybereš ty nejlepší do týmu...",
                delay
              });
            } else if (player.personality === "mentor") {
              responses.push({
                playerId: `${player.name} ${player.surname}`,
                text: "Co dát Honzu k nám? On dobře spolupracuje s Pepou v útoku. 🤝",
                delay
              });
            } else if (player.personality === "pratelsky") {
              responses.push({
                playerId: `${player.name} ${player.surname}`,
                text: "Hlavně ať si zahrajeme, složení je fajn! 👍",
                delay
              });
            } else {
              responses.push({
                playerId: `${player.name} ${player.surname}`,
                text: "Nezdá se vám, že mají černí silnější útok? 🤔",
                delay
              });
            }
          });

          // Olda reaguje na připomínky
          const shouldChange = Math.random() > 0.5;
          if (shouldChange) {
            responses.push({
              playerId: `${olda.name} ${olda.surname}`,
              text: "Hmm, máte pravdu. Tak to prohodíme - Honza půjde k bílým a Pepa k černým. Teď by to mělo být vyrovnanější! 👌",
              delay: responses.length * 1500 + 500
            });
          } else {
            responses.push({
              playerId: `${olda.name} ${olda.surname}`,
              text: "Nebojte, ono se to během hry vyrovná. Navíc po polovině můžeme prohodit týmy, kdyby to bylo jednostranný. 😉",
              delay: responses.length * 1500 + 500
            });
          }

          return responses;
        }
      }
    // Další otázky můžeme přidat později
  ];

   // Funkce pro kontrolu, zda lze ještě mluvit (ponechána, i když usedDialogOptions není hlavní mechanismus)
   // const canStillTalk = () => { ... };

  // Funkce pro zpracování výběru promluvy (ponechána, i když se primárně používá handleQuestionSelect)
  // const handleTeamDialog = (option) => { ... };


  // --- Upravená Funkce pro zpracování výběru otázky ---
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setShowTeamDialog(false);
    
    // Přidám otázku do použitých
    setUsedQuestions(prev => new Set([...prev, question.id]));

    // 1. Přidáme otázku uživatele do historie
    setConversationHistory(prev => [...prev, {
      type: 'user_question',
      text: question.text,
      timestamp: Date.now()
    }]);

    // Získáme odpovědi pro aktuální sestavu hráčů
    const responses = question.getResponses(activePlayers);

    // 2. Postupně přidáváme odpovědi hráčů do historie
    responses.forEach((response) => {
      setTimeout(() => {
        setConversationHistory(prev => [...prev, {
          type: 'player_response',
          playerId: response.playerId,
          text: response.text,
          timestamp: Date.now()
        }]);
      }, response.delay);
    });
  };


  // Funkce pro náhodný výběr hráčů (beze změny)
  // const selectPlayersByChance = (players) => { ... };
  // Funkce pro zajištění minimálního počtu hráčů (beze změny)
  // const ensureMinimumPlayers = (selectedPlayers, allPlayers, minCount, position) => { ... };
  // Funkce pro omezení maximálního počtu hráčů (beze změny)
  // const limitMaxPlayers = (players, maxCount) => { ... };

  // Výběr aktivních hráčů (beze změny)
  useEffect(() => {
    const activePlayersList = litvinovLancers.players.filter(
      player => player.attendance >= 75
    );
    setActivePlayers(activePlayersList);
  }, []);

  // Rozdělení hráčů podle pozic (beze změny)
  // const groupedPlayers = ...

  // Formátování času (beze změny)
  const formatGameTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Efekt pro simulaci času v kabině (beze změny)
  useEffect(() => {
    // ... (kód pro časovač)
  }, [gameState, gameSpeed]);

  // Funkce pro získání náhodného pozdravu (beze změny)
  const getRandomGreeting = () => {
    const greetings = [ "Ahoj! 👋", "Čau! 😊", "Nazdar! 💪", "Vítej! 🏒", "Zdravím! 👍", "Čus! 😄", "Ahoj, vítej mezi námi! 🤝", "Čau, rád tě poznávám! 😊", "Nazdar, nová posilo! 💪" ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Funkce pro zpracování pozdravu od hráče (beze změny)
  const handleGreet = () => {
    setHasGreeted(true);
    setShowGreetPrompt(false);
    const vsichniHraci = [...activePlayers];
    const zamichaniHraci = vsichniHraci.sort(() => Math.random() - 0.5);
    const pocetSkupin = Math.max(1, Math.min(5, Math.ceil(zamichaniHraci.length / 4))); // Dynamičtější počet skupin
    const hraci_ve_skupine = Math.ceil(zamichaniHraci.length / pocetSkupin);

    let maxDelay = 0;

    for (let i = 0; i < pocetSkupin; i++) {
        const skupina = zamichaniHraci.slice(i * hraci_ve_skupine, (i + 1) * hraci_ve_skupine);
        const baseDelay = i * 500; // 500ms mezi skupinami

        skupina.forEach(player => {
            const randomOffset = Math.random() * 300; // Menší náhodný rozptyl
            const delay = baseDelay + randomOffset;
            maxDelay = Math.max(maxDelay, delay + 1500); // Sledujeme maximální delay pro přechod

            setTimeout(() => {
                setPlayerGreetings(prev => ({ ...prev, [`${player.name}${player.surname}`]: getRandomGreeting() }));
                setTimeout(() => {
                    setPlayerGreetings(prev => {
                        const newGreetings = { ...prev };
                        delete newGreetings[`${player.name}${player.surname}`];
                        return newGreetings;
                    });
                }, 1500); // Doba zobrazení pozdravu
            }, delay);
        });
    }

    // Přejdeme do stavu locker_room až po posledním pozdravu
    setTimeout(() => {
      setGameState('locker_room');
    }, maxDelay + 200); // Malá rezerva
  };


  // Komponenta pro zobrazení hráče v kabině (beze změny)
  const LockerRoomPlayer = ({ player, playerGreetings }) => {
    const greeting = playerGreetings[`${player.name}${player.surname}`];
    return (
      <div className={`relative flex items-center gap-4 bg-black/30 p-3 rounded-xl hover:bg-black/40 transition-colors ${player.name === "Oldřich" && player.surname === "Štěpanovský" ? 'border-2 border-yellow-500/50' : ''}`}>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/50">
          <Image src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)} alt={player.name} width={48} height={48} className="w-full h-full object-cover" unoptimized={true}/>
        </div>
        <div>
          <div className="text-base font-bold text-white">{player.name} {player.surname}<span className="ml-2 text-xs text-indigo-400">({player.attendance}%)</span></div>
          <div className="text-sm text-indigo-300">{player.position.charAt(0).toUpperCase() + player.position.slice(1)}<span className="mx-2">•</span>{personalityTypes[player.personality].name}</div>
        </div>
        {greeting && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-xl message-bubble whitespace-normal max-w-[250px] text-sm z-10">
            {greeting}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  // Komponenta pro ovládání času (beze změny)
  // const TimeControl = () => { ... };

  // Komponenta pro tlačítko interakce s týmem (beze změny)
  // const TeamInteractionButton = () => { ... };

  // Funkce pro vstup do kabiny (beze změny)
  const enterLockerRoom = () => {
    setGameState('greeting');
    handleGreet();
  };

  // Do state přidám nový stav pro hokejový zápas
  const [showHockeyMatch, setShowHockeyMatch] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center font-sans"> {/* Přidán font-sans pro konzistenci */}
      <div className="w-full max-w-[95vw] mx-auto p-4 md:p-8"> {/* Responzivní padding */}

        {/* Úvodní obrazovka */}
        {gameState === 'enter' && (
          <div className="text-center space-y-8 animate-fadeInSlideUp">
            <h2 className="text-4xl font-bold text-indigo-400">Vstup do kabiny</h2>
            <p className="text-xl text-indigo-300">Oldova parta už na tebe čeká!</p>
            <button
              onClick={enterLockerRoom}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-xl font-bold transition-colors shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105"
            >
              Vstoupit do kabiny
            </button>
          </div>
        )}

        {/* Kabina (pozdravy a hlavní stav) */}
        {(gameState === 'greeting' || gameState === 'locker_room') && (
          <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-6 md:p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm relative animate-fadeInSlideUp">
            {/* Hlavička kabiny */}
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button
                onClick={onBack}
                className="bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                ← Zpět
              </button>
              <h2 className="text-2xl md:text-3xl font-bold text-indigo-400 text-center">Kabina Oldovy party</h2>
              <button
                onClick={() => setShowHockeyMatch(true)}
                className="bg-green-500/50 hover:bg-green-500/70 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <span>🏒</span>
                Jít na led
              </button>
            </div>

            {/* Nový layout - grid s hráči vlevo a konverzací vpravo */}
            <div className="flex gap-8 h-[70vh]">
              {/* Levá část - hráči */}
              <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                {/* Brankáři */}
                {activePlayers.filter(p => p.position === 'brankář').length > 0 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-indigo-300 mb-3 md:mb-4 border-b border-indigo-700/50 pb-2">Brankáři</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activePlayers.filter(player => player.position === 'brankář').map((player) => (
                        <LockerRoomPlayer key={`${player.name}-${player.surname}`} player={player} playerGreetings={playerGreetings} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Obránci */}
                {activePlayers.filter(p => p.position === 'obránce').length > 0 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-indigo-300 mb-3 md:mb-4 border-b border-indigo-700/50 pb-2">Obránci</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activePlayers.filter(player => player.position === 'obránce').map((player) => (
                        <LockerRoomPlayer key={`${player.name}-${player.surname}`} player={player} playerGreetings={playerGreetings} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Útočníci */}
                {activePlayers.filter(p => p.position === 'útočník').length > 0 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-indigo-300 mb-3 md:mb-4 border-b border-indigo-700/50 pb-2">Útočníci</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activePlayers.filter(player => player.position === 'útočník').map((player) => (
                        <LockerRoomPlayer key={`${player.name}-${player.surname}`} player={player} playerGreetings={playerGreetings} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pravá část - konverzace */}
              <div className="w-[400px] relative">
                <ConversationWindow history={conversationHistory} />
              </div>
            </div>

            {/* Tlačítko pro interakci s týmem */}
            {gameState === 'locker_room' && (
              <button
                onClick={() => setShowTeamDialog(true)}
                className="fixed bottom-4 left-4 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg
                          transition-all duration-300 transform hover:scale-110 z-30 flex items-center gap-2"
                title="Promluvit s týmem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden md:inline">Promluvit</span>
              </button>
            )}

            {/* Modální okno pro výběr otázky */}
            {showTeamDialog && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowTeamDialog(false)}>
                <div className="bg-gradient-to-br from-indigo-950 via-gray-900 to-indigo-950 p-6 rounded-xl border border-indigo-500/40 max-w-lg w-[90%] mx-auto shadow-2xl animate-fadeInSlideUp" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-indigo-300 mb-5 text-center">Co chceš říct nebo se zeptat?</h3>
                  <div className="space-y-3">
                    {questions
                      .filter(question => !usedQuestions.has(question.id)) // Filtrujeme použité otázky
                      .map((question) => (
                        <button
                          key={question.id}
                          onClick={() => handleQuestionSelect(question)}
                          className="w-full text-left px-4 py-3 rounded-lg bg-indigo-700/40 hover:bg-indigo-600/60 text-indigo-100 hover:text-white transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          {question.text}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setShowTeamDialog(false)}
                    className="mt-6 w-full px-4 py-2 bg-gray-600/50 hover:bg-gray-500/70 text-gray-200 rounded-lg transition-colors"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Herní stav (placeholder) */}
        {gameState === 'game' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-indigo-400 mb-8">Zápas s Oldovou partou</h2>
            <p className="text-xl text-indigo-300">Připravuje se zápas...</p>
            {/* Okno konverzace můžeme zobrazit i zde, pokud chceme */}
            <ConversationWindow history={conversationHistory} />
          </div>
        )}
      </div>

      {/* Globální styly a animace */}
      <style jsx global>{`
        /* Základní styly pro scrollbar (pro Webkit prohlížeče) */
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: var(--scrollbar-track-bg, rgba(79, 70, 229, 0.1)); /* fallback: indigo-900/50 */
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb-bg, #6366f1); /* fallback: indigo-500 */
          border-radius: 10px;
          border: 2px solid var(--scrollbar-track-bg, rgba(79, 70, 229, 0.1));
        }
        /* Styly pro Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb-bg, #6366f1) var(--scrollbar-track-bg, rgba(79, 70, 229, 0.1));
        }

        /* Definice proměnných pro Tailwind třídy */
        :root {
          --scrollbar-track-bg: rgba(49, 46, 129, 0.5); /* bg-indigo-900/50 */
          --scrollbar-thumb-bg: #4f46e5; /* bg-indigo-600 */
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px) scale(0.95); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          90% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }

        .message-bubble {
          animation: fadeInOut 1.5s ease-in-out forwards;
          transform-origin: bottom center;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes fadeInSlideUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeInSlideUp {
          opacity: 0; /* Start hidden */
          animation: fadeInSlideUp 0.4s ease-out forwards;
          will-change: transform, opacity;
        }

        /* Tooltip pro tlačítko Promluvit (jen pro demonstraci, lze použít knihovnu) */
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          left: 110%; /* Position to the right */
          top: 50%;
          transform: translateY(-50%);
          white-space: nowrap;
          background-color: #1f2937; /* gray-800 */
          color: #e5e7eb; /* gray-200 */
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          z-index: 100; /* Ensure it's above other elements */
        }

      `}</style>

      {/* Před koncem komponenty přidám podmíněné renderování zápasu */}
      {showHockeyMatch && (
        <OldaHockeyMatch
          onBack={() => setShowHockeyMatch(false)}
          onGameComplete={(result) => {
            setShowHockeyMatch(false);
            if (onGameComplete) {
              onGameComplete(result);
            }
          }}
        />
      )}
    </div>
  );
};

export default OldaGameSimulation;