import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/navigation';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  });
}
