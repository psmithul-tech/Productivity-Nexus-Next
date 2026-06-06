export interface PlayersProps {
  title: string;
  source: string;
  recommended?: boolean;
  fast?: boolean;
  ads?: boolean;
  resumable?: boolean;
}

export const getMoviePlayers = (tmdbId: string | number): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: `https://vidlink.pro/movie/${tmdbId}?primaryColor=006fee&autoplay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "SuperEmbed",
      source: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed",
      source: `https://autoembed.co/movie/tmdb/${tmdbId}`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc",
      source: `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "<Embed>",
      source: `https://embed.su/embed/movie/${tmdbId}`,
      ads: true,
    },
    {
      title: "2Embed",
      source: `https://www.2embed.cc/embed/${tmdbId}`,
      ads: true,
    },
  ];
};

export const getTvShowPlayers = (
  tmdbId: string | number,
  season: number,
  episode: number
): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=f5a524&autoplay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "SuperEmbed",
      source: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed",
      source: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc",
      source: `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "<Embed>",
      source: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
      ads: true,
    },
    {
      title: "2Embed",
      source: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
      ads: true,
    },
  ];
};
