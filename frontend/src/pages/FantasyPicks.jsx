import { useState, useEffect } from 'react';
import { Sparkles, Trophy, TrendingDown, TrendingUp, AlertCircle, ShieldAlert, Share2, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStaggerChildren } from '../utils/useStaggerChildren';
import { useTypewriter } from '../utils/useTypewriter';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';
import CustomDropdown from '../components/CustomDropdown';
import PageTransition from '../components/PageTransition';
import { getFantasyPicks, getAvailableRaces } from '../services/api';
import { getFlagUrl } from '../utils/flagHelper';
import DriverImage from '../components/DriverImage';
import { useMode } from '../context/ModeContext';
import { getTeamColor } from '../utils/teamColors';

export default function FantasyPicks() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dur = (d) => (shouldReduceMotion ? 0 : isMobile ? d * 0.7 : d);
  const { isBeginnerMode } = useMode();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { containerVariants, itemVariants } = useStaggerChildren(0.1, 0.05);

  const [season, setSeason] = useState('2026');
  const [selectedRace, setSelectedRace] = useState('');
  const [raceList, setRaceList] = useState([]);

  const [drivers, setDrivers] = useState([]);
  const [constructor, setConstructor] = useState(null);
  const [keyInsight, setKeyInsight] = useState('');
  const [driversToAvoid, setDriversToAvoid] = useState([]);
  
  const [currentForm, setCurrentForm] = useState({});
  const [formSource, setFormSource] = useState('');
  const [data, setData] = useState(null);

  const displayedInsight = useTypewriter(keyInsight, 40);

  // Share state
  const [shareState, setShareState] = useState('idle'); // idle | copied | tweeted

  const [myTeam, setMyTeam] = useState([]);
  const BUDGET = 100;

  const isInTeam = (driverCode) => myTeam.some(d => d.code === driverCode);

  const addToTeam = (driver) => {
    if (myTeam.length >= 5) {
      toast.error('Team is full! Max 5 drivers.');
      return;
    }
    if (myTeam.find(d => d.code === driver.code)) {
      toast.error(`${driver.name} already in team`);
      return;
    }
    setMyTeam(prev => [...prev, driver]);
    toast.success(`${driver.name} added to team`);
  };

  const removeFromTeam = (driverCode) => {
    setMyTeam(prev => prev.filter(d => d.code !== driverCode));
    toast.success('Driver removed');
  };

  const assembleAutoLineup = () => {
    if (!data?.drivers || data.drivers.length === 0) {
      toast.error('Get AI picks first!');
      return;
    }

    const top5 = data.drivers.slice(0, 5).map((d, i) => ({
      id: i + 1,
      name: d.name || d.code,
      code: d.code,
      price: d.price_range || '---',
      price_range: d.price_range || '---',
      team: d.team || 'Unknown',
      reasoning: d.reasoning || '',
      trend: i < 3 ? 'up' : 'static',
    }));

    setMyTeam(top5);

    setTimeout(() => {
      document.getElementById('my-team-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 300);

    toast.success('AI lineup assembled! 🏎️');
  };

  const budgetUsed = myTeam.reduce((sum, d) => {
    const match = (d.price_range || d.price || '').match(/\$(\d+)-(\d+)M/);
    if (match) {
      return sum + ((parseInt(match[1]) + parseInt(match[2])) / 2);
    }
    return sum + 20;
  }, 0);

  const budgetRemaining = BUDGET - budgetUsed;

  const cleanUserText = (text = '') =>
    String(text).replace(/JSON\s+parse\s+failed/gi, 'Based on recent performance data').trim();

  function buildTweetText() {
    const driverLine = drivers.slice(0, 5).map(d => d.code || d.name).join(' | ');
    const teamLine = constructor ? constructor.name : 'N/A';
    const race = selectedRace || 'the next race';
    return encodeURIComponent(
      `My BoxBox picks for ${race} 🏎️\n` +
      `Drivers: ${driverLine}\n` +
      `Constructor: ${teamLine}\n` +
      `Powered by @BoxBoxApp\n` +
      `boxbox.app\n` +
      `#F1 #F1Fantasy #Formula1`
    );
  }

  function handleShare() {
    if (drivers.length === 0) return;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${buildTweetText()}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    setShareState('tweeted');
    setTimeout(() => setShareState('idle'), 3000);
  }

  function handleCopy() {
    if (drivers.length === 0) return;
    const driverLine = drivers.slice(0, 5).map(d => d.code || d.name).join(', ');
    const teamLine = constructor ? constructor.name : 'N/A';
    const text =
      `My BoxBox picks for ${selectedRace || 'the next race'} 🏎️\n` +
      `Drivers: ${driverLine}\n` +
      `Constructor: ${teamLine}\n` +
      `Powered by @BoxBoxApp | boxbox.app\n` +
      `#F1 #F1Fantasy #Formula1`;
    navigator.clipboard.writeText(text).then(() => {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    });
  }


  // Fetch race list
  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await getAvailableRaces(parseInt(season));
        if (res.data.races?.length) {
          setRaceList(res.data.races);
          setSelectedRace(res.data.races[res.data.races.length - 1]); // default to latest
        }
      } catch {
        setRaceList(['Monaco Grand Prix', 'British Grand Prix', 'Italian Grand Prix']);
        setSelectedRace('Monaco Grand Prix');
      }
    };
    fetchRaces();
  }, [season]);

  // Fetch fantasy picks with retry logic for Render cold starts
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!selectedRace) return;
    let cancelled = false;
    let retryTimer = null;

    const fetchFantasyPicks = async (retryCount = 0) => {
      try {
        if (retryCount === 0) {
          setIsLoading(true);
          setError(null);
          setDrivers([]);
          setConstructor(null);
          setKeyInsight('');
          setDriversToAvoid([]);
          setCurrentForm({});
          setFormSource('');
          setData(null);
        }
        setRetryAttempt(retryCount);

        const res = await getFantasyPicks(selectedRace, parseInt(season));
        if (cancelled) return;
        const data = res.data;
        setData(data);

        if (data.error) {
          setError(cleanUserText(data.message || 'AI could not generate picks.'));
          setDrivers([]);
          setIsLoading(false);
          return;
        }

        // Map API drivers to display format
        const mapped = (data.drivers || []).map((d, i) => ({
          id: i + 1,
          name: d.name || d.code,
          code: d.code,
          price: d.price_range || '---',
          price_range: d.price_range || '---',
          team: d.team || 'Unknown',
          reasoning: d.reasoning || '',
          trend: i < 3 ? 'up' : 'static',
        }));

        setDrivers(mapped);
        setConstructor(data.constructor || null);
        setKeyInsight(cleanUserText(data.key_insight || ''));
        setDriversToAvoid(data.drivers_to_avoid || []);
        setCurrentForm(data.form_data || {});
        setFormSource(data.source || '');
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (retryCount < 2) {
          setError('RETRYING');
          retryTimer = setTimeout(() => {
            if (!cancelled) fetchFantasyPicks(retryCount + 1);
          }, 8000);
        } else {
          setError(
            err.message === 'RATE_LIMIT' ? 'Too many requests — wait a minute.' :
            err.message === 'AUTH_ERROR' ? 'Authentication failed.' :
            err.message === 'NO_DATA' ? 'No fantasy data for this race.' :
            err.message === 'REQUEST_TIMEOUT' ? 'Backend took too long to wake up. Try again in a moment.' :
            'Failed to fetch picks. Check backend.'
          );
          setIsLoading(false);
        }
      }
    };
    fetchFantasyPicks();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [selectedRace, season]);

  return (
    <PageTransition>
      <div className="pt-8 pb-28 px-4 max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-['Space_Grotesk'] font-bold tracking-tight text-white mb-2 text-4xl"
          >
            {isBeginnerMode ? 'AI DREAM' : 'FANTASY'} <span className="text-[#e10600]">{isBeginnerMode ? 'TEAM ✨' : 'STRATEGIST'}</span>
          </motion.h1>
          <p className="text-[#e9bcb5] uppercase tracking-[0.2em] font-bold text-xs">
            {isBeginnerMode ? 'Our AI picks the best drivers for you — just sit back!' : 'AI-Optimized Selection Engine'}
          </p>
        </header>

        {/* Race selector */}
        <div className="flex flex-wrap gap-6 mb-10">
          <div className="w-32">
            <CustomDropdown label="Season" value={season} options={['2026', '2025', '2024', '2023', '2022']} onChange={setSeason} />
            {parseInt(season) >= 2025 ? (
              <p className="text-[10px] text-[#00D2BE] mt-1 font-bold">✓ LIVE DATA (OPENF1)</p>
            ) : (
              <p className="text-[10px] text-[#666] mt-1">HISTORICAL (FASTF1)</p>
            )}
          </div>
          <div className="w-64">
            <CustomDropdown label="Grand Prix" value={selectedRace} options={raceList} onChange={setSelectedRace} />
          </div>
        </div>

        {/* Error Banner */}
        {error === 'RETRYING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-amber-500/10 border border-amber-400/30 rounded flex items-center justify-between gap-3 text-amber-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">
                Backend waking up, retrying automatically... ⚙️
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
              Attempt {retryAttempt + 1}/3
            </span>
          </motion.div>
        )}

        {error && error !== 'RETRYING' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">{error}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* AI Advisor Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: dur(0.6) }}
            className="lg:col-span-4"
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
              }}
              className="p-8 relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="text-[#e10600]/20 w-12 h-12" />
              </div>
              
              <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                <Trophy size={16} className="text-[#e10600]" />
                {isBeginnerMode ? 'Why These Picks?' : 'Strategy Brief'}
              </h2>

              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-4 w-3/4 bg-white/5 rounded" />
                  <div className="h-4 w-1/2 bg-white/5 rounded" />
                </div>
              ) : (
                <p className="text-[#e5e2e1] leading-relaxed mb-8 min-h-[100px]">
                  {displayedInsight || 'No insights available yet.'}
                </p>
              )}

              <div className="space-y-6">
                {/* Constructor Pick */}
                {!isLoading && constructor && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: '2px solid #47efda',
                      borderRadius: 12,
                    }}
                    className="p-5"
                  >
                    <p className="text-[10px] font-bold text-[#47efda] uppercase tracking-widest mb-1">
                      {isBeginnerMode ? 'Best Team to Pick' : 'Top Constructor'}
                    </p>
                    <p className="text-white font-['Space_Grotesk'] font-bold">{constructor.name}</p>
                    <p className="text-xs text-[#e9bcb5] mt-1">{constructor.reasoning}</p>
                  </motion.div>
                )}

                {/* Avoid List */}
                {!isLoading && driversToAvoid.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: '2px solid #e10600',
                      borderRadius: 12,
                    }}
                    className="p-5"
                  >
                    <p className="text-[10px] font-bold text-[#e10600] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ShieldAlert size={12} /> {isBeginnerMode ? 'Skip These Drivers' : 'Drivers to Avoid'}
                    </p>
                    <p className="text-white font-['Space_Grotesk'] font-bold">{driversToAvoid.join(', ')}</p>
                  </motion.div>
                )}
              </div>

              <motion.button 
                onClick={assembleAutoLineup}
                {...(!isMobile && { whileHover: { gap: '12px' } })}
                className="mt-12 w-full py-4 bg-[#e10600] text-white font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(225,6,0,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
                style={{ borderRadius: 100 }}
              >
                Assemble Auto-Lineup ✦
              </motion.button>

              <a
                href="https://game.formula1.com/en/fantasy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 100,
                  color: '#888',
                  fontSize: 13,
                  textDecoration: 'none',
                  marginTop: 8,
                  justifyContent: 'center'
                }}
              >
                Apply picks in Official F1 Fantasy →
              </a>

              {/* Share Picks */}
              <div className="mt-3 flex gap-2">
                <motion.button
                  id="share-tweet-btn"
                  onClick={handleShare}
                  disabled={drivers.length === 0 || isLoading}
                  whileTap={{ scale: 0.96 }}
                  {...(!isMobile && { whileHover: { scale: 1.02 } })}
                  className={`flex-1 py-3 rounded-xl font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border ${
                    drivers.length === 0 || isLoading
                      ? 'border-white/5 text-[#555] cursor-not-allowed'
                      : shareState === 'tweeted'
                      ? 'border-[#1DA1F2]/50 bg-[#1DA1F2]/10 text-[#1DA1F2]'
                      : 'border-[#1DA1F2]/30 bg-[#1DA1F2]/5 text-[#1DA1F2] hover:bg-[#1DA1F2]/15'
                  }`}
                >
                  {shareState === 'tweeted' ? <Check size={13} /> : <Share2 size={13} />}
                  {shareState === 'tweeted' ? 'Tweeted!' : 'Share on X'}
                </motion.button>

                <motion.button
                  id="copy-picks-btn"
                  onClick={handleCopy}
                  disabled={drivers.length === 0 || isLoading}
                  whileTap={{ scale: 0.96 }}
                  {...(!isMobile && { whileHover: { scale: 1.02 } })}
                  className={`px-4 py-3 rounded-xl font-['Space_Grotesk'] font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                    drivers.length === 0 || isLoading
                      ? 'border-white/5 text-[#555] cursor-not-allowed'
                      : shareState === 'copied'
                      ? 'border-[#47efda]/50 bg-[#47efda]/10 text-[#47efda]'
                      : 'border-white/10 bg-white/5 text-[#999] hover:text-white hover:border-white/20'
                  }`}
                  title="Copy to clipboard"
                >
                  {shareState === 'copied' ? <Check size={13} /> : <Copy size={13} />}
                </motion.button>
              </div>

              {/* Toast */}
              <AnimatePresence>
                {shareState !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-2 text-center text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest"
                    style={{ color: shareState === 'copied' ? '#47efda' : '#1DA1F2' }}
                  >
                    {shareState === 'copied' ? '✓ Copied to clipboard!' : '✓ Opening X / Twitter…'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Driver Grid */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loader" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} type="driver" />)}
                </div>
              ) : drivers.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertCircle size={48} className="text-[#e10600]/40 mb-4" />
                  <p className="text-[#e9bcb5] font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">No driver picks available</p>
                  <p className="text-[#999] text-xs mt-2">Try selecting a different race.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                   {drivers.map(driver => (
                     <motion.div 
                       key={driver.id}
                       variants={itemVariants}
                       {...(!isMobile && { whileHover: { y: -8, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' } })}
                       style={{
                         background: 'rgba(255,255,255,0.03)',
                         backdropFilter: 'blur(12px)',
                         WebkitBackdropFilter: 'blur(12px)',
                         border: '1px solid rgba(255,255,255,0.08)',
                         borderRadius: 16,
                       }}
                       className="group overflow-hidden hover:border-[#e10600]/30 transition-colors"
                     >
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px 16px 0 0', height: 260 }} className="relative overflow-hidden">
                          <DriverImage
                            code={driver.code}
                            name={driver.name}
                            fill={true}
                            className="w-full h-full object-top object-contain transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                             <div className="flex items-center gap-1.5">
                                {driver.trend === 'up' && <TrendingUp size={14} className="text-[#47efda]" />}
                                {driver.trend === 'down' && <TrendingDown size={14} className="text-[#e10600]" />}
                                {driver.trend === 'static' && <AlertCircle size={14} className="text-[#e9bcb5]" />}
                                <span className="text-xs font-bold text-white">{driver.price}</span>
                             </div>
                          </div>
                       </div>

                       <div className="p-6">
                          <h3 className="font-['Space_Grotesk'] font-bold text-white text-xl mb-1 flex items-center gap-2">
                            <span className="flex items-center justify-center">
                              <img src={getFlagUrl(driver.code)} alt={driver.code} loading="lazy" decoding="async" style={{ width: 24, height: 18, borderRadius: 2 }} />
                            </span>
                            <span>{driver.name}</span>
                          </h3>
                          <p className="text-xs text-[#e9bcb5] font-bold uppercase tracking-tighter opacity-60 mb-3">{driver.team}</p>
                          
                          {driver.reasoning && (
                            <div className="mb-4">
                              {isBeginnerMode && (
                                <p className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-widest mb-1">💡 Why pick them?</p>
                              )}
                              <p className="text-xs text-[#999] leading-relaxed line-clamp-2">{driver.reasoning}</p>
                            </div>
                          )}
                          
                          {currentForm[driver.code] && currentForm[driver.code].length > 0 && (
                            <div className="mb-4 flex flex-col gap-1.5">
                              <span className="text-[10px] text-[#999] uppercase tracking-widest flex items-center gap-1">
                                Recent Form {formSource === 'OpenF1 2026' ? '(2026 OpenF1)' : formSource === 'OpenF1 2025' ? '(2025 OpenF1)' : ''}
                              </span>
                              <div className="flex gap-2">
                                {currentForm[driver.code].map((f, i) => (
                                  <div key={i} className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-md px-2 py-1 flex-1 overflow-hidden">
                                    <span className="text-[9px] text-[#e9bcb5] truncate w-full text-center" title={f.race}>{f.race.split(' ')[0]}</span>
                                    <span className={`font-['Space_Grotesk'] font-bold text-sm ${f.position <= 3 ? 'text-[#47efda]' : f.position <= 10 ? 'text-white' : 'text-[#e10600]'}`}>
                                      P{f.position}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t border-white/5">
                             <div>
                               <p className="text-[10px] text-[#999999] uppercase tracking-widest mb-1">
                                 {isBeginnerMode ? 'Cost' : 'Price'}
                               </p>
                               <p className="font-['Space_Grotesk'] font-extrabold text-[#47efda]">{driver.price}</p>
                             </div>
                             <motion.button 
                               onClick={() => addToTeam(driver)}
                               disabled={isInTeam(driver.code) || (myTeam.length >= 5 && !isInTeam(driver.code))}
                               whileTap={{ scale: 0.95 }}
                               {...(!isMobile && { whileHover: { scale: 1.02 } })}
                                className="px-6 py-2 text-white text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#e10600] hover:scale-[1.02]"
                               style={{
                                 padding: '10px 20px',
                                 borderRadius: 100,
                                 background: isInTeam(driver.code) ? '#00D2BE' : 'transparent',
                                 border: isInTeam(driver.code) ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                 color: 'white',
                                 cursor: isInTeam(driver.code) ? 'default' : 'pointer',
                                 fontSize: 13,
                                 fontWeight: 600,
                                 transition: 'all 0.2s',
                                 opacity: myTeam.length >= 5 && !isInTeam(driver.code) ? 0.4 : 1,
                               }}
                             >
                               {isInTeam(driver.code) ? '✓ ADDED' : 'ADD TO TEAM'}
                             </motion.button>
                          </div>
                       </div>
                     </motion.div>
                   ))}
                </motion.div>
              )}
            </AnimatePresence>

            {myTeam.length > 0 && (
              <div
                id="my-team-section"
                style={{
                  marginTop: 40,
                  padding: 24,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>
                    MY TEAM ({myTeam.length}/5)
                  </h3>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: budgetRemaining < 0 ? '#E10600' : '#00D2BE', fontSize: 20, fontWeight: 700 }}>
                      ${budgetRemaining.toFixed(1)}M left
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      of $100M budget
                    </div>
                  </div>
                </div>

                <div style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  marginBottom: 20,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((budgetUsed / BUDGET) * 100, 100)}%`,
                    background: budgetRemaining < 0 ? '#E10600' : '#00D2BE',
                    borderRadius: 2,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {myTeam.map(driver => (
                    <div
                      key={driver.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${getTeamColor(driver.team)}40`,
                        borderRadius: 100,
                        borderLeft: `3px solid ${getTeamColor(driver.team)}`
                      }}
                    >
                      <img
                        src={getFlagUrl(driver.code)}
                        style={{ width: 16, height: 12 }}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                        {driver.code || driver.name}
                      </span>
                      <button
                        onClick={() => removeFromTeam(driver.code)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {myTeam.length > 0 && (
                  <button
                    onClick={() => {
                      setMyTeam([]);
                      toast.success('Team cleared');
                    }}
                    style={{
                      marginTop: 16,
                      background: 'none',
                      border: '1px solid rgba(255,0,0,0.3)',
                      color: '#E10600',
                      padding: '8px 16px',
                      borderRadius: 100,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Clear Team
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
