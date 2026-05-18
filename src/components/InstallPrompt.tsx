'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true); // Default to true so it doesn't flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check if dismissed in localStorage
    if (localStorage.getItem('pwa_prompt_dismissed') === 'true') {
      return; // Already dismissed, don't show
    }

    setDismissed(false);

    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return; // If already installed, stop here

    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Android/Chrome event listener
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDismissed(true); // hide it
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || dismissed) return null;
  if (!isIOS && !deferredPrompt) return null; // Wait for beforeinstallprompt on Android
  if (pathname === '/login') return null; // Don't show on login page

  return (
    <div style={{
      position: 'fixed',
      top: '20px', // Top of screen
      left: '16px',
      right: '16px',
      zIndex: 50,
      background: '#fff',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo-square.png" alt="Logo" width={40} height={40} style={{ borderRadius: '10px' }} />
          <div>
            <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-high)' }}>Install Aplikasi</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-medium)' }}>Akses lebih cepat & tanpa browser</p>
          </div>
        </div>
        <button onClick={handleDismiss} style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-text-low)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {isIOS ? (
        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'var(--color-text-high)', lineHeight: 1.5 }}>
          Ketuk ikon <svg style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#007AFF' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> <b>Share</b> di bawah, lalu pilih <b>"Add to Home Screen"</b> <svg style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#000' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>.
        </div>
      ) : (
        <button onClick={handleInstallClick} style={{ width: '100%', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Install Sekarang
        </button>
      )}
    </div>
  );
}
