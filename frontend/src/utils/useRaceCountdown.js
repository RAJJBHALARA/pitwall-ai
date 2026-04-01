import { useState, useEffect } from 'react';

// Official 2026 F1 Calendar — 24 races
// Source: formula1.com / mclaren.com confirmed schedule
// raceStart = UTC race start time
// IST (India) = UTC + 5:30
const F1_CALENDAR_2025 = [
  // --- ALREADY COMPLETED ---
  { round: 1,  name: 'Australian Grand Prix',          shortName: 'Australia',    country: 'Australia',    flag: '🇦🇺', circuit: 'Albert Park',      raceStart: '2026-03-08T04:00:00Z', localTime: '15:00 AEDT' },
  { round: 2,  name: 'Chinese Grand Prix',              shortName: 'China',        country: 'China',        flag: '🇨🇳', circuit: 'Shanghai',          raceStart: '2026-03-15T07:00:00Z', localTime: '15:00 CST'  },
  { round: 3,  name: 'Japanese Grand Prix',             shortName: 'Japan',        country: 'Japan',        flag: '🇯🇵', circuit: 'Suzuka',             raceStart: '2026-03-29T05:00:00Z', localTime: '14:00 JST'  },
  // --- UPCOMING (Rounds 4 & 5 cancelled) ---
  { round: 6,  name: 'Miami Grand Prix',                shortName: 'Miami',        country: 'USA',          flag: '🇺🇸', circuit: 'Miami',              raceStart: '2026-05-03T20:00:00Z', localTime: '16:00 EDT'  },
  { round: 7,  name: 'Canadian Grand Prix',             shortName: 'Canada',       country: 'Canada',       flag: '🇨🇦', circuit: 'Montreal',           raceStart: '2026-05-24T20:00:00Z', localTime: '16:00 EDT'  },
  { round: 8,  name: 'Monaco Grand Prix',               shortName: 'Monaco',       country: 'Monaco',       flag: '🇲🇨', circuit: 'Monaco',             raceStart: '2026-06-07T13:00:00Z', localTime: '15:00 CEST' },
  { round: 9,  name: 'Spanish Grand Prix',              shortName: 'Spain',        country: 'Spain',        flag: '🇪🇸', circuit: 'Barcelona',          raceStart: '2026-06-14T13:00:00Z', localTime: '15:00 CEST' },
  { round: 10, name: 'Austrian Grand Prix',             shortName: 'Austria',      country: 'Austria',      flag: '🇦🇹', circuit: 'Red Bull Ring',      raceStart: '2026-06-28T13:00:00Z', localTime: '15:00 CEST' },
  { round: 11, name: 'British Grand Prix',              shortName: 'Britain',      country: 'UK',           flag: '🇬🇧', circuit: 'Silverstone',        raceStart: '2026-07-05T14:00:00Z', localTime: '15:00 BST'  },
  { round: 12, name: 'Belgian Grand Prix',              shortName: 'Belgium',      country: 'Belgium',      flag: '🇧🇪', circuit: 'Spa-Francorchamps',  raceStart: '2026-07-19T13:00:00Z', localTime: '15:00 CEST' },
  { round: 13, name: 'Hungarian Grand Prix',            shortName: 'Hungary',      country: 'Hungary',      flag: '🇭🇺', circuit: 'Hungaroring',        raceStart: '2026-07-26T13:00:00Z', localTime: '15:00 CEST' },
  { round: 14, name: 'Dutch Grand Prix',                shortName: 'Netherlands',  country: 'Netherlands',  flag: '🇳🇱', circuit: 'Zandvoort',          raceStart: '2026-08-23T13:00:00Z', localTime: '15:00 CEST' },
  { round: 15, name: 'Italian Grand Prix',              shortName: 'Italy',        country: 'Italy',        flag: '🇮🇹', circuit: 'Monza',              raceStart: '2026-09-06T13:00:00Z', localTime: '15:00 CEST' },
  { round: 16, name: 'Spanish Grand Prix (Madrid)',     shortName: 'Madrid',       country: 'Spain',        flag: '🇪🇸', circuit: 'IFEMA Madrid',       raceStart: '2026-09-13T13:00:00Z', localTime: '15:00 CEST' },
  { round: 17, name: 'Azerbaijan Grand Prix',           shortName: 'Azerbaijan',   country: 'Azerbaijan',   flag: '🇦🇿', circuit: 'Baku',               raceStart: '2026-09-26T11:00:00Z', localTime: '15:00 AZT'  },
  { round: 18, name: 'Singapore Grand Prix',            shortName: 'Singapore',    country: 'Singapore',    flag: '🇸🇬', circuit: 'Marina Bay',         raceStart: '2026-10-11T12:00:00Z', localTime: '20:00 SGT'  },
  { round: 19, name: 'United States Grand Prix',        shortName: 'USA (Austin)', country: 'USA',          flag: '🇺🇸', circuit: 'COTA',               raceStart: '2026-10-25T20:00:00Z', localTime: '15:00 CDT'  },
  { round: 20, name: 'Mexico City Grand Prix',          shortName: 'Mexico',       country: 'Mexico',       flag: '🇲🇽', circuit: 'Mexico City',        raceStart: '2026-11-01T20:00:00Z', localTime: '14:00 CDT'  },
  { round: 21, name: 'São Paulo Grand Prix',            shortName: 'Brazil',       country: 'Brazil',       flag: '🇧🇷', circuit: 'Interlagos',         raceStart: '2026-11-08T17:00:00Z', localTime: '14:00 BRT'  },
  { round: 22, name: 'Las Vegas Grand Prix',            shortName: 'Las Vegas',    country: 'USA',          flag: '🇺🇸', circuit: 'Las Vegas Strip',    raceStart: '2026-11-22T04:00:00Z', localTime: '20:00 PST'  },
  { round: 23, name: 'Qatar Grand Prix',                shortName: 'Qatar',        country: 'Qatar',        flag: '🇶🇦', circuit: 'Lusail',             raceStart: '2026-11-29T16:00:00Z', localTime: '19:00 AST'  },
  { round: 24, name: 'Abu Dhabi Grand Prix',            shortName: 'Abu Dhabi',    country: 'UAE',          flag: '🇦🇪', circuit: 'Yas Marina',         raceStart: '2026-12-06T13:00:00Z', localTime: '17:00 GST'  },
];


function getCountdown(targetUTC) {
  const now = Date.now();
  const target = new Date(targetUTC).getTime();
  const diff = target - now;
  if (diff <= 0) return null; // race has started
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, diff };
}

// Check if current time is within a race weekend (Thu/Fri practice to race end)
function isRaceWeekend(raceStartUTC) {
  const raceTime = new Date(raceStartUTC).getTime();
  const now = Date.now();
  // Weekend starts ~48 hours before race (FP1), ends 3 hours after race start
  const weekendStart = raceTime - 48 * 60 * 60 * 1000;
  const weekendEnd = raceTime + 3 * 60 * 60 * 1000;
  return now >= weekendStart && now <= weekendEnd;
}

// Convert UTC race time to IST string
function toIST(utcString) {
  const d = new Date(utcString);
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const mm = String(ist.getUTCMinutes()).padStart(2, '0');
  // Date in IST
  const day = ist.getUTCDate();
  const month = ist.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${day} ${month} · ${hh}:${mm} IST`;
}

export function useRaceCountdown() {
  const [countdowns, setCountdowns] = useState([]);
  const [activeWeekend, setActiveWeekend] = useState(null);

  useEffect(() => {
    function compute() {
      const now = Date.now();
      // Find next 3 upcoming races
      const upcoming = F1_CALENDAR_2025
        .filter(race => new Date(race.raceStart).getTime() > now - 3 * 60 * 60 * 1000) // include race if within 3h of start
        .slice(0, 3)
        .map(race => ({
          ...race,
          countdown: getCountdown(race.raceStart),
          istTime: toIST(race.raceStart),
          isThisWeekend: isRaceWeekend(race.raceStart),
        }));

      setCountdowns(upcoming);

      // Detect active race weekend from the NEXT upcoming race
      const nextRace = F1_CALENDAR_2025.find(
        race => new Date(race.raceStart).getTime() > now - 3 * 60 * 60 * 1000
      );
      if (nextRace && isRaceWeekend(nextRace.raceStart)) {
        setActiveWeekend(nextRace);
      } else {
        setActiveWeekend(null);
      }
    }

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, []);

  return { countdowns, activeWeekend, calendar: F1_CALENDAR_2025 };
}
