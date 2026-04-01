// Official 2026 F1 Team Colors — exact hex codes as specified
export const TEAM_COLORS = {
  'Red Bull Racing':    '#3671C6',
  'Red Bull':           '#3671C6',
  'Ferrari':            '#E8002D',
  'McLaren':            '#FF8000',
  'Mercedes':           '#27F4D2',
  'Aston Martin':       '#229971',
  'Alpine':             '#0093CC',
  'Williams':           '#64C4FF',
  'Haas':               '#B6BABD',
  'Haas F1 Team':       '#B6BABD',
  'RB':                 '#6692FF',
  'Racing Bulls':       '#6692FF',
  'Kick Sauber':        '#52E252',
  'Sauber':             '#52E252',
};

// Get team color with fallback
export function getTeamColor(teamName) {
  if (!teamName) return '#666666';
  // Try exact match first
  if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName];
  // Try partial match
  const key = Object.keys(TEAM_COLORS).find(k =>
    teamName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(teamName.toLowerCase())
  );
  return key ? TEAM_COLORS[key] : '#666666';
}

// All 2026 F1 drivers with team, nationality, flag
export const DRIVER_DATA = {
  VER: { name: 'Max Verstappen',      team: 'Red Bull Racing', flag: '🇳🇱', nationality: 'Dutch'       },
  NOR: { name: 'Lando Norris',        team: 'McLaren',         flag: '🇬🇧', nationality: 'British'     },
  LEC: { name: 'Charles Leclerc',     team: 'Ferrari',         flag: '🇲🇨', nationality: 'Monégasque'  },
  PIA: { name: 'Oscar Piastri',       team: 'McLaren',         flag: '🇦🇺', nationality: 'Australian'  },
  SAI: { name: 'Carlos Sainz',        team: 'Williams',        flag: '🇪🇸', nationality: 'Spanish'     },
  HAM: { name: 'Lewis Hamilton',      team: 'Ferrari',         flag: '🇬🇧', nationality: 'British'     },
  RUS: { name: 'George Russell',      team: 'Mercedes',        flag: '🇬🇧', nationality: 'British'     },
  ANT: { name: 'Kimi Antonelli',      team: 'Mercedes',        flag: '🇮🇹', nationality: 'Italian'     },
  ALO: { name: 'Fernando Alonso',     team: 'Aston Martin',    flag: '🇪🇸', nationality: 'Spanish'     },
  STR: { name: 'Lance Stroll',        team: 'Aston Martin',    flag: '🇨🇦', nationality: 'Canadian'    },
  GAS: { name: 'Pierre Gasly',        team: 'Alpine',          flag: '🇫🇷', nationality: 'French'      },
  DOO: { name: 'Jack Doohan',         team: 'Alpine',          flag: '🇦🇺', nationality: 'Australian'  },
  TSU: { name: 'Yuki Tsunoda',        team: 'Red Bull Racing', flag: '🇯🇵', nationality: 'Japanese'    },
  LAW: { name: 'Liam Lawson',         team: 'RB',              flag: '🇳🇿', nationality: 'New Zealander'},
  ALB: { name: 'Alexander Albon',     team: 'Williams',        flag: '🇹🇭', nationality: 'Thai'        },
  COL: { name: 'Franco Colapinto',    team: 'Alpine',          flag: '🇦🇷', nationality: 'Argentine'   },
  HUL: { name: 'Nico Hülkenberg',     team: 'Kick Sauber',     flag: '🇩🇪', nationality: 'German'      },
  BOR: { name: 'Gabriel Bortoleto',   team: 'Kick Sauber',     flag: '🇧🇷', nationality: 'Brazilian'   },
  OCO: { name: 'Esteban Ocon',        team: 'Haas',            flag: '🇫🇷', nationality: 'French'      },
  BEA: { name: 'Oliver Bearman',      team: 'Haas',            flag: '🇬🇧', nationality: 'British'     },
};

// Position change indicator
export function positionChangeLabel(change) {
  if (!change || change === 0) return null;
  if (change > 0) return { text: `▲${change}`, color: '#22c55e' };
  return { text: `▼${Math.abs(change)}`, color: '#ef4444' };
}
