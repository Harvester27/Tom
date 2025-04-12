'use client';

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import Image from 'next/image';
import OldaChat from './OldaChat';
import { litvinovLancers } from '../data/LitvinovLancers';
import OldaGameSimulation from './OldaGameSimulation';
import PostGameRewards from './PostGameRewards';

// Import nových komponent, které budeme implementovat později
import { WeatherSystem, useWeather } from './systems/WeatherSystem';
import { PhoneSystem, usePhone } from './systems/PhoneSystem';
import { LocationMap } from './systems/LocationMap';

// Pomocná funkce pro načtení dat z localStorage s fallbackem
const loadFromStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  
  return defaultValue;
};

// Pomocná funkce pro uložení dat do localStorage
const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Pomocné funkce pro kontrolu data a času s memoizací pro lepší výkon
const formatDate = (date) => {
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 
                'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
  
  return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
};

const PlayerCareer = ({
  onBack,
  money,
  xp,
  level,
  getXpToNextLevel,
  getLevelProgress,
  onXpChange,
  onMoneyChange
}) => {
  // =========== GAME STATE ===========
  // Základní stav hráče a herního času
  const [playerName, setPlayerName] = useState(() => 
    loadFromStorage('playerName', 'Nový hráč')
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentHour, setCurrentHour] = useState(8);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  
  // State pro scaling uživatelského rozhraní
  const [scale, setScale] = useState(1);
  const contentRef = useRef(null);
  
  // State pro hokejový trénink
  const [hockeyPractice, setHockeyPractice] = useState(() => 
    loadFromStorage('hockeyPractice', null)
  );

  // State pro zápas a odměny
  const [showOldaGame, setShowOldaGame] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  
  // State pro lokace
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // =========== HOOKS PRO EXTERNÍ SYSTÉMY ===========
  // Hook pro počasí (bude implementován později)
  const { 
    weather, 
    temperature, 
    updateWeather,
    getWeatherEmoji,
    getWeatherDescription
  } = useWeather(currentDate, currentHour);
  
  // Hook pro systém telefonu (bude implementován později)
  const {
    conversations,
    setConversations,
    phoneScreen,
    setPhoneScreen,
    activeChat,
    setActiveChat,
    hasNewMessage,
    unreadMessages,
    ledBlink,
    handleChatUpdate,
    markConversationAsRead,
    openChat,
    renderPhoneContent
  } = usePhone();

  // =========== SCALING LOGIC ===========
  useEffect(() => {
    const updateScale = () => {
      const baseWidth = 1600;
      const baseHeight = 900;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY);

      setScale(Math.max(0.5, newScale)); // Minimální scale 0.5
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // =========== GAME FUNCTIONS ===========
  // Funkce pro posun na další den
  const goToNextDay = useCallback(() => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(9, 0, 0, 0); // Vždy nastavíme 9:00
    setCurrentDate(nextDay);
    setCurrentHour(9);
    updateWeather(nextDay, 9, true); // Force nové počasí pro nový den
    setShowLocationInfo(false);
  }, [currentDate, updateWeather]);

  // Nová funkce pro posun času o 1 hodinu dopředu
  const advanceOneHour = useCallback(() => {
    const newHour = currentHour + 1;
    
    // Pokud je 23:00, přejdeme na další den a nastavíme 9:00
    if (newHour >= 24) {
      goToNextDay();
      return;
    }
    
    setCurrentHour(newHour);
    
    // Aktualizujeme počasí s novým časem
    const date = new Date(currentDate);
    updateWeather(date, newHour, false);
    
    console.log(`Čas posunut na ${newHour}:00`);
  }, [currentDate, currentHour, goToNextDay, updateWeather]);

  // Přidáme novou funkci pro rychlý skok na den hokejového tréninku
  const goToHockeyDay = useCallback(() => {
    const hockeyDate = new Date(2024, 5, 2); // 2. června 2024
    hockeyDate.setHours(9, 0, 0, 0); // Nastavíme čas na 9:00
    
    setCurrentDate(hockeyDate);
    setCurrentHour(9);
    updateWeather(hockeyDate, 9, true);
    
    console.log("Přesun na den hokejového tréninku:", {
      nové_datum: hockeyDate.toISOString(),
      nová_hodina: 9
    });
  }, [updateWeather]);

  // Referenční proměnná pro kontrolu inicializace počasí
  const weatherInitialized = useRef(false);
  
  // Efekt pro aktualizaci času a počasí - ODSTRANĚN ČASOVAČ
  useEffect(() => {
    console.log("🌦️ [WEATHER] Časovač pro pravidelnou aktualizaci počasí je deaktivovaný");
    
    // Jednorázově nastavíme počasí, ale čas se nebude automaticky měnit
    updateWeather(currentDate, currentHour, false);

    return () => {
      console.log("🌦️ [WEATHER] Čištění časovače pro aktualizaci počasí");
    };
  }, [currentDate, currentHour, updateWeather]);
  
  // Samostatný efekt pro počáteční nastavení počasí - pouze při startu aplikace
  useEffect(() => {
    if (weatherInitialized.current) {
      console.log("🌦️ [WEATHER] Počasí již bylo inicializováno, přeskakuji");
      return;
    }
    
    console.log("🌦️ [WEATHER] Počáteční nastavení počasí při startu aplikace");
    // Počasí se nyní inicializuje uvnitř WeatherSystem pomocí statické proměnné
    
    weatherInitialized.current = true;
  }, []);

  // Funkce pro uložení jména hráče
  const savePlayerName = useCallback(() => {
    if (tempFirstName && tempLastName) {
      const newPlayerName = `${tempFirstName} ${tempLastName}`;
      setPlayerName(newPlayerName);
      saveToStorage('playerName', newPlayerName);
      setShowNameModal(false);
      setTempFirstName('');
      setTempLastName('');
    }
  }, [tempFirstName, tempLastName]);

  // Funkce pro kontrolu, zda je den hokejového tréninku
  const isHockeyPracticeDay = useCallback((date, practice) => {
    if (!practice || !practice.date) return false;
    
    const practiceDate = new Date(practice.date);
    
    // Přidáme debugging výpisy
    console.log("Kontrola hokejového dne:", {
      aktuálníDatum: date.toISOString().split('T')[0],
      tréninkovýDen: practiceDate.toISOString().split('T')[0],
      aktuálníDen: date.getDate(),
      tréninkovýDen: practiceDate.getDate(),
      aktuálníMěsíc: date.getMonth(),
      tréninkovýMěsíc: practiceDate.getMonth(),
      výsledek: date.getDate() === practiceDate.getDate() &&
               date.getMonth() === practiceDate.getMonth() &&
               date.getFullYear() === practiceDate.getFullYear()
    });
    
    return date.getDate() === practiceDate.getDate() &&
           date.getMonth() === practiceDate.getMonth() &&
           date.getFullYear() === practiceDate.getFullYear();
  }, []);

  // Funkce pro kontrolu, zda je před tréninkem
  const isBeforePractice = useCallback((hour, practice) => {
    if (!practice || !practice.time) return false;
    
    const practiceHour = parseInt(practice.time.split(':')[0]);
    
    console.log("Kontrola času před tréninkem:", {
      aktuálníHodina: hour,
      tréninková: practiceHour,
      výsledek: hour < practiceHour
    });
    
    return hour < practiceHour;
  }, []);

  // Jednoduché počítadlo pro kontrolu, kolikrát se efekt spustil
  const initCount = useRef(0);

  // Efekt pro nastavení počátečního času a data
  useEffect(() => {
    // Pouze při prvním spuštění
    if (initCount.current === 0) {
      console.log("🌦️ [WEATHER] První inicializace času a data");
      
      // Zkontrolujeme, jestli existuje hokejový trénink a nastavíme počáteční datum podle něj
      let startDate;
      
      if (hockeyPractice && hockeyPractice.date) {
        console.log("Nastavuji datum podle uloženého hokejového tréninku:", hockeyPractice.date);
        startDate = new Date(hockeyPractice.date);
        startDate.setHours(9, 0, 0, 0); // Vždy 9:00
      } else {
        startDate = new Date(2024, 5, 1); // 1. června 2024 (den před tréninkem)
        startDate.setHours(9, 0, 0, 0); // Vždy 9:00
        console.log("Nastavuji výchozí datum na 1. června 2024, 9:00");
      }
      
      setCurrentDate(startDate);
      setCurrentHour(9); // Vždy 9:00
      
      // DŮLEŽITÉ: Nastavíme window._weatherInitialized na true IHNED
      // aby ostatní efekty neprováděly své aktualizace
      if (typeof window !== 'undefined') {
        window._weatherInitialized = true;
      }
      
      // Počkáme, až se komponenta stabilizuje, pak provedeme JEDNU aktualizaci počasí
      const timer = setTimeout(() => {
        console.log("🌦️ [WEATHER] Načítám počáteční počasí po stabilizaci komponenty");
        // NEPOUŽÍVÁME forcedChange=true
        updateWeather(startDate, 9, false);
      }, 2000); // Delší zpoždění, aby se hra stabilizovala
      
      initCount.current++; // Zvýšíme počítadlo
      
      return () => clearTimeout(timer);
    }
  }, [hockeyPractice, updateWeather]);

  // Sledování, zda se hráč domluvil na hokeji
  useEffect(() => {
    console.log("Kontrola chatu s Oldou pro nastavení hokejového tréninku");
    const savedMessages = loadFromStorage('oldaChatMessages', null);
    
    if (savedMessages) {
      const playerMessages = savedMessages.filter(msg => msg.sender === 'Player');
      
      // Rozšíříme seznam možných potvrzení, aby se zvýšila šance na zachycení
      const confirmationMessages = [
        'Díky moc! Tak v 16:15 na zimáku.',
        'Díky, výstroj mám. Tak v 16:30 na zimáku!',
        'Super, budu tam!',
        'Jasně, budu tam! Díky za info.',
        'Určitě přijdu',
        'Díky za pozvání',
        'Rád se přidám'
      ];
      
      // Kontrolujeme shodu části zprávy, ne jen celou zprávu
      const isConfirmed = playerMessages.some(msg => 
        confirmationMessages.some(confirm => msg.text.toLowerCase().includes(confirm.toLowerCase()))
      );

      console.log("Kontrola potvrzení tréninku:", {
        zprávy: playerMessages.map(m => m.text),
        potvrzeno: isConfirmed
      });

      if (isConfirmed) {
        // Nastavení data na 2. června 2024
        const practiceDate = new Date(2024, 5, 2);
        practiceDate.setHours(17, 0, 0, 0);

        const practice = {
          date: practiceDate.toISOString(),
          time: '17:00',
          confirmed: true,
          needsEquipment: playerMessages.some(msg => msg.text.includes('16:15')) // přijde dřív kvůli vybavení
        };
        
        console.log("Nastavení hokejového tréninku:", practice);
        setHockeyPractice(practice);
        saveToStorage('hockeyPractice', practice);
        
        // NOVÉ: Zobrazení upozornění ihned po potvrzení tréninku
        setTimeout(() => {
          alert('Hokejový trénink potvrzen na 2. června v 17:00! Přijď na zimní stadion od 16:00.');
        }, 1000);
      }
    }
  }, []);

  // Funkce pro zpracování kliknutí na lokaci
  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(location);
    setShowLocationInfo(true);
  }, []);

  // Zpracování dokončení hokejového zápasu
  const handleOldaGameComplete = useCallback((result) => {
    if (!result || !result.score) {
      console.error('Invalid game result:', result);
      return;
    }
    
    // Vypočtení odměn podle výsledku
    const xpReward = result.score.home > result.score.away ? 50 : 20;
    const moneyReward = result.score.home > result.score.away ? 200 : 100;
  
    // Ukončení zápasu a zobrazení odměn
    setShowOldaGame(false);
    setShowRewards(true);
  
    // Uložení výsledku včetně všech dat o zápasu
    setMatchResult({
      result: result.score.home > result.score.away ? 'win' : 'loss',
      xpReward,
      moneyReward,
      homeScore: result.score.home,
      awayScore: result.score.away,
      rawResult: result
    });
  }, []);

  // Definice lokací
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
          name: `Posunout čas o 1 hodinu → ${(currentHour + 1) % 24}:00`,
          onClick: advanceOneHour
        },
        {
          name: 'Jít spát (další den)',
          onClick: goToNextDay
        },
        {
          name: 'TEST: Skok na den hokejového tréninku',
          onClick: goToHockeyDay
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
        },
        {
          name: 'Uložit hru',
          onClick: () => {
            const gameState = {
              playerName,
              currentDate: currentDate.toISOString(),
              currentHour,
              weather,
              temperature,
              conversations,
              hockeyPractice,
              money,
              xp,
              level
            };
            saveToStorage('savedGameState', gameState);
            alert('Hra byla úspěšně uložena!');
          }
        },
        {
          name: 'Načíst uloženou hru',
          onClick: () => {
            const savedState = loadFromStorage('savedGameState', null);
            if (savedState) {
              if (confirm('Opravdu chceš načíst uloženou hru? Přijdeš o současný postup.')) {
                setPlayerName(savedState.playerName);
                setCurrentDate(new Date(savedState.currentDate));
                setCurrentHour(savedState.currentHour);
                updateWeather(new Date(savedState.currentDate), savedState.currentHour);
                setConversations(savedState.conversations);
                setHockeyPractice(savedState.hockeyPractice);
                
                // Aktualizujeme localStorage pro jednotlivé komponenty
                saveToStorage('oldaChatMessages', savedState.conversations[0].messages);
                saveToStorage('playerCareerConversations', savedState.conversations);
                saveToStorage('hockeyPractice', savedState.hockeyPractice);
                
                window.location.reload();
              }
            } else {
              alert('Nebyla nalezena žádná uložená hra.');
            }
          }
        },
        {
          name: 'Resetovat hru',
          onClick: () => {
            if (confirm('Opravdu chceš resetovat hru? Přijdeš o všechny uložené zprávy a aktuální postup.')) {
              localStorage.removeItem('oldaChatMessages');
              localStorage.removeItem('playerCareerConversations');
              localStorage.removeItem('hockeyPractice');
              window.location.reload();
            }
          }
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
      get actions() {
        const isGameDay = hockeyPractice && 
                       isHockeyPracticeDay(currentDate, hockeyPractice) && 
                       isBeforePractice(currentHour, hockeyPractice);
      
        // Logování pro snadnější debugování
        console.log("Stadium - kontrola hokejového dne:", {
          mámeHokejovýTrénink: !!hockeyPractice,
          datum: currentDate.toISOString(),
          hodina: currentHour,
          hokejDatum: hockeyPractice?.date,
          hokejČas: hockeyPractice?.time,
          jeHokejovýDen: isHockeyPracticeDay(currentDate, hockeyPractice),
          jePředTréninkem: isBeforePractice(currentHour, hockeyPractice),
          výsledek: isGameDay
        });
      
        return [
          {
            name: isGameDay
              ? `🏒 Jít na hokej s Oldovou partou (${hockeyPractice.time})`
              : 'Trénink týmu',
            onClick: () => {
              if (isGameDay) {
                // Kontrola, jestli už je správný čas pro hokej
                // Vytvoříme správnou kontrolu času
                // Kontrolujeme, jestli už je alespoň 16:00 v den hokeje (2. června)
                const hockeyDate = new Date(2024, 5, 2);
                const isCorrectDay = currentDate.getDate() === hockeyDate.getDate() &&
                                    currentDate.getMonth() === hockeyDate.getMonth() &&
                                    currentDate.getFullYear() === hockeyDate.getFullYear();

                // Pokud je správný den, kontrolujeme hodinu
                if (isCorrectDay && currentHour >= 16) {
                  // Nastavíme čas na 19:00 a spustíme hokejový zápas
                  setCurrentHour(19);
                  updateWeather(currentDate, 19, false);
                  console.log("Spouštím hokejový zápas s Oldou!");
                  setShowOldaGame(true);
                } else {
                  // Pokud je moc brzo, zobrazíme upozornění
                  alert('Je ještě brzo na hokej! Přijď 2. června od 16:00.');
                  return;
                }
                
                // Nastavíme čas na 19:00 a spustíme hokejový zápas
                setCurrentHour(19);
                updateWeather(currentDate, 19, false);
                console.log("Spouštím hokejový zápas s Oldou!");
                setShowOldaGame(true);
              } else {
                console.log('Běžný trénink týmu - není den hokeje s Oldou');
              }
            }
          },
          {
            name: 'Zápas',
            onClick: () => console.log('Zápas')
          },
          {
            name: 'Prohlídka stadionu',
            onClick: () => console.log('Prohlídka stadionu')
          }
        ];
      }
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

  // =========== RENDER ===========
  return (
    // Kontejner celé obrazovky
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black/90 z-50 p-4">
      {/* Modal pro nastavení jména (mimo scaling) */}
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

      {/* Simulace zápasu s Oldovou partou */}
      {showOldaGame && (
        <OldaGameSimulation
          onBack={() => setShowOldaGame(false)}
          onGameComplete={handleOldaGameComplete}
          playerName={playerName}
          level={level}
        />
      )}

      {/* Zobrazení odměn po zápase */}
      {showRewards && matchResult && (
        <PostGameRewards
          gameResult={matchResult.rawResult}
          playerName={playerName}
          currentXp={xp}
          currentMoney={money}
          onBack={() => {
            if (onXpChange) onXpChange(xp + matchResult.xpReward);
            if (onMoneyChange) onMoneyChange(money + matchResult.moneyReward);
            setShowRewards(false);
          }}
        />
      )}

      {/* Scalable content wrapper */}
      <div
        ref={contentRef}
        style={{
          width: '1600px',
          height: '900px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="relative transition-transform duration-200 ease-out flex flex-col"
      >
        {/* Horní info panel */}
        <div className="flex gap-4 p-4">
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

        {/* Hlavní obsah */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="max-w-7xl w-full mx-auto">
            <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-8 border border-indigo-500/20 shadow-xl backdrop-blur-sm">
              {/* Hlavička mapy */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                  Mapa města
                </h2>
              </div>

              {/* Kontejner pro telefon a mapu */}
              <div className="flex gap-8 items-start">
                {/* Telefon - bude později nahrazen komponentou PhoneInterface */}
                <div className="w-[300px] h-[600px] bg-black rounded-[40px] p-3 relative shadow-2xl border-4 border-gray-800 flex-shrink-0">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-3xl z-20 flex items-center justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                    <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${ledBlink ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                  </div>
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[32px] overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-black/30 flex items-center justify-between px-6 text-white text-sm z-10">
                      <span>{currentHour.toString().padStart(2, '0')}:{(Math.floor(Date.now() / 1000) % 60).toString().padStart(2, '0')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">5G</span>
                        <span>📶</span>
                        <span>🔋 100%</span>
                      </div>
                    </div>
                    {renderPhoneContent({
                      currentHour,
                      setPhoneScreen,
                      openChat,
                      activeChat,
                      phoneScreen,
                      unreadMessages,
                      conversations,
                      setActiveChat,
                      handleChatUpdate,
                      hockeyPractice,
                      isHockeyPracticeDay,
                      isBeforePractice,
                      currentDate
                    })}
                  </div>
                </div>

                {/* Mapa - později bude nahrazena komponentou LocationMap */}
                <div className="flex-1 h-[600px] bg-indigo-900/30 rounded-xl overflow-hidden relative border border-indigo-500/30">
                  {/* Weather effects overlay */}
                  {weather !== 'clear' && weather !== 'partlyCloudy' && weather !== 'cloudy' && (
                    <div className={`absolute inset-0 pointer-events-none z-0
                      ${weather === 'rain' ? 'animate-rain bg-gradient-to-b from-transparent to-blue-500/10' :
                        weather === 'thunderstorm' ? 'animate-storm bg-gradient-to-b from-transparent to-purple-500/20' :
                        weather === 'snow' ? 'animate-snow bg-gradient-to-b from-transparent to-white/10' :
                        weather === 'snowRain' ? 'animate-mixed-precipitation bg-gradient-to-b from-transparent to-blue-500/10' :
                        weather === 'fog' ? 'animate-fog bg-gradient-to-b from-gray-400/20 to-gray-400/10' : ''}`}
                    />
                  )}
                  
                  {/* Silnice a řeky */}
                  <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100">
                    <path 
                      d="M 20,20 C 40,20 60,20 80,20 C 80,40 80,60 80,80 C 60,80 40,80 20,80 C 20,60 20,40 20,20" 
                      className={`stroke-2 fill-none transition-all duration-1000
                        ${weather === 'clear' ? 'stroke-slate-400/50' :
                        weather === 'cloudy' ? 'stroke-gray-400/50' :
                        weather === 'rain' ? 'stroke-blue-400/30' :
                        'stroke-gray-400/30'}`}
                      strokeDasharray="4 2"
                    />
                    <path 
                      d="M 50,20 Q 50,50 50,80 M 20,50 Q 50,50 80,50" 
                      className={`stroke-2 fill-none transition-all duration-1000
                        ${weather === 'clear' ? 'stroke-slate-400/30' :
                        weather === 'cloudy' ? 'stroke-gray-400/30' :
                        weather === 'rain' ? 'stroke-blue-400/20' :
                        'stroke-gray-400/20'}`}
                      strokeDasharray="4 2"
                    />
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
                  <div className="absolute inset-0 z-10">
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
                            ${location.id === 'stadium' && isHockeyDay ? 'animate-pulse-strong' : 'hover:z-20'}
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
                          {/* Indikátor hokejového tréninku */}
                          {isHockeyDay && (
                            <>
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full" />
                            </>
                          )}
                          
                          {/* Ikona lokace */}
                          <span className="text-3xl filter drop-shadow-lg transform transition-transform duration-300 hover:scale-110">
                            {location.icon}
                          </span>
                          
                          {/* Tooltip při hoveru */}
                          {hoveredLocation?.id === location.id && (
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                                          whitespace-nowrap bg-black/80 text-white text-sm px-2 py-1 
                                          rounded-lg pointer-events-none z-30">
                              {location.name}
                              {isHockeyDay && (
                                <span className="ml-2 text-red-400">• Hokej v {hockeyPractice.time}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Info panel lokace */}
                  {showLocationInfo && selectedLocation && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                                  w-96 bg-black/80 backdrop-blur-sm rounded-xl p-6
                                  border border-indigo-500/30 text-white
                                  animate-slideUp shadow-xl z-20">
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
                            onClick={typeof action === 'object' ? action.onClick : () => {}}
                            className="w-full text-left px-4 py-2 rounded-lg
                                      bg-indigo-500/20 hover:bg-indigo-500/30
                                      transition-colors duration-200
                                      text-indigo-200 hover:text-indigo-100"
                          >
                            {typeof action === 'object' ? action.name : action}
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
        </div>

        {/* Tlačítko zpět */}
        <div className="mt-auto p-4 text-center">
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700
              text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300
              hover:scale-105 active:scale-95 border-2 border-white/20"
          >
            Zpět do menu
          </button>
        </div>
      </div>

      {/* Animace a styly */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes rain {
          0% { background-position: 0% 0%; }
          100% { background-position: 10% 100%; }
        }
        
        @keyframes snow {
          0% { background-position: 0% 0%; }
          100% { background-position: 5% 100%; }
        }

        @keyframes storm {
          0% { opacity: 0.2; background-position: 0% 0%; }
          50% { opacity: 0.5; background-position: 2% 50%; }
          75% { opacity: 0.7; background-position: 3% 75%; }
          100% { opacity: 0.2; background-position: 5% 100%; }
        }

        @keyframes mixed-precipitation {
          0% { background-position: 0% 0%; }
          100% { background-position: 8% 100%; }
        }

        @keyframes fog {
          0% { opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { opacity: 0.2; }
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
          animation: rain 3s linear infinite;
          background-size: 100px 100px;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 5px,
            rgba(120, 180, 255, 0.15) 5px,
            rgba(120, 180, 255, 0.15) 10px
          );
        }

        .animate-snow {
          animation: snow 8s linear infinite;
          background-size: 200px 200px;
          background-image: radial-gradient(
            circle at 25% 25%,
            white 0.5%,
            transparent 1%
          ), radial-gradient(
            circle at 75% 75%,
            white 0.5%,
            transparent 1%
          ), radial-gradient(
            circle at 50% 50%,
            white 0.5%,
            transparent 1%
          );
        }

        .animate-storm {
          animation: storm 5s linear infinite;
          background-size: 200px 200px;
          background-image: 
            radial-gradient(circle at 30% 30%, rgba(180, 160, 255, 0.2) 0%, transparent 5%),
            radial-gradient(circle at 70% 60%, rgba(180, 160, 255, 0.2) 0%, transparent 5%);
        }

        .animate-mixed-precipitation {
          animation: mixed-precipitation 4s linear infinite;
          background-size: 150px 150px;
          background-image: 
            repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent 5px,
              rgba(120, 180, 255, 0.15) 5px,
              rgba(120, 180, 255, 0.15) 10px
            ),
            radial-gradient(
              circle at 70% 70%,
              white 0.5%,
              transparent 1%
            );
        }

        .animate-fog {
          animation: fog 10s linear infinite;
          background-image: 
            linear-gradient(to bottom, transparent, rgba(200, 200, 220, 0.2)),
            repeating-linear-gradient(
              0deg,
              rgba(200, 200, 220, 0.1) 0px,
              rgba(200, 200, 220, 0.1) 2px,
              transparent 2px,
              transparent 4px
            );
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