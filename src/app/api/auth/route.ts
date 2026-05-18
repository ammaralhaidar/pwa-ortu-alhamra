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

  // Forward the Set-Cookie header from Odoo to the browser
  const setCookie = response.headers.get('set-cookie');
  const nextRes = NextResponse.json(data, { status: response.status });
  if (setCookie) {
    nextRes.headers.set('set-cookie', setCookie);
  }
  return nextRes;
}
