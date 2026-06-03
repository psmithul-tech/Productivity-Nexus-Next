import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID in environment." }, { status: 500 });
  }

  const scope = "https://www.googleapis.com/auth/calendar.events";
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
