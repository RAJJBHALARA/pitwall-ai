import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, Timer } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAnimatedCounter } from '../utils/useAnimatedCounter';
import { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import { getDrivers } from '../services/api';
export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dur = (d) => shouldReduceMotion ? 0 : isMobile ? d * 0.7 : d;

  const trackTemp = useAnimatedCounter(42.8, 1.5, 0.6, true);
  const heroWords = ['THE', 'KINETIC'];

  const [leader, setLeader] = useState({ name: 'Max Verstappen', code: 'VER', team: 'Red Bull Racing' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeader = async () => {
      try {
        setLoading(true);
        const res = await getDrivers(2024);
        if (res.data.drivers && res.data.drivers.length > 0) {
          setLeader(res.data.drivers[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeader();
  }, []);

  return (
    <PageTransition>
      <div className="w-full">
        {/* Hero Section */}
        <section className="relative h-[618px] w-full flex items-end overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              alt="F1 car on track"
              src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2000&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent"></div>
          </div>
          <div className="relative z-10 px-8 pb-16 max-w-screen-2xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <div>
              <h1 className="text-6xl md:text-8xl font-['Space_Grotesk'] font-bold text-white tracking-[-0.04em] leading-tight flex flex-col">
                <span>
                  {heroWords.map((word, i) => (
                    <motion.span
                      key={word}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15, duration: dur(0.6), ease: [0.22, 1, 0.36, 1] }}
                      className="inline-block mr-4"
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
                <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: dur(0.6), ease: [0.22, 1, 0.36, 1] }}
                  className="text-[#e10600]"
                >
                  OBSERVATORY
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: dur(0.8) }}
                className="mt-6 text-[#e9bcb5] max-w-md text-lg leading-relaxed"
              >
                Harnessing real-time telemetry from the paddock. Precision analytics engineered for the high-performance spectator.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: dur(0.6) }}
              className="hidden md:flex flex-col items-end"
            >
              <div className="bg-[#2a2a2a]/60 backdrop-blur-md p-6 rounded-xl border border-white/5 w-80">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-[#999999] tracking-widest uppercase">Track Surface</span>
                  <span className="text-[#47efda] font-bold">OPTIMAL</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-['Space_Grotesk'] font-bold text-white">{trackTemp}°C</span>
                    <span className="text-xs text-[#999999] pb-1 uppercase">Asphalt Temp</span>
                  </div>
                  <div className="h-1 bg-[#353534] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: dur(1) }}
                      style={{ transformOrigin: 'left' }}
                      className="h-full bg-[#47efda] w-3/4"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Live Telemetry Dashboard */}
        <section className="max-w-screen-2xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: dur(0.5) }}
              className="md:col-span-2 lg:col-span-2 bg-[#1c1b1b] rounded-none p-8 flex flex-col justify-between min-h-[400px]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-[#e10600] tracking-widest uppercase mb-2 block">Current Leader</span>
                  <h2 className="text-4xl font-['Space_Grotesk'] font-bold text-white uppercase tracking-tight">
                    {loading ? 'LOADING...' : leader.name}
                  </h2>
                  {!loading && error && <span className="text-xs text-[#e10600] mt-1 block">{error}</span>}
                </div>
                <div className="text-5xl font-['Space_Grotesk'] font-extrabold text-[#ffffff10] italic">01</div>
              </div>
              <div className="mt-8 flex-1 flex items-center justify-center">
                 <img className="h-64 object-contain filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700" alt="Driver" src="https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png"/>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 border-t border-white/5 pt-6">
                <div>
                  <span className="text-[10px] text-[#999999] uppercase tracking-widest block mb-1">Interval</span>
                  <span className="text-xl font-['Space_Grotesk'] font-bold text-white">+12.454s</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#999999] uppercase tracking-widest block mb-1">Tires</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ffb4ab]"></div>
                    <span className="text-xl font-['Space_Grotesk'] font-bold text-white">SOFT (8L)</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: dur(0.5) }}
              className="md:col-span-2 lg:col-span-3 bg-[#1c1b1b] rounded-none p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-widest">Live Sector Delta</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-[#01d2be]/10 text-[#47efda] text-[10px] font-bold rounded-full">SECTOR 1: -0.042</span>
                  <span className="px-3 py-1 bg-[#01d2be]/10 text-[#47efda] text-[10px] font-bold rounded-full">SECTOR 2: -0.118</span>
                </div>
              </div>
              <div className="flex-1 flex items-end gap-2 h-full">
                 {[75, 50, 90, 60, 85, 66].map((h, i) => (
                   <motion.div
                     key={i}
                     initial={{ scaleY: 0 }}
                     whileInView={{ scaleY: 1 }}
                     viewport={{ once: true }}
                     transition={{ duration: dur(0.8), delay: i * 0.1 }}
                     style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                     className="flex-1 bg-gradient-to-t from-[#47efda]/20 to-[#47efda]/5 border-t-2 border-[#47efda] relative"
                   />
                 ))}
              </div>
              <div className="mt-6 flex justify-between text-[10px] font-['Space_Grotesk'] text-[#999999] uppercase tracking-widest">
                <span>Lap Start</span>
                <span>Current Lap: 1:32.441</span>
                <span>Finish Line</span>
              </div>
            </motion.div>

            <div className="md:col-span-2 lg:col-span-1 space-y-4">
              {[
                { label: 'Pit Window', value: 'LAP 24', sub: 'Optimal Entry', icon: <Timer size={16} />, color: '#47efda' },
                { label: 'Weather', value: '0% RAIN', sub: 'Clear Skies', icon: <Cloud size={16} />, color: '#999999' },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, duration: dur(0.4) }}
                  className="bg-[#2a2a2a] p-6 flex flex-col justify-between h-[192px]"
                >
                   <span className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">{card.label}</span>
                   <div className="text-4xl font-['Space_Grotesk'] font-bold text-white">{card.value}</div>
                   <div className="flex items-center gap-2" style={{ color: card.color }}>
                     {card.icon}
                     <span className="text-[10px] font-bold uppercase">{card.sub}</span>
                   </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="max-w-screen-2xl mx-auto px-8 py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div>
                <span className="text-[#e10600] font-bold tracking-[0.2em] uppercase text-xs">Deep Dive</span>
                <h2 className="text-4xl font-['Space_Grotesk'] font-bold text-white mt-2">EXPLORE MODULES</h2>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { to: '/race-analysis', title: 'Race Analysis', desc: 'Historical lap times, tire strategies, and race event data visualizations.', cta: 'Explore' },
                { to: '/rivalry-tracker', title: 'Rivalry Tracker', desc: 'Head-to-head comparison between drivers including qualifying gaps and race results.', cta: 'Compare' },
                { to: '/fantasy-picks', title: 'AI Fantasy Picks', desc: 'Claude 3.5 Sonnet-powered recommendations for your fantasy Formula 1 lineup.', cta: 'Predict' },
              ].map((card, i) => (
                <motion.div
                  key={card.to}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: dur(0.5) }}
                  whileHover={{ y: -5, borderColor: 'rgba(225,6,0,0.4)', transition: { duration: 0.2 } }}
                >
                  <Link to={card.to} className="group block bg-[#1c1b1b] p-6 h-full border border-transparent hover:border-white/10">
                      <h3 className="text-xl font-['Space_Grotesk'] font-bold text-white mb-3 group-hover:text-[#e10600] transition-colors">{card.title}</h3>
                      <p className="text-[#e9bcb5] text-sm leading-relaxed mb-6">{card.desc}</p>
                      <span className="text-[#e10600] text-xs font-bold uppercase tracking-widest flex items-center gap-2">{card.cta} <ArrowRight size={14} /></span>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
