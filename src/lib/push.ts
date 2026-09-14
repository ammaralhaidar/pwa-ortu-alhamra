export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) return null
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export async function subscribePush(
  reg: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return null

  try {
    let subscription = await reg.pushManager.getSubscription()
    if (subscription) return subscription

    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    })
    return subscription
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.message?.includes('push service error')) {
      console.warn(
        '[Push Notification] Layanan push dibatasi oleh browser (misal Brave Privacy Shield). ' +
        'Untuk mengaktifkannya di Brave: buka brave://settings/privacy -> nyalakan "Use Google services for push messaging", lalu restart browser.'
      )
    } else {
      console.warn('[Push Notification] Gagal berlangganan push:', e?.message || e)
    }
    return null
  }
}

export async function sendSubscriptionToServer(subscription: PushSubscription) {
  const sub = subscription.toJSON()
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }),
    })
  } catch {
    // silently fail
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Local Notification] Notification API tidak didukung di browser ini.')
    return false
  }
  if (Notification.permission !== 'granted') {
    console.warn('[Local Notification] Izin notifikasi belum diberikan:', Notification.permission)
    return false
  }

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: { url: url || '/' },
  }

  let shown = false

  // 1. Coba tampilkan lewat ServiceWorker dengan timeout 1 detik agar tidak menggantung jika SW pending
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
      ])
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions)
        shown = true
      }
    } catch (err) {
      console.warn('[Local Notification] Gagal memicu lewat ServiceWorker, beralih ke Native Notification:', err)
    }
  }

  // 2. Fallback langsung ke konstruktor Notification standar (berfungsi di Desktop macOS/Windows Chrome/Brave/Safari)
  if (!shown) {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
      })
      notif.onclick = () => {
        window.focus()
        if (url) window.location.href = url
      }
      shown = true
    } catch (err) {
      console.error('[Local Notification] Gagal menampilkan lewat Notification constructor:', err)
    }
  }

  return shown
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)))
}
