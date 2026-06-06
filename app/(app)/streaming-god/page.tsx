"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Play, X, ArrowLeft } from "lucide-react";
import { searchMediaAction, getTrendingAction } from "./actions";
import { UnifiedMedia } from "@/lib/tmdb";
import { getMoviePlayers, getTvShowPlayers } from "@/lib/players";

export default function StreamingGodPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<UnifiedMedia | null>(null);

  useEffect(() => {
    // Load trending by default
    getTrendingAction().then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      getTrendingAction().then(setResults);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      const data = await searchMediaAction(query);
      setResults(data);
      setSearching(false);
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  // Use the recommended player (vidlink)
  const getPlayerSrc = (media: UnifiedMedia) => {
    if (media.type === "tv") {
      // Default to season 1 episode 1 for TV shows for now
      return getTvShowPlayers(media.tmdbId, 1, 1)[0].source;
    }
    return getMoviePlayers(media.tmdbId)[0].source;
  };

  if (selectedMedia) {
    return (
      <div className="flex-1 w-full h-full flex flex-col bg-white dark:bg-[#050505] relative">
        <div className="bg-white dark:bg-surface border-b-[3px] border-black dark:border-transparent p-4 flex items-center justify-between z-30 shadow-[0_4px_0_0_#000] dark:shadow-none shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedMedia(null)}
              className="p-2 bg-[#F0F4F8] dark:bg-surface-container rounded-xl border-[2px] border-black dark:border-transparent hover:-translate-y-1 transition-transform shadow-[0_2px_0_0_#000] dark:shadow-none"
            >
              <ArrowLeft className="h-5 w-5 text-black dark:text-on-surface" />
            </button>
            <div>
              <h2 className="font-headline-md font-bold text-lg text-black dark:text-on-surface">
                {selectedMedia.title}
              </h2>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                {selectedMedia.type} {selectedMedia.releaseDate ? `• ${selectedMedia.releaseDate.substring(0,4)}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full h-full relative">
          <iframe
            src={getPlayerSrc(selectedMedia)}
            className="w-full h-full border-none"
            allowFullScreen
            title={selectedMedia.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white dark:bg-[#050505] relative overflow-hidden">
      {/* Header & Search */}
      <div className="bg-[#FFBE0B] dark:bg-surface border-b-[3px] border-black dark:border-outline-variant/20 p-6 md:p-8 z-30 shadow-[0_4px_0_0_#000] dark:shadow-sm shrink-0">
        <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-black dark:text-on-surface mb-6 tracking-tight">
          Streaming God
        </h1>
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-on-surface-variant" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies or TV shows..."
            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-surface-container-lowest rounded-2xl border-[3px] border-black dark:border-outline-variant/30 text-black dark:text-on-surface font-body-md shadow-[0_4px_0_0_#000] dark:shadow-inner focus:outline-none focus:ring-4 focus:ring-black/10 dark:focus:ring-primary/10 transition-all text-lg placeholder:text-on-surface-variant/50"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <X className="h-5 w-5 text-on-surface-variant hover:text-error transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="h-8 w-8 text-black dark:text-primary animate-spin" />
            <p className="font-mono-label text-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Initializing Catalog...
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-6 text-black dark:text-on-surface">
              {query.trim() ? (searching ? "Searching..." : "Search Results") : "Trending Now"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((media) => (
                <div 
                  key={media.id}
                  onClick={() => setSelectedMedia(media)}
                  className="group cursor-pointer bg-[#F0F4F8] dark:bg-surface-container rounded-2xl border-[3px] border-black dark:border-transparent overflow-hidden shadow-[0_4px_0_0_#000] dark:shadow-sm hover:-translate-y-2 hover:shadow-[0_8px_0_0_#000] dark:hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="relative aspect-[2/3] w-full border-b-[3px] border-black dark:border-transparent bg-black/5 dark:bg-black/20">
                    {media.coverImage ? (
                      <img 
                        src={media.coverImage} 
                        alt={media.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-black/20 dark:text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors z-10 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 scale-75 group-hover:scale-100 shadow-lg">
                        <Play className="h-5 w-5 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-sm text-black dark:text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {media.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {media.type}
                      </span>
                      {media.releaseDate && (
                        <span className="text-[10px] font-bold text-on-surface-variant">
                          {media.releaseDate.substring(0,4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {!loading && !searching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#F0F4F8] dark:bg-surface-container rounded-full flex items-center justify-center mb-4 border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none">
                  <Search className="h-8 w-8 text-on-surface-variant" />
                </div>
                <h3 className="font-headline-md text-xl font-bold text-black dark:text-on-surface mb-2">No results found</h3>
                <p className="text-on-surface-variant font-body-md max-w-sm">
                  We couldn't find any movies or TV shows matching "{query}". Try another search term.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
