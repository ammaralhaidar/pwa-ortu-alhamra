import { NextResponse } from 'next/server'
import webpush from 'web-push'
import dns from 'dns'

// Patch dns.lookup fallback to dns.resolve4 for macOS/sandboxed environments
if (typeof dns.lookup === 'function' && !(dns as any).__patched) {
  const originalLookup = dns.lookup.bind(dns)
  ;(dns as any).lookup = (hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    originalLookup(hostname, options, (err: any, address: any, family: any) => {
      if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) {
        dns.resolve4(hostname, (err2, addresses) => {
          if (!err2 && addresses && addresses.length > 0) {
            return callback(null, addresses[0], 4)
          }
          return callback(err, address, family)
        })
      } else {
        callback(err, address, family)
      }
    })
  }
  ;(dns as any).__patched = true
}

function initVapid() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ibs.alhamra.sch.id'

  if (vapidPublicKey && vapidPrivateKey) {
    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
      return true
    } catch (e) {
      console.warn('VAPID setup warning:', e)
    }
  }
  return false
}

export async function POST(request: Request) {
  const apiSecret = process.env.PUSH_API_SECRET || ''
  if (apiSecret) {
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!initVapid()) {
    return NextResponse.json({ error: 'VAPID keys not properly configured' }, { status: 500 })
  }

  try {
    const { subscription, title, body, url } = await request.json()

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
    }

    const payload = JSON.stringify({
      title: title || 'IBS Al Hamra',
      body: body || '',
      url: url || '/',
    })

    await webpush.sendNotification(subscription, payload)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.statusCode === 410) {
      return NextResponse.json({ error: 'Subscription expired', code: 'EXPIRED' }, { status: 410 })
    }
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Failed to send push', message: error?.message, statusCode: error?.statusCode, body: error?.body },
      { status: error?.statusCode || 500 }
    )
  }
}
