'use client';

import { getEventIcon } from './HockeyComponents';

// Konstanty pro generování událostí
const BASE_EVENT_CHANCE = 0.2;      // Základní šance na událost při kontrole
const MIN_EVENT_SPACING = 5;        // Minimální rozestup mezi událostmi (v sekundách)
const MAX_EVENT_SPACING = 25;       // Maximální rozestup mezi událostmi (v sekundách)
const EVENT_CHECK_INTERVAL = 5;     // Jak často kontrolujeme, zda se má vygenerovat událost (v sekundách)

// Váhy pro jednotlivé typy akcí (určují relativní pravděpodobnost)
const EVENT_TYPE_WEIGHTS = {
  shot: 35,           // Střela
  pass: 20,           // Přihrávka
  defense: 15,        // Obranný zákrok
  hit: 10,            // Bodyček
  turnover: 8,        // Ztráta puku
  icing: 5,           // Zakázané uvolnění
  offside: 5,         // Ofsajd
  penalty: 2,         // Trest
};

// Speciální typy akcí, které se mohou stát po jiných akcích (např. střela může vést k gólu)
const FOLLOW_UP_EVENTS = {
  shot: [
    { type: 'goal', chance: 0.25, description: 'střelu' },
    { type: 'save', chance: 0.45, description: 'střelu' },
    { type: 'block', chance: 0.15, description: 'střelu' },
    { type: 'miss', chance: 0.15, description: 'střelu' },
  ],
  hit: [
    { type: 'penalty', chance: 0.15, description: 'bodyček' },
    { type: 'turnover', chance: 0.35, description: 'bodyček' },
  ]
};

// Typy trestů a jejich pravděpodobnosti
const PENALTY_TYPES = [
  { minutes: 2, description: 'menší trest za hákování', chance: 0.25 },
  { minutes: 2, description: 'menší trest za držení', chance: 0.2 },
  { minutes: 2, description: 'menší trest za sekání', chance: 0.15 },
  { minutes: 2, description: 'menší trest za nedovolené bránění', chance: 0.15 },
  { minutes: 2, description: 'menší trest za vysokou hůl', chance: 0.1 },
  { minutes: 4, description: 'dvojitý menší trest za krvavé zranění', chance: 0.1 },
  { minutes: 5, description: 'větší trest za napadení', chance: 0.05 },
];

// Pomocná funkce pro výběr náhodného prvku podle váhy
const selectRandomByWeight = (items) => {
  const totalWeight = Object.values(items).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [item, weight] of Object.entries(items)) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return Object.keys(items)[0];
};

// Pomocná funkce pro výběr náhodného prvku z pole
const selectRandomFrom = (items) => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};

// Pomocná funkce pro výběr náhodného prvku z pole s pravděpodobnostmi
const selectRandomWithChance = (items) => {
  if (!items || items.length === 0) return null;
  
  // Kumulativní pravděpodobnosti
  let cumulative = 0;
  const ranges = items.map(item => {
    cumulative += item.chance;
    return { ...item, maxRange: cumulative };
  });
  
  const random = Math.random();
  return ranges.find(item => random <= item.maxRange) || items[0];
};

// Pomocná funkce pro výběr náhodného trestu
const selectRandomPenalty = () => {
  return selectRandomWithChance(PENALTY_TYPES);
};

// Funkce pro generování náhodné události
const generateRandomEvent = (gameTime, teamState, teams, score, highlightPlayersFn, setScore) => {
  if (!teamState) return null;
  
  // Vybereme náhodně útočící tým
  const attackingTeamId = Math.random() > 0.5 ? 'white' : 'black';
  const defendingTeamId = attackingTeamId === 'white' ? 'black' : 'white';
  
  const attackingTeamState = teamState[attackingTeamId];
  const defendingTeamState = teamState[defendingTeamId];
  const attackingTeamOnIce = attackingTeamState?.onIce ?? [];
  const defendingTeamOnIce = defendingTeamState?.onIce ?? [];
  
  // Kontrola, zda máme dostatek hráčů na ledě pro generování události
  if (attackingTeamOnIce.length < 4 || defendingTeamOnIce.length < 4) return null;
  
  // Vygenerujeme základní typ události
  const eventType = selectRandomByWeight(EVENT_TYPE_WEIGHTS);
  
  // Základní struktura události
  let event = { 
    time: gameTime, 
    team: attackingTeamId, 
    id: `${gameTime}-${attackingTeamId}-${Math.random().toString(36).substr(2, 9)}`,
    type: eventType
  };
  
  // Útočníci a obránci na ledě
  const attackingFieldPlayers = attackingTeamOnIce.filter(p => p && p.position !== 'brankář');
  const defendingFieldPlayers = defendingTeamOnIce.filter(p => p && p.position !== 'brankář');
  const defendingDefenders = defendingTeamOnIce.filter(p => p && p.position === 'obránce');
  
  // Brankáři
  const attackingGoalie = attackingTeamOnIce.find(p => p && p.position === 'brankář');
  const defendingGoalie = defendingTeamOnIce.find(p => p && p.position === 'brankář');
  
  // Vybereme náhodné hráče pro akci
  const attacker = selectRandomFrom(attackingFieldPlayers);
  const defender = selectRandomFrom(defendingFieldPlayers);
  const specificDefender = defendingDefenders.length > 0 
    ? selectRandomFrom(defendingDefenders) 
    : defender;
  
  // Pokud nemáme útočníka, nemůžeme generovat událost
  if (!attacker) return null;
  
  // Příprava textu pro týmy
  const attackingTeamName = attackingTeamId === 'white' ? 'Bílí' : 'Černí';
  const defendingTeamName = defendingTeamId === 'white' ? 'Bílí' : 'Černí';
  
  // Funkce pro formátování jména hráče s označením, zda je to hráč ovládaný uživatelem
  const formatPlayerName = (player) => {
    if (!player) return 'Neznámý hráč';
    return `${player.name} ${player.surname}${player.isPlayer ? ' (Ty!)' : ''}`;
  };
  
  // Zpracujeme událost podle jejího typu
  switch(eventType) {
    case 'shot': {
      event.player = attacker;
      event.description = `🏒 ${formatPlayerName(attacker)} (${attackingTeamName}) vystřelil na bránu!`;
      
      // Určíme následnou událost (gól, zákrok, blok...)
      let shotModifier = 0;
      
      // Upravíme šanci podle úrovně hráčů
      shotModifier += (attacker.level || 1) * 0.03;
      if (attacker.isPlayer) shotModifier += 0.05;
      if (defendingGoalie) shotModifier -= (defendingGoalie.level || 1) * 0.04;
      
      // Upravíme váhy následných událostí podle modifikátoru
      const modifiedFollowUps = FOLLOW_UP_EVENTS.shot.map(followUp => {
        let adjustedChance = followUp.chance;
        
        if (followUp.type === 'goal') {
          adjustedChance += shotModifier;
        } else if (followUp.type === 'save' && defendingGoalie) {
          adjustedChance -= shotModifier;
        }
        
        return { ...followUp, chance: Math.max(0.05, Math.min(0.95, adjustedChance)) };
      });
      
      const followUp = selectRandomWithChance(modifiedFollowUps);
      
      // Vytvoříme následnou událost
      if (followUp) {
        event.type = followUp.type;
        
        switch(followUp.type) {
          case 'goal': {
            // Zvýšíme skóre
            setScore(prev => ({ 
              ...prev, 
              [attackingTeamId]: prev[attackingTeamId] + 1 
            }));
            
            // Vybereme náhodně asistujícího hráče
            const possibleAssists = attackingFieldPlayers.filter(p => p.key !== attacker.key);
            const assistant = possibleAssists.length > 0 
              ? selectRandomFrom(possibleAssists)
              : null;
            
            event.assistant = assistant;
            event.goalieKey = defendingGoalie?.key;
            event.description = `🚨 GÓÓÓL! ${formatPlayerName(attacker)} (${attackingTeamName}) skóruje${assistant ? ` po přihrávce od ${formatPlayerName(assistant)}` : ''}!`;
            
            // Zvýrazníme hráče
            highlightPlayersFn([attacker.key, assistant?.key].filter(Boolean));
            break;
          }
          
          case 'save': {
            if (defendingGoalie) {
              event.player = defendingGoalie;
              event.shooter = attacker;
              event.description = `🧤 Zákrok! ${formatPlayerName(defendingGoalie)} (${defendingTeamName}) chytá ${followUp.description} ${formatPlayerName(attacker)}.`;
              
              // Zvýrazníme hráče
              highlightPlayersFn([defendingGoalie.key, attacker.key]);
            }
            break;
          }
          
          case 'block': {
            if (specificDefender) {
              event.player = specificDefender;
              event.attacker = attacker;
              event.description = `🛡️ Blok! ${formatPlayerName(specificDefender)} (${defendingTeamName}) zablokoval ${followUp.description} ${formatPlayerName(attacker)}!`;
              
              // Zvýrazníme hráče
              highlightPlayersFn([specificDefender.key, attacker.key]);
            }
            break;
          }
          
          case 'miss': {
            event.player = attacker;
            event.description = `💨 Střela vedle! ${formatPlayerName(attacker)} (${attackingTeamName}) minul branku.`;
            
            // Zvýrazníme hráče
            highlightPlayersFn(attacker.key);
            break;
          }
        }
      }
      break;
    }
    
    case 'pass': {
      const possibleReceivers = attackingFieldPlayers.filter(p => p.key !== attacker.key);
      const receiver = possibleReceivers.length > 0 
        ? selectRandomFrom(possibleReceivers)
        : null;
      
      if (receiver) {
        event.player = attacker;
        event.receiver = receiver;
        event.description = `🔄 ${formatPlayerName(attacker)} (${attackingTeamName}) přihrává na ${formatPlayerName(receiver)}.`;
        
        // Zvýrazníme hráče
        highlightPlayersFn([attacker.key, receiver.key]);
      } else {
        // Pokud nemáme komu přihrát, změníme na jiný typ události
        event.type = 'turnover';
        event.player = attacker;
        event.description = `🔄 ${formatPlayerName(attacker)} (${attackingTeamName}) se snaží přihrát, ale nikdo není volný.`;
        
        // Zvýrazníme hráče
        highlightPlayersFn(attacker.key);
      }
      break;
    }
    
    case 'defense': {
      if (specificDefender) {
        event.player = specificDefender;
        event.description = `🛡️ ${formatPlayerName(specificDefender)} (${defendingTeamName}) předvádí dobrý obranný zákrok.`;
        
        // Zvýrazníme hráče
        highlightPlayersFn(specificDefender.key);
      }
      break;
    }
    
    case 'hit': {
      if (defender) {
        event.player = attacker;
        event.target = defender;
        event.description = `💥 ${formatPlayerName(attacker)} (${attackingTeamName}) tvrdě bodyčekuje ${formatPlayerName(defender)}!`;
        
        // Zvýrazníme hráče
        highlightPlayersFn([attacker.key, defender.key]);
        
        // Kontrola, zda po bodyčeku následuje další událost (trest, ztráta puku)
        const followUp = selectRandomWithChance(FOLLOW_UP_EVENTS.hit);
        
        if (followUp && followUp.type === 'penalty') {
          const penalty = selectRandomPenalty();
          
          if (penalty) {
            event.type = 'penalty';
            event.player = attacker;
            event.penaltyMinutes = penalty.minutes;
            event.description = `😠 ${formatPlayerName(attacker)} (${attackingTeamName}) dostává ${penalty.minutes} minuty za ${penalty.description} po tvrdém bodyčeku!`;
          }
        }
      }
      break;
    }
    
    case 'turnover': {
      event.player = attacker;
      event.description = `🔄 ${formatPlayerName(attacker)} (${attackingTeamName}) ztrácí puk.`;
      
      // Zvýrazníme hráče
      highlightPlayersFn(attacker.key);
      break;
    }
    
    case 'icing': {
      event.team = attackingTeamId;
      event.description = `❄️ Zakázané uvolnění týmu ${attackingTeamName}.`;
      break;
    }
    
    case 'offside': {
      event.team = attackingTeamId;
      event.description = `🚫 Ofsajd týmu ${attackingTeamName}.`;
      break;
    }
    
    case 'penalty': {
      const penalty = selectRandomPenalty();
      
      if (penalty) {
        event.player = attacker;
        event.penaltyMinutes = penalty.minutes;
        event.description = `😠 ${formatPlayerName(attacker)} (${attackingTeamName}) dostává ${penalty.minutes} minuty za ${penalty.description}!`;
        
        // Zvýrazníme hráče
        highlightPlayersFn(attacker.key);
      }
      break;
    }
  }
  
  return event;
};

// Třída pro generátor událostí v zápase
class HockeyEventsGenerator {
  constructor() {
    this.lastEventTime = 0;
    this.nextEventTime = 0;
    this.processedEventIds = new Set();
  }
  
  // Vyčistí generátor pro nový zápas
  reset() {
    this.lastEventTime = 0;
    this.nextEventTime = 0;
    this.processedEventIds.clear();
  }
  
  // Naplánování další události
  scheduleNextEvent() {
    // Náhodný čas do další události (mezi MIN a MAX EVENT_SPACING)
    const timeToNextEvent = MIN_EVENT_SPACING + Math.random() * (MAX_EVENT_SPACING - MIN_EVENT_SPACING);
    this.nextEventTime = this.lastEventTime + timeToNextEvent;
  }
  
  // Kontrola, zda se má generovat nová událost
  shouldGenerateEvent(currentTime) {
    // Pokud ještě nemáme naplánovanou další událost, naplánujeme ji
    if (this.nextEventTime === 0) {
      this.scheduleNextEvent();
      return false;
    }
    
    // Kontrolujeme, zda jsme dosáhli naplánovaného času pro událost
    return currentTime >= this.nextEventTime;
  }
  
  // Hlavní metoda pro vygenerování nové události
  generateEvent(currentTime, gameState) {
    const { teamState, teams, score, setScore, triggerHighlight } = gameState;
    
    // Pokud by se neměla generovat událost, vrátíme null
    if (!this.shouldGenerateEvent(currentTime)) {
      return null;
    }
    
    // Vygenerujeme událost
    const event = generateRandomEvent(currentTime, teamState, teams, score, triggerHighlight, setScore);
    
    // Aktualizujeme čas poslední události a naplánujeme další
    this.lastEventTime = currentTime;
    this.scheduleNextEvent();
    
    return event;
  }
  
  // Metoda pro sledování zpracovaných událostí (aby nedošlo k duplicitám)
  markEventAsProcessed(eventId) {
    this.processedEventIds.add(eventId);
  }
  
  // Kontrola, zda byla událost již zpracována
  isEventProcessed(eventId) {
    return this.processedEventIds.has(eventId);
  }
}

export default HockeyEventsGenerator;
export { generateRandomEvent, getEventIcon };