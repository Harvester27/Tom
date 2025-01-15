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
  const [money, setMoney] = useState(100);
  
  const cards = [
    { id: 1, name: "Štěpánovský", image: "/Images/Stepanovsky1.jpg", rarity: "common" },
    { id: 2, name: "Nováková", image: "/Images/Novakova1.jpg", rarity: "common" },
    { id: 3, name: "Coufal", image: "/Images/Coufal3.jpg", rarity: "legendary" },
    { id: 4, name: "Dlugopolský", image: "/Images/Dlugopolsky1.jpg", rarity: "rare" },
    { id: 5, name: "Petrov", image: "/Images/Petrov1.jpg", rarity: "common" },
    { id: 6, name: "Nistor", image: "/Images/Nistor1.jpg", rarity: "rare" },
    { id: 7, name: "Materna", image: "/Images/Materna1.jpg", rarity: "epic" }
  ];

  const packPrices = {
    3: 30,
    5: 50,
    7: 70
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
    if (money < packPrices[size]) {
      alert('Nemáte dostatek peněz!');
      return;
    }

    const availableCards = cards.filter(card => !unlockedCards.has(card.id));
    if (availableCards.length === 0) {
      alert('Všechny karty jsou již odemčené!');
      return;
    }

    setMoney(prev => prev - packPrices[size]);
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

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Sbírka karet</h1>
          <p className="text-white text-xl mb-2">
            Získáno: {unlockedCards.size} / {cards.length}
          </p>
          <p className="text-white text-xl">
            Peníze: {money} Kč
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center mb-8">
          {!showCollection ? (
            <>
              {[3, 5, 7].map((packSize) => (
                <div
                  key={packSize}
                  className="transform transition-transform hover:scale-105 active:scale-95"
                  onClick={() => openPack(packSize)}
                >
                  <div className="cursor-pointer bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-yellow-500 rounded-lg p-4 w-64">
                    <img
                      src="/Images/LancersBalicek.jpg"
                      alt={`Balíček ${packSize} karet`}
                      className="w-full h-64 object-contain mb-3"
                    />
                    <h3 className="text-xl font-bold text-yellow-400 text-center mb-1">
                      Balíček {packSize} karet
                    </h3>
                    <p className="text-white text-center">
                      Cena: {packPrices[packSize]} Kč
                    </p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <div className={`
                    relative overflow-hidden rounded-lg shadow-xl
                    ${unlockedCards.has(card.id) 
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 p-0.5' 
                      : 'bg-zinc-800 p-0.5'}
                  `}>
                    {unlockedCards.has(card.id) ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-56 object-contain rounded"
                      />
                    ) : (
                      <div className="w-full h-56 flex items-center justify-center text-4xl text-gray-500">
                        ?
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

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