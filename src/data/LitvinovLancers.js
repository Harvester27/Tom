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
      name: "Tomáš",
      surname: "Novotný",
      position: "brankář",
      level: 8,
      attendance: 90,
      reliability: 95,
      personality: "profesional",
      relationship: 50
    },
    {
      name: "Martin",
      surname: "Svoboda",
      position: "brankář",
      level: 6,
      attendance: 75,
      reliability: 85,
      personality: "vtipkar",
      relationship: 65
    },
    {
      name: "Jakub",
      surname: "Dvořák",
      position: "brankář",
      level: 4,
      attendance: 60,
      reliability: 90,
      personality: "samotarsky",
      relationship: 30
    },

    // Obránci
    {
      name: "Petr",
      surname: "Černý",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 90,
      personality: "mentor",
      relationship: 70
    },
    {
      name: "Jan",
      surname: "Procházka",
      position: "obránce",
      level: 9,
      attendance: 95,
      reliability: 98,
      personality: "profesional",
      relationship: 50
    },
    {
      name: "Michal",
      surname: "Kučera",
      position: "obránce",
      level: 5,
      attendance: 70,
      reliability: 75,
      personality: "soutezivi",
      relationship: 45
    },
    {
      name: "David",
      surname: "Veselý",
      position: "obránce",
      level: 6,
      attendance: 80,
      reliability: 85,
      personality: "pratelsky",
      relationship: 60
    },
    {
      name: "Filip",
      surname: "Horák",
      position: "obránce",
      level: 4,
      attendance: 65,
      reliability: 70,
      personality: "vtipkar",
      relationship: 65
    },
    {
      name: "Ondřej",
      surname: "Marek",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 88,
      personality: "mentor",
      relationship: 70
    },
    {
      name: "Lukáš",
      surname: "Pokorný",
      position: "obránce",
      level: 5,
      attendance: 75,
      reliability: 82,
      personality: "pratelsky",
      relationship: 60
    },
    {
      name: "Vojtěch",
      surname: "Král",
      position: "obránce",
      level: 3,
      attendance: 55,
      reliability: 65,
      personality: "samotarsky",
      relationship: 30
    },
    {
      name: "Adam",
      surname: "Bartoš",
      position: "obránce",
      level: 6,
      attendance: 78,
      reliability: 85,
      personality: "soutezivi",
      relationship: 45
    },

    // Útočníci
    {
      name: "Jiří",
      surname: "Kovář",
      position: "útočník",
      level: 8,
      attendance: 90,
      reliability: 92,
      personality: "profesional",
      relationship: 50
    },
    {
      name: "Pavel",
      surname: "Říha",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 88,
      personality: "mentor",
      relationship: 70
    },
    {
      name: "Daniel",
      surname: "Urban",
      position: "útočník",
      level: 9,
      attendance: 95,
      reliability: 96,
      personality: "soutezivi",
      relationship: 45
    },
    {
      name: "Marek",
      surname: "Beneš",
      position: "útočník",
      level: 5,
      attendance: 70,
      reliability: 75,
      personality: "vtipkar",
      relationship: 65
    },
    {
      name: "Roman",
      surname: "Šimek",
      position: "útočník",
      level: 6,
      attendance: 80,
      reliability: 85,
      personality: "pratelsky",
      relationship: 60
    },
    {
      name: "Karel",
      surname: "Doležal",
      position: "útočník",
      level: 4,
      attendance: 60,
      reliability: 70,
      personality: "samotarsky",
      relationship: 30
    },
    {
      name: "Josef",
      surname: "Malý",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 90,
      personality: "profesional",
      relationship: 50
    },
    {
      name: "František",
      surname: "Němec",
      position: "útočník",
      level: 5,
      attendance: 75,
      reliability: 80,
      personality: "vtipkar",
      relationship: 65
    },
    {
      name: "Radek",
      surname: "Sedláček",
      position: "útočník",
      level: 8,
      attendance: 88,
      reliability: 92,
      personality: "mentor",
      relationship: 70
    },
    {
      name: "Milan",
      surname: "Zeman",
      position: "útočník",
      level: 6,
      attendance: 78,
      reliability: 83,
      personality: "pratelsky",
      relationship: 60
    },
    {
      name: "Vladimír",
      surname: "Kolář",
      position: "útočník",
      level: 3,
      attendance: 50,
      reliability: 60,
      personality: "samotarsky",
      relationship: 30
    },
    {
      name: "Zdeněk",
      surname: "Vlček",
      position: "útočník",
      level: 5,
      attendance: 72,
      reliability: 78,
      personality: "soutezivi",
      relationship: 45
    },
    {
      name: "Patrik",
      surname: "Šťastný",
      position: "útočník",
      level: 7,
      attendance: 83,
      reliability: 87,
      personality: "profesional",
      relationship: 50
    },
    {
      name: "Dominik",
      surname: "Hrubý",
      position: "útočník",
      level: 4,
      attendance: 65,
      reliability: 72,
      personality: "vtipkar",
      relationship: 65
    },
    {
      name: "Matěj",
      surname: "Tichý",
      position: "útočník",
      level: 6,
      attendance: 77,
      reliability: 82,
      personality: "pratelsky",
      relationship: 60
    },
    {
      name: "Štěpán",
      surname: "Holub",
      position: "útočník",
      level: 5,
      attendance: 73,
      reliability: 79,
      personality: "mentor",
      relationship: 70
    },
    {
      name: "Richard",
      surname: "Havlík",
      position: "útočník",
      level: 4,
      attendance: 68,
      reliability: 75,
      personality: "samotarsky",
      relationship: 30
    },
    {
      name: "Viktor",
      surname: "Sýkora",
      position: "útočník",
      level: 7,
      attendance: 82,
      reliability: 86,
      personality: "soutezivi",
      relationship: 45
    },
    {
      name: "Oldřich",
      surname: "Kříž",
      position: "útočník",
      level: 5,
      attendance: 71,
      reliability: 77,
      personality: "pratelsky",
      relationship: 60
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
  }
};

export { litvinovLancers, personalityTypes }; 