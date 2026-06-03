import { db, settingsTable } from "./db";
import { eq } from "drizzle-orm";

async function refreshGoogleToken(userId: string, refreshToken: string) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccessToken = data.access_token;
    await db.update(settingsTable).set({ googleAccessToken: newAccessToken }).where(eq(settingsTable.userId, userId));
    return newAccessToken;
  } catch {
    return null;
  }
}

export async function fetchGoogleEvents(userId: string, from: Date, to: Date) {
  try {
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
    if (!settings || !settings.googleAccessToken) return [];
    
    let token = settings.googleAccessToken;
    
    let res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 && settings.googleRefreshToken) {
      const newToken = await refreshGoogleToken(userId, settings.googleRefreshToken);
      if (newToken) {
        token = newToken;
        res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    if (!res.ok) {
      console.error("Google Calendar API error:", await res.text());
      return [];
    }
    
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: `gcal_${item.id}`,
      userId,
      title: item.summary || "Untitled Event",
      description: item.description || null,
      location: item.location || null,
      startTime: new Date(item.start?.dateTime || item.start?.date),
      endTime: new Date(item.end?.dateTime || item.end?.date),
      isRecurring: !!item.recurringEventId,
      recurrenceRule: null,
      tag: "Google Calendar",
      source: "google",
      createdAt: new Date(item.created || Date.now()),
    }));
  } catch (err) {
    console.error("Error fetching Google events:", err);
    return [];
  }
}
