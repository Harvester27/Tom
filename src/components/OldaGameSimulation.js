'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers, personalityTypes } from '../data/LitvinovLancers';

const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState('warmup'); // warmup, period1, period2, period3, end
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [currentTime, setCurrentTime] = useState(0); // 0-1200 seconds (20 minutes)
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showPlayerInteraction, setShowPlayerInteraction] = useState(false);
  const [interactingPlayer, setInteractingPlayer] = useState(null);

  // Definice týmů pro zápas
  const homeTeam = {
    name: "Oldova parta",
    players: [
      litvinovLancers.players.find(p => p.name === "Vlastimil" && p.surname === "Nistor"), // brankář
      litvinovLancers.players.find(p => p.name === "Oldřich" && p.surname === "Štěpanovský"), // obránce
      litvinovLancers.players.find(p => p.name === "Roman" && p.surname === "Šimek"), // obránce
      litvinovLancers.players.find(p => p.name === "Václav" && p.surname === "Matějovič"), // útočník
      litvinovLancers.players.find(p => p.name === "Vašek" && p.surname === "Materna"), // útočník
    ]
  };

  const awayTeam = {
    name: "HC Teplice",
    players: Array(5).fill(null) // Protihráči budou generovaní
  };

  // Generování herních událostí
  const generateGameEvents = () => {
    const possibleEvents = [
      {
        type: 'shot',
        description: 'Dostáváš přihrávku od {player}, střílíš na bránu!',
        choices: [
          { text: 'Vystřelit přímo', success: 0.4, relationship: 'neutral' },
          { text: 'Naznačit střelu a vystřelit', success: 0.6, relationship: 'neutral' },
          { text: 'Přihrát zpět na {player}', success: 0.8, relationship: 'assist' }
        ]
      },
      {
        type: 'defense',
        description: 'Soupeř se řítí na naši bránu, jsi poslední obránce!',
        choices: [
          { text: 'Zkusit vypíchnout puk', success: 0.5, relationship: 'neutral' },
          { text: 'Přibrzdit soupeře tělem', success: 0.7, relationship: 'neutral' },
          { text: 'Počkat na pomoc od {player}', success: 0.8, relationship: 'assist' }
        ]
      },
      {
        type: 'pass',
        description: '{player} je volný před bránou!',
        choices: [
          { text: 'Rychle přihrát', success: 0.6, relationship: 'assist' },
          { text: 'Zkusit to sám', success: 0.3, relationship: 'mistake' },
          { text: 'Počkat na lepší pozici', success: 0.4, relationship: 'neutral' }
        ]
      }
    ];

    return possibleEvents.map(event => ({
      ...event,
      player: homeTeam.players[Math.floor(Math.random() * homeTeam.players.length)]
    }));
  };

  // Generování komentářů spoluhráčů podle jejich osobnosti
  const generatePlayerComment = (player, eventResult) => {
    const personality = personalityTypes[player.personality];
    const comments = {
      success: {
        pratelsky: ["Skvělá práce, parťáku! 👍", "To byla paráda! Jen tak dál! 🎉"],
        profesional: ["Dobře odehraná situace.", "Přesně tak se to má hrát."],
        soutezivi: ["Výborně! Takhle je dostaneme! 💪", "To je ono! Ještě pár takových akcí!"],
        mentor: ["Správné rozhodnutí v té situaci.", "Vidíš, jak to funguje, když se hraje hlavou?"],
        samotarsky: ["Dobrý zákrok.", "*přikývne*"],
        vtipkar: ["No ty jsi ale šikula! 😄", "Takhle nějak to učili v hokejové školce? 😉"]
      },
      failure: {
        pratelsky: ["Nevadí, příště to vyjde! 😊", "Hlavně se z toho neposer 😅"],
        profesional: ["Musíme se z toho poučit.", "Příště lépe vyhodnotit situaci."],
        soutezivi: ["Tohle si nemůžeme dovolit!", "Musíme být důraznější! 😤"],
        mentor: ["Pojď, probereme, co šlo udělat jinak.", "Z chyb se člověk učí."],
        samotarsky: ["Hmm...", "*pokrčí rameny*"],
        vtipkar: ["Aspoň že jsi hezkej/hezká! 😂", "I mistr tesař se někdy utne! 😅"]
      }
    };

    const commentType = eventResult ? 'success' : 'failure';
    const possibleComments = comments[commentType][player.personality];
    return possibleComments[Math.floor(Math.random() * possibleComments.length)];
  };

  // Efekt pro simulaci hry
  useEffect(() => {
    if (gameState === 'end') return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + gameSpeed;
        
        // Generování nové události
        if (Math.random() < 0.1 && !currentEvent) {
          const possibleEvents = generateGameEvents();
          setCurrentEvent(possibleEvents[Math.floor(Math.random() * possibleEvents.length)]);
        }

        // Kontrola konce třetiny/zápasu
        if (newTime >= 1200) {
          if (gameState === 'period3') {
            setGameState('end');
            if (onGameComplete) {
              onGameComplete({ score });
            }
          } else {
            setGameState(prev => {
              switch (prev) {
                case 'period1': return 'period2';
                case 'period2': return 'period3';
                default: return prev;
              }
            });
            return 0;
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, gameSpeed, currentEvent]);

  // Formátování času
  const formatGameTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Zpracování volby hráče
  const handleChoice = (choice) => {
    const success = Math.random() < choice.success;
    const eventPlayer = currentEvent.player;

    if (success) {
      if (Math.random() < 0.3) {
        setScore(prev => ({ ...prev, home: prev.home + 1 }));
      }
    } else {
      if (Math.random() < 0.2) {
        setScore(prev => ({ ...prev, away: prev.away + 1 }));
      }
    }

    // Přidání události do historie
    setEvents(prev => [...prev, {
      time: currentTime,
      description: currentEvent.description.replace('{player}', `${eventPlayer.name} ${eventPlayer.surname}`),
      choice: choice.text.replace('{player}', `${eventPlayer.name} ${eventPlayer.surname}`),
      result: success ? 'success' : 'failure'
    }]);

    // Zobrazení reakce spoluhráče
    setInteractingPlayer(eventPlayer);
    setShowPlayerInteraction(true);
    setTimeout(() => setShowPlayerInteraction(false), 3000);

    setCurrentEvent(null);
  };

  // Začátek zápasu
  const startGame = () => {
    setGameState('period1');
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-4xl w-full mx-4 relative">
        {/* Záhlaví */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-400">
            {gameState === 'warmup' ? 'Příprava na zápas' :
             gameState === 'end' ? 'Konec zápasu' :
             `${gameState === 'period1' ? '1.' : gameState === 'period2' ? '2.' : '3.'} třetina`}
          </h2>
          <div className="text-xl font-bold text-white">
            {homeTeam.name} {score.home} : {score.away} {awayTeam.name}
          </div>
          <div className="text-xl font-bold text-indigo-400">
            {formatGameTime(currentTime)}
          </div>
        </div>

        {/* Hlavní obsah */}
        <div className="space-y-6">
          {gameState === 'warmup' ? (
            <div className="text-center space-y-4">
              <p className="text-indigo-200">Jsi připraven na zápas s {awayTeam.name}?</p>
              <button
                onClick={startGame}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >
                Začít zápas
              </button>
            </div>
          ) : gameState === 'end' ? (
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold text-indigo-400">
                Konečný výsledek: {homeTeam.name} {score.home} : {score.away} {awayTeam.name}
              </p>
              <p className="text-indigo-200">
                {score.home > score.away ? 'Gratulujeme k výhře! 🎉' :
                 score.home < score.away ? 'Příště to bude lepší! 💪' :
                 'Dobrá remíza! 🤝'}
              </p>
              <button
                onClick={onBack}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >
                Zpět do města
              </button>
            </div>
          ) : (
            <>
              {/* Aktuální událost */}
              {currentEvent && (
                <div className="bg-black/30 p-6 rounded-xl border border-indigo-500/30 space-y-4">
                  <p className="text-indigo-200">
                    {currentEvent.description.replace('{player}', `${currentEvent.player.name} ${currentEvent.player.surname}`)}
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {currentEvent.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => handleChoice(choice)}
                        className="bg-indigo-500/20 hover:bg-indigo-500/30 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        {choice.text.replace('{player}', `${currentEvent.player.name} ${currentEvent.player.surname}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interakce s hráčem */}
              {showPlayerInteraction && interactingPlayer && (
                <div className="absolute bottom-4 right-4 bg-black/60 p-4 rounded-xl border border-indigo-500/30 flex items-center gap-4 animate-slideUp">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={litvinovLancers.getPlayerPhotoUrl(`${interactingPlayer.name} ${interactingPlayer.surname}`)}
                      alt={`${interactingPlayer.name} ${interactingPlayer.surname}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div>
                    <div className="text-indigo-400 font-bold">
                      {interactingPlayer.name} {interactingPlayer.surname}
                    </div>
                    <div className="text-white">
                      {generatePlayerComment(interactingPlayer, events[events.length - 1]?.result === 'success')}
                    </div>
                  </div>
                </div>
              )}

              {/* Historie událostí */}
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {events.slice(-5).map((event, index) => (
                  <div key={index} className="text-indigo-200/70 text-sm">
                    [{formatGameTime(event.time)}] {event.description} - {event.choice}
                    <span className={event.result === 'success' ? ' text-green-400' : ' text-red-400'}>
                      {event.result === 'success' ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ovládání rychlosti */}
        {gameState !== 'warmup' && gameState !== 'end' && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setGameSpeed(1)}
              className={`px-3 py-1 rounded ${gameSpeed === 1 ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-300'}`}
            >
              1×
            </button>
            <button
              onClick={() => setGameSpeed(2)}
              className={`px-3 py-1 rounded ${gameSpeed === 2 ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-300'}`}
            >
              2×
            </button>
            <button
              onClick={() => setGameSpeed(4)}
              className={`px-3 py-1 rounded ${gameSpeed === 4 ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-300'}`}
            >
              4×
            </button>
          </div>
        )}

        {/* Tlačítko zpět */}
        {gameState !== 'end' && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Zpět
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OldaGameSimulation; 