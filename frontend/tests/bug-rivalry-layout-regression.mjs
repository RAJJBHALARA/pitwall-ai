import assert from 'node:assert/strict'
import fs from 'node:fs'

const rivalry = fs.readFileSync('D:/f1 project/frontend/src/pages/RivalryTracker.jsx', 'utf8')
const fantasy = fs.readFileSync('D:/f1 project/frontend/src/pages/FantasyPicks.jsx', 'utf8')
const race = fs.readFileSync('D:/f1 project/frontend/src/pages/RaceAnalysis.jsx', 'utf8')
const lap = fs.readFileSync('D:/f1 project/frontend/src/pages/LapExplainer.jsx', 'utf8')
const mode = fs.readFileSync('D:/f1 project/frontend/src/context/ModeContext.jsx', 'utf8')
const onboarding = fs.readFileSync('D:/f1 project/frontend/src/components/OnboardingModal.jsx', 'utf8')
const footer = fs.readFileSync('D:/f1 project/frontend/src/components/Footer.jsx', 'utf8')

for (const source of [rivalry, fantasy, race, lap]) {
  assert(source.includes("['2026', '2025', '2024', '2023', '2022', '2021']"))
}

assert(rivalry.includes("RIVALRY</span>{' '}HUB"))
assert(rivalry.includes("Pick two drivers and see who's been better this season"))
assert(rivalry.includes("gridColumn: isMobile ? '1 / -1' : 'auto'"))
assert(rivalry.includes("return doubled > 4;"))
assert(fantasy.includes('const MAX_RETRIES = 3;'))
assert(fantasy.includes('Retrying... ({retryAttempt}/{MAX_RETRIES})'))
assert(race.includes("LIVE DATA (OPENF1)"))
assert(race.includes("Historical data (FastF1)"))
assert(mode.includes("const MODE_KEY = 'boxbox_mode';"))
assert(onboarding.includes('minHeight: isMobile ? 180 : 200'))
assert(footer.includes('https://api.github.com/repos/RAJJBHALARA/Box-Box'))

console.log('Rivalry/layout regression checks passed.')
