import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db, settingsTable } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      const { provider_token, provider_refresh_token, user } = data.session;
      if (provider_token) {
        const updateData: any = { googleAccessToken: provider_token };
        if (provider_refresh_token) updateData.googleRefreshToken = provider_refresh_token;
        
        await db.insert(settingsTable)
          .values({ userId: user.id, ...updateData })
          .onConflictDoUpdate({
            target: settingsTable.userId,
            set: updateData
          });
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
