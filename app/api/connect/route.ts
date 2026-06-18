import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: "Missing connectionId" }, { status: 400 });
    }

    // Lấy thông tin connection (Có RLS nên sẽ chỉ lấy được nếu user sở hữu)
    const { data: connection, error: connError } = await supabase
      .from("user_connections")
      .select(`
        id,
        app_id,
        is_active,
        connection_version,
        apps (
          app_code,
          website
        )
      `)
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (!connection.is_active) {
      // Ghi log FAILED
      await supabase.from("connection_logs").insert({
        user_id: user.id,
        connection_id: connection.id,
        app_id: connection.app_id,
        status: "FAILED_INACTIVE"
      });
      return NextResponse.json({ error: "Connection is disabled" }, { status: 403 });
    }

    const appCode = connection.apps.app_code;
    const website = connection.apps.website;
    const portalSecret = process.env.PORTAL_JWT_SECRET;

    if (!portalSecret) {
      console.error("Missing PORTAL_JWT_SECRET");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        connectionId: connection.id,
        version: connection.connection_version,
        jti: crypto.randomUUID(),
        nonce: crypto.randomUUID()
      },
      portalSecret,
      {
        expiresIn: "30s",
        issuer: "portal.dichvupro.com",
        audience: website // Dùng website làm audience
      }
    );

    // Ghi log SUCCESS
    await supabase.from("connection_logs").insert({
      user_id: user.id,
      connection_id: connection.id,
      app_id: connection.app_id,
      status: "SUCCESS"
    });

    return NextResponse.json({ token });

  } catch (err: any) {
    console.error("Connect error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
