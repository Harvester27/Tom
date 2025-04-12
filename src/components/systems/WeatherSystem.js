'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook pro správu počasí v herním světě
 * @param {Date} initialDate - Počáteční datum
 * @param {number} initialHour - Počáteční hodina (0-23)
 * @returns {Object} - Objekt s aktuálním stavem počasí a funkcemi pro jeho ovládání
 */
export const useWeather = (initialDate, initialHour) => {
  // Stav počasí
  const [weather, setWeather] = useState('clear');
  const [temperature, setTemperature] = useState(22);
  const [weatherTrend, setWeatherTrend] = useState({
    type: 'clear',
    baseTemp: 22,
    tempTrend: 0, // změna teploty za hodinu
    duration: 24, // jak dlouho trend vydrží
    stormComing: false
  });

  // Funkce pro získání nastavení podle ročního období
  const getSeasonalSettings = useCallback((month) => {
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
      default:
        return { baseTemp: 15, minTemp: 0, maxTemp: 30 };
    }
  }, []);

  // Funkce pro získání modifikátoru podle denní doby
  const getTimeOfDayModifier = useCallback((hour) => {
    if (hour >= 5 && hour <= 8) {
      return -2 + (hour - 5);
    } else if (hour >= 9 && hour <= 14) {
      return 1 + (hour - 9) * 0.5;
    } else if (hour >= 15 && hour <= 19) {
      return 4 - (hour - 15) * 0.5;
    } else {
      return -3;
    }
  }, []);

  // Hlavní funkce pro generování počasí
  const generateWeather = useCallback((date, hour = 8, forcedChange = false) => {
    const month = date.getMonth();
    const currentTemp = temperature;
    let newWeather = { ...weatherTrend };

    // Pokud je potřeba vygenerovat nový trend počasí
    // Kontrolujeme forcedChange, duration <= 0 nebo pokud je speciální časový úsek (nový den, poledne, západ slunce)
    const isSpecialTimeChange = (hour === 8 || hour === 12 || hour === 18);
    
    if (forcedChange || weatherTrend.duration <= 0 || (isSpecialTimeChange && Math.random() < 0.3)) {
      console.log('🌡️ Generování nového trendu počasí', { hour, forcedChange, isSpecialTimeChange });
      
      // Základní nastavení podle měsíce
      const seasonalSettings = getSeasonalSettings(month);
      
      // 85% šance zachovat současný typ počasí, pokud není vyžadována změna
      // Tato pravděpodobnost je vyšší než předtím pro stabilnější počasí
      if (!forcedChange && Math.random() > 0.15) {
        newWeather.type = weatherTrend.type;
        console.log('🌡️ Zachováváme současný typ počasí:', newWeather.type);
      } else {
        // Výběr nového typu počasí
        const weatherRoll = Math.random();
        const prevType = weatherTrend.type; // Pro plynulejší přechody
        
        // Logika pro plynulejší přechody mezi typy počasí
        if (prevType === 'clear') {
          // Z jasna většinou na polojasno
          if (weatherRoll < 0.7) newWeather.type = 'clear';
          else if (weatherRoll < 0.9) newWeather.type = 'partlyCloudy';
          else newWeather.type = 'cloudy';
        } 
        else if (prevType === 'partlyCloudy') {
          // Z polojasna buď zpět na jasno nebo více zataženo
          if (weatherRoll < 0.4) newWeather.type = 'clear';
          else if (weatherRoll < 0.8) newWeather.type = 'partlyCloudy';
          else if (weatherRoll < 0.95) newWeather.type = 'cloudy';
          else newWeather.type = 'rain';
        }
        else if (prevType === 'cloudy') {
          // Ze zataženo buď zpět na polojasno nebo déšť
          if (weatherRoll < 0.3) newWeather.type = 'partlyCloudy';
          else if (weatherRoll < 0.7) newWeather.type = 'cloudy';
          else if (weatherRoll < 0.9) newWeather.type = 'rain';
          else newWeather.type = 'thunderstorm';
        }
        else if (prevType === 'rain') {
          // Z deště buď zpět na zataženo nebo horší počasí
          if (weatherRoll < 0.3) newWeather.type = 'cloudy';
          else if (weatherRoll < 0.7) newWeather.type = 'rain';
          else if (weatherRoll < 0.9) newWeather.type = 'thunderstorm';
          else if (month <= 1 || month === 11) newWeather.type = 'snow';
          else newWeather.type = 'fog';
        }
        else if (prevType === 'thunderstorm') {
          // Z bouřky většinou zpět na déšť
          if (weatherRoll < 0.6) newWeather.type = 'rain';
          else if (weatherRoll < 0.9) newWeather.type = 'thunderstorm';
          else newWeather.type = 'cloudy';
        }
        else if (prevType === 'snow') {
          // Ze sněhu buď sníh pokračuje nebo se vrátí na zataženo/déšť
          if (weatherRoll < 0.6) newWeather.type = 'snow';
          else if (weatherRoll < 0.8) newWeather.type = 'snowRain';
          else newWeather.type = 'cloudy';
        }
        else if (prevType === 'snowRain') {
          if (weatherRoll < 0.5) newWeather.type = 'rain';
          else if (weatherRoll < 0.8) newWeather.type = 'snow';
          else newWeather.type = 'cloudy';
        }
        else if (prevType === 'fog') {
          if (weatherRoll < 0.6) newWeather.type = 'fog';
          else if (weatherRoll < 0.8) newWeather.type = 'cloudy';
          else newWeather.type = 'partlyCloudy';
        }
        else {
          // Výchozí chování pro první nastavení počasí
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
        
        console.log('🌡️ Změna počasí z', prevType, 'na', newWeather.type);
      }

      // Nastavení základní teploty a trendu
      const timeOfDay = getTimeOfDayModifier(hour);
      newWeather.baseTemp = seasonalSettings.baseTemp + timeOfDay;
      
      // Nastavení trendu změny teploty - plynulejší změny
      if (hour >= 6 && hour <= 14) {
        // Dopoledne - teplota stoupá
        newWeather.tempTrend = 0.3 + Math.random() * 0.3;
      } else if (hour >= 15 && hour <= 20) {
        // Odpoledne - teplota klesá
        newWeather.tempTrend = -(0.2 + Math.random() * 0.3);
      } else {
        // Noc - teplota mírně klesá
        newWeather.tempTrend = -(0.1 + Math.random() * 0.1);
      }

      // Bouřka způsobí rychlejší pokles teploty
      if (newWeather.type === 'thunderstorm') {
        newWeather.tempTrend = -1;
      }
      
      // Sníh udržuje nižší teploty
      if (newWeather.type === 'snow') {
        newWeather.tempTrend -= 0.5;
      }

      // Nastavení delší doby trendu (8-16 hodin) pro stabilnější počasí
      newWeather.duration = 8 + Math.floor(Math.random() * 8);
    } else {
      // Pokračování současného trendu
      newWeather.duration -= 1;
    }

    // Výpočet nové teploty - plynulejší změny
    let newTemp = currentTemp + (newWeather.tempTrend / 2); // Poloviční změna pro plynulejší přechod
    
    // Omezení extrémních teplot podle ročního období
    const seasonalSettings = getSeasonalSettings(month);
    newTemp = Math.max(seasonalSettings.minTemp, Math.min(seasonalSettings.maxTemp, newTemp));

    return {
      type: newWeather.type,
      temperature: Math.round(newTemp),
      trend: newWeather
    };
  }, [temperature, weatherTrend, getSeasonalSettings, getTimeOfDayModifier]);

  // Funkce pro aktualizaci počasí
  const updateWeather = useCallback((date, hour, forcedChange = false) => {
    // Aktualizace pouze při změně hodiny nebo vynucené změně
    // Kontrola, zda se opravdu změnila hodina v porovnání s posledním updatem
    const shouldUpdate = forcedChange || !weatherTrend.lastUpdateHour || weatherTrend.lastUpdateHour !== hour;
    
    if (shouldUpdate) {
      console.log('🌡️ Aktualizace počasí', { hour, forcedChange });
      const newWeatherData = generateWeather(date, hour, forcedChange);
      
      // Přidáme informaci o poslední aktualizaci
      const updatedTrend = {
        ...newWeatherData.trend,
        lastUpdateHour: hour,
        lastUpdateDate: date.toISOString()
      };
      
      setWeather(newWeatherData.type);
      setTemperature(newWeatherData.temperature);
      setWeatherTrend(updatedTrend);
      return newWeatherData;
    }
    
    // Pokud není potřeba aktualizovat, vrátíme současný stav
    return {
      type: weather,
      temperature,
      trend: weatherTrend
    };
  }, [generateWeather, weather, temperature, weatherTrend]);

  // Funkce pro získání emoji počasí
  const getWeatherEmoji = useCallback(() => {
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
  }, [weather]);

  // Funkce pro získání textového popisu počasí
  const getWeatherDescription = useCallback(() => {
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
  }, [weather]);

  // Inicializace počasí při prvním načtení
  useEffect(() => {
    if (initialDate && initialHour !== undefined) {
      updateWeather(initialDate, initialHour, true);
    }
  }, []);

  return {
    weather,
    temperature,
    weatherTrend,
    updateWeather,
    getWeatherEmoji,
    getWeatherDescription,
    generateWeather
  };
};

export class WeatherSystem {
  // Tato třída by mohla být použita pro serverovou část nebo více pokročilou implementaci
  // Pro jednoduchost nyní používáme jen hook useWeather
}