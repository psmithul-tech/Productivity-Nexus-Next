export async function fetchAnilist(query: string, variables: any = {}) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      query,
      variables
    })
  });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

export const ANIME_FRAGMENT = `
  id
  title {
    english
    romaji
  }
  coverImage {
    extraLarge
    large
  }
  bannerImage
  description(asHtml: false)
  genres
  averageScore
  episodes
`;

export interface AniListAnime {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
  };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  averageScore: number;
  episodes: number;
}

export async function getTrendingAnime(): Promise<AniListAnime[]> {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: TRENDING_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const res = await fetchAnilist(query);
  return res.Page.media;
}

export async function getPopularAnime(): Promise<AniListAnime[]> {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const res = await fetchAnilist(query);
  return res.Page.media;
}

export async function getTopRatedAnime(): Promise<AniListAnime[]> {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: SCORE_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const res = await fetchAnilist(query);
  return res.Page.media;
}

export async function getAnimeByGenre(genre: string): Promise<AniListAnime[]> {
  const query = `
    query($genre: String) {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
          ${ANIME_FRAGMENT}
        }
      }
    }
  `;
  const res = await fetchAnilist(query, { genre });
  return res.Page.media;
}
