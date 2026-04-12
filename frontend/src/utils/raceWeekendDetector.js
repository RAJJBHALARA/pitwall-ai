import { F1_CALENDAR_2025 } from './f1Calendar2025';

// ── Test Mode ─────────────────────────────────────────
// Set TEST_MODE = true + a TEST_DATE to simulate a race weekend
const TEST_MODE = false;
const TEST_DATE = new Date('2025-05-22T12:00:00Z'); // Monaco GP FP1

/**
 * Detects whether a race weekend is currently active,
 * a session is live, or the next race is within 7 days.
 */
export function getCurrentRaceStatus() {
  const now = TEST_MODE ? TEST_DATE : new Date();

  for (const race of F1_CALENDAR_2025) {
    const fp1Date = new Date(race.fp1);
    const raceDate = new Date(race.race);

    // Weekend window: FP1 to 3 hours after race
    const weekendEnd = new Date(raceDate);
    weekendEnd.setHours(weekendEnd.getHours() + 3);

    if (now >= fp1Date && now <= weekendEnd) {
      const sessions = [
        { name: 'FP1', time: new Date(race.fp1), duration: 60 },
        { name: 'FP2', time: new Date(race.fp2), duration: 60 },
        { name: 'FP3', time: new Date(race.fp3), duration: 60 },
        { name: 'QUALIFYING', time: new Date(race.qualifying), duration: 75 },
        { name: 'RACE', time: new Date(race.race), duration: 120 },
      ];

      let currentSession = null;
      let nextSession = null;

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        const sessionEnd = new Date(s.time);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + s.duration);

        if (now >= s.time && now <= sessionEnd) {
          currentSession = s.name;
        }
        if (now < s.time && !nextSession) {
          nextSession = s;
        }
      }

      return {
        isRaceWeekend: true,
        isUpcoming: false,
        race,
        currentSession,
        nextSession,
        isLive: currentSession !== null,
      };
    }

    // Upcoming: within 7 days of FP1
    const sevenDaysBefore = new Date(fp1Date);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    if (now >= sevenDaysBefore && now < fp1Date) {
      return {
        isRaceWeekend: false,
        isUpcoming: true,
        race,
        daysUntil: Math.ceil((fp1Date - now) / (1000 * 60 * 60 * 24)),
      };
    }
  }

  return { isRaceWeekend: false, isUpcoming: false };
}

/**
 * Format a countdown from now to a target date.
 * Returns { hours, minutes, seconds }.
 */
export function formatCountdown(targetDate) {
  const now = TEST_MODE ? TEST_DATE : new Date();
  const diff = new Date(targetDate) - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}
