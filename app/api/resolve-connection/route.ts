import { NextResponse } from "next/navigation";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.split(" ")[1];
    
    const body = await request.json();
    const { connectionId, aud } = body;

    if (!connectionId || !aud) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Xác thực API Key để tìm App Code
    let callerAppCode = null;
    const supportedApps = ["POSSPA", "LOGOAI", "CRM"];
    for (const code of supportedApps) {
       if (process.env[`${code}_API_KEY`] === apiKey) {
          callerAppCode = code;
          break;
       }
    }

    if (!callerAppCode) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    // 2. Lấy thông tin Connection bằng Supabase Admin Client
    // Lưu ý: Dùng Service Role Key để bypass RLS vì request này đến từ Server của App con, 
    // không phải từ Browser của người dùng.
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: connection, error } = await supabaseAdmin
      .from("user_connections")
      .select(`
        id,
        user_id,
        username,
        store_code,
        apps (
          app_code,
          website
        )
      `)
      .eq("id", connectionId)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Kiểm tra bảo mật App Code & Audience
    if (connection.apps.app_code !== callerAppCode) {
      return NextResponse.json({ error: "App Code mismatch" }, { status: 403 });
    }

    if (connection.apps.website !== aud) {
      return NextResponse.json({ error: "Audience mismatch" }, { status: 403 });
    }

    // Trả về thông tin cho app con
    return NextResponse.json({
      connectionId: connection.id,
      username: connection.username,
      storeCode: connection.store_code,
      portalUserId: connection.user_id
    });

  } catch (err: any) {
    console.error("Resolve connection error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
