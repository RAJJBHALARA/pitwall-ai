import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Formspree endpoint ──────────────────────────────────
// Replace with your actual Formspree form ID
const FORMSPREE_URL = 'https://formspree.io/f/xyzabcde';

const FEATURE_PILLS = [
  { emoji: '📊', label: 'Race Preview' },
  { emoji: '🤖', label: 'AI Picks' },
  { emoji: '⚡', label: 'Fastest Tips' },
];

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) return;

    setStatus('loading');
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'pitwall-ai-home',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        // Ask for browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification('PitWall AI 🏎️', {
                body: 'Race weekend notifications enabled!',
                icon: '/pitwall-icon.png',
              });
            }
          } catch { /* ignore */ }
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top accent gradient line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #E10600 0%, #F59E0B 50%, #E10600 100%)',
          opacity: 0.8,
        }} />

        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,6,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 40,
          padding: '40px 44px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Left side */}
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(225,6,0,0.2), rgba(225,6,0,0.05))',
                border: '1px solid rgba(225,6,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}>🏁</div>
              <div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}>GET RACE PREVIEWS</h3>
              </div>
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: '#888',
              margin: '0 0 20px 0',
              lineHeight: 1.5,
              maxWidth: 380,
            }}>
              AI race analysis delivered before every grand prix weekend.
              Never miss a qualifying battle or strategy call.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FEATURE_PILLS.map((pill) => (
                <span
                  key={pill.label}
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#bbb',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 100,
                    padding: '5px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    letterSpacing: '0.03em',
                  }}
                >
                  <span>{pill.emoji}</span> {pill.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div style={{ flex: '1 1 320px', maxWidth: 400 }}>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 12,
                    padding: '28px 24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#22c55e',
                    marginBottom: 4,
                  }}>You're on the list! 🏎️</div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: '#666',
                    margin: 0,
                  }}>Race previews will hit your inbox before every GP weekend.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {/* Email input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="your@email.com"
                      required
                      disabled={status === 'loading'}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        color: '#fff',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${focused ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10,
                        outline: 'none',
                        transition: 'border-color 0.25s, box-shadow 0.25s',
                        boxShadow: focused ? '0 0 0 3px rgba(225,6,0,0.1)' : 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={status === 'loading' || !email}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: 800,
                      color: status === 'loading' ? '#999' : '#fff',
                      background: status === 'loading'
                        ? 'rgba(255,255,255,0.05)'
                        : 'linear-gradient(135deg, #E10600, #c00500)',
                      border: 'none',
                      borderRadius: 100,
                      padding: '13px 28px',
                      cursor: status === 'loading' ? 'wait' : 'pointer',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      boxShadow: status === 'loading'
                        ? 'none'
                        : '0 4px 20px rgba(225,6,0,0.25)',
                    }}
                  >
                    {status === 'loading' ? 'SENDING...' : 'NOTIFY ME →'}
                  </motion.button>

                  {/* Spam disclaimer / error */}
                  {status === 'error' ? (
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: '#ef4444',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      ✕ Something went wrong. Please try again.
                    </p>
                  ) : (
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: '#4a4a4a',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span style={{ color: '#22c55e' }}>✓</span> 0 spam. Unsubscribe anytime.
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
