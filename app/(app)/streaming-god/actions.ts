"use server";

import { searchTmdb, getTrendingMovies } from "@/lib/tmdb";

export async function searchMediaAction(query: string) {
  if (!query) return [];
  return await searchTmdb(query);
}

export async function getTrendingAction() {
  return await getTrendingMovies();
}
