import { TMDB } from "tmdb-ts";

// Initialize TMDB client
const token = process.env.TMDB_ACCESS_TOKEN || "";
export const tmdb = new TMDB(token);

export interface UnifiedMedia {
  id: string; // tmdb:12345
  tmdbId: number;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  averageScore: number;
  type: "movie" | "tv" | "anime";
  releaseDate: string | null;
}

const getPosterUrl = (path: string | null | undefined) => 
  path ? `https://image.tmdb.org/t/p/w500${path}` : "";

const getBackdropUrl = (path: string | null | undefined) => 
  path ? `https://image.tmdb.org/t/p/original${path}` : "";

// Map TMDB Movie to our unified interface
export function mapTmdbMovie(movie: any): UnifiedMedia {
  return {
    id: `tmdb:movie:${movie.id}`,
    tmdbId: movie.id,
    title: movie.title || movie.original_title,
    description: movie.overview || "",
    coverImage: getPosterUrl(movie.poster_path),
    bannerImage: getBackdropUrl(movie.backdrop_path) || getPosterUrl(movie.poster_path),
    genres: [], // Would need full details fetch or genre mapping, omitting for lists
    averageScore: movie.vote_average ? movie.vote_average * 10 : 0,
    type: "movie",
    releaseDate: movie.release_date || null,
  };
}

// Map TMDB TV to our unified interface
export function mapTmdbTv(tv: any): UnifiedMedia {
  return {
    id: `tmdb:tv:${tv.id}`,
    tmdbId: tv.id,
    title: tv.name || tv.original_name,
    description: tv.overview || "",
    coverImage: getPosterUrl(tv.poster_path),
    bannerImage: getBackdropUrl(tv.backdrop_path) || getPosterUrl(tv.poster_path),
    genres: [], 
    averageScore: tv.vote_average ? tv.vote_average * 10 : 0,
    type: "tv",
    releaseDate: tv.first_air_date || null,
  };
}

export async function getTrendingMovies(): Promise<UnifiedMedia[]> {
  try {
    const data = await tmdb.trending.trending("movie", "day");
    return data.results.map(mapTmdbMovie);
  } catch (err) {
    console.error("TMDB error:", err);
    return [];
  }
}

export async function getTrendingTvShows(): Promise<UnifiedMedia[]> {
  try {
    const data = await tmdb.trending.trending("tv", "day");
    return data.results.map(mapTmdbTv);
  } catch (err) {
    console.error("TMDB error:", err);
    return [];
  }
}

export async function getPopularMovies(): Promise<UnifiedMedia[]> {
  try {
    const data = await tmdb.movies.popular();
    return data.results.map(mapTmdbMovie);
  } catch (err) {
    console.error("TMDB popular movies error:", err);
    return [];
  }
}

export async function getPopularTvShows(): Promise<UnifiedMedia[]> {
  try {
    const data = await tmdb.tvShows.popular();
    return data.results.map(mapTmdbTv);
  } catch (err) {
    console.error("TMDB popular TV error:", err);
    return [];
  }
}

export async function searchTmdb(query: string): Promise<UnifiedMedia[]> {
  try {
    const [movies, tv] = await Promise.all([
      tmdb.search.movies({ query, page: 1 }),
      tmdb.search.tvShows({ query, page: 1 })
    ]);
    
    const combined = [
      ...movies.results.map(mapTmdbMovie),
      ...tv.results.map(mapTmdbTv)
    ];
    
    // Sort by popularity
    return combined.sort((a, b) => (b as any).popularity - (a as any).popularity);
  } catch (err) {
    console.error("TMDB search error:", err);
    return [];
  }
}

export async function getTmdbMovieDetails(id: number) {
  return await tmdb.movies.details(id);
}

export async function getTmdbTvDetails(id: number) {
  return await tmdb.tvShows.details(id);
}
