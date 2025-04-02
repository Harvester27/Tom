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
    },
    {
      name: "Martin",
      surname: "Svoboda",
      position: "brankář",
      level: 6,
      attendance: 75,
      reliability: 85,
    },
    {
      name: "Jakub",
      surname: "Dvořák",
      position: "brankář",
      level: 4,
      attendance: 60,
      reliability: 90,
    },

    // Obránci
    {
      name: "Petr",
      surname: "Černý",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 90,
    },
    {
      name: "Jan",
      surname: "Procházka",
      position: "obránce",
      level: 9,
      attendance: 95,
      reliability: 98,
    },
    {
      name: "Michal",
      surname: "Kučera",
      position: "obránce",
      level: 5,
      attendance: 70,
      reliability: 75,
    },
    {
      name: "David",
      surname: "Veselý",
      position: "obránce",
      level: 6,
      attendance: 80,
      reliability: 85,
    },
    {
      name: "Filip",
      surname: "Horák",
      position: "obránce",
      level: 4,
      attendance: 65,
      reliability: 70,
    },
    {
      name: "Ondřej",
      surname: "Marek",
      position: "obránce",
      level: 7,
      attendance: 85,
      reliability: 88,
    },
    {
      name: "Lukáš",
      surname: "Pokorný",
      position: "obránce",
      level: 5,
      attendance: 75,
      reliability: 82,
    },
    {
      name: "Vojtěch",
      surname: "Král",
      position: "obránce",
      level: 3,
      attendance: 55,
      reliability: 65,
    },
    {
      name: "Adam",
      surname: "Bartoš",
      position: "obránce",
      level: 6,
      attendance: 78,
      reliability: 85,
    },

    // Útočníci
    {
      name: "Jiří",
      surname: "Kovář",
      position: "útočník",
      level: 8,
      attendance: 90,
      reliability: 92,
    },
    {
      name: "Pavel",
      surname: "Říha",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 88,
    },
    {
      name: "Daniel",
      surname: "Urban",
      position: "útočník",
      level: 9,
      attendance: 95,
      reliability: 96,
    },
    {
      name: "Marek",
      surname: "Beneš",
      position: "útočník",
      level: 5,
      attendance: 70,
      reliability: 75,
    },
    {
      name: "Roman",
      surname: "Šimek",
      position: "útočník",
      level: 6,
      attendance: 80,
      reliability: 85,
    },
    {
      name: "Karel",
      surname: "Doležal",
      position: "útočník",
      level: 4,
      attendance: 60,
      reliability: 70,
    },
    {
      name: "Josef",
      surname: "Malý",
      position: "útočník",
      level: 7,
      attendance: 85,
      reliability: 90,
    },
    {
      name: "František",
      surname: "Němec",
      position: "útočník",
      level: 5,
      attendance: 75,
      reliability: 80,
    },
    {
      name: "Radek",
      surname: "Sedláček",
      position: "útočník",
      level: 8,
      attendance: 88,
      reliability: 92,
    },
    {
      name: "Milan",
      surname: "Zeman",
      position: "útočník",
      level: 6,
      attendance: 78,
      reliability: 83,
    },
    {
      name: "Vladimír",
      surname: "Kolář",
      position: "útočník",
      level: 3,
      attendance: 50,
      reliability: 60,
    },
    {
      name: "Zdeněk",
      surname: "Vlček",
      position: "útočník",
      level: 5,
      attendance: 72,
      reliability: 78,
    },
    {
      name: "Patrik",
      surname: "Šťastný",
      position: "útočník",
      level: 7,
      attendance: 83,
      reliability: 87,
    },
    {
      name: "Dominik",
      surname: "Hrubý",
      position: "útočník",
      level: 4,
      attendance: 65,
      reliability: 72,
    },
    {
      name: "Matěj",
      surname: "Tichý",
      position: "útočník",
      level: 6,
      attendance: 77,
      reliability: 82,
    },
    {
      name: "Štěpán",
      surname: "Holub",
      position: "útočník",
      level: 5,
      attendance: 73,
      reliability: 79,
    },
    {
      name: "Richard",
      surname: "Havlík",
      position: "útočník",
      level: 4,
      attendance: 68,
      reliability: 75,
    },
    {
      name: "Viktor",
      surname: "Sýkora",
      position: "útočník",
      level: 7,
      attendance: 82,
      reliability: 86,
    },
    {
      name: "Oldřich",
      surname: "Kříž",
      position: "útočník",
      level: 5,
      attendance: 71,
      reliability: 77,
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

  // Statistiky týmu
  getTeamStats: function() {
    const stats = {
      averageLevel: 0,
      averageAttendance: 0,
      averageReliability: 0,
      playersByPosition: {
        brankář: 0,
        obránce: 0,
        útočník: 0
      }
    };

    this.players.forEach(player => {
      stats.averageLevel += player.level;
      stats.averageAttendance += player.attendance;
      stats.averageReliability += player.reliability;
      stats.playersByPosition[player.position]++;
    });

    const playerCount = this.players.length;
    stats.averageLevel = (stats.averageLevel / playerCount).toFixed(1);
    stats.averageAttendance = (stats.averageAttendance / playerCount).toFixed(1);
    stats.averageReliability = (stats.averageReliability / playerCount).toFixed(1);

    return stats;
  }
};

export default litvinovLancers; 