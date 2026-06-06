/**
 * OMDB API Integration for Movies.
 * Uses a public free key for fetching movie metadata.
 */

export interface OMDBMovie {
  id: string; // prefixed with omdb:
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  episodes: null;
  averageScore: number;
  type: string; // "movie"
  releaseDate: string | null;
}

const OMDB_API_KEY = "trilogy";

function mapOMDBToMovie(movie: any): OMDBMovie {
  return {
    id: `omdb:${movie.imdbID}`,
    title: movie.Title,
    description: movie.Plot || "",
    coverImage: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "",
    bannerImage: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "",
    genres: movie.Genre ? movie.Genre.split(", ") : [],
    episodes: null,
    averageScore: movie.imdbRating && movie.imdbRating !== "N/A" ? parseFloat(movie.imdbRating) * 10 : 0,
    type: 'movie',
    releaseDate: movie.Released && movie.Released !== "N/A" ? movie.Released : null
  };
}

export async function searchMovies(query: string): Promise<OMDBMovie[]> {
  try {
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${OMDB_API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch from OMDB');
    const data = await res.json();
    
    if (data.Response === "False" || !data.Search) {
      return [];
    }

    return data.Search.map((item: any) => ({
      id: `omdb:${item.imdbID}`,
      title: item.Title,
      description: "",
      coverImage: item.Poster && item.Poster !== "N/A" ? item.Poster : "",
      bannerImage: item.Poster && item.Poster !== "N/A" ? item.Poster : "",
      genres: [],
      episodes: null,
      averageScore: 0,
      type: 'movie',
      releaseDate: item.Year
    }));
  } catch (err) {
    console.error("OMDB search error:", err);
    return [];
  }
}

export async function getMovieById(imdbId: string): Promise<OMDBMovie | null> {
  try {
    const id = imdbId.replace("omdb:", "");
    const res = await fetch(`https://www.omdbapi.com/?i=${id}&plot=full&apikey=${OMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;
    return mapOMDBToMovie(data);
  } catch (err) {
    console.error("OMDB fetch movie error:", err);
    return null;
  }
}

/**
 * Fetch popular/trending movies.
 * OMDB doesn't have a trending endpoint, so we search for well-known
 * recent blockbusters across a few categories.
 */
const POPULAR_SEARCHES = [
  "Avengers", "Dune", "Oppenheimer", "Batman", "Spider-Man",
  "John Wick", "Interstellar", "Inception", "Joker", "Deadpool"
];

export async function getPopularMovies(): Promise<OMDBMovie[]> {
  try {
    // Pick 4 random categories and fetch 10 movies each, then dedupe
    const picks = POPULAR_SEARCHES.sort(() => Math.random() - 0.5).slice(0, 4);
    const batches = await Promise.all(picks.map(q => searchMovies(q)));
    
    const seen = new Set<string>();
    const movies: OMDBMovie[] = [];
    
    for (const batch of batches) {
      for (const movie of batch) {
        if (!seen.has(movie.id) && movie.coverImage) {
          seen.add(movie.id);
          movies.push(movie);
        }
      }
    }
    
    // Shuffle and return up to 20
    return movies.sort(() => Math.random() - 0.5).slice(0, 20);
  } catch (err) {
    console.error("Popular movies error:", err);
    return [];
  }
}
