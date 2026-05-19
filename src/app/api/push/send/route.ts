import { NextResponse } from 'next/server'
import webpush from 'web-push'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ibs.alhamra.sch.id'
const apiSecret = process.env.PUSH_API_SECRET || ''

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

export async function POST(request: Request) {
  if (apiSecret) {
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 })
  }
}
