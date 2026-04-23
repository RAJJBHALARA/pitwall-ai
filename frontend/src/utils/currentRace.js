import { F1_CALENDAR_2025 } from './f1Calendar2025';

export const F1_CALENDAR_2026 = [
  {
    round: 1,
    name: 'Australian Grand Prix',
    country: 'au',
    race: '2026-03-15T05:00:00Z',
    completed: true,
  },
  {
    round: 2,
    name: 'Chinese Grand Prix',
    country: 'cn',
    race: '2026-03-22T07:00:00Z',
    completed: true,
  },
  {
    round: 3,
    name: 'Japanese Grand Prix',
    country: 'jp',
    race: '2026-04-05T05:00:00Z',
    completed: true,
  },
  {
    round: 4,
    name: 'Bahrain Grand Prix',
    country: 'bh',
    race: '2026-04-19T15:00:00Z',
    completed: true,
  },
  {
    round: 5,
    name: 'Saudi Arabian Grand Prix',
    country: 'sa',
    race: '2026-04-26T17:00:00Z',
    completed: false,
  },
  {
    round: 6,
    name: 'Miami Grand Prix',
    country: 'us',
    race: '2026-05-03T20:00:00Z',
    completed: false,
  },
  {
    round: 7,
    name: 'Emilia Romagna Grand Prix',
    country: 'it',
    race: '2026-05-17T13:00:00Z',
    completed: false,
  },
  {
    round: 8,
    name: 'Monaco Grand Prix',
    country: 'mc',
    race: '2026-05-24T13:00:00Z',
    completed: false,
  },
  {
    round: 9,
    name: 'Spanish Grand Prix',
    country: 'es',
    race: '2026-06-07T13:00:00Z',
    completed: false,
  },
  {
    round: 10,
    name: 'Canadian Grand Prix',
    country: 'ca',
    race: '2026-06-14T18:00:00Z',
    completed: false,
  },
  {
    round: 11,
    name: 'Austrian Grand Prix',
    country: 'at',
    race: '2026-06-28T13:00:00Z',
    completed: false,
  },
  {
    round: 12,
    name: 'British Grand Prix',
    country: 'gb',
    race: '2026-07-05T14:00:00Z',
    completed: false,
  },
  {
    round: 13,
    name: 'Belgian Grand Prix',
    country: 'be',
    race: '2026-07-26T13:00:00Z',
    completed: false,
  },
  {
    round: 14,
    name: 'Hungarian Grand Prix',
    country: 'hu',
    race: '2026-08-02T13:00:00Z',
    completed: false,
  },
  {
    round: 15,
    name: 'Dutch Grand Prix',
    country: 'nl',
    race: '2026-08-30T13:00:00Z',
    completed: false,
  },
  {
    round: 16,
    name: 'Italian Grand Prix',
    country: 'it',
    race: '2026-09-06T13:00:00Z',
    completed: false,
  },
  {
    round: 17,
    name: 'Azerbaijan Grand Prix',
    country: 'az',
    race: '2026-09-20T11:00:00Z',
    completed: false,
  },
  {
    round: 18,
    name: 'Singapore Grand Prix',
    country: 'sg',
    race: '2026-10-04T12:00:00Z',
    completed: false,
  },
  {
    round: 19,
    name: 'United States Grand Prix',
    country: 'us',
    race: '2026-10-18T19:00:00Z',
    completed: false,
  },
  {
    round: 20,
    name: 'Mexico City Grand Prix',
    country: 'mx',
    race: '2026-10-25T20:00:00Z',
    completed: false,
  },
  {
    round: 21,
    name: 'Sao Paulo Grand Prix',
    country: 'br',
    race: '2026-11-08T17:00:00Z',
    completed: false,
  },
  {
    round: 22,
    name: 'Las Vegas Grand Prix',
    country: 'us',
    race: '2026-11-22T06:00:00Z',
    completed: false,
  },
  {
    round: 23,
    name: 'Qatar Grand Prix',
    country: 'qa',
    race: '2026-11-29T17:00:00Z',
    completed: false,
  },
  {
    round: 24,
    name: 'Abu Dhabi Grand Prix',
    country: 'ae',
    race: '2026-12-06T13:00:00Z',
    completed: false,
  },
];

const normalizeRaceName = (name) => {
  if (!name) return name;
  return String(name).replace(/\sGP$/i, ' Grand Prix');
};

const normalized2025 = F1_CALENDAR_2025.map((race) => ({
  ...race,
  name: normalizeRaceName(race.name),
}));

const getCalendarByYear = (year) => {
  if (year >= 2026) return F1_CALENDAR_2026;
  return normalized2025;
};

export const getLatestCompletedRace = (year) => {
  const now = new Date();
  const calendar = getCalendarByYear(year);

  const completedRaces = calendar.filter((race) => {
    const raceDate = new Date(race.race);
    return raceDate < now;
  });

  if (completedRaces.length === 0) {
    return calendar[0];
  }

  return completedRaces[completedRaces.length - 1];
};

export const getNextUpcomingRace = (year) => {
  const now = new Date();
  const calendar = getCalendarByYear(year);

  const upcoming = calendar.find((race) => {
    const raceDate = new Date(race.race);
    return raceDate > now;
  });

  if (upcoming) return upcoming;
  return calendar[calendar.length - 1];
};

export const getDefaultYear = () => {
  return new Date().getFullYear().toString();
};
