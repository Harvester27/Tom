'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { litvinovLancers, personalityTypes } from '../data/LitvinovLancers';

const OldaGameSimulation = ({ onBack, onGameComplete }) => {
  const [gameState, setGameState] = useState('locker_room'); // locker_room, warmup, period1, period2, period3, end
  const [currentTime, setCurrentTime] = useState(16 * 60 + 30); // 16:30 v minutách
  const [gameSpeed, setGameSpeed] = useState(1);
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showPlayerInteraction, setShowPlayerInteraction] = useState(false);
  const [interactingPlayer, setInteractingPlayer] = useState(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [activePlayers] = useState(() => {
    // Získáme všechny aktivní hráče (s attendance > 70)
    return litvinovLancers.getActivePlayers(70);
  });

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
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, gameSpeed]);

  // Komponenta pro zobrazení hráče v kabině
  const LockerRoomPlayer = ({ player }) => (
    <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl hover:bg-black/40 transition-colors">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50">
        <Image
          src={litvinovLancers.getPlayerPhotoUrl(`${player.name} ${player.surname}`)}
          alt={player.name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          unoptimized={true}
        />
      </div>
      <div>
        <div className="text-lg font-bold text-white">
          {player.name} {player.surname}
        </div>
        <div className="text-sm text-indigo-300">
          {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
          <span className="mx-2">•</span>
          {personalityTypes[player.personality].name}
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-6xl w-full mx-4 relative">
        {gameState === 'locker_room' ? (
          <>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent mb-8">
              Kabina Lancers
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-4">
              {activePlayers.map((player, index) => (
                <LockerRoomPlayer key={index} player={player} />
              ))}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-indigo-300">
              Hráči se připravují na zápas...
            </div>

            <TimeControl />

            <button
              onClick={onBack}
              className="absolute top-4 left-4 bg-indigo-500/50 hover:bg-indigo-500/70 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Zpět
            </button>
          </>
        ) : (
          // ... zbytek kódu pro ostatní stavy hry ...
          <div>Další stavy hry budou následovat...</div>
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