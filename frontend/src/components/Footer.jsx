import { useEffect, useState } from 'react';

export default function Footer() {
  const [stars, setStars] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch('https://api.github.com/repos/RAJJBHALARA/Box-Box')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d?.stargazers_count === 'number') {
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div style={{ color: '#444', fontSize: 13 }}>
        © 2025 BoxBox · Built for F1 fans 🏎️
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <a
          href="https://github.com/RAJJBHALARA/Box-Box"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#888',
            textDecoration: 'none',
            fontSize: 13,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
          }}
        >
          ⭐ {stars !== null ? `${stars.toLocaleString()} Stars` : 'Star on GitHub'}
        </a>

        <span style={{ color: '#333' }}>·</span>

        <a
          href="https://github.com/RAJJBHALARA/Box-Box"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#888',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          Open Source (MIT)
        </a>
      </div>
    </footer>
  );
}
