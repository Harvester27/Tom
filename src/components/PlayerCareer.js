'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import OldaChat from './OldaChat';
import { litvinovLancers } from '../data/LitvinovLancers';

// Helper function for initial state
function getInitialConversationsState() {
  return [
    {
      id: 'olda',
      name: 'Olda Trenér',
      avatar: litvinovLancers.getPlayerPhotoUrl('Oldřich Štěpanovský'), // Generuje lowercase
      unread: 1, // Start with 1 unread
      lastMessage: 'Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒',
      time: '08:00',
      messages: [
        {
          id: 1,
          sender: 'Olda',
          text: 'Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒',
          time: '08:00',
          read: false
        }
      ]
    },
    {
      id: 'doktor',
      name: 'Doktor Novák',
      avatar: '👨‍⚕️',
      unread: 0,
      lastMessage: 'Výsledky vypadají dobře',
      time: 'včera',
      messages: [
        {
          id: 1,
          sender: 'Doktor',
          text: 'Výsledky vypadají dobře',
          time: 'včera',
          read: true
        }
      ]
    }
  ];
}

// Pomocné funkce pro kontrolu data a času
const isHockeyPracticeDay = (currentDate, hockeyPractice) => {
  if (!hockeyPractice || !hockeyPractice.date) {
    console.log('🏒 isHockeyPracticeDay - chybí data:', { hockeyPractice });
    return false;
  }
  
  const practiceDate = new Date(hockeyPractice.date);
  
  // Porovnání bez časové zóny
  const isSameDay = currentDate.getDate() === practiceDate.getDate() &&
                   currentDate.getMonth() === practiceDate.getMonth() &&
                   currentDate.getFullYear() === practiceDate.getFullYear();

  console.log('🏒 isHockeyPracticeDay - porovnání:', {
    currentDate: `${currentDate.getDate()}.${currentDate.getMonth() + 1}.${currentDate.getFullYear()}`,
    practiceDate: `${practiceDate.getDate()}.${practiceDate.getMonth() + 1}.${practiceDate.getFullYear()}`,
    isSameDay
  });
  
  return isSameDay;
};

const isBeforePractice = (currentHour, hockeyPractice) => {
  if (!hockeyPractice || !hockeyPractice.time) {
    console.log('🏒 isBeforePractice - chybí data:', { hockeyPractice });
    return false;
  }
  
  const practiceHour = parseInt(hockeyPractice.time.split(':')[0]);
  const result = currentHour < practiceHour;

  console.log('🏒 isBeforePractice - porovnání:', {
    currentHour,
    practiceHour,
    result
  });
  
  return result;
};

const PlayerCareer = ({ onBack, money, xp, level, getXpToNextLevel, getLevelProgress }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [temperature, setTemperature] = useState(22);
  const [currentHour, setCurrentHour] = useState(8);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [playerName, setPlayerName] = useState('Nový hráč');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [weatherTrend, setWeatherTrend] = useState({
    type: 'clear',
    baseTemp: 22,
    tempTrend: 0, // změna teploty za hodinu
    duration: 24, // jak dlouho trend vydrží
    stormComing: false
  });
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [phoneScreen, setPhoneScreen] = useState('home'); // 'home', 'messages', 'chat'
  const [unreadMessages, setUnreadMessages] = useState(1);
  const [activeChat, setActiveChat] = useState(null);

  // Initial state loading from localStorage or default
  const [conversations, setConversations] = useState(() => {
    if (typeof window === 'undefined') {
      return getInitialConversationsState();
    }
    try {
      const savedState = localStorage.getItem('playerCareerConversations'); // Nový klíč
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Základní validace, zda je to pole
        if (Array.isArray(parsedState)) {
            // Zajištění, že avatar URL je aktuální (pro případ změn)
            return parsedState.map(conv => {
                if (conv.id === 'olda') {
                    return { ...conv, avatar: litvinovLancers.getPlayerPhotoUrl('Oldřich Štěpanovský') };
                }
                return conv;
            });
        } else {
             console.warn("Invalid conversation state found in localStorage, using default.");
             return getInitialConversationsState();
        }
      } 
    } catch (error) {
      console.error("Error reading conversations from localStorage:", error);
    }
    return getInitialConversationsState();
  });

  // Effect for saving state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('playerCareerConversations', JSON.stringify(conversations));
        } catch (error) {
            console.error("Error saving conversations to localStorage:", error);
        }
    }
  }, [conversations]);

  // Blikající LED efekt
  const [ledBlink, setLedBlink] = useState(false);

  // Přidání stavu pro hokejový trénink
  const [hockeyPractice, setHockeyPractice] = useState(() => {
    const savedPractice = localStorage.getItem('hockeyPractice');
    console.log('🏒 Načtení hokejového tréninku z localStorage:', savedPractice);
    return savedPractice ? JSON.parse(savedPractice) : null;
  });

  // Funkce pro formátování data
  const formatDate = (date) => {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 
                   'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  };

  // Funkce pro generování realistického počasí podle měsíce a hodiny
  const generateWeather = (date, hour = 8, forcedChange = false) => {
    const month = date.getMonth();
    const currentTemp = temperature;
    let newWeather = { ...weatherTrend };

    // Pokud je potřeba vygenerovat nový trend počasí
    if (forcedChange || weatherTrend.duration <= 0) {
      // Základní nastavení podle měsíce
      const seasonalSettings = getSeasonalSettings(month);
      
      // 80% šance zachovat současný typ počasí, pokud není vyžadována změna
      if (!forcedChange && Math.random() > 0.2) {
        newWeather.type = weatherTrend.type;
      } else {
        // Výběr nového typu počasí
        const weatherRoll = Math.random();
        if (weatherRoll < 0.6) {
          newWeather.type = 'clear';
        } else if (weatherRoll < 0.8) {
          newWeather.type = 'partlyCloudy';
        } else if (weatherRoll < 0.9) {
          newWeather.type = 'cloudy';
        } else {
          // 10% šance na výraznější změnu počasí
          const extremeWeather = Math.random();
          if (extremeWeather < 0.4) {
            newWeather.type = 'rain';
            newWeather.stormComing = false;
          } else if (extremeWeather < 0.7) {
            newWeather.type = 'thunderstorm';
            newWeather.stormComing = true;
          } else if (month <= 1 || month === 11) {
            newWeather.type = 'snow';
            newWeather.stormComing = false;
          } else {
            newWeather.type = 'fog';
            newWeather.stormComing = false;
          }
        }
      }

      // Nastavení základní teploty a trendu
      const timeOfDay = getTimeOfDayModifier(hour);
      newWeather.baseTemp = seasonalSettings.baseTemp + timeOfDay;
      
      // Nastavení trendu změny teploty
      if (hour >= 6 && hour <= 14) {
        // Dopoledne - teplota stoupá
        newWeather.tempTrend = 0.5 + Math.random() * 0.5;
      } else if (hour >= 15 && hour <= 20) {
        // Odpoledne - teplota klesá
        newWeather.tempTrend = -(0.3 + Math.random() * 0.4);
      } else {
        // Noc - teplota mírně klesá
        newWeather.tempTrend = -(0.1 + Math.random() * 0.2);
      }

      // Bouřka způsobí rychlejší pokles teploty
      if (newWeather.type === 'thunderstorm') {
        newWeather.tempTrend = -2;
      }

      // Nastavení délky trendu (4-8 hodin)
      newWeather.duration = 4 + Math.floor(Math.random() * 4);
    } else {
      // Pokračování současného trendu
      newWeather.duration -= 1;
    }

    // Výpočet nové teploty
    let newTemp = currentTemp + newWeather.tempTrend;
    
    // Omezení extrémních teplot podle ročního období
    const seasonalSettings = getSeasonalSettings(month);
    newTemp = Math.max(seasonalSettings.minTemp, Math.min(seasonalSettings.maxTemp, newTemp));

    setWeatherTrend(newWeather);
    return {
      type: newWeather.type,
      temperature: Math.round(newTemp)
    };
  };

  // Funkce pro získání nastavení podle ročního období
  const getSeasonalSettings = (month) => {
    switch(month) {
      case 11: // Prosinec
      case 0:  // Leden
      case 1:  // Únor
        return { baseTemp: 0, minTemp: -10, maxTemp: 8 };
      case 2:  // Březen
      case 3:  // Duben
      case 4:  // Květen
        return { baseTemp: 15, minTemp: 5, maxTemp: 25 };
      case 5:  // Červen
      case 6:  // Červenec
      case 7:  // Srpen
        return { baseTemp: 24, minTemp: 15, maxTemp: 35 };
      case 8:  // Září
      case 9:  // Říjen
      case 10: // Listopad
        return { baseTemp: 12, minTemp: 3, maxTemp: 20 };
    }
  };

  // Funkce pro získání modifikátoru podle denní doby
  const getTimeOfDayModifier = (hour) => {
    if (hour >= 5 && hour <= 8) {
      return -2 + (hour - 5);
    } else if (hour >= 9 && hour <= 14) {
      return 1 + (hour - 9) * 0.5;
    } else if (hour >= 15 && hour <= 19) {
      return 4 - (hour - 15) * 0.5;
    } else {
      return -3;
    }
  };

  // Funkce pro aktualizaci počasí podle hodiny
  const updateHourlyWeather = () => {
    const currentWeather = generateWeather(currentDate, currentHour);
    setWeather(currentWeather.type);
    setTemperature(currentWeather.temperature);
  };

  // Efekt pro aktualizaci času a počasí
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(prev => {
        const newHour = prev + 1;
        if (newHour >= 24) {
          goToNextDay();
          return 8; // Nový den začíná v 8:00
        }
        // Aktualizace počasí při změně hodiny
        const currentWeather = generateWeather(currentDate, newHour);
        setWeather(currentWeather.type);
        setTemperature(currentWeather.temperature);
        return newHour;
      });
    }, 30000); // Každých 30 sekund = 1 herní hodina

    return () => clearInterval(interval);
  }, [currentDate]);

  // Funkce pro posun na další den
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    setCurrentDate(nextDay);
    setCurrentHour(8);
    
    // Generování nového počasí pro další den
    const newWeather = generateWeather(nextDay, 8);
    setWeather(newWeather.type);
    setTemperature(newWeather.temperature);
    
    setShowLocationInfo(false);
  };

  // Funkce pro uložení jména hráče
  const savePlayerName = () => {
    if (tempFirstName && tempLastName) {
      setPlayerName(`${tempFirstName} ${tempLastName}`);
      setShowNameModal(false);
      setTempFirstName('');
      setTempLastName('');
    }
  };

  // Nastavení počátečního data a počasí při prvním načtení
  useEffect(() => {
    const startDate = new Date(2024, 5, 1); // Měsíce jsou 0-based, takže 5 = červen
    startDate.setHours(8, 0, 0, 0);
    setCurrentDate(startDate);
    
    // Generování počátečního počasí
    const initialWeather = generateWeather(startDate);
    setWeather(initialWeather.type);
    setTemperature(initialWeather.temperature);
  }, []);

  // Funkce pro získání emoji počasí
  const getWeatherEmoji = () => {
    switch(weather) {
      case 'clear': return '☀️';
      case 'partlyCloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'thunderstorm': return '⛈️';
      case 'snow': return '❄️';
      case 'snowRain': return '🌨️';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  };

  // Funkce pro získání textového popisu počasí
  const getWeatherDescription = () => {
    switch(weather) {
      case 'clear': return 'Jasno';
      case 'partlyCloudy': return 'Polojasno';
      case 'cloudy': return 'Zataženo';
      case 'rain': return 'Déšť';
      case 'thunderstorm': return 'Bouřky';
      case 'snow': return 'Sněžení';
      case 'snowRain': return 'Déšť se sněhem';
      case 'fog': return 'Mlha';
      default: return 'Jasno';
    }
  };

  const locations = [
    {
      id: 'home',
      name: 'Tvůj dům',
      description: 'Luxusní sídlo s výhledem na město. Zde si můžeš odpočinout, prohlédnout trofeje a naplánovat další kroky své kariéry.',
      x: 30,
      y: 20,
      icon: '🏠',
      color: '#FFD700',
      actions: [
        {
          name: 'Jít spát (další den)',
          onClick: goToNextDay
        },
        {
          name: 'Nastavit jméno hráče',
          onClick: () => setShowNameModal(true)
        },
        {
          name: 'Rozdělení atributů',
          onClick: () => console.log('Rozdělení atributů')
        },
        {
          name: 'Prohlídka trofejí',
          onClick: () => console.log('Prohlídka trofejí')
        }
      ]
    },
    {
      id: 'stadium',
      name: 'Zimní stadion',
      description: 'Moderní hokejová aréna s kapacitou 15 000 diváků. Domov tvého týmu a místo, kde se píše historie.',
      x: 70,
      y: 60,
      icon: '🏟️',
      color: '#87CEEB',
      actions: [
        {
          name: hockeyPractice && isHockeyPracticeDay(currentDate, hockeyPractice) && isBeforePractice(currentHour, hockeyPractice)
            ? '🏒 Jít na hokej s Oldovou partou (17:00)'
            : 'Trénink týmu',
          onClick: () => {
            if (hockeyPractice && isHockeyPracticeDay(currentDate, hockeyPractice) && isBeforePractice(currentHour, hockeyPractice)) {
              // TODO: Implementovat hokejový zápas s partou
              alert('Přišel jsi na hokej s partou! (Tato funkce bude brzy implementována)');
            } else {
              console.log('Trénink týmu');
            }
          }
        },
        'Zápas',
        'Prohlídka stadionu'
      ]
    },
    {
      id: 'shop',
      name: 'Hokejové centrum',
      description: 'Specializovaný obchod s nejnovějším hokejovým vybavením a možností vylepšení karet hráčů.',
      x: 20,
      y: 70,
      icon: '🏪',
      color: '#98FB98',
      actions: ['Nákup vybavení', 'Vylepšení karet', 'Prodej věcí']
    },
    {
      id: 'gym',
      name: 'Sportovní centrum',
      description: 'Špičkově vybavené fitness centrum s osobními trenéry a rehabilitačním oddělením.',
      x: 80,
      y: 30,
      icon: '💪',
      color: '#FF6B6B',
      actions: ['Silový trénink', 'Rehabilitace', 'Konzultace s trenérem']
    },
    {
      id: 'school',
      name: 'Hokejová akademie',
      description: 'Vzdělávací centrum pro hokejisty. Zde se můžeš naučit nové taktiky a strategii.',
      x: 50,
      y: 40,
      icon: '🎓',
      color: '#DDA0DD',
      actions: ['Studium taktiky', 'Mentoring', 'Analýza zápasů']
    },
    {
      id: 'restaurant',
      name: 'Sportovní restaurace',
      description: 'Restaurace specializovaná na výživu sportovců. Perfektní místo pro týmové porady.',
      x: 40,
      y: 65,
      icon: '🍽️',
      color: '#FFA07A',
      actions: ['Týmová večeře', 'Konzultace s nutričním specialistou', 'Společenská akce']
    },
    {
      id: 'medical',
      name: 'Sportovní klinika',
      description: 'Zdravotnické zařízení specializované na sportovní medicínu a rehabilitaci.',
      x: 60,
      y: 25,
      icon: '🏥',
      color: '#F08080',
      actions: ['Zdravotní prohlídka', 'Rehabilitace', 'Konzultace']
    }
  ];

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setShowLocationInfo(true);
  };

  useEffect(() => {
    if (hasNewMessage) {
      const blinkInterval = setInterval(() => {
        setLedBlink(prev => !prev);
      }, 1000);
      return () => clearInterval(blinkInterval);
    } else {
      setLedBlink(false);
    }
  }, [hasNewMessage]);

  // ===== LOGIKA ZPRÁV =====

  // Funkce volaná komponentou OldaChat, když tam dojde ke změně (nová zpráva od Oldy nebo hráče)
  const handleChatUpdate = (conversationId, updatedMessages) => {
    setConversations(prevConvs => {
      const newConvs = prevConvs.map(conv => {
        if (conv.id === conversationId) {
          const lastMsg = updatedMessages[updatedMessages.length - 1];
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: lastMsg ? lastMsg.text : conv.lastMessage, // Aktualizuj poslední zprávu
            time: lastMsg ? lastMsg.time : conv.time, // Aktualizuj čas
            unread: conv.unread // Unread se bude řešit níže
          };
        }
        return conv;
      });
      return newConvs;
    });
  };

  // Efekt pro sledování nepřečtených zpráv
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => {
        // Spočítá nepřečtené zprávy od ostatních (ne od 'Player')
        const unreadFromOthers = conv.messages.filter(msg => msg.sender !== 'Player' && !msg.read).length;
        return sum + unreadFromOthers;
    }, 0);
    setUnreadMessages(totalUnread);
    setHasNewMessage(totalUnread > 0);
  }, [conversations]);

  // Funkce pro označení konverzace jako přečtené
  const markConversationAsRead = (conversationId) => {
    setConversations(prevConvs => prevConvs.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          // Projdi zprávy a označ všechny jako přečtené
          messages: conv.messages.map(msg => ({ ...msg, read: true }))
          // Unread count se přepočítá v useEffect výše
        };
      }
      return conv;
    }));
  };

  // Funkce pro otevření chatu
  const openChat = (conv) => {
    setActiveChat(conv);
    setPhoneScreen('chat');
    markConversationAsRead(conv.id); // Označí zprávy jako přečtené při otevření
  };

  // Funkce pro renderování obsahu telefonu
  const renderPhoneContent = () => {
    switch (phoneScreen) {
      case 'messages':
        return (
          <div className="h-full">
            <div className="p-4 bg-indigo-950/50 flex items-center justify-between">
              <button 
                onClick={() => setPhoneScreen('home')}
                className="w-8 h-8 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 flex items-center justify-center text-white"
              >
                ←
              </button>
              <h2 className="text-white font-bold">Zprávy</h2>
              <div className="w-8"></div>
            </div>
            <div className="p-4 space-y-3">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => openChat(conv)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-2xl overflow-hidden">
                      {typeof conv.avatar === 'string' && (conv.avatar.startsWith('/') || conv.avatar.startsWith('http')) ? (
                        <Image
                          src={conv.avatar}
                          alt={conv.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                          onError={(e) => {
                            console.error('❌ Error loading image:', e.target.src);
                          }}
                        />
                      ) : (
                        conv.avatar
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{conv.name}</span>
                        <span className="text-white/50 text-xs">{conv.time}</span>
                      </div>
                      <div className="text-white/70 text-sm truncate">{conv.lastMessage}</div>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chat':
        if (!activeChat) return null; // Pojistka
        // Předáme OldaChat komponentě potřebné props
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 bg-indigo-950/50 flex items-center gap-4">
              <button 
                onClick={() => setPhoneScreen('messages')}
                className="w-8 h-8 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 flex items-center justify-center text-white"
              >
                ←
              </button>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl overflow-hidden">
                  {typeof activeChat?.avatar === 'string' && (activeChat.avatar.startsWith('/') || activeChat.avatar.startsWith('http')) ? (
                    <Image
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                      onError={(e) => {
                        console.error('❌ Error loading image:', e.target.src);
                      }}
                    />
                  ) : (
                    activeChat?.avatar
                  )}
                </div>
                <div>
                  <div className="text-white font-bold">{activeChat?.name}</div>
                  <div className="text-indigo-300 text-sm">online</div>
                </div>
              </div>
            </div>
            <OldaChat
              key={activeChat.id} // Přidáno pro reset stavu při změně chatu
              initialMessages={activeChat.messages}
              onChatUpdate={(updatedMessages) => handleChatUpdate(activeChat.id, updatedMessages)}
            />
          </div>
        );

      default: // 'home'
        return (
          <>
            <div className="p-4 pt-12">
              {/* Záložky s ikonkami */}
              <div className="flex justify-around mb-6">
                <button 
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group relative"
                  onClick={() => setPhoneScreen('messages')}
                >
                  <span className="text-xl">💬</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Zprávy</span>
                  {unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unreadMessages}
                    </div>
                  )}
                </button>
                <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                  <span className="text-xl">👥</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Kontakty</span>
                </button>
                <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                  <span className="text-xl">📅</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Kalendář</span>
                </button>
              </div>

              {/* Seznam posledních zpráv */}
              <div className="space-y-3">
                {conversations.filter(conv => conv.unread > 0).map(conv => (
                  <div 
                    key={conv.id}
                    className={`bg-white/5 p-4 rounded-xl border ${conv.unread > 0 ? 'border-blue-500/50 animate-pulse' : 'border-white/10'} cursor-pointer`}
                    onClick={() => openChat(conv)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl overflow-hidden">
                        {typeof conv.avatar === 'string' && (conv.avatar.startsWith('/') || conv.avatar.startsWith('http')) ? (
                          <Image
                            src={conv.avatar}
                            alt={conv.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('❌ Error loading image:', e.target.src);
                            }}
                          />
                        ) : (
                          conv.avatar
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium flex items-center gap-2">
                          {conv.name}
                          {conv.unread > 0 && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <div className="text-white/50 text-xs">{conv.lastMessage}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  // Kontrola, jestli se hráč domluvil na hokeji
  useEffect(() => {
    const savedMessages = localStorage.getItem('oldaChatMessages');
    console.log('🏒 Načtení zpráv z localStorage:', savedMessages);
    
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      const playerMessages = messages.filter(msg => msg.sender === 'Player');
      
      // Kontrola posledních zpráv pro potvrzení
      const confirmationMessages = [
        'Díky moc! Tak v 16:15 na zimáku.',
        'Díky, výstroj mám. Tak v 16:30 na zimáku!',
        'Super, budu tam!',
        'Jasně, budu tam! Díky za info.'
      ];
      
      const isConfirmed = playerMessages.some(msg => 
        confirmationMessages.some(confirm => msg.text.includes(confirm))
      );

      console.log('🏒 Kontrola potvrzení účasti:', {
        playerMessages: playerMessages.map(msg => msg.text),
        confirmationMessages,
        isConfirmed
      });

      if (isConfirmed) {
        // Nastavení data na 2. června 2024
        const practiceDate = new Date(2024, 5, 2, 17, 0, 0, 0);

        const practice = {
          date: practiceDate.toISOString(),
          time: '17:00',
          confirmed: true,
          needsEquipment: playerMessages.some(msg => msg.text.includes('16:15')) // přijde dřív kvůli vybavení
        };
        
        console.log('🏒 Nastavení nového tréninku:', practice);
        
        setHockeyPractice(practice);
        localStorage.setItem('hockeyPractice', JSON.stringify(practice));
      }
    }
  }, []);

  // Přidání logu pro aktuální datum a čas
  useEffect(() => {
    const practiceDate = hockeyPractice ? new Date(hockeyPractice.date) : null;
    console.log('🏒 Aktuální stav:', {
      currentDate: currentDate.toISOString(),
      currentHour,
      practiceDate: practiceDate?.toISOString(),
      hockeyPractice
    });
  }, [currentDate, currentHour, hockeyPractice]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8 overflow-y-auto">
      {/* Stats v levém horním rohu */}
      <div className="fixed top-4 left-4 flex gap-4 z-50">
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            Peníze: <span className="font-bold text-indigo-400">{money.toLocaleString()} Kč</span>
          </p>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 relative overflow-hidden shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl relative z-10">
            <span className="font-bold text-indigo-400">{playerName}</span>
            <span className="mx-2">•</span>
            Level: <span className="font-bold text-indigo-400">{level}</span>
            <span className="ml-1 text-sm text-indigo-200">({xp} XP)</span>
          </p>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" 
               style={{ width: `${getLevelProgress(xp)}%` }}></div>
          <div className="absolute top-1 right-2 text-xs text-indigo-200">
            {getXpToNextLevel(xp)} XP do dalšího levelu
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            <span className="font-bold text-indigo-400">{formatDate(currentDate)}</span>
            <span className="mx-2">•</span>
            <span className="font-bold text-indigo-400">{currentHour.toString().padStart(2, '0')}:00</span>
          </p>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xl">
            <span className="mr-2">{getWeatherEmoji()}</span>
            <span className="font-bold text-indigo-400">{getWeatherDescription()}</span>
            <span className="mx-2">•</span>
            <span className="font-bold text-indigo-400">{temperature}°C</span>
          </p>
        </div>
      </div>

      {/* Modal pro nastavení jména */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 p-8 rounded-xl border border-indigo-500/30 shadow-xl backdrop-blur-sm max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-indigo-400 mb-6">Nastavení jména hráče</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-indigo-300 mb-2">Jméno</label>
                <input
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Zadejte jméno"
                />
              </div>
              <div>
                <label className="block text-indigo-300 mb-2">Příjmení</label>
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Zadejte příjmení"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 bg-gray-500/50 hover:bg-gray-500/70 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={savePlayerName}
                  disabled={!tempFirstName || !tempLastName}
                  className={`flex-1 ${
                    tempFirstName && tempLastName
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : 'bg-indigo-500/50 cursor-not-allowed'
                  } text-white font-bold py-2 px-4 rounded-lg transition-colors`}
                >
                  Uložit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full mx-auto">
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-8 border border-indigo-500/20 shadow-xl backdrop-blur-sm">
          {/* Hlavička */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Mapa města
            </h2>
            <div className="text-indigo-300 mt-2">
              {getWeatherDescription()}
            </div>
          </div>

          {/* Hlavní kontejner pro telefon a mapu */}
          <div className="flex gap-8">
            {/* Mobilní telefon - zarovnaný úplně vlevo */}
            <div className="w-[300px] h-[600px] bg-black rounded-[40px] p-3 relative shadow-2xl border-4 border-gray-800" style={{ marginLeft: '-22rem' }}>
              {/* Výřez pro kameru a senzory */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-3xl z-20 flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${ledBlink ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                <div className="w-2 h-2 rounded-full bg-gray-800"></div>
              </div>
              
              {/* Displej telefonu */}
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] overflow-hidden relative">
                {/* Stavový řádek */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/30 flex items-center justify-between px-6 text-white text-sm">
                  <span>{currentHour.toString().padStart(2, '0')}:{(Math.floor(Date.now() / 1000) % 60).toString().padStart(2, '0')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">5G</span>
                    <span>📶</span>
                    <span>🔋 100%</span>
                  </div>
                </div>

                {/* Dynamický obsah telefonu */}
                {renderPhoneContent()}
              </div>
            </div>

            {/* Mapa - zůstává beze změny */}
            <div className="flex-1 h-[600px] rounded-xl overflow-hidden transition-all duration-1000">
              {/* Efekty počasí */}
              {weather !== 'clear' && weather !== 'partlyCloudy' && weather !== 'cloudy' && (
                <div className={`absolute inset-0 pointer-events-none
                  ${weather === 'rain' ? 'animate-rain bg-gradient-to-b from-transparent to-blue-500/10' :
                    weather === 'thunderstorm' ? 'animate-storm bg-gradient-to-b from-transparent to-purple-500/20' :
                    weather === 'snow' ? 'animate-snow bg-gradient-to-b from-transparent to-white/10' :
                    weather === 'snowRain' ? 'animate-mixed-precipitation bg-gradient-to-b from-transparent to-blue-500/10' :
                    weather === 'fog' ? 'animate-fog bg-gradient-to-b from-gray-400/20 to-gray-400/10' : ''}`}
                />
              )}

              {/* Cesty */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {/* Hlavní cesty */}
                <path 
                  d="M 20,20 C 40,20 60,20 80,20 C 80,40 80,60 80,80 C 60,80 40,80 20,80 C 20,60 20,40 20,20" 
                  className={`stroke-2 fill-none transition-all duration-1000
                    ${weather === 'clear' ? 'stroke-slate-400/50' :
                      weather === 'cloudy' ? 'stroke-gray-400/50' :
                      weather === 'rain' ? 'stroke-blue-400/30' :
                      'stroke-gray-400/30'}`}
                  strokeDasharray="4 2"
                />
                
                {/* Vedlejší cesty */}
                <path 
                  d="M 50,20 Q 50,50 50,80 M 20,50 Q 50,50 80,50" 
                  className={`stroke-2 fill-none transition-all duration-1000
                    ${weather === 'clear' ? 'stroke-slate-400/30' :
                      weather === 'cloudy' ? 'stroke-gray-400/30' :
                      weather === 'rain' ? 'stroke-blue-400/20' :
                      'stroke-gray-400/20'}`}
                  strokeDasharray="4 2"
                />
                
                {/* Řeka */}
                <path 
                  d="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60" 
                  className={`stroke-[3] fill-none transition-all duration-1000
                    ${weather === 'clear' ? 'stroke-blue-500/30' :
                      weather === 'cloudy' ? 'stroke-gray-500/30' :
                      weather === 'rain' ? 'stroke-blue-700/30' :
                      'stroke-gray-700/30'}`}
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="d"
                    dur="5s"
                    repeatCount="indefinite"
                    values="M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60;
                           M 10,42 Q 30,47 40,37 Q 50,27 60,47 Q 70,67 90,62;
                           M 10,40 Q 30,45 40,35 Q 50,25 60,45 Q 70,65 90,60"
                  />
                </path>
              </svg>

              {/* Lokace */}
              {locations.map((location) => {
                const isHockeyDay = location.id === 'stadium' && 
                                  hockeyPractice && 
                                  isHockeyPracticeDay(currentDate, hockeyPractice) && 
                                  isBeforePractice(currentHour, hockeyPractice);

                return (
                  <button
                    key={location.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                      w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-300 hover:scale-110 
                      ${location.id === 'stadium' && isHockeyDay ? 'animate-pulse-strong' : 'hover:z-10'}
                      ${weather === 'rain' ? 'shadow-glow' : 'shadow-lg'}`}
                    style={{ 
                      left: `${location.x}%`, 
                      top: `${location.y}%`,
                      backgroundColor: `${location.color}40`,
                      boxShadow: hoveredLocation?.id === location.id 
                        ? `0 0 20px ${location.color}80` 
                        : isHockeyDay
                        ? `0 0 30px rgba(255, 255, 255, 0.8)`
                        : `0 0 10px ${location.color}40`,
                      borderColor: location.color
                    }}
                    onClick={() => handleLocationClick(location)}
                    onMouseEnter={() => setHoveredLocation(location)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  >
                    {isHockeyDay && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    )}
                    {isHockeyDay && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full" />
                    )}
                    <span className="text-3xl filter drop-shadow-lg transform transition-transform duration-300 hover:scale-110">
                      {location.icon}
                    </span>
                    {hoveredLocation?.id === location.id && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                                   whitespace-nowrap bg-black/80 text-white text-sm px-2 py-1 
                                   rounded-lg pointer-events-none">
                        {location.name}
                        {isHockeyDay && (
                          <span className="ml-2 text-red-400">• Hokej v {hockeyPractice.time}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Info panel o lokaci */}
              {showLocationInfo && selectedLocation && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                             w-96 bg-black/80 backdrop-blur-sm rounded-xl p-6
                             border border-indigo-500/30 text-white
                             animate-slideUp shadow-xl">
                  <h3 className="text-2xl font-bold text-indigo-400 mb-2 flex items-center gap-2">
                    <span>{selectedLocation.icon}</span>
                    {selectedLocation.name}
                  </h3>
                  <p className="text-indigo-100 mb-4">
                    {selectedLocation.description}
                  </p>
                  <div className="space-y-2">
                    {selectedLocation.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick || (() => {})}
                        className="w-full text-left px-4 py-2 rounded-lg
                                 bg-indigo-500/20 hover:bg-indigo-500/30
                                 transition-colors duration-200
                                 text-indigo-200 hover:text-indigo-100"
                      >
                        {action.name || action}
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-4 bg-indigo-500/50 hover:bg-indigo-500/70 
                             px-4 py-2 rounded-lg text-sm transition-colors
                             absolute top-4 right-4"
                    onClick={() => setShowLocationInfo(false)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tlačítko pro návrat */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onBack}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700
            text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300
            hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          Zpět do menu
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes rain {
          0% { background-position: 0% 0%; }
          100% { background-position: 20% 100%; }
        }
        
        @keyframes snow {
          0% { background-position: 0% 0%; }
          100% { background-position: 10% 100%; }
        }

        @keyframes storm {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes mixed-precipitation {
          0% { background-position: 0% 0%; }
          100% { background-position: 15% 100%; }
        }

        @keyframes fog {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }

        @keyframes pulse-strong {
          0% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
          50% { transform: scale(1.1) translate(-45%, -45%); opacity: 0.8; }
          100% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-rain {
          animation: rain 0.8s linear infinite;
          background-size: 100px 100px;
          background-image: repeating-linear-gradient(
            transparent 0px,
            transparent 5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 10px
          );
        }

        .animate-snow {
          animation: snow 3s linear infinite;
          background-size: 100px 100px;
          background-image: radial-gradient(
            circle at 50% 50%,
            white 0.1em,
            transparent 0.2em
          );
        }

        .animate-storm {
          animation: storm 0.8s linear infinite;
        }

        .animate-mixed-precipitation {
          animation: mixed-precipitation 0.8s linear infinite;
          background-size: 100px 100px;
          background-image: repeating-linear-gradient(
            transparent 0px,
            transparent 5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 10px
          );
        }

        .animate-fog {
          animation: fog 0.8s linear infinite;
        }

        .animate-pulse-strong {
          animation: pulse-strong 2s infinite;
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default PlayerCareer; 