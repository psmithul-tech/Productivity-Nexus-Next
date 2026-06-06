import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db, settingsTable } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';
  
  console.log("=== CALLBACK HIT ===");
  console.log("URL:", request.url);
  console.log("Host header:", request.headers.get('host'));
  console.log("X-Forwarded-Host:", request.headers.get('x-forwarded-host'));
  console.log("X-Forwarded-Proto:", request.headers.get('x-forwarded-proto'));
  console.log("====================");

  let errorMsg = 'no_code_in_url';
  
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      const { provider_token, provider_refresh_token, user } = data.session;
      if (provider_token) {
        const updateData: any = { googleAccessToken: provider_token };
        if (provider_refresh_token) updateData.googleRefreshToken = provider_refresh_token;
        
        try {
          await db.insert(settingsTable)
            .values({ userId: user.id, ...updateData })
            .onConflictDoUpdate({
              target: settingsTable.userId,
              set: updateData
            });
        } catch (dbError) {
          console.error("Failed to save Google tokens to database:", dbError);
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else if (host) {
        const isHttps = protocol === 'https' || host.includes('ngrok-free.dev');
        return NextResponse.redirect(`http${isHttps ? 's' : ''}://${host}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("Auth exchange error:", error);
      errorMsg = error?.message || 'exchange_failed_no_session';
    }
  } else {
    // Check if Supabase passed an error directly
    const authError = searchParams.get('error_description') || searchParams.get('error');
    if (authError) errorMsg = authError;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const errorUrlParams = `?error=auth&msg=${encodeURIComponent(errorMsg)}`;
  
  if (!isLocalEnv && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}/login${errorUrlParams}`);
  } else if (!isLocalEnv && host) {
    const isHttps = protocol === 'https' || host.includes('ngrok-free.dev');
    return NextResponse.redirect(`http${isHttps ? 's' : ''}://${host}/login${errorUrlParams}`);
  }
  
  return NextResponse.redirect(`${origin}/login${errorUrlParams}`);
}
