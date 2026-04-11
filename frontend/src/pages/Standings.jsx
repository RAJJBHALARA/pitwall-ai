import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Award } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { getDriverStandings, getConstructorStandings } from '../services/api';
import { getTeamColor, DRIVER_DATA, positionChangeLabel } from '../utils/teamColors';
import { getFlagUrl } from '../utils/flagHelper';
import { useMode } from '../context/ModeContext';

const SEASON_YEAR = 2026; // Current live season

// Podium medal colours
const MEDAL = {
  1: { bg: 'from-[#FFD700]/20 to-[#FFD700]/5', border: '#FFD700', glow: '#FFD70040', label: '01' },
  2: { bg: 'from-[#C0C0C0]/20 to-[#C0C0C0]/5', border: '#C0C0C0', glow: '#C0C0C040', label: '02' },
  3: { bg: 'from-[#CD7F32]/20 to-[#CD7F32]/5', border: '#CD7F32', glow: '#CD7F3240', label: '03' },
};

function PodiumCard({ driver, rank, tab }) {
  const m = MEDAL[rank];
  const teamColor = tab === 'drivers'
    ? getTeamColor(driver.team)
    : getTeamColor(driver.name);
  const driverMeta = tab === 'drivers' ? DRIVER_DATA[driver.code] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: rank * 0.12, duration: 0.5, type: 'spring', stiffness: 120 }}
      className={`relative bg-gradient-to-b ${m.bg} border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden`}
      style={{ borderColor: m.border, boxShadow: `0 0 40px ${m.glow}` }}
    >
      {/* Position number watermark */}
      <div
        className="absolute right-3 top-1 font-['Space_Grotesk'] font-black text-7xl opacity-10 select-none"
        style={{ color: m.border }}
      >
        {m.label}
      </div>

      {/* Trophy icon */}
      <div className="flex items-center gap-2">
        <Award size={14} style={{ color: m.border }} />
        <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: m.border }}>
          P{rank}
        </span>
      </div>

      {/* Driver/Team name */}
      <div>
        <div className="flex items-center gap-2">
          {driverMeta && (
            <span className="flex items-center justify-center">
              <img src={getFlagUrl(driver.code)} alt={driver.code} style={{ width: 24, height: 18, borderRadius: 2 }} />
            </span>
          )}
          <span className="font-['Space_Grotesk'] font-black text-white text-base leading-tight">
            {tab === 'drivers' ? driver.code : driver.name}
          </span>
        </div>
        <div className="text-[11px] text-[#888] mt-0.5 truncate">
          {tab === 'drivers' ? driver.team : driver.nationality}
        </div>
      </div>

      {/* Team color strip */}
      <div className="h-0.5 w-full rounded-full" style={{ background: teamColor }} />

      {/* Points */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-['Space_Grotesk'] font-black text-3xl text-white">{driver.points}</div>
          <div className="text-[10px] text-[#666] uppercase tracking-widest">Points</div>
        </div>
        <div className="text-right">
          <div className="font-['Space_Grotesk'] font-bold text-lg text-white">{driver.wins}</div>
          <div className="text-[10px] text-[#666] uppercase tracking-widest">Wins</div>
        </div>
      </div>
    </motion.div>
  );
}

function StandingRow({ entry, index, leaderPoints, tab }) {
  const teamColor = tab === 'drivers'
    ? getTeamColor(entry.team)
    : getTeamColor(entry.name);
  const driverMeta = tab === 'drivers' ? DRIVER_DATA[entry.code] : null;
  const gap = leaderPoints - entry.points;
  const pct = leaderPoints > 0 ? (entry.points / leaderPoints) * 100 : 0;
  const change = positionChangeLabel(entry.positionChange);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.35 }}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
    >
      {/* Position */}
      <div className="w-7 flex-shrink-0 text-right">
        <span className="font-['Space_Grotesk'] font-bold text-sm text-[#555]">
          {entry.position}
        </span>
      </div>

      {/* Position change */}
      <div className="w-8 flex-shrink-0 text-center">
        {change ? (
          <span className="font-['Space_Grotesk'] font-bold text-[10px]" style={{ color: change.color }}>
            {change.text}
          </span>
        ) : (
          <Minus size={10} className="text-[#444] mx-auto" />
        )}
      </div>

      {/* Team color dot */}
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ background: teamColor }}
      />

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {driverMeta && (
            <span className="flex items-center justify-center">
              <img src={getFlagUrl(entry.code)} alt={entry.code} style={{ width: 24, height: 18, borderRadius: 2 }} />
            </span>
          )}
          <span className="font-['Space_Grotesk'] font-bold text-white text-sm truncate">
            {tab === 'drivers' ? entry.name : entry.name}
          </span>
          {tab === 'drivers' && (
            <span
              className="font-['Space_Grotesk'] font-bold text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: teamColor + '25', color: teamColor }}
            >
              {entry.code}
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#555] truncate mt-0.5">
          {tab === 'drivers' ? entry.team : entry.nationality}
        </div>
      </div>

      {/* Points bar */}
      <div className="w-28 hidden sm:block">
        <div className="h-1 bg-[#222] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.2 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: teamColor }}
          />
        </div>
      </div>

      {/* Gap */}
      <div className="w-14 text-right flex-shrink-0">
        <span className="font-['Space_Grotesk'] font-bold text-sm text-white">{entry.points}</span>
        {gap > 0 && (
          <div className="text-[9px] text-[#555]">-{gap}</div>
        )}
      </div>

      {/* Wins */}
      <div className="w-8 text-right flex-shrink-0 hidden md:block">
        <span className="font-['Space_Grotesk'] text-xs text-[#666]">{entry.wins}W</span>
      </div>
    </motion.div>
  );
}

export default function Standings() {
  const [activeTab, setActiveTab] = useState('drivers');
  const [driverData, setDriverData] = useState(null);
  const [constructorData, setConstructorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRound, setLastRound] = useState(null);
  const { isBeginnerMode } = useMode();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [dRes, cRes] = await Promise.all([
          getDriverStandings(SEASON_YEAR),
          getConstructorStandings(SEASON_YEAR),
        ]);
        setDriverData(dRes.data.standings);
        setConstructorData(cRes.data.standings);
        setLastRound(dRes.data.round);
      } catch (e) {
        setError(e.message || 'Failed to load standings');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const current = activeTab === 'drivers' ? driverData : constructorData;
  const top3 = current?.slice(0, 3) || [];
  const rest = current?.slice(3) || [];
  const leaderPoints = current?.[0]?.points || 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={22} className="text-[#e10600]" />
              <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-[0.25em] text-[#666] uppercase">
                2026 Season · After Round {lastRound ?? '…'}
              </span>
            </div>
            <h1 className="font-['Space_Grotesk'] font-black text-4xl md:text-5xl text-white tracking-tight">
              {isBeginnerMode ? 'Who\'s ' : 'Championship '}<span className="text-[#e10600]">{isBeginnerMode ? 'Winning? 🏆' : 'Standings'}</span>
            </h1>
            {isBeginnerMode && (
              <p className="text-sm text-[#999] font-['Inter'] mt-2">The leaderboard for {SEASON_YEAR} — higher points = better season</p>
            )}
          </motion.div>

          {/* Tab Switcher */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mb-8 bg-[#131313] rounded-xl p-1.5 border border-white/5 w-fit"
          >
            {['drivers', 'constructors'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 rounded-lg font-['Space_Grotesk'] font-bold text-sm uppercase tracking-wider transition-colors ${
                  activeTab === tab ? 'text-white' : 'text-[#666] hover:text-[#999]'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-highlight"
                    className="absolute inset-0 bg-[#e10600] rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'drivers'
                    ? (isBeginnerMode ? '🏁  Drivers' : '🏎  Drivers')
                    : (isBeginnerMode ? '🏢  Teams' : '🏭  Constructors')
                  }
                </span>
              </button>
            ))}
          </motion.div>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={28} className="text-[#e10600]" />
              </motion.div>
              <span className="font-['Space_Grotesk'] text-sm text-[#666] uppercase tracking-widest">
                Fetching standings…
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-24 text-center"
            >
              <AlertCircle size={36} className="text-[#e10600]" />
              <div>
                <p className="font-['Space_Grotesk'] font-bold text-white text-lg">Failed to load standings</p>
                <p className="text-[#666] text-sm mt-1">Backend may be offline. Start the server and refresh.</p>
                <p className="text-[#444] text-xs mt-2 font-mono">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {!loading && !error && current && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Podium Top 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {/* Order: P2, P1, P3 for visual podium effect on desktop */}
                  {[top3[1], top3[0], top3[2]].filter(Boolean).map((driver, i) => {
                    const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                    return (
                      <div key={driver.position} className={i === 1 ? 'sm:-mt-4' : 'sm:mt-4'}>
                        <PodiumCard driver={driver} rank={rank} tab={activeTab} />
                      </div>
                    );
                  })}
                </div>

                {/* Rest of field */}
                <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl overflow-hidden">
                  {/* Column headers */}
                  <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5 bg-[#131313]">
                    <div className="w-7 text-right">
                      <span className="font-['Space_Grotesk'] text-[9px] text-[#444] uppercase tracking-widest">Pos</span>
                    </div>
                    <div className="w-8" />
                    <div className="w-1" />
                    <div className="flex-1">
                      <span className="font-['Space_Grotesk'] text-[9px] text-[#444] uppercase tracking-widest">
                        {activeTab === 'drivers' ? 'Driver' : 'Constructor'}
                      </span>
                    </div>
                    <div className="w-28 hidden sm:block text-right">
                      <span className="font-['Space_Grotesk'] text-[9px] text-[#444] uppercase tracking-widest">Gap</span>
                    </div>
                    <div className="w-14 text-right">
                      <span className="font-['Space_Grotesk'] text-[9px] text-[#444] uppercase tracking-widest">
                        {isBeginnerMode ? 'Score' : 'PTS'}
                      </span>
                    </div>
                    <div className="w-8 text-right hidden md:block">
                      <span className="font-['Space_Grotesk'] text-[9px] text-[#444] uppercase tracking-widest">
                        {isBeginnerMode ? 'Wins' : 'W'}
                      </span>
                    </div>
                  </div>

                  {rest.map((entry, i) => (
                    <StandingRow
                      key={entry.position}
                      entry={entry}
                      index={i}
                      leaderPoints={leaderPoints}
                      tab={activeTab}
                    />
                  ))}
                </div>

                {/* Footer note */}
                <div className="mt-4 text-center">
                  <p className="text-[#444] text-[10px] font-['Space_Grotesk'] uppercase tracking-widest">
                    Data from Jolpica API · 2026 Season · Updates post-race
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
