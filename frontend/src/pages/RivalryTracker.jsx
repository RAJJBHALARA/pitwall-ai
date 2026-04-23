import { useState, useEffect } from 'react';
import { Share2, BarChart2, Lightbulb, AlertCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAnimatedCounter } from '../utils/useAnimatedCounter';
import CustomDropdown from '../components/CustomDropdown';
import PageTransition from '../components/PageTransition';
import { getRivalryStats, getDrivers } from '../services/api';
import { DRIVER_DATA } from '../utils/teamColors';
import { getFlagUrl } from '../utils/flagHelper';
import DriverImage from '../components/DriverImage';
import { useMode } from '../context/ModeContext';

const TEAM_GRADIENTS = {
  'Mercedes':          'linear-gradient(180deg, #27F4D2 0%, #0a0a0a 60%)',
  'Red Bull Racing':   'linear-gradient(180deg, #3671C6 0%, #0a0a0a 60%)',
  'Ferrari':           'linear-gradient(180deg, #E8002D 0%, #0a0a0a 60%)',
  'McLaren':          'linear-gradient(180deg, #FF8000 0%, #0a0a0a 60%)',
  'Aston Martin':     'linear-gradient(180deg, #358C75 0%, #0a0a0a 60%)',
  'Alpine':            'linear-gradient(180deg, #FF87BC 0%, #0a0a0a 60%)',
  'Williams':          'linear-gradient(180deg, #37BEDD 0%, #0a0a0a 60%)',
  'Haas':              'linear-gradient(180deg, #B6BABD 0%, #0a0a0a 60%)',
  'Kick Sauber':      'linear-gradient(180deg, #52E252 0%, #0a0a0a 60%)',
  'RB':                'linear-gradient(180deg, #6692FF 0%, #0a0a0a 60%)',
};

const DRIVER_TEAMS = {
  VER:'Red Bull Racing', NOR:'McLaren', PIA:'McLaren', LEC:'Ferrari',
  HAM:'Ferrari', RUS:'Mercedes', SAI:'Williams', ALO:'Aston Martin',
  STR:'Aston Martin', OCO:'Haas', GAS:'Alpine', TSU:'RB',
  ALB:'Williams', HUL:'Kick Sauber', MAG:'Haas', BOT:'Kick Sauber',
  ANT:'Mercedes', BEA:'Haas', LAW:'RB', DOO:'Alpine', HAD:'RB', COL:'Alpine',
};

export default function RivalryTracker() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dur = (d) => (shouldReduceMotion ? 0 : isMobile ? d * 0.7 : d);
  const { isBeginnerMode } = useMode();

  const [season, setSeason] = useState('2026');
  const [driver1, setDriver1] = useState('HAM');
  const [driver2, setDriver2] = useState('RUS');
  const [driverList, setDriverList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rivalryData, setRivalryData] = useState(null);
  const [aiText, setAiText] = useState('');

  // Fetch driver list for dropdowns
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await getDrivers(parseInt(season));
        if (res.data.drivers) {
          setDriverList(res.data.drivers.map(d => d.code || d.abbreviation || d));
        }
      } catch { /* keep defaults */ }
    };
    fetchDrivers();
  }, [season]);

  // Fetch rivalry data
  useEffect(() => {
    if (driver1 === driver2) return;
    const fetchRivalry = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getRivalryStats(parseInt(season), driver1, driver2);
        setRivalryData(res.data.stats);
        setAiText(res.data.aiAnalysis || '');
      } catch (err) {
        setError(
          err.message === 'RATE_LIMIT' ? 'Too many requests. Wait 1 minute.' :
          err.message === 'AUTH_ERROR' ? 'Authentication failed.' :
          err.message === 'NO_DATA' ? 'No rivalry data available for these drivers.' :
          'Something went wrong. Try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRivalry();
  }, [season, driver1, driver2]);

  // Animated counters — use real data when available, fallback to 0
  const q1 = rivalryData?.qualifying?.[driver1] ?? 0;
  const q2 = rivalryData?.qualifying?.[driver2] ?? 0;
  const w1 = rivalryData?.race_wins?.[driver1] ?? 0;
  const w2 = rivalryData?.race_wins?.[driver2] ?? 0;
  const p1 = rivalryData?.points?.[driver1] ?? 0;
  const p2 = rivalryData?.points?.[driver2] ?? 0;

  const qualy1 = useAnimatedCounter(q1, 1.5, 0.3);
  const qualy2 = useAnimatedCounter(q2, 1.5, 0.3);
  const wins1 = useAnimatedCounter(w1, 1.5, 0.5);
  const wins2 = useAnimatedCounter(w2, 1.5, 0.5);
  const points1 = useAnimatedCounter(p1, 1.5, 0.7);
  const points2 = useAnimatedCounter(p2, 1.5, 0.7);

  const isCorrupted = (text) => {
    if (!text) return true;

    if (/(.)\1{2,}/.test(text)) return true;

    const doubledAll = (text.match(/([a-z])\1/gi) || []).length;
    if (doubledAll > 4) return true;

    const weirdLongWords = (text.match(/[A-Za-z']{10,}/g) || []).filter(
      (w) => /([aeiou])\1|([bcdfghjklmnpqrstvwxyz])\1/i.test(w)
    );
    if (weirdLongWords.length > 0) return true;

    return false;
  };

  const calcPercent = (a, b) => {
    const total = a + b;
    if (total === 0) return ['50%', '50%'];
    return [`${Math.round((a / total) * 100)}%`, `${Math.round((b / total) * 100)}%`];
  };

  const BEGINNER_LABELS = {
    'Qualifying': 'Who Starts Ahead?',
    'Race Wins': 'Who Won More Races?',
    'Avg. Pace Gap': 'Speed Difference',
    'Championship Points': 'Total Score',
  };

  const stats = [
    { label: 'Qualifying', v1: qualy1, v2: qualy2, p1: calcPercent(q1, q2)[0], p2: calcPercent(q1, q2)[1] },
    { label: 'Race Wins', v1: wins1, v2: wins2, p1: calcPercent(w1, w2)[0], p2: calcPercent(w1, w2)[1] },
    { label: 'Avg. Pace Gap', v1: rivalryData?.avg_gap || '---', v2: '---', p1: '85%', p2: '15%', isSpecial: true },
    { label: 'Championship Points', v1: points1, v2: points2, p1: calcPercent(p1, p2)[0], p2: calcPercent(p1, p2)[1] },
  ];

  // Available drivers for dropdowns
  const driverOptions = driverList.length > 0 ? driverList : ['VER', 'NOR', 'LEC', 'SAI', 'HAM', 'RUS', 'PIA', 'ALO'];

  return (
    <PageTransition>
      <div className="pt-8 pb-28 px-4 max-w-4xl mx-auto min-h-screen w-full">
        <div className="flex flex-col mb-8 gap-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-['Space_Grotesk'] font-bold tracking-[-0.02em] uppercase text-3xl text-white"
          >
            <span className="text-[#e10600] italic mr-3">
              {isBeginnerMode ? 'DRIVER' : 'RIVALRY'}
            </span>
            {isBeginnerMode ? 'SHOWDOWN' : 'HUB'}
          </motion.h1>
          {isBeginnerMode && (
            <p className="text-sm text-[#999] font-['Inter']">Pick two drivers and see who's been better this season 🏆</p>
          )}
        </div>

        {/* Year + Driver Selectors */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="col-span-1">
              <CustomDropdown label="Season" value={season} options={['2026', '2025', '2024', '2023', '2022']} onChange={setSeason} />
              {parseInt(season) >= 2025 ? (
                <p className="text-[10px] text-[#00D2BE] mt-1 font-bold">✓ LIVE DATA</p>
              ) : (
                <p className="text-[10px] text-[#666] mt-1">HISTORICAL</p>
              )}
            </div>
            <div className="col-span-1">
              <CustomDropdown label="Driver 1" value={driver1} options={driverOptions.filter(d => d !== driver2)} onChange={setDriver1} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <CustomDropdown label="Driver 2" value={driver2} options={driverOptions.filter(d => d !== driver1)} onChange={setDriver2} />
            </div>
          </div>
          <div className="flex gap-4 self-end md:self-auto">
            <motion.button 
              {...(!isMobile && { whileHover: { scale: 1.1 } })}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px',
              }}
              className="w-12 h-12 flex items-center justify-center text-[#e9bcb5] hover:text-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
            <motion.button 
              {...(!isMobile && { whileHover: { scale: 1.1 } })}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 flex items-center justify-center bg-[#e10600] rounded-full text-white shadow-[0_0_15px_rgba(225,6,0,0.4)] hover:bg-[#c00500] transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3 text-red-500">
            <AlertCircle size={20} />
            <span className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">{error}</span>
          </motion.div>
        )}

        {/* Rivalry Head-to-Head Hero */}
        <div className="relative grid grid-cols-2 gap-px bg-[#5e3f3a]/20 rounded-2xl overflow-hidden mb-12 shadow-2xl">
          {/* Driver 1 */}
          <motion.div 
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: dur(0.6), ease: "easeOut" }}
            className="p-6 pb-0 flex flex-col items-center relative overflow-hidden"
            style={{ background: TEAM_GRADIENTS[DRIVER_TEAMS[driver1]] || '#1c1b1b' }}
          >
            <div className="relative w-full flex items-end justify-center" style={{ height: 260 }}>
              <DriverImage code={driver1} size={200} />
            </div>
            <div className="absolute bottom-6 left-6 z-10">
              <div className="flex items-center gap-2 justify-start">
                <img src={getFlagUrl(driver1)} alt={driver1} loading="lazy" decoding="async" style={{ width: 36, height: 27, borderRadius: 2 }} />
                <p className="font-['Space_Grotesk'] font-black text-5xl italic text-white tracking-tighter leading-none drop-shadow-lg">{driver1}</p>
              </div>
              <p className="font-body text-xs text-[#e9bcb5] uppercase tracking-[0.2em] mt-2 font-bold drop-shadow-md">Driver 1</p>
            </div>
          </motion.div>

          {/* Driver 2 */}
          <motion.div 
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: dur(0.6), ease: "easeOut" }}
            className="p-6 pb-0 flex flex-col items-center relative overflow-hidden"
            style={{ background: TEAM_GRADIENTS[DRIVER_TEAMS[driver2]] || '#1c1b1b' }}
          >
            <div className="relative w-full flex items-end justify-center" style={{ height: 260 }}>
              <DriverImage code={driver2} size={200} />
            </div>
            <div className="absolute bottom-6 right-6 z-10 text-right">
              <div className="flex items-center gap-2 justify-end">
                <img src={getFlagUrl(driver2)} alt={driver2} loading="lazy" decoding="async" style={{ width: 36, height: 27, borderRadius: 2 }} />
                <p className="font-['Space_Grotesk'] font-black text-5xl italic text-white tracking-tighter leading-none drop-shadow-lg">{driver2}</p>
              </div>
              <p className="font-body text-xs text-[#e9bcb5] uppercase tracking-[0.2em] mt-2 font-bold drop-shadow-md">Driver 2</p>
            </div>
          </motion.div>

          {/* VS Badge */}
          <motion.div 
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <div className="bg-[#e10600] text-white font-['Space_Grotesk'] font-black italic px-6 py-2 text-xl skew-x-[-12deg] shadow-[0_10px_30px_rgba(225,6,0,0.5)]">
              VS
            </div>
          </motion.div>
        </div>

        {/* Comparative Stats Grid */}
        <section className="space-y-10">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-['Space_Grotesk'] font-black text-xl text-[#e9bcb5] tracking-widest uppercase mb-8 flex items-center gap-4"
          >
            <span className="h-px flex-1 bg-[#5e3f3a]/50"></span>
            {isBeginnerMode ? 'The Scorecard' : 'Head-to-Head Data'}
            <span className="h-px flex-1 bg-[#5e3f3a]/50"></span>
          </motion.h2>

          {loading ? (
            <div className="space-y-8 animate-pulse">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between"><div className="h-6 w-12 bg-white/5 rounded" /><div className="h-4 w-24 bg-white/5 rounded" /><div className="h-6 w-12 bg-white/5 rounded" /></div>
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            stats.map((stat, i) => (
              <div key={stat.label} className="space-y-4">
                <div className="flex justify-between items-end px-2">
                  <span className={`font-['Space_Grotesk'] font-bold text-3xl ${stat.isSpecial ? 'text-[#47efda]' : 'text-white'}`}>{stat.v1}</span>
                  <span className="font-['Space_Grotesk'] font-bold text-xs text-[#e9bcb5] tracking-[0.2em] uppercase pb-1">
                    {isBeginnerMode ? (BEGINNER_LABELS[stat.label] || stat.label) : stat.label}
                  </span>
                  <span className="font-['Space_Grotesk'] font-bold text-3xl text-white">{stat.v2}</span>
                </div>
                <div className="flex h-2 w-full bg-[#353534] rounded-full overflow-hidden gap-1 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: stat.p1 }}
                    transition={{ duration: dur(0.8), delay: i * 0.1 }}
                    className={`h-full ${stat.isSpecial ? 'bg-[#01d2be]' : 'bg-gradient-to-l from-transparent to-[#e10600]'} rounded-full`}
                  />
                  <div className="h-full bg-[#2a2a2a] rounded-full flex-1"></div>
                  {!stat.isSpecial && (
                     <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stat.p2 }}
                      transition={{ duration: dur(0.8), delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-transparent to-[#e10600] rounded-full"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Insights Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: dur(0.5) }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: '4px solid #e10600',
            borderRadius: 16,
          }}
          className="mt-16 p-8 relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Lightbulb className="w-32 h-32" />
          </div>
          <h3 className="font-['Space_Grotesk'] font-bold text-sm tracking-widest text-[#ffb4a8] uppercase mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#e10600]" />
            AI Analysis
          </h3>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-3/4 bg-white/5 rounded" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
            </div>
          ) : aiText && !isCorrupted(aiText) ? (
            <p className="text-[#e5e2e1] text-lg leading-relaxed relative z-10 font-['Inter']">
              {aiText || 'No AI analysis available for this matchup.'}
            </p>
          ) : aiText && isCorrupted(aiText) ? (
            <p
              className="text-lg leading-relaxed relative z-10 font-['Inter']"
              style={{ color: '#666', fontStyle: 'italic' }}
            >
              AI analysis temporarily unavailable. Check back shortly.
            </p>
          ) : (
            <p
              className="text-lg leading-relaxed relative z-10 font-['Inter']"
              style={{ color: '#666' }}
            >
              Loading analysis...
            </p>
          )}
        </motion.div>

      </div>
    </PageTransition>
  );
}
