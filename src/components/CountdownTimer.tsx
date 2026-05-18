'use client';

import { useEffect, useState, useRef } from 'react';

interface CountdownTimerProps {
  targetDateStr: string; // ISO datetime string
}

export default function CountdownTimer({ targetDateStr }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDateStr).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculate();
    intervalRef.current = setInterval(calculate, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [targetDateStr]);

  if (timeLeft.expired) {
    return (
      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Kode Kedaluwarsa</span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  const isUrgent = timeLeft.hours < 1;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {[
        { value: pad(timeLeft.hours), label: 'Jam' },
        { value: pad(timeLeft.minutes), label: 'Menit' },
        { value: pad(timeLeft.seconds), label: 'Detik' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              background: isUrgent ? 'var(--color-danger)' : 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '22px',
              fontWeight: 700,
              minWidth: '52px',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {item.value}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-medium)', marginTop: '4px' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
