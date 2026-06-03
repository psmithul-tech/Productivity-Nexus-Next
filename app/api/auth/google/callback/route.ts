import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  
  if (error) {
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=Google_Auth_Failed`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=Missing_Code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      })
    });

    if (!tokenRes.ok) {
      console.error("Google Auth token error:", await tokenRes.text());
      return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=Token_Exchange_Failed`);
    }

    const data = await tokenRes.json();
    
    // Get the authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=Not_Authenticated`);
    }

    const userId = user.id;

    const updateData: any = {
      googleAccessToken: data.access_token,
    };
    if (data.refresh_token) {
      updateData.googleRefreshToken = data.refresh_token;
    }

    // Ensure settings exist, then update
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
    if (existing) {
      await db.update(settingsTable).set(updateData).where(eq(settingsTable.userId, userId));
    } else {
      await db.insert(settingsTable).values({
        userId,
        ...updateData
      });
    }

    return NextResponse.redirect(`${req.nextUrl.origin}/settings?success=google_connected`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=Internal_Error`);
  }
}
