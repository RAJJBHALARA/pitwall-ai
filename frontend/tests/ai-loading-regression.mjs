import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = {
  loadingBlock: 'D:/f1 project/frontend/src/components/AILoadingBlock.jsx',
  circuitInfo: 'D:/f1 project/frontend/src/components/CircuitInfo.jsx',
  rivalry: 'D:/f1 project/frontend/src/pages/RivalryTracker.jsx',
  fantasy: 'D:/f1 project/frontend/src/pages/FantasyPicks.jsx',
  lap: 'D:/f1 project/frontend/src/pages/LapExplainer.jsx',
  career: 'D:/f1 project/frontend/src/pages/DriverCareer.jsx',
};

for (const file of Object.values(files)) {
  assert.ok(fs.existsSync(file), `Expected file to exist: ${file}`);
}

const loadingBlock = fs.readFileSync(files.loadingBlock, 'utf8');
const circuitInfo = fs.readFileSync(files.circuitInfo, 'utf8');
const rivalry = fs.readFileSync(files.rivalry, 'utf8');
const fantasy = fs.readFileSync(files.fantasy, 'utf8');
const lap = fs.readFileSync(files.lap, 'utf8');
const career = fs.readFileSync(files.career, 'utf8');

assert.ok(loadingBlock.includes('export default function AILoadingBlock'), 'AILoadingBlock component should export a shared loader');
assert.ok(circuitInfo.includes("import AILoadingBlock from './AILoadingBlock'"), 'CircuitInfo should use the shared AI loader');
assert.ok(rivalry.includes("import AILoadingBlock from '../components/AILoadingBlock'"), 'RivalryTracker should use the shared AI loader');
assert.ok(fantasy.includes("import AILoadingBlock from '../components/AILoadingBlock'"), 'FantasyPicks should use the shared AI loader');
assert.ok(lap.includes("import AILoadingBlock from '../components/AILoadingBlock'"), 'LapExplainer should use the shared AI loader');
assert.ok(career.includes("import AILoadingBlock from '../components/AILoadingBlock'"), 'DriverCareer should use the shared AI loader');

console.log('AI loading regression checks passed.');
