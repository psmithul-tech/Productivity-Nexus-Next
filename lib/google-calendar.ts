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

export async function getGoogleToken(userId: string) {
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
  if (!settings || !settings.googleAccessToken) return null;
  
  // Return early if no token handling is needed
  // Actual token validation will happen on fetch. If 401, we use refreshGoogleToken
  return { token: settings.googleAccessToken, refreshToken: settings.googleRefreshToken };
}

export async function fetchGoogleEvents(userId: string, from: Date, to: Date) {
  try {
    const creds = await getGoogleToken(userId);
    if (!creds) return [];
    
    let token = creds.token;
    
    let res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 && creds.refreshToken) {
      const newToken = await refreshGoogleToken(userId, creds.refreshToken);
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

export async function pushTaskToGoogleCalendar(userId: string, title: string, dueDate: Date) {
  try {
    const creds = await getGoogleToken(userId);
    if (!creds) return false;
    
    let token = creds.token;
    
    const start = new Date(dueDate);
    const end = new Date(dueDate);
    end.setMinutes(end.getMinutes() + 30); // Default 30 min duration for tasks
    
    const payload = {
      summary: `☑️ ${title}`,
      description: "Auto-synced from Productivity Nexus",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() }
    };
    
    const makeReq = (t: string) => fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    let res = await makeReq(token);
    
    if (res.status === 401 && creds.refreshToken) {
      const newToken = await refreshGoogleToken(userId, creds.refreshToken);
      if (newToken) {
        res = await makeReq(newToken);
      }
    }
    
    return res.ok;
  } catch (err) {
    console.error("Error pushing to Google Calendar:", err);
    return false;
  }
}
