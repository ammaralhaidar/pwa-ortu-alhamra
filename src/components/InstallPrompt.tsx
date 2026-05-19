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
    <>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div onClick={handleDismiss} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '24px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        animation: 'slideUp 0.3s ease-out',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <div style={{ width: '40px', height: '4px', background: '#CBD5E1', borderRadius: '2px', margin: '0 auto 20px' }} />
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo-square.png" alt="IBS Al Hamra" width={64} height={64} style={{ borderRadius: '16px', marginBottom: '12px', background: '#fff' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-high)', margin: '0 0 4px' }}>Install Aplikasi IBS Al Hamra</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: 0 }}>Akses portal orang tua lebih mudah dan cepat</p>
        </div>

        {isIOS ? (
          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', fontSize: '13px', color: 'var(--color-text-high)', lineHeight: 1.6, marginBottom: '16px' }}>
            Ketuk ikon <b>Share</b> <svg style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#007AFF' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> di bawah, lalu pilih <b>"Add to Home Screen"</b> <svg style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, text: 'Akses 3x Lebih Cepat' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect width="18" height="14" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="10" y2="10"/></svg>, text: 'Tanpa Perlu Buka Browser' },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, text: 'Hemat Memori HP' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px' }}>
                  {item.icon}
                  <span style={{ fontSize: '14px', color: 'var(--color-text-high)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handleInstallClick} style={{ width: '100%', padding: '15px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
              Install Sekarang
            </button>
          </>
        )}
        
        <button onClick={handleDismiss} style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--color-text-medium)', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Nanti Saja
        </button>
      </div>
    </>
  );
}
