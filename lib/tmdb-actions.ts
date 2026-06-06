"use server";

import { tmdb } from "./tmdb";

export async function fetchTmdbTvShowEpisodes(id: number) {
  try {
    const details = await tmdb.tvShows.details(id);
    return details.number_of_episodes || 12;
  } catch (err) {
    console.error("TMDB TV details error:", err);
    return 12; // Fallback
  }
}
