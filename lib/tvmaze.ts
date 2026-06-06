/**
 * TVMaze API Integration for live-action TV Shows.
 * Using the free public API: https://www.tvmaze.com/api
 */

export interface TVShow {
  id: string; // prefixed with tmdb: or tvmaze: to distinguish from anilist
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  episodes: number | null;
  averageScore: number;
  type: string; // "tv"
  releaseDate: string | null;
  imdbId?: string; // e.g. tt1234567
}
function mapTVMazeToShow(show: any): TVShow {
  // Try to use clean summary without HTML tags
  const cleanSummary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : '';
  
  return {
    id: `tvmaze:${show.id}`,
    title: show.name,
    description: cleanSummary,
    coverImage: show.image?.original || show.image?.medium || '',
    bannerImage: show.image?.original || '', // TVMaze doesn't have banners, so fallback to poster
    genres: show.genres || [],
    episodes: show.weight || null, // rough approximation
    averageScore: show.rating?.average ? show.rating.average * 10 : 0, // out of 100
    type: 'tv',
    releaseDate: show.premiered || null,
    imdbId: show.externals?.imdb || undefined
  };
}

export async function searchTVShows(query: string): Promise<TVShow[]> {
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch from TVMaze');
    const data = await res.json();
    return data.map((item: any) => mapTVMazeToShow(item.show));
  } catch (err) {
    console.error("TVMaze search error:", err);
    return [];
  }
}

export async function getTrendingTVShows(): Promise<TVShow[]> {
  // TVMaze doesn't have a direct "trending" endpoint. We can fetch schedule for today.
  // We'll just fetch a popular query like "Batman" or just use shows on schedule today.
  try {
    const res = await fetch(`https://api.tvmaze.com/schedule`);
    if (!res.ok) throw new Error('Failed to fetch schedule from TVMaze');
    const data = await res.json();
    
    // Extract unique shows from episodes
    const showsMap = new Map();
    data.forEach((item: any) => {
      if (item.show && !showsMap.has(item.show.id)) {
        showsMap.set(item.show.id, mapTVMazeToShow(item.show));
      }
    });
    
    return Array.from(showsMap.values()).slice(0, 20);
  } catch (err) {
    console.error("TVMaze trending error:", err);
    return [];
  }
}

export async function getTVShowById(id: number): Promise<TVShow | null> {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return mapTVMazeToShow(data);
  } catch (err) {
    console.error("TVMaze fetch show error:", err);
    return null;
  }
}

export async function getTVShowEpisodesCount(id: number): Promise<number> {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}/episodes`);
    if (!res.ok) return 12; // Fallback
    const data = await res.json();
    return data.length || 12;
  } catch (err) {
    console.error("TVMaze fetch episodes error:", err);
    return 12;
  }
}
