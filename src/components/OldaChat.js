import React, { useState, useEffect } from 'react';

const OldaChat = () => {
  // Definice dialogových sekvencí
  const dialogSequences = {
    start: {
      message: "Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒",
      options: [
        { 
          text: "Ahoj, to zní dobře! O jakou jde úroveň?", 
          next: "level_question" 
        },
        { 
          text: "Díky za pozvání, ale asi nejsem dost dobrý...", 
          next: "encouragement" 
        },
        { 
          text: "Super, určitě dorazím! 💪", 
          next: "excited_yes" 
        },
        { 
          text: "Díky, ale zítra nemůžu.", 
          next: "decline" 
        }
      ]
    },
    level_question: {
      message: "Je to mix různých úrovní. Máme tam pár kluků z krajského přeboru, ale i začátečníky. Hlavně jde o to si zahrát a pobavit se 😊",
      options: [
        { 
          text: "A kolik vás tam obvykle chodí?", 
          next: "players_count" 
        },
        { 
          text: "To zní fajn, jen nemám moc zkušeností...", 
          next: "encouragement" 
        },
        { 
          text: "Tak jo, zkusím to! V kolik mám dorazit?", 
          next: "time_details" 
        }
      ]
    },
    players_count: {
      message: "Většinou nás je tak 15-20. Hrajeme na dvě lajny, občas i na tři. Každý si pěkně zahraje, nikdo není moc dlouho na střídačce 👍",
      options: [
        { 
          text: "A jaké vybavení potřebuju?", 
          next: "equipment" 
        },
        { 
          text: "Dobře, počítejte se mnou! V kolik tam mám být?", 
          next: "time_details" 
        },
        { 
          text: "Ještě si to rozmyslím...", 
          next: "think_about_it" 
        }
      ]
    },
    encouragement: {
      message: "Vůbec se neboj! Máme tam i úplné začátečníky. Hlavní je chuť hrát. Navíc ti můžu pomoct se základy. Jsem si jistý, že nebudeš nejhorší 😉",
      options: [
        { 
          text: "No... tak dobře, zkusím to!", 
          next: "time_details" 
        },
        { 
          text: "A kolik vás tam chodí?", 
          next: "players_count" 
        },
        { 
          text: "Díky, ale radši ještě potrénuju sám.", 
          next: "maybe_next_time" 
        }
      ]
    },
    excited_yes: {
      message: "Super! Budu rád. Přijď nejlíp v 16:30, ať máš čas se v klidu připravit. Vezmi si tmavý a světlý dres, rozdělíme týmy až na místě 👕",
      options: [
        { 
          text: "Jasně, budu tam! Díky za info.", 
          next: "confirmed" 
        },
        { 
          text: "Ještě se zeptám - jaké vybavení potřebuju?", 
          next: "equipment" 
        }
      ]
    },
    time_details: {
      message: "Přijď v 16:30, ať se v klidu převlečeš a připravíš. Budeme hrát do 18:30. Vezmi si tmavý a světlý dres, týmy uděláme až tam 👍",
      options: [
        { 
          text: "Dobře, díky. A co všechno si mám vzít?", 
          next: "equipment" 
        },
        { 
          text: "Super, budu tam!", 
          next: "confirmed" 
        }
      ]
    },
    equipment: {
      message: "Kompletní hokejovou výstroj (brusle, helma s košíkem, chrániče, hokejka). Pokud ti něco chybí, napiš, něco bych ti půjčil. A nezapomeň na dva dresy - tmavý a světlý 🏒",
      options: [
        { 
          text: "Díky, výstroj mám. Tak v 16:30 na zimáku!", 
          next: "confirmed" 
        },
        { 
          text: "Nemám chrániče ramen, šlo by půjčit?", 
          next: "borrow_equipment" 
        },
        { 
          text: "Asi si radši nejdřív seženu vybavení...", 
          next: "maybe_next_time" 
        }
      ]
    },
    borrow_equipment: {
      message: "Jasně, chrániče ti půjčím! Mám jedny náhradní. Přijď v 16:15, pomůžu ti je nastavit, ať ti sedí 🤝",
      options: [
        { 
          text: "Díky moc! Tak v 16:15 na zimáku.", 
          next: "confirmed" 
        }
      ]
    },
    decline: {
      message: "Škoda! Ale nevadí, hrajeme pravidelně každý týden. Dej vědět, až budeš moct 👍",
      options: [
        { 
          text: "Díky, určitě se někdy přidám!", 
          next: "maybe_next_time" 
        }
      ]
    },
    think_about_it: {
      message: "Jasně, rozmysli si to. Ale neboj, je to fakt v pohodě parta. Kdyžtak napiš do zítřka 😊",
      options: [
        { 
          text: "Dobře, díky. Ozvu se!", 
          next: "maybe_next_time" 
        }
      ]
    },
    maybe_next_time: {
      message: "Dobře, tak třeba příště! Dám ti vědět, až budeme zase hrát 👋",
      options: [
        { 
          text: "Díky, měj se!", 
          next: "end" 
        }
      ]
    },
    confirmed: {
      message: "Super! Už se těším. Kdyby něco, napiš. Jinak se vidíme zítra na zimáku! 🏒💪",
      options: [
        { 
          text: "Díky moc, těším se! Ahoj zítra!", 
          next: "end" 
        }
      ]
    }
  };

  // Načtení historie z localStorage nebo použití výchozí zprávy
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('oldaChatMessages');
    const savedSequence = localStorage.getItem('oldaChatSequence');
    
    if (savedMessages && savedSequence) {
      return JSON.parse(savedMessages);
    }
    
    return [{
      id: 1,
      sender: 'Olda',
      text: "Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒",
      time: '08:00',
      read: false
    }];
  });

  // Načtení aktuální sekvence z localStorage nebo použití 'start'
  const [currentSequence, setCurrentSequence] = useState(() => {
    const savedSequence = localStorage.getItem('oldaChatSequence');
    return savedSequence || 'start';
  });

  const [showOptions, setShowOptions] = useState(() => {
    const savedSequence = localStorage.getItem('oldaChatSequence');
    return savedSequence !== 'end';
  });
  
  const [isTyping, setIsTyping] = useState(false);

  // Ukládání zpráv do localStorage při každé změně
  useEffect(() => {
    localStorage.setItem('oldaChatMessages', JSON.stringify(messages));
  }, [messages]);

  // Ukládání aktuální sekvence do localStorage
  useEffect(() => {
    localStorage.setItem('oldaChatSequence', currentSequence);
  }, [currentSequence]);

  const handleOptionSelect = (option) => {
    // Přidání odpovědi hráče
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'Player',
      text: option.text,
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      read: true
    }]);

    setShowOptions(false);
    setIsTyping(true);

    // Simulace psaní Oldy
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'Olda',
        text: dialogSequences[option.next].message,
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        read: false
      }]);
      
      if (option.next !== 'end') {
        setCurrentSequence(option.next);
        setShowOptions(true);
      } else {
        setShowOptions(false);
      }
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id}
            className={`flex ${message.sender === 'Player' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              message.sender === 'Player' 
                ? 'bg-indigo-600 text-white rounded-t-2xl rounded-l-2xl' 
                : 'bg-white/10 text-white rounded-t-2xl rounded-r-2xl'
            } p-3 shadow-lg`}>
              <div className="text-sm">{message.text}</div>
              <div className="text-xs mt-1 opacity-70">{message.time}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white rounded-t-2xl rounded-r-2xl p-3 shadow-lg">
              <div className="flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response options */}
      {showOptions && currentSequence !== 'end' && (
        <div className="p-4 bg-indigo-950/50 space-y-2">
          {dialogSequences[currentSequence].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              className="w-full text-left px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {option.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OldaChat; 