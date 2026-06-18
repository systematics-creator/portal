import { NextResponse } from 'next/navigation';
import jwt from 'jsonwebtoken';

// Ví dụ route xử lý POST /autologin tại App con (PosSpa, LogoAI, CRM...)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token');

    if (!token || typeof token !== 'string') {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    const portalSecret = process.env.PORTAL_JWT_SECRET!;
    const myAppWebsite = "posspa.dichvupro.com"; // Thay đổi theo app
    const myApiKey = process.env.POSSPA_API_KEY!; // API Key của app này

    // 1. Verify JWT
    let payload: any;
    try {
      payload = jwt.verify(token, portalSecret, {
        issuer: 'portal.dichvupro.com',
        audience: myAppWebsite,
        ignoreExpiration: false
      });
    } catch (err) {
      console.error("JWT Verify Error", err);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 2. Chống Replay Attack bằng Database Local (used_tokens)
    // Ví dụ với Supabase Client:
    // const { data: existingToken } = await localDb.from('used_tokens').select('jti').eq('jti', payload.jti).single();
    // if (existingToken) return NextResponse.redirect(new URL('/login?error=token_used', request.url));
    // await localDb.from('used_tokens').insert({ jti: payload.jti, app_code: 'POSSPA' });

    // 3. Gọi Portal API để Resolve Connection
    const portalApiUrl = "https://portal.dichvupro.com/api/resolve-connection"; // URL thực tế của Portal
    const resolveRes = await fetch(portalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myApiKey}`
      },
      body: JSON.stringify({
        connectionId: payload.connectionId,
        aud: myAppWebsite
      })
    });

    if (!resolveRes.ok) {
      console.error("Failed to resolve connection", await resolveRes.text());
      return NextResponse.redirect(new URL('/login?error=resolve_failed', request.url));
    }

    const data = await resolveRes.json();
    // data = { connectionId, username, storeCode, portalUserId }

    // 4. Tạo Session Độc Lập
    // Ví dụ: Thiết lập cookie an toàn hoặc sử dụng thư viện quản lý session
    // cookies().set('app_session', createSecureSessionCookie(data));

    // 5. Redirect vào ứng dụng con (Dashboard)
    return NextResponse.redirect(new URL('/dashboard', request.url), { status: 302 });

  } catch (error) {
    console.error("Autologin Error:", error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
