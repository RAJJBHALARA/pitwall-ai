import { useState, useEffect } from 'react';
import { Sparkles, Trophy, TrendingDown, TrendingUp, AlertCircle, ShieldAlert, Share2, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStaggerChildren } from '../utils/useStaggerChildren';
import { useTypewriter } from '../utils/useTypewriter';
import SkeletonLoader from '../components/SkeletonLoader';
import CustomDropdown from '../components/CustomDropdown';
import PageTransition from '../components/PageTransition';
import { getFantasyPicks, getAvailableRaces } from '../services/api';
import { DRIVER_DATA } from '../utils/teamColors';
import { getFlagUrl } from '../utils/flagHelper';

export default function FantasyPicks() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dur = (d) => (shouldReduceMotion ? 0 : isMobile ? d * 0.7 : d);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { containerVariants, itemVariants } = useStaggerChildren(0.1, 0.05);

  const [season, setSeason] = useState('2024');
  const [selectedRace, setSelectedRace] = useState('');
  const [raceList, setRaceList] = useState([]);

  const [drivers, setDrivers] = useState([]);
  const [constructor, setConstructor] = useState(null);
  const [keyInsight, setKeyInsight] = useState('');
  const [driversToAvoid, setDriversToAvoid] = useState([]);

  const displayedInsight = useTypewriter(keyInsight, 40);

  // Share state
  const [shareState, setShareState] = useState('idle'); // idle | copied | tweeted

  function buildTweetText() {
    const driverLine = drivers.slice(0, 5).map(d => d.code || d.name).join(' | ');
    const teamLine = constructor ? constructor.name : 'N/A';
    const race = selectedRace || 'the next race';
    return encodeURIComponent(
      `My PitWall AI picks for ${race} 🏎️\n` +
      `Drivers: ${driverLine}\n` +
      `Constructor: ${teamLine}\n` +
      `Powered by @PitWallAI\n` +
      `github.com/RAJJBHALARA/pitwall-ai\n` +
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
      `My PitWall AI picks for ${selectedRace || 'the next race'} 🏎️\n` +
      `Drivers: ${driverLine}\n` +
      `Constructor: ${teamLine}\n` +
      `Powered by @PitWallAI | github.com/RAJJBHALARA/pitwall-ai\n` +
      `#F1 #F1Fantasy #Formula1`;
    navigator.clipboard.writeText(text).then(() => {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    });
  }

  // Avatar map for known drivers
  const avatarMap = {
    'VER': 'https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png',
    'NOR': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LANDON01_Lando_Norris/landon01.png.transform/2col/image.png',
    'LEC': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col/image.png',
    'PIA': 'https://media.formula1.com/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col/image.png',
    'SAI': 'https://media.formula1.com/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col/image.png',
    'HAM': 'https://media.formula1.com/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col/image.png',
    'RUS': 'https://media.formula1.com/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col/image.png',
    'ALO': 'https://media.formula1.com/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col/image.png',
  };

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

  // Fetch fantasy picks
  useEffect(() => {
    if (!selectedRace) return;
    const fetchPicks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await getFantasyPicks(selectedRace, parseInt(season));
        const data = res.data;

        if (data.error) {
          setError(data.message || 'AI could not generate picks.');
          setDrivers([]);
          return;
        }

        // Map API drivers to display format
        const mapped = (data.drivers || []).map((d, i) => ({
          id: i + 1,
          name: d.name || d.code,
          code: d.code,
          price: d.price_range || '---',
          team: d.team || 'Unknown',
          reasoning: d.reasoning || '',
          avatar: avatarMap[d.code] || null,
          trend: i < 3 ? 'up' : 'static',
        }));

        setDrivers(mapped);
        setConstructor(data.constructor || null);
        setKeyInsight(data.key_insight || '');
        setDriversToAvoid(data.drivers_to_avoid || []);
      } catch (err) {
        setError(
          err.message === 'RATE_LIMIT' ? 'Too many requests — wait a minute.' :
          err.message === 'AUTH_ERROR' ? 'Authentication failed.' :
          err.message === 'NO_DATA' ? 'No fantasy data for this race.' :
          'Failed to fetch picks. Check backend.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPicks();
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
            FANTASY <span className="text-[#e10600]">STRATEGIST</span>
          </motion.h1>
          <p className="text-[#e9bcb5] uppercase tracking-[0.2em] font-bold text-xs">AI-Optimized Selection Engine</p>
        </header>

        {/* Race selector */}
        <div className="flex flex-wrap gap-4 mb-10">
          <div className="w-28">
            <CustomDropdown label="Season" value={season} options={['2024', '2023']} onChange={setSeason} />
          </div>
          <div className="w-64">
            <CustomDropdown label="Grand Prix" value={selectedRace} options={raceList} onChange={setSelectedRace} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
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
            <div className="bg-[#1c1b1b] p-8 rounded-2xl border border-white/5 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="text-[#e10600]/20 w-12 h-12" />
              </div>
              
              <h2 className="font-['Space_Grotesk'] font-bold text-sm tracking-widest text-white uppercase mb-6 flex items-center gap-2">
                <Trophy size={16} className="text-[#e10600]" />
                Strategy Brief
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
                    className="bg-[#2a2a2a] p-5 rounded-xl border-l-2 border-[#47efda]"
                  >
                    <p className="text-[10px] font-bold text-[#47efda] uppercase tracking-widest mb-1">Top Constructor</p>
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
                    className="bg-[#2a2a2a] p-5 rounded-xl border-l-2 border-[#e10600]"
                  >
                    <p className="text-[10px] font-bold text-[#e10600] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ShieldAlert size={12} /> Drivers to Avoid
                    </p>
                    <p className="text-white font-['Space_Grotesk'] font-bold">{driversToAvoid.join(', ')}</p>
                  </motion.div>
                )}
              </div>

              <motion.button 
                whileHover={{ gap: '12px' }}
                className="mt-12 w-full py-4 bg-[#e10600] text-white font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,6,0,0.3)]"
              >
                Assemble Auto-Lineup <Sparkles size={14} />
              </motion.button>

              {/* Share Picks */}
              <div className="mt-3 flex gap-2">
                <motion.button
                  id="share-tweet-btn"
                  onClick={handleShare}
                  disabled={drivers.length === 0 || isLoading}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
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
                  whileHover={{ scale: 1.02 }}
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
                       whileHover={{ y: -8, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' }}
                       className="group bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/5 hover:border-[#e10600]/30 transition-colors"
                     >
                       <div className="relative h-48 bg-[#2a2a2a] overflow-hidden flex items-center justify-center">
                          {driver.avatar ? (
                            <img 
                              src={driver.avatar} 
                              alt={driver.name} 
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 object-contain transition-transform duration-700 group-hover:scale-110" 
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-[#e10600]/10 flex items-center justify-center">
                              <span className="font-['Space_Grotesk'] font-black text-3xl text-[#e10600]">{driver.code}</span>
                            </div>
                          )}
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
                              <img src={getFlagUrl(driver.code)} alt={driver.code} style={{ width: 24, height: 18, borderRadius: 2 }} />
                            </span>
                            <span>{driver.name}</span>
                          </h3>
                          <p className="text-xs text-[#e9bcb5] font-bold uppercase tracking-tighter opacity-60 mb-3">{driver.team}</p>
                          
                          {driver.reasoning && (
                            <p className="text-xs text-[#999] leading-relaxed mb-4 line-clamp-2">{driver.reasoning}</p>
                          )}
                          
                          <div className="flex justify-between items-center pt-4 border-t border-white/5">
                             <div>
                               <p className="text-[10px] text-[#999999] uppercase tracking-widest mb-1">Price</p>
                               <p className="font-['Space_Grotesk'] font-extrabold text-[#47efda]">{driver.price}</p>
                             </div>
                             <motion.button 
                               whileTap={{ scale: 0.95 }}
                               className="px-6 py-2 bg-[#2a2a2a] hover:bg-[#e10600] text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg"
                             >
                               ADD TO TEAM
                             </motion.button>
                          </div>
                       </div>
                     </motion.div>
                   ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
