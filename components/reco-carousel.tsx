"use client";

import { useState, useEffect, useRef } from "react";
import { Play, ChevronRight, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchTmdb, UnifiedMedia } from "@/lib/tmdb";
import { fetchAnilist } from "@/lib/anilist";
import { createClient } from "@/utils/supabase/client";

interface RecoCarouselProps {
  onSelect: (title: string, isMovie?: boolean) => void;
}

export function RecoCarousel({ onSelect }: RecoCarouselProps) {
  const [items, setItems] = useState<UnifiedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  useEffect(() => {
    async function loadRecos() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        // Use user ID if available, else default to 1 for the reco engine demo
        const userId = session?.user?.id || "1";
        
        const recoRes = await fetch(`/api/reco?userId=${userId}&n=10`);
        if (!recoRes.ok) throw new Error("Failed to fetch recos");
        const recoData = await recoRes.json();
        
        if (!recoData.recommendations) {
          setLoading(false);
          return;
        }

        const populatedItems: UnifiedMedia[] = [];

        // Hydrate the recommendations (They are string titles right now like "Death Note")
        for (const rec of recoData.recommendations) {
          const title = rec.item_id;
          
          // Let's search TMDB first to see if it exists as a Movie/TV show
          const tmdbResults = await searchTmdb(title);
          if (tmdbResults && tmdbResults.length > 0) {
            populatedItems.push(tmdbResults[0]);
            continue;
          }

          // Fallback to Anilist
          const queryStr = `
            query($search: String) {
              Page(page: 1, perPage: 1) {
                media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
                  id
                  title { english, romaji }
                  coverImage { extraLarge }
                  description
                  bannerImage
                }
              }
            }
          `;
          const aniData = await fetchAnilist(queryStr, { search: title });
          if (aniData?.Page?.media?.length > 0) {
            const m = aniData.Page.media[0];
            populatedItems.push({
              id: `anilist:${m.id}`,
              title: m.title.english || m.title.romaji,
              description: m.description,
              coverImage: m.coverImage.extraLarge,
              bannerImage: m.bannerImage,
              type: 'anime',
              genres: [],
              tmdbId: 0,
              averageScore: 0,
              releaseDate: null
            });
          }
        }
        
        setItems(populatedItems);
      } catch (err) {
        console.error("Reco hydration error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecos();
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = dir === "left" ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  if (loading) {
    return (
      <div className="mb-10 md:mb-14 px-4 md:px-12">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-white/90">
          <Sparkles className="h-5 w-5 text-purple-500" />
          For You
        </h2>
        <div className="flex items-center gap-2 text-white/50 h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Analyzing your watch history...</span>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group/carousel mb-10 md:mb-14">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-12 flex items-center gap-2 text-white">
        <Sparkles className="h-5 w-5 text-purple-500 fill-purple-500/20" />
        Top Picks For You
      </h2>
      
      <div className="relative">
        <AnimatePresence>
          {showLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("left")}
              className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent z-30 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-8 w-8 text-white hover:scale-125 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-none px-4 md:px-12 pb-8 pt-2 snap-x snap-mandatory"
        >
          {items.map((media, idx) => {
            const isMovie = media.type === 'movie';
            const navId = media.id.toString().startsWith("anilist:") 
              ? media.title 
              : `tmdb:${media.type}:${media.id}`;

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => onSelect(navId, isMovie)}
                className="relative shrink-0 w-[160px] md:w-[220px] aspect-[2/3] bg-white/5 rounded-xl overflow-hidden cursor-pointer group snap-start ring-1 ring-white/10 hover:ring-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
              >
                {media.coverImage ? (
                  <img 
                    src={media.coverImage}
                    alt={media.title}
                    className="absolute inset-0 w-full h-full object-cover" 
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-zinc-900">
                    <Play className="h-8 w-8 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity z-10" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)] backdrop-blur-sm">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-sm backdrop-blur-md">
                      {media.type || 'Media'}
                    </span>
                    <span className="text-[10px] font-bold text-white/60">
                      Match {99 - idx}%
                    </span>
                  </div>
                  <p className="font-bold leading-tight text-sm text-white line-clamp-2 drop-shadow-md">
                    {media.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {showRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll("right")}
              className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-l from-[#09090b] via-[#09090b]/80 to-transparent z-30 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-8 w-8 text-white hover:scale-125 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
