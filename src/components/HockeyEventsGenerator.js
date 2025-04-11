'use client';

import { getEventIcon } from './HockeyComponents';

// Konstanty pro generování událostí
const BASE_EVENT_CHANCE = 0.2;
const MIN_EVENT_SPACING = 5;
const MAX_EVENT_SPACING = 25;
const EVENT_CHECK_INTERVAL = 5;

// Váhy pro jednotlivé typy akcí
const EVENT_TYPE_WEIGHTS = {
  shot: 35,           // Střela
  pass: 20,           // Přihrávka
  defense: 15,        // Obranný zákrok
  hit: 10,            // Bodyček
  turnover: 8,        // Ztráta puku
  icing: 5,           // Zakázané uvolnění
  offside: 5,         // Ofsajd
  penalty: 2          // Trest
};

// Speciální typy akcí, které se mohou stát po jiných akcích
const FOLLOW_UP_EVENTS = {
  shot: [
    { type: 'goal', chance: 0.25, description: 'střelu' },
    { type: 'save', chance: 0.45, description: 'střelu' },
    { type: 'block', chance: 0.15, description: 'střelu' },
    { type: 'miss', chance: 0.15, description: 'střelu' }
  ],
  hit: [
    { type: 'penalty', chance: 0.15, description: 'bodyček' },
    { type: 'turnover', chance: 0.35, description: 'bodyček' }
  ]
};

// Typy trestů a jejich pravděpodobnosti
const PENALTY_TYPES = [
  { minutes: 2, description: 'menší trest za hákování', chance: 0.2 },
  { minutes: 2, description: 'menší trest za držení', chance: 0.15 },
  { minutes: 2, description: 'menší trest za sekání', chance: 0.12 },
  { minutes: 2, description: 'menší trest za nedovolené bránění', chance: 0.12 },
  { minutes: 2, description: 'menší trest za vysokou hůl', chance: 0.1 },
  { minutes: 2, description: 'menší trest za krosček', chance: 0.08 },
  { minutes: 2, description: 'menší trest za podražení', chance: 0.08 },
  { minutes: 4, description: 'dvojitý menší trest za krvavé zranění', chance: 0.08 },
  { minutes: 5, description: 'větší trest za napadení', chance: 0.04 },
  { minutes: 5, description: 'větší trest za úder loktem', chance: 0.02 },
  { minutes: 5, description: 'větší trest za naražení zezadu', chance: 0.01 }
];

// === SLOVNÍKY PRO DETAILNÍ POPISY UDÁLOSTÍ ===

// Adjektiva pro popis střel
const SHOT_ADJECTIVES = [
  'tvrdou', 'ostrou', 'prudkou', 'nechytatelnou', 'razantní', 'nebezpečnou', 
  'přesnou', 'překvapivou', 'pohotovou', 'dělovitou', 'technickou', 'křižnou',
  'rychlou', 'pumelici', 'perfektně umístěnou', 'nepříjemnou'
];

// Způsoby provedení střely
const SHOT_TYPES = [
  'z první', 'bez přípravy', 'po rychlé kombinaci', 'z otočky', 'z mezikruží',
  'po objetí branky', 'po přihrávce zpoza branky', 'po individuálním průniku',
  'z pravého kruhu', 'z levého kruhu', 'z vrcholu kruhu', 'z osy kluziště',
  'po přečíslení', 'z dorážky', 'golfovým úderem', 'po kličce'
];

// Místa střely
const SHOT_TARGETS = [
  'do horního rohu', 'k bližší tyči', 'k vzdálenější tyči', 'mezi betony',
  'pod vyrážečku', 'nad lapačku', 'do horního rohu', 'do šibenice',
  'po ledě', 'nad branku', 'vedle branky', 'těsně nad břevno',
  'do protipohybu brankáře', 'do brankoviště'
];

// Popisy brankářských zákroků
const SAVE_DESCRIPTIONS = [
  'vyrazil lapačkou', 'chytil do lapačky', 'zastavil betonem', 'vyrazil vyrážečkou',
  'se štěstím zastavil', 'reflexivně vykopl', 'chytil na druhý pokus',
  'schoval pod lapačku', 'zlikvidoval', 'skvěle vyrazil', 'famózně zneškodnil',
  'vyrazil ramenem', 'zastavil tělem', 'ukryl pod betony', 'vykopl pravým betonem',
  'zneškodnil bleskovou reakcí', 'vytěsnil konečky prstů'
];

// Popis přihrávek
const PASS_DESCRIPTIONS = [
  'přesnou přihrávkou našel', 'výborně přihrál na', 'poslal přihrávku mezi kruhy na',
  'zpoza branky poslal kotouč na', 'posunul puk na', 'bekhendem našel přihrávkou',
  'přihrál z první na', 'poslal kotouč křižně na', 'z otočky přihrál na',
  'dokonale našel volného', 'přes dva hráče poslal puk na', 'zpětnou přihrávkou vybídl',
  'předložil puk ideálně pro', 'posunul na modrou čáru na'
];

// Popis bodyčeků
const HIT_DESCRIPTIONS = [
  'tvrdě bodyčekoval', 'atakoval u mantinelu', 'složil čistým hitem',
  'poslal k ledu', 'přišpendlil na mantinel', 'vystavil do cesty jasný bodyček',
  'důrazně zastavil', 'nemilosrdně sundal', 'složil na led drtivým hitem',
  'vybodoval v souboji u hrazení', 'atakoval ramenem', 'tvrdě dohrál'
];

// Popis ztráty puku
const TURNOVER_DESCRIPTIONS = [
  'pod tlakem ztratil kotouč', 'neudržel puk na holi', 'pokazil rozehrávku',
  'přišel o puk v souboji s', 'ztratil kontrolu nad pukem', 'nahrál přímo na hokejku',
  'byl okraden o puk hráčem', 'přišel o kotouč po důrazu', 'chyboval v rozehrávce',
  'neudržel puk na útočné modré', 'přehodil hrazení a poslal kotouč mimo hru',
  'udělal chybu v rozehrávce a daroval puk'
];

// Popis obranných zákroků
const DEFENSE_DESCRIPTIONS = [
  'skvěle vypíchnul kotouč', 'zablokoval přihrávku', 'výborně přečetl hru a zachytil kotouč',
  'byl první u puku a odvrátil nebezpečí', 'obětavě padl do střely', 'dobrým postavením zabránil šanci',
  'výborným zákrokem zmařil útočnou akci', 'odebral puk čistým zákrokem', 'přečetl přihrávku a zachytil ji',
  'vytlačil soupeře z ideální pozice', 'vypíchnul puk v poslední chvíli'
];

// Popis blokování střel
const BLOCK_DESCRIPTIONS = [
  'obětavě zablokoval střelu', 'vrhnul se pod puk', 'skvěle si lehl do střely',
  'nastavil tělo a zablokoval ránu', 'tělem zastavil nebezpečný pokus', 'obětavým skluzem zblokoval střelu',
  'položil se na led a zabránil střele projít', 'prudkou ránu zastavil vlastním tělem',
  'statečně nastavil holeně', 'blokoval střelu za cenu bolesti'
];

// Způsoby gólu
const GOAL_DESCRIPTIONS = [
  'zavěsil přesně nad rameno brankáře', 'propálil brankáře', 'trefil přesně k tyči',
  'uklidil puk do prázdné branky', 'doklepnul kotouč do sítě', 'prostřelil gólmana mezi betony',
  'překonal brankáře střelou do šibenice', 'trefil se nechytatelně po ledě k tyči',
  'poslal puk přesně nad lapačku', 'zavěsil efektně pod břevno', 'nachytal brankáře střelou na bližší tyč',
  'propálil vše, co mu stálo v cestě', 'rychlou kličkou obhodil gólmana a skóroval',
  'prudkou ranou nedal brankáři šanci', 'dorazil odražený puk do sítě'
];

// Způsoby přečíslení
const ODD_MAN_RUSH = [
  'přečíslení 2 na 1', 'přečíslení 3 na 2', 'brejk', 'únik', 'rychlý protiútok',
  'početní výhodu', 'výhodu přečíslení', 'samostatný únik'
];

// === POMOCNÉ FUNKCE ===

// Výběr náhodné položky podle váhy
function selectRandomByWeight(items) {
  const totalWeight = Object.values(items).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [item, weight] of Object.entries(items)) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return Object.keys(items)[0];
}

// Výběr náhodné položky z pole
function selectRandomFrom(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

// Výběr náhodné položky podle pravděpodobnosti
function selectRandomWithChance(items) {
  if (!items || items.length === 0) return null;
  
  let cumulative = 0;
  const ranges = items.map(item => {
    cumulative += item.chance;
    return { ...item, maxRange: cumulative };
  });
  
  const random = Math.random();
  return ranges.find(item => random <= item.maxRange) || items[0];
}

// Výběr náhodného trestu
function selectRandomPenalty() {
  return selectRandomWithChance(PENALTY_TYPES);
}

// Funkce pro vytvoření vylepšeného popisu události
function createEnhancedDescription(eventType, data) {
  const { attacker, defender, team, teamName, opposingTeamName, goalie, assistants = [] } = data;
  const attackerName = `${attacker.name} ${attacker.surname}${attacker.isPlayer ? ' (Ty!)' : ''}`;
  
  // Funkce získá jméno týmu s velkým prvním písmenem
  const formatTeamName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  switch(eventType) {
    case 'shot': {
      const adjective = selectRandomFrom(SHOT_ADJECTIVES);
      const shotType = selectRandomFrom(SHOT_TYPES);
      const target = selectRandomFrom(SHOT_TARGETS);
      
      return `🏒 ${attackerName} (${formatTeamName(teamName)}) vystřelil ${adjective} ránu ${shotType} ${target}!`;
    }
    
    case 'goal': {
      const goalDescription = selectRandomFrom(GOAL_DESCRIPTIONS);
      let description = `🚨 GÓÓÓL! ${attackerName} (${formatTeamName(teamName)}) ${goalDescription}`;
      
      // Přidání asistentů, pokud existují
      if (assistants.length > 0) {
        const assistant1Name = `${assistants[0].name} ${assistants[0].surname}${assistants[0].isPlayer ? ' (Ty!)' : ''}`;
        
        if (assistants.length === 1) {
          description += ` po přihrávce od ${assistant1Name}`;
        } else {
          const assistant2Name = `${assistants[1].name} ${assistants[1].surname}${assistants[1].isPlayer ? ' (Ty!)' : ''}`;
          description += ` po souhře ${assistant1Name} a ${assistant2Name}`;
        }
      }
      
      description += '!';
      
      // Občas přidáme informaci o skóre
      if (Math.random() > 0.5 && data.score) {
        description += ` Stav utkání je nyní ${data.score[team]}:${data.score[team === 'white' ? 'black' : 'white']}.`;
      }
      
      return description;
    }
    
    case 'save': {
      if (!goalie) return null;
      
      const adjective = selectRandomFrom(SHOT_ADJECTIVES);
      const shotType = selectRandomFrom(SHOT_TYPES);
      const saveDescription = selectRandomFrom(SAVE_DESCRIPTIONS);
      const goalieName = `${goalie.name} ${goalie.surname}${goalie.isPlayer ? ' (Ty!)' : ''}`;
      
      return `🧤 Zákrok! ${goalieName} (${formatTeamName(opposingTeamName)}) ${saveDescription} ${adjective} střelu ${attackerName} ${shotType}.`;
    }
    
    case 'block': {
      if (!defender) return null;
      
      const blockDescription = selectRandomFrom(BLOCK_DESCRIPTIONS);
      const defenderName = `${defender.name} ${defender.surname}${defender.isPlayer ? ' (Ty!)' : ''}`;
      
      return `🛡️ Blok! ${defenderName} (${formatTeamName(opposingTeamName)}) ${blockDescription} od ${attackerName}!`;
    }
    
    case 'miss': {
      const shotType = selectRandomFrom(SHOT_TYPES);
      
      return `💨 ${attackerName} (${formatTeamName(teamName)}) vyslal střelu ${shotType}, ale minul branku a puk letí mimo!`;
    }
    
    case 'pass': {
      if (!data.receiver) return null;
      
      const passDescription = selectRandomFrom(PASS_DESCRIPTIONS);
      const receiverName = `${data.receiver.name} ${data.receiver.surname}${data.receiver.isPlayer ? ' (Ty!)' : ''}`;
      
      return `🔄 ${attackerName} (${formatTeamName(teamName)}) ${passDescription} ${receiverName}.`;
    }
    
    case 'defense': {
      if (!defender) return null;
      
      const defenseDescription = selectRandomFrom(DEFENSE_DESCRIPTIONS);
      const defenderName = `${defender.name} ${defender.surname}${defender.isPlayer ? ' (Ty!)' : ''}`;
      
      return `🛡️ ${defenderName} (${formatTeamName(opposingTeamName)}) ${defenseDescription} v souboji s ${attackerName}.`;
    }
    
    case 'hit': {
      if (!defender) return null;
      
      const hitDescription = selectRandomFrom(HIT_DESCRIPTIONS);
      const defenderName = `${defender.name} ${defender.surname}${defender.isPlayer ? ' (Ty!)' : ''}`;
      
      return `💥 ${attackerName} (${formatTeamName(teamName)}) ${hitDescription} ${defenderName}!`;
    }
    
    case 'turnover': {
      const turnoverDescription = selectRandomFrom(TURNOVER_DESCRIPTIONS);
      
      // Někdy přidáme jméno obránce
      if (defender && Math.random() > 0.5) {
        const defenderName = `${defender.name} ${defender.surname}${defender.isPlayer ? ' (Ty!)' : ''}`;
        return `🔄 ${attackerName} (${formatTeamName(teamName)}) ${turnoverDescription} ${defenderName}.`;
      }
      
      return `🔄 ${attackerName} (${formatTeamName(teamName)}) ${turnoverDescription}.`;
    }
    
    case 'icing': {
      const icingVariants = [
        `❄️ Zakázané uvolnění týmu ${formatTeamName(teamName)}. Bude se vhazovat v obranném pásmu.`,
        `❄️ ${formatTeamName(teamName)} posílají kotouč přes všechny čáry! Rozhodčí odpískává zakázané uvolnění.`,
        `❄️ Puk přeletěl přes celé kluziště! Zakázané uvolnění proti týmu ${formatTeamName(teamName)}.`
      ];
      
      return selectRandomFrom(icingVariants);
    }
    
    case 'offside': {
      const offsideVariants = [
        `🚫 Ofsajd týmu ${formatTeamName(teamName)}. Rozhodčí přerušuje hru, puk opustil útočné pásmo.`,
        `🚫 ${formatTeamName(teamName)} při vstupu do pásma přechází modrou čáru nepovoleně! Rozhodčí signalizuje ofsajd.`,
        `🚫 ${attackerName} vstupuje do pásma příliš brzy. Čárový rozhodčí odpískává ofsajd.`
      ];
      
      return selectRandomFrom(offsideVariants);
    }
    
    case 'penalty': {
      const penalty = data.penalty;
      
      if (!penalty) return null;
      
      return `😠 ${attackerName} (${formatTeamName(teamName)}) dostává ${penalty.minutes} minuty za ${penalty.description}! ${
        Math.random() > 0.5 ? `${formatTeamName(opposingTeamName)} budou hrát v přesilovce.` : ''
      }`;
    }
    
    default: 
      return null;
  }
}

// Funkce pro generování náhodné události
function generateRandomEvent(gameTime, teamState, teams, score, highlightPlayersFn, setScore) {
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
  const attackingTeamName = attackingTeamId === 'white' ? 'bílí' : 'černí';
  const defendingTeamName = defendingTeamId === 'white' ? 'bílí' : 'černí';
  
  // Zpracujeme událost podle jejího typu
  switch(eventType) {
    case 'shot': {
      event.player = attacker;
      
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
            if (setScore) {
              setScore(prev => ({ 
                ...prev, 
                [attackingTeamId]: prev[attackingTeamId] + 1 
              }));
            }
            
            // Vybereme náhodně asistujícího hráče
            const possibleAssists = attackingFieldPlayers.filter(p => p.key !== attacker.key);
            const assistant = possibleAssists.length > 0 
              ? selectRandomFrom(possibleAssists)
              : null;
            
            // Někdy přidáme i druhého asistenta
            let secondAssistant = null;
            if (assistant && possibleAssists.length > 1 && Math.random() > 0.5) {
              const possibleSecondAssists = possibleAssists.filter(p => p.key !== assistant.key);
              secondAssistant = possibleSecondAssists.length > 0 
                ? selectRandomFrom(possibleSecondAssists)
                : null;
            }
            
            event.assistant = assistant;
            event.secondAssistant = secondAssistant;
            event.goalieKey = defendingGoalie?.key;
            
            // Vytvoříme vylepšený popis gólu
            event.description = createEnhancedDescription('goal', {
              attacker,
              team: attackingTeamId,
              teamName: attackingTeamName, 
              opposingTeamName: defendingTeamName,
              assistants: [assistant, secondAssistant].filter(Boolean),
              score
            });
            
            // Zvýrazníme hráče
            if (highlightPlayersFn) {
              highlightPlayersFn([attacker.key, assistant?.key].filter(Boolean));
            }
            break;
          }
          
          case 'save': {
            if (defendingGoalie) {
              event.player = defendingGoalie;
              event.shooter = attacker;
              
              event.description = createEnhancedDescription('save', {
                attacker,
                goalie: defendingGoalie,
                teamName: attackingTeamName,
                opposingTeamName: defendingTeamName
              });
              
              // Zvýrazníme hráče
              if (highlightPlayersFn) {
                highlightPlayersFn([defendingGoalie.key, attacker.key]);
              }
            }
            break;
          }
          
          case 'block': {
            if (specificDefender) {
              event.player = specificDefender;
              event.attacker = attacker;
              
              event.description = createEnhancedDescription('block', {
                attacker,
                defender: specificDefender,
                teamName: attackingTeamName,
                opposingTeamName: defendingTeamName
              });
              
              // Zvýrazníme hráče
              if (highlightPlayersFn) {
                highlightPlayersFn([specificDefender.key, attacker.key]);
              }
            }
            break;
          }
          
          case 'miss': {
            event.player = attacker;
            
            event.description = createEnhancedDescription('miss', {
              attacker,
              teamName: attackingTeamName
            });
            
            // Zvýrazníme hráče
            if (highlightPlayersFn) {
              highlightPlayersFn(attacker.key);
            }
            break;
          }
        }
      } else {
        // Pokud není následná událost, vytvoříme popis střely
        event.description = createEnhancedDescription('shot', {
          attacker,
          teamName: attackingTeamName
        });
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn(attacker.key);
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
        
        event.description = createEnhancedDescription('pass', {
          attacker,
          receiver,
          teamName: attackingTeamName
        });
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn([attacker.key, receiver.key]);
        }
      } else {
        // Pokud nemáme komu přihrát, změníme na jiný typ události
        event.type = 'turnover';
        event.player = attacker;
        
        event.description = createEnhancedDescription('turnover', {
          attacker,
          teamName: attackingTeamName
        });
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn(attacker.key);
        }
      }
      break;
    }
    
    case 'defense': {
      if (specificDefender) {
        event.player = specificDefender;
        
        event.description = createEnhancedDescription('defense', {
          defender: specificDefender,
          attacker,
          teamName: defendingTeamName,
          opposingTeamName: attackingTeamName
        });
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn(specificDefender.key);
        }
      }
      break;
    }
    
    case 'hit': {
      if (defender) {
        event.player = attacker;
        event.target = defender;
        
        event.description = createEnhancedDescription('hit', {
          attacker,
          defender,
          teamName: attackingTeamName
        });
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn([attacker.key, defender.key]);
        }
        
        // Kontrola, zda po bodyčeku následuje další událost (trest, ztráta puku)
        const followUp = selectRandomWithChance(FOLLOW_UP_EVENTS.hit);
        
        if (followUp && followUp.type === 'penalty') {
          const penalty = selectRandomPenalty();
          
          if (penalty) {
            event.type = 'penalty';
            event.player = attacker;
            event.penaltyMinutes = penalty.minutes;
            
            event.description = `😠 ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává ${penalty.minutes} minuty za ${penalty.description}! ${
              Math.random() > 0.5 ? `${defendingTeamId === 'white' ? 'Bílí' : 'Černí'} budou hrát v přesilovce.` : ''
            }`;
          }
        }
      }
      break;
    }
    
    case 'turnover': {
      event.player = attacker;
      
      event.description = createEnhancedDescription('turnover', {
        attacker,
        defender,
        teamName: attackingTeamName,
        opposingTeamName: defendingTeamName
      });
      
      // Zvýrazníme hráče
      if (highlightPlayersFn) {
        highlightPlayersFn(attacker.key);
      }
      break;
    }
    
    case 'icing': {
      event.team = attackingTeamId;
      
      event.description = createEnhancedDescription('icing', {
        teamName: attackingTeamName
      });
      break;
    }
    
    case 'offside': {
      event.team = attackingTeamId;
      
      event.description = createEnhancedDescription('offside', {
        attacker,
        teamName: attackingTeamName
      });
      break;
    }
    
    case 'penalty': {
      const penalty = selectRandomPenalty();
      
      if (penalty) {
        event.player = attacker;
        event.penaltyMinutes = penalty.minutes;
        
        event.description = `😠 ${attacker.name} ${attacker.surname} ${attacker.isPlayer ? '(Ty!)' : ''} (${attackingTeamId === 'white' ? 'Bílí' : 'Černí'}) dostává ${penalty.minutes} minuty za ${penalty.description}! ${
          Math.random() > 0.5 ? `${defendingTeamId === 'white' ? 'Bílí' : 'Černí'} budou hrát v přesilovce.` : ''
        }`;
        
        // Zvýrazníme hráče
        if (highlightPlayersFn) {
          highlightPlayersFn(attacker.key);
        }
      }
      break;
    }
  }
  
  return event;
}

// Třída pro generátor událostí v zápase
class HockeyEventsGenerator {
  constructor() {
    this.lastEventTime = 0;
    this.nextEventTime = 0;
    this.processedEventIds = new Set();
    console.log("✅ Vylepšený hokejový generátor událostí inicializován.");
  }
  
  reset() {
    this.lastEventTime = 0;
    this.nextEventTime = 0;
    this.processedEventIds.clear();
    console.log("🔄 Hokejový generátor událostí resetován.");
  }
  
  scheduleNextEvent() {
    const timeToNextEvent = MIN_EVENT_SPACING + Math.random() * (MAX_EVENT_SPACING - MIN_EVENT_SPACING);
    this.nextEventTime = this.lastEventTime + timeToNextEvent;
  }
  
  shouldGenerateEvent(currentTime) {
    if (this.nextEventTime === 0) {
      this.scheduleNextEvent();
      return false;
    }
    
    return currentTime >= this.nextEventTime;
  }
  
  // Hlavní metoda volaná z OldaHockeyMatch.js
  generateEvent(currentTime, gameState) {
    const { teamState, teams, score, setScore, triggerHighlight } = gameState;
    
    if (!this.shouldGenerateEvent(currentTime)) {
      return null;
    }
    
    const event = generateRandomEvent(currentTime, teamState, teams, score, triggerHighlight, setScore);
    
    this.lastEventTime = currentTime;
    this.scheduleNextEvent();
    
    return event;
  }
  
  markEventAsProcessed(eventId) {
    this.processedEventIds.add(eventId);
  }
  
  isEventProcessed(eventId) {
    return this.processedEventIds.has(eventId);
  }
}

export default HockeyEventsGenerator;
export { generateRandomEvent, getEventIcon };