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
  const [unlockedCards, setUnlockedCards] = useState(new Set());
  const [showCollection, setShowCollection] = useState(false);
  const [currentCards, setCurrentCards] = useState([]);
  const [confetti, setConfetti] = useState([]);
  
  const cards = [
    { id: 1, name: "Štěpánovský", image: "/Images/Stepanovsky1.jpg", rarity: "common" },
    { id: 2, name: "Nováková", image: "/Images/Novakova1.jpg", rarity: "common" },
    { id: 3, name: "Coufal", image: "/Images/Coufal3.jpg", rarity: "legendary" },
    { id: 4, name: "Dlugopolský", image: "/Images/Dlugopolsky1.jpg", rarity: "rare" },
    { id: 5, name: "Petrov", image: "/Images/Petrov1.jpg", rarity: "common" },
    { id: 6, name: "Nistor", image: "/Images/Nistor1.jpg", rarity: "rare" },
    { id: 7, name: "Materna", image: "/Images/Materna1.jpg", rarity: "epic" }
  ];

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
    const availableCards = cards.filter(card => !unlockedCards.has(card.id));
    if (availableCards.length === 0) {
      alert('Všechny karty jsou již odemčené!');
      return;
    }

    const drawnCards = [];
    const maxCards = Math.min(size, availableCards.length);
    
    for (let i = 0; i < maxCards; i++) {
      const remainingCards = availableCards.filter(card => !drawnCards.includes(card));
      const randomCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
      drawnCards.push(randomCard);
    }

    setCurrentCards(drawnCards);
    createConfetti();
  };

  const collectCards = () => {
    if (currentCards.length > 0) {
      setUnlockedCards(prev => new Set([...prev, ...currentCards.map(card => card.id)]));
      setCurrentCards([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
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
      `}</style>

      {confetti.map((particle) => (
        <ConfettiParticle key={particle.id} color={particle.color} />
      ))}

      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">Sbírka karet</h1>
          <p className="text-white text-xl">
            Získáno: {unlockedCards.size} / {cards.length}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {!showCollection ? (
            <>
              {[3, 5, 7].map((packSize) => (
                <div
                  key={packSize}
                  className="transform transition-transform hover:scale-105 active:scale-95"
                  onClick={() => openPack(packSize)}
                >
                  <div className="cursor-pointer bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-yellow-500 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-yellow-400 text-center">
                      Balíček {packSize} karet
                    </h3>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="transform transition-opacity opacity-100"
                >
                  <div className={`
                    relative overflow-hidden rounded-lg
                    ${unlockedCards.has(card.id) 
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-700' 
                      : 'bg-zinc-800'}
                  `}>
                    <div className="p-4">
                      {unlockedCards.has(card.id) ? (
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-64 object-contain rounded"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center text-4xl text-gray-500">
                          ?
                        </div>
                      )}
                      <h3 className="mt-4 text-center text-white font-bold">
                        {card.name}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {currentCards.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap justify-center gap-4">
                {currentCards.map(card => (
                  <div key={card.id} className="w-40 transform transition-all duration-300 hover:scale-105">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-xl">
                      <div className="p-3">
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-56 object-contain rounded"
                        />
                        <h3 className="mt-2 text-lg font-bold text-white text-center">
                          {card.name}
                        </h3>
                        <div className="mt-1 text-sm text-yellow-200 text-center">
                          {card.rarity}
                        </div>
                      </div>
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

        <div className="fixed top-4 right-4">
          <button
            onClick={() => setShowCollection(!showCollection)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
          >
            {showCollection ? 'Zpět na balíčky' : 'Zobrazit sbírku'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardGame;