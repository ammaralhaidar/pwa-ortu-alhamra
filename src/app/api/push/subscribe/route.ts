import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
    }

    // Forward to Odoo for storage
    const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:10016'
    const sessionCookie = request.headers.get('cookie') || ''

    const odooResp = await fetch(`${odooUrl}/api/v1/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ endpoint, auth: keys.auth, p256dh: keys.p256dh }),
    })

    if (!odooResp.ok) {
      const errText = await odooResp.text()
      console.error('Odoo push subscribe failed:', odooResp.status, errText)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
