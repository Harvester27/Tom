"use client";

// Pomocná funkce pro odstranění diakritiky - vytaženo jako globální funkce
const removeDiacritics = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Pomocná funkce pro převod jména na název souboru
const getPhotoFilename = (name, surname) => {
  // Speciální případ pro Oldřicha Štěpanovského
  if (name === "Oldřich" && surname === "Štěpanovský") {
    return "oldrich_stepanovsky.png";
  }

  // Převod jména a příjmení na formát pro soubor
  const cleanName = removeDiacritics(name);
  const cleanSurname = removeDiacritics(surname);
  
  // Speciální případy pro Schubadu
  if (surname === "Schubada St.") {
    return "Pavel_Schubada st.png";
  }
  if (surname === "Schubada ml.") {
    return "Pavel_Schubada ml.png";
  }
  
  // Pro ostatní hráče zachováme velká písmena
  return `${cleanName}_${cleanSurname}.png`;
};

const personalityTypes = {
  pratelsky: {
    name: "Přátelský",
    description: "Otevřený a vstřícný, snadno si vytváří vztahy",
    baseRelationship: 60,
    relationshipModifiers: {
      win: +5,  // Při výhře
      loss: -2, // Při prohře
      assist: +8, // Když mu hráč nahraje na gól
      mistake: -3, // Když hráč udělá chybu
      compliment: +10, // Při pochvale
      criticism: -5  // Při kritice
    }
  },
  profesional: {
    name: "Profesionál",
    description: "Soustředí se hlavně na výkon a profesionalitu",
    baseRelationship: 50,
    relationshipModifiers: {
      win: +3,
      loss: -3,
      assist: +5,
      mistake: -5,
      compliment: +5,
      criticism: -3
    }
  },
  soutezivi: {
    name: "Soutěživý",
    description: "Klade velký důraz na výhry a osobní úspěchy",
    baseRelationship: 45,
    relationshipModifiers: {
      win: +8,
      loss: -6,
      assist: +10,
      mistake: -8,
      compliment: +6,
      criticism: -7
    }
  },
  mentor: {
    name: "Mentor",
    description: "Rád pomáhá mladším a méně zkušeným hráčům",
    baseRelationship: 70,
    relationshipModifiers: {
      win: +4,
      loss: -2,
      assist: +6,
      mistake: -2,
      compliment: +8,
      criticism: -4
    }
  },
  samotarsky: {
    name: "Samotářský",
    description: "Drží si odstup, ale je spolehlivý",
    baseRelationship: 30,
    relationshipModifiers: {
      win: +2,
      loss: -2,
      assist: +4,
      mistake: -4,
      compliment: +3,
      criticism: -6
    }
  },
  vtipkar: {
    name: "Vtipkař",
    description: "Udržuje dobrou náladu v týmu",
    baseRelationship: 65,
    relationshipModifiers: {
      win: +6,
      loss: -1,
      assist: +7,
      mistake: -2,
      compliment: +8,
      criticism: -4
    }
  }
};

const litvinovLancers = {
  teamName: "Litvínov Lancers",
  players: [
    // Brankáři
    {
      name: "Vlastimil",
      surname: "Nistor",
      position: "brankář",
      level: 8,
      attendance: 90,
      reliability: 95,
      personality: "profesional",
      relationship: 50,
      photo: getPhotoFilename("Vlastimil", "Nistor")
    },
    {
      name: "Michaela",
      surname: "Nováková",
      position: "brankář",
      level: 6,
      attendance: 75,
      reliability: 85,
      personality: "vtipkar",
      relationship: 65,
      photo: getPhotoFilename("Michaela", "Novakova")
    },
    {
      name: "Jakub",
      surname: "Seidler",
      position: "brankář",
      level: 4,
      attendance: 60,
      reliability: 90,
      personality: "samotarsky",
      relationship: 30,
      photo: getPhotoFilename("Jakub", "Seidler")
    },

    // Obránci
    {
      name: "Jiří",
      surname: "Belinger",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 90,
      personality: "mentor",
      relationship: 70,
      photo: getPhotoFilename("Jiri", "Belinger")
    },
    {
      name: "Roman",
      surname: "Šimek",
      position: "obránce",
      level: 9,
      attendance: 95,
      reliability: 98,
      personality: "profesional",
      relationship: 50,
      photo: getPhotoFilename("Roman", "Simek")
    },
    {
      name: "Jindřich",
      surname: "Belinger",
      position: "obránce",
      level: 5,
      attendance: 70,
      reliability: 75,
      personality: "soutezivi",
      relationship: 45,
      photo: getPhotoFilename("Jindrich", "Belinger")
    },
    {
      name: "Luboš",
      surname: "Coufal",
      position: "obránce",
      level: 6,
      attendance: 80,
      reliability: 85,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Luboš", "Coufal")
    },
    {
      name: "Tomáš",
      surname: "Tureček",
      position: "obránce",
      level: 4,
      attendance: 65,
      reliability: 70,
      personality: "vtipkar",
      relationship: 65,
      photo: getPhotoFilename("Tomas", "Turecek")
    },
    {
      name: "Oldřich",
      surname: "Štěpanovský",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 88,
      personality: "mentor",
      relationship: 70,
      photo: getPhotoFilename("Oldrich", "Stepanovsky")
    },
    {
      name: "Jan",
      surname: "Hanuš",
      position: "obránce",
      level: 5,
      attendance: 75,
      reliability: 82,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Jan", "Hanus")
    },
    {
      name: "Jiří",
      surname: "Koláček",
      position: "obránce",
      level: 3,
      attendance: 55,
      reliability: 65,
      personality: "samotarsky",
      relationship: 30,
      photo: getPhotoFilename("Jiri", "Kolacek")
    },
    {
      name: "Pavel",
      surname: "Schubada St.",
      position: "obránce",
      level: 6,
      attendance: 78,
      reliability: 85,
      personality: "soutezivi",
      relationship: 45,
      photo: getPhotoFilename("Pavel", "Schubada st.")
    },

    // Útočníci
    {
      name: "Václav",
      surname: "Matějovič",
      position: "útočník",
      level: 8,
      attendance: 90,
      reliability: 92,
      personality: "profesional",
      relationship: 50,
      photo: getPhotoFilename("Vaclav", "Matejovic")
    },
    {
      name: "Stanislav",
      surname: "Švarc",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 88,
      personality: "mentor",
      relationship: 70,
      photo: getPhotoFilename("Stanislav", "Svarc")
    },
    {
      name: "Vašek",
      surname: "Materna",
      position: "útočník",
      level: 9,
      attendance: 95,
      reliability: 96,
      personality: "soutezivi",
      relationship: 45,
      photo: getPhotoFilename("Vasek", "Materna")
    },
    {
      name: "Ladislav",
      surname: "Černý",
      position: "útočník",
      level: 5,
      attendance: 70,
      reliability: 75,
      personality: "vtipkar",
      relationship: 65,
      photo: getPhotoFilename("Ladislav", "Cerny")
    },
    {
      name: "Pavel",
      surname: "Schubada ml.",
      position: "útočník",
      level: 6,
      attendance: 80,
      reliability: 85,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Pavel", "Schubada ml.")
    },
    {
      name: "Gustav",
      surname: "Toman",
      position: "útočník",
      level: 4,
      attendance: 60,
      reliability: 70,
      personality: "samotarsky",
      relationship: 30,
      photo: getPhotoFilename("Gustav", "Toman")
    },
    {
      name: "Adam",
      surname: "Schubada",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 90,
      personality: "profesional",
      relationship: 50,
      photo: getPhotoFilename("Adam", "Schubada")
    },
    {
      name: "Jan",
      surname: "Švarc",
      position: "útočník",
      level: 5,
      attendance: 75,
      reliability: 80,
      personality: "vtipkar",
      relationship: 65,
      photo: getPhotoFilename("Jan", "Svarc")
    },
    {
      name: "Petr",
      surname: "Štěpanovský",
      position: "útočník",
      level: 8,
      attendance: 88,
      reliability: 92,
      personality: "mentor",
      relationship: 70,
      photo: getPhotoFilename("Petr", "Stepanovsky")
    },
    {
      name: "Jiří",
      surname: "Šalanda",
      position: "útočník",
      level: 6,
      attendance: 78,
      reliability: 83,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Jiri", "Salanda")
    },
    {
      name: "Marian",
      surname: "Dlugopolsky",
      position: "útočník",
      level: 3,
      attendance: 50,
      reliability: 60,
      personality: "samotarsky",
      relationship: 30,
      photo: getPhotoFilename("Marian", "Dlugopolsky")
    },
    {
      name: "Jan",
      surname: "Schubada",
      position: "útočník",
      level: 5,
      attendance: 72,
      reliability: 78,
      personality: "soutezivi",
      relationship: 45,
      photo: getPhotoFilename("Jan", "Schubada")
    },
    {
      name: "Aleš",
      surname: "Kuřitka",
      position: "útočník",
      level: 7,
      attendance: 83,
      reliability: 87,
      personality: "profesional",
      relationship: 50,
      photo: getPhotoFilename("Aleš", "Kuritka")
    },
    {
      name: "Pavel",
      surname: "Novák",
      position: "útočník",
      level: 4,
      attendance: 65,
      reliability: 72,
      personality: "vtipkar",
      relationship: 65,
      photo: getPhotoFilename("Pavel", "Novak")
    },
    {
      name: "Ondřej",
      surname: "Hrubý",
      position: "útočník",
      level: 6,
      attendance: 77,
      reliability: 82,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Ondrej", "Hruby")
    },
    {
      name: "Roman",
      surname: "Beneš",
      position: "útočník",
      level: 5,
      attendance: 73,
      reliability: 79,
      personality: "mentor",
      relationship: 70,
      photo: getPhotoFilename("Roman", "Benes")
    },
    {
      name: "Kateřina",
      surname: "Schubadová",
      position: "útočník",
      level: 1,
      attendance: 68,
      reliability: 75,
      personality: "samotarsky",
      relationship: 30,
      photo: getPhotoFilename("Kateřina", "Schubadova")
    },
    {
      name: "Petra",
      surname: "Volmutová",
      position: "útočník",
      level: 2,
      attendance: 82,
      reliability: 86,
      personality: "soutezivi",
      relationship: 45,
      photo: getPhotoFilename("Petra", "Volmutova")
    },
    {
      name: "Jaroslav",
      surname: "Volmut",
      position: "útočník",
      level: 5,
      attendance: 71,
      reliability: 77,
      personality: "pratelsky",
      relationship: 60,
      photo: getPhotoFilename("Jaroslav", "Volmut")
    }
  ],

  // Pomocné funkce pro práci s týmem
  getPlayersByPosition: function(position) {
    return this.players.filter(player => player.position === position);
  },

  getPlayersByLevel: function(minLevel) {
    return this.players.filter(player => player.level >= minLevel);
  },

  getReliablePlayers: function(minReliability) {
    return this.players.filter(player => player.reliability >= minReliability);
  },

  getActivePlayers: function(minAttendance) {
    return this.players.filter(player => player.attendance >= minAttendance);
  },

  // Funkce pro práci se vztahy
  updateRelationship: function(playerId, event) {
    const player = this.players.find(p => p.name + p.surname === playerId);
    if (!player) return;

    const personality = personalityTypes[player.personality];
    const modifier = personality.relationshipModifiers[event];
    
    if (modifier) {
      player.relationship = Math.max(0, Math.min(100, player.relationship + modifier));
    }
  },

  getPlayersByRelationship: function(minRelationship) {
    return this.players.filter(player => player.relationship >= minRelationship);
  },

  getPlayerPersonality: function(playerId) {
    const player = this.players.find(p => p.name + p.surname === playerId);
    if (!player) return null;
    return personalityTypes[player.personality];
  },

  // Statistiky týmu
  getTeamStats: function() {
    const stats = {
      averageLevel: 0,
      averageAttendance: 0,
      averageReliability: 0,
      averageRelationship: 0,
      playersByPosition: {
        brankář: 0,
        obránce: 0,
        útočník: 0
      },
      personalityDistribution: Object.keys(personalityTypes).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {})
    };

    this.players.forEach(player => {
      stats.averageLevel += player.level;
      stats.averageAttendance += player.attendance;
      stats.averageReliability += player.reliability;
      stats.averageRelationship += player.relationship;
      stats.playersByPosition[player.position]++;
      stats.personalityDistribution[player.personality]++;
    });

    const playerCount = this.players.length;
    stats.averageLevel = (stats.averageLevel / playerCount).toFixed(1);
    stats.averageAttendance = (stats.averageAttendance / playerCount).toFixed(1);
    stats.averageReliability = (stats.averageReliability / playerCount).toFixed(1);
    stats.averageRelationship = (stats.averageRelationship / playerCount).toFixed(1);

    return stats;
  },

  // Nová funkce pro získání URL fotky hráče
  getPlayerPhotoUrl: function(playerId) {
    console.log(`📸 DEBUG: Hledám fotku pro hráče: "${playerId}"`);
    
    // Odstranění diakritiky a normalizace jména
    const normalizeString = (str) => {
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');
    };

    // Najdeme hráče podle jména
    const normalizedPlayerId = normalizeString(playerId);
    console.log(`📸 DEBUG: Normalizované jméno hráče: "${normalizedPlayerId}"`);
    
    const player = this.players.find(p => {
      const normalizedName = normalizeString(`${p.name}${p.surname}`);
      const match = normalizedName === normalizedPlayerId;
      if (match) {
        console.log(`📸 DEBUG: Nalezen hráč v databázi: ${p.name} ${p.surname}`);
      }
      return match;
    });
    
    if (!player) {
      console.error('❌ Player not found:', {
        searchedId: playerId,
        normalizedId: normalizedPlayerId
      });
      return '/Images/Litvinov_Lancers.png';
    }

    // Mapování speciálních případů fotek podle skutečných souborů
    const specialPhotoMap = {
      "Stanislav Švarc": "Standa_Svarc.png",
      "Petr Štěpanovský": "Petr_Stepanovsky.png",
      "Roman Šimek": "Roman_Simek.png",
      "Václav Matějovič": "Vaclav_Matejovic.png",
      "Aleš Kuřitka": "Ales_Kuritka.png",
      "Roman Beneš": "Roman_Benes.png",
      "Jan Švarc": "Jan_Svarc_new.png",
      "Pavel Schubada St.": "Pavel_Schubada st.png",
      "Pavel Schubada ml.": "Pavel_Schubada ml.png",
      "Jiří Belinger": "Jiri_Belinger.png",
      "Jiří Koláček": "Jiri_Kolacek.png",
      "Jiří Šalanda": "Jiri_Salanda.png",
      "Kateřina Schubadová": "Katerina_Schubadovaj.png",
      "Ladislav Černý": "Ladislav_Cerny.png",
      "Luboš Coufal": "Lubos_Coufal.png",
      "Marian Dlugopolsky": "Marian_Dlugopolsky.png",
      "Michaela Nováková": "Michaela_Novakova.png",
      "Oldřich Štěpanovský": "Olda21.png",
      "Ondřej Hrubý": "Ondrej_Hruby.png",
      "Pavel Novák": "Pavel_Novak.png",
      "Petra Volmutová": "Petra_Berankova.png"  // Pravděpodobně se jedná o stejnou osobu pod jiným příjmením
    };

    // Seznam hráčů s ověřenými fotkami (podle výpisu ze složky)
    const verifiedPhotos = [
      "Adam_Schubada.png",
      "Ales_Kuritka.png",
      "Gustav_Toman.png",
      "Jakub_Seidler.png",
      "Jan_Hanus.png",
      "Jan_Schubada.png",
      "Jan_Svarc_new.png",
      "Jaroslav_Volmut.png",
      "Jindrich_Belinger.png",
      "Jiri_Belinger.png",
      "Jiri_Kolacek.png",
      "Jiri_Salanda.png",
      "Katerina_Schubadovaj.png",
      "Ladislav_Cerny.png",
      "Lubos_Coufal.png",
      "Marian_Dlugopolsky.png",
      "Michaela_Novakova.png",
      "Olda21.png",
      "Oldrich_Stepanovsky.png",
      "Ondrej_Hruby.png",
      "Pavel_Novak.png",
      "Pavel_Schubada ml.png",
      "Pavel_Schubada st.png",
      "Petra_Berankova.png",
      "Petr_Stepanovsky.png",
      "Roman_Benes.png",
      "Roman_Simek.png",
      "Standa_Svarc.png",
      "Tomas_Turecek.png",
      "Vaclav_Matejovic.png",
      "Vasek_Materna.png",
      "Vlastimil_Nistor.png"
    ];

    // SPECIÁLNÍ PŘÍPAD PRO OLDŘICHA - zkusíme přímo oba soubory
    if (player.name === "Oldřich" && player.surname === "Štěpanovský") {
      // Zkusíme oba názvy souborů, pokud je problém s detekcí
      console.log("🔎 SPECIÁLNÍ PŘÍPAD: Oldřich Štěpanovský - zkusíme oba soubory");
      const oldaPhotoUrl = `/Images/players/Olda21.png`;
      const standardPhotoUrl = `/Images/players/Oldrich_Stepanovsky.png`;
      
      // Pro účely debugování zkusíme poslat Olda21.png
      console.log("🖼️ Using Oldřich's photo:", {
        name: `${player.name} ${player.surname}`,
        preferredFile: "Olda21.png",
        url: oldaPhotoUrl
      });
      
      return oldaPhotoUrl;
    }

    // Pokud je speciální případ, použijeme namapovaný název souboru
    const playerFullName = `${player.name} ${player.surname}`;
    console.log(`📸 DEBUG: Plné jméno hráče: "${playerFullName}"`);
    console.log(`📸 DEBUG: Kontrola speciálního mapování pro: "${playerFullName}"`);
    
    if (specialPhotoMap[playerFullName]) {
      const photoUrl = `/Images/players/${specialPhotoMap[playerFullName]}`;
      console.log(`✅ DEBUG: Nalezeno speciální mapování! Soubor: ${specialPhotoMap[playerFullName]}`);
      console.log('🖼️ Using special mapped photo for player:', {
        name: playerFullName,
        photoFile: specialPhotoMap[playerFullName],
        url: photoUrl
      });
      return photoUrl;
    } else {
      console.log(`❌ DEBUG: Žádné speciální mapování nenalezeno pro hráče: "${playerFullName}"`);
    }
    
    // Standardní cesta k fotce hráče
    const standardFileName = `${removeDiacritics(player.name)}_${removeDiacritics(player.surname)}.png`;
    console.log(`📸 DEBUG: Standardní název souboru: "${standardFileName}"`);
    const photoUrl = `/Images/players/${standardFileName}`;
    
    // Kontrola, jestli je soubor v seznamu ověřených fotek
    const fileExists = verifiedPhotos.includes(standardFileName);
    console.log(`📸 DEBUG: Kontrola existence souboru v seznamu: "${standardFileName}" - ${fileExists ? 'NALEZENO' : 'NENALEZENO'}`);
    
    if (fileExists) {
      console.log(`✅ DEBUG: Standardní fotka nalezena: ${standardFileName}`);
      console.log('🖼️ Using standard photo for player:', {
        name: playerFullName,
        photo: standardFileName,
        url: photoUrl
      });
      return photoUrl;
    } else {
      // Pokud soubor neexistuje, vrátíme výchozí obrázek
      const defaultImage = player.position === 'brankář' 
        ? '/Images/default_goalie.png'
        : '/Images/default_player.png';
      
      console.log(`⚠️ DEBUG: Žádná fotka nenalezena! Použije se výchozí obrázek: ${defaultImage}`);
      console.log('🖼️ No photo found for player, using default:', {
        name: playerFullName,
        position: player.position,
        defaultImage
      });
      
      return defaultImage;
    }
  }
};

export { litvinovLancers, personalityTypes, getPhotoFilename }; 