import React, { useState, useEffect } from 'react';
import { litvinovLancers } from '../data/LitvinovLancers';

const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState({
    period: 1,
    time: 1200, // 20 minut v sekundách
    score: { home: 0, away: 0 },
    events: [],
    isPlaying: true
  });

  const [gameSpeed, setGameSpeed] = useState(1);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generování náhodných událostí
  const generateEvent = (currentTime) => {
    const events = [
      "Střela na branku",
      "Nebezpečná akce",
      "Dobrý zákrok brankáře",
      "Faul",
      "Přihrávka do šance"
    ];

    const players = [
      "Oldřich Štěpanovský",
      "Petr Štěpanovský",
      "Jiří Belinger",
      "Roman Šimek",
      "Václav Matějovič"
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    const player = players[Math.floor(Math.random() * players.length)];
    const isHomeTeam = Math.random() > 0.5;

    // 20% šance na gól při každé události
    const isGoal = Math.random() < 0.2;

    return {
      type: isGoal ? "goal" : "event",
      text: isGoal 
        ? `GÓÓÓL! ${player} skóruje!` 
        : `${event} - ${player}`,
      time: formatTime(1200 - currentTime),
      isHomeTeam,
      id: Date.now()
    };
  };

  // Herní timer
  useEffect(() => {
    if (gameState.isPlaying) {
      const gameTimer = setInterval(() => {
        setGameState(prev => {
          const timeDecrease = gameSpeed;
          const newTime = prev.time - timeDecrease;

          // Generování náhodných událostí
          if (Math.random() < 0.1) { // 10% šance na událost každou sekundu
            const event = generateEvent(newTime);
            const newEvents = [...prev.events];
            newEvents.unshift(event);

            // Aktualizace skóre pokud je to gól
            let newScore = { ...prev.score };
            if (event.type === "goal") {
              if (event.isHomeTeam) {
                newScore.home += 1;
              } else {
                newScore.away += 1;
              }
            }

            if (newTime <= 0) {
              if (prev.period < 3) {
                return {
                  ...prev,
                  period: prev.period + 1,
                  time: 1200,
                  score: newScore,
                  events: newEvents
                };
              } else {
                clearInterval(gameTimer);
                // Zavoláme callback s výsledkem
                if (onGameComplete) {
                  onGameComplete({
                    score: newScore,
                    events: newEvents
                  });
                }
                return {
                  ...prev,
                  isPlaying: false,
                  time: 0,
                  score: newScore,
                  events: newEvents
                };
              }
            }

            return {
              ...prev,
              time: newTime,
              score: newScore,
              events: newEvents
            };
          }

          if (newTime <= 0) {
            if (prev.period < 3) {
              return {
                ...prev,
                period: prev.period + 1,
                time: 1200
              };
            } else {
              clearInterval(gameTimer);
              // Zavoláme callback s výsledkem
              if (onGameComplete) {
                onGameComplete({
                  score: prev.score,
                  events: prev.events
                });
              }
              return {
                ...prev,
                isPlaying: false,
                time: 0
              };
            }
          }

          return {
            ...prev,
            time: newTime
          };
        });
      }, 1000);

      return () => clearInterval(gameTimer);
    }
  }, [gameState.isPlaying, gameSpeed, onGameComplete]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full mx-auto bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-xl p-8 border border-blue-500/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-400 mb-2">Hokej s Oldovou partou</h2>
          <div className="text-xl text-white">
            Oldova parta vs HC Teplice
          </div>
        </div>

        {/* Časomíra a skóre */}
        <div className="bg-black/50 p-6 rounded-xl mb-8">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <img src="/Images/Litvinov_Lancers.png" alt="Oldova parta" className="h-16 object-contain mb-2" />
              <div className="text-white font-bold">Oldova parta</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {gameState.score.home} : {gameState.score.away}
              </div>
              <div className="text-3xl font-mono text-white">
                {formatTime(gameState.time)}
              </div>
              <div className="text-xl text-yellow-200 mt-2">
                {gameState.period}. třetina
              </div>
            </div>
            <div className="text-center">
              <img src="/Images/question_mark.png" alt="HC Teplice" className="h-16 object-contain mb-2" />
              <div className="text-white font-bold">HC Teplice</div>
            </div>
          </div>
        </div>

        {/* Ovládání rychlosti */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 4, 8].map(speed => (
            <button
              key={speed}
              onClick={() => setGameSpeed(speed)}
              className={`px-4 py-2 rounded ${
                gameSpeed === speed
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800/50'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>

        {/* Seznam událostí */}
        <div className="bg-black/30 rounded-xl p-6 max-h-[400px] overflow-y-auto">
          <div className="space-y-2">
            {gameState.events.map(event => (
              <div
                key={event.id}
                className={`p-3 rounded-lg ${
                  event.type === 'goal'
                    ? 'bg-green-900/40 border-l-4 border-green-500'
                    : 'bg-blue-900/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono">{event.time}</span>
                  <span className="text-white">{event.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tlačítko pro návrat */}
        {!gameState.isPlaying && (
          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Zpět do menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OldaGameSimulation; 