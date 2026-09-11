import { NextRequest, NextResponse } from 'next/server';

const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:10016';

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  const response = await fetch(`${ODOO_URL}/api/v1/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await response.json();

  // Forward the Set-Cookie header from Odoo to the browser with long-lived 90-day persistence
  const setCookie = response.headers.get('set-cookie');
  const nextRes = NextResponse.json(data, { status: response.status });

  const ninetyDaysInSeconds = 90 * 24 * 60 * 60; // 90 days (7,776,000 seconds)
  const expiresDate = new Date(Date.now() + ninetyDaysInSeconds * 1000);

  if (setCookie) {
    const match = setCookie.match(/session_id=([^;]+)/);
    if (match) {
      const sessionId = match[1];
      const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

      nextRes.cookies.set('session_id', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: ninetyDaysInSeconds,
        expires: expiresDate,
        secure: isHttps,
      });
    } else {
      nextRes.headers.set('set-cookie', setCookie);
    }
  }

  return nextRes;
}
