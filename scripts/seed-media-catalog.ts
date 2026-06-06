import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { db } from '../lib/db';
import { mediaCatalogTable } from '../lib/db/schema';
import { getTrendingAnime, getPopularAnime, getTopRatedAnime } from '../lib/anilist';
import { getTrendingTVShows } from '../lib/tvmaze';

async function main() {
  console.log("Seeding media catalog...");

  // 1. Fetch Anime
  const trending = await getTrendingAnime();
  const popular = await getPopularAnime();
  const toprated = await getTopRatedAnime();

  const allAnime = [...trending, ...popular, ...toprated];
  const animeMap = new Map();
  allAnime.forEach(a => {
    if (!animeMap.has(a.id)) {
      animeMap.set(a.id, a);
    }
  });

  // 2. Fetch TV Shows
  const tvshows = await getTrendingTVShows();

  const mediaToInsert: any[] = [];

  // Map Anime
  for (const [_, a] of animeMap) {
    mediaToInsert.push({
      mediaId: `anilist:${a.id}`,
      title: a.title?.english || a.title?.romaji || a.animeTitle,
      description: a.description || "",
      genre: a.genres?.[0] || "Anime",
      tags: JSON.stringify(a.genres || []),
      type: "anime",
      coverImage: a.coverImage?.extraLarge || a.image,
      bannerImage: a.bannerImage || "",
      episodes: a.episodes || 0,
      averageScore: a.averageScore || 0,
      releaseDate: new Date(), // fallback
    });
  }

  // Map TV Shows
  for (const t of tvshows) {
    mediaToInsert.push({
      mediaId: t.id,
      title: t.title,
      description: t.description,
      genre: t.genres?.[0] || "TV",
      tags: JSON.stringify(t.genres || []),
      type: "tv",
      coverImage: t.coverImage,
      bannerImage: t.bannerImage,
      episodes: t.episodes || 0,
      averageScore: t.averageScore || 0,
      releaseDate: t.releaseDate ? new Date(t.releaseDate) : new Date(),
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Inserting ${mediaToInsert.length} media items via Supabase REST API...`);
  
  // Insert with conflict resolution
  for (const item of mediaToInsert) {
    try {
      // Map JS camelCase back to snake_case for Supabase
      const dbItem = {
        media_id: item.mediaId,
        title: item.title,
        description: item.description,
        genre: item.genre,
        tags: item.tags,
        type: item.type,
        cover_image: item.coverImage,
        banner_image: item.bannerImage,
        episodes: item.episodes,
        average_score: item.averageScore,
        release_date: item.releaseDate.toISOString(),
      };
      
      const { error } = await supabase.from('media_catalog').upsert(dbItem, { onConflict: 'media_id' });
      if (error) {
         console.error(`Failed to insert ${item.title}:`, error.message);
      }
    } catch (err) {
      console.error(`Failed to insert ${item.title}`, err);
    }
  }

  console.log("Seed complete. Calling Reco Engine Fit...");
  
  // Trigger fit endpoint
  try {
    const res = await fetch("http://127.0.0.1:8000/reco/fit", { method: "POST" });
    const data = await res.json();
    console.log("Reco Fit Response:", data);
  } catch (err) {
    console.error("Failed to call reco fit", err);
  }

  process.exit(0);
}

main().catch(console.error);
