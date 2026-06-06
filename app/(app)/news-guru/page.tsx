"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function NewsDashboard() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "INDIA");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryCat = searchParams.get("category");
    if (queryCat && queryCat.toUpperCase() !== category.toUpperCase()) {
      setCategory(queryCat.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const categories = ["ALL", "INDIA", "BUSINESS", "SPORTS", "SPACE", "TECHNOLOGY"];
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const secondaryArticles = articles.slice(1, 3);
  const otherArticles = articles.slice(3);

  return (
    <div className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300 page-enter">
      <main className="flex-1 p-md md:p-lg overflow-y-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-lg">
          
          {/* Section Header & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2 border-b border-outline-variant/20 pb-6">
            <header className="flex flex-col gap-3">
              <h1 className="text-[28px] font-headline-md font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF5F0] dark:bg-surface-container flex items-center justify-center border-[2px] border-black dark:border-[#E8DCC8] shrink-0 shadow-[0_2px_0_0_#000] dark:shadow-none">
                  <span className="material-symbols-outlined text-[#118AB2] dark:text-primary text-[20px]">newspaper</span>
                </div>
                News.Guru
              </h1>
              <p className="text-on-surface-variant font-body-lg">
                Global Intelligence Feed
              </p>
            </header>
            <div className="flex overflow-x-auto hide-scrollbar items-center gap-3 w-full md:w-auto -mx-4 md:mx-0 px-4 md:px-0">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={"px-5 py-2 font-mono-label text-[12px] tracking-wider uppercase rounded-full transition-all shrink-0 " + (
                    category.toUpperCase() === cat.toUpperCase() 
                      ? "bg-[#118AB2] dark:bg-primary text-white border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-sm"
                      : "bg-white dark:bg-surface-container text-black dark:text-on-surface-variant border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none hover:-translate-y-[1px] hover:shadow-[0_3px_0_0_#000] dark:hover:bg-surface-container-high"
                  )}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="p-12 flex justify-center text-primary">
               <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
             </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60 text-on-surface">
              <span className="material-symbols-outlined text-[48px] mb-4">search_off</span>
              <p>No intelligence feeds found for {category}.</p>
            </div>
          ) : (
            <>
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Featured Story */}
                {featuredArticle && (
                  <article 
                    className="lg:col-span-8 bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] overflow-hidden group cursor-pointer relative flex flex-col hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md transition-all"
                    onClick={() => window.open(featuredArticle.link, "_blank")}
                  >
                    <div className="relative h-64 md:h-[400px] w-full overflow-hidden bg-surface">
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent z-10"></div>
                      {featuredArticle.image_url ? (
                        <img 
                          alt="Feature" 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                          src={featuredArticle.image_url} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 bg-[#F0F4F8]">
                          <span className="material-symbols-outlined text-[80px]">newspaper</span>
                        </div>
                      )}
                      
                      <div className="absolute top-6 left-6 z-20 flex gap-2">
                        <span className="bg-white/90 dark:bg-surface/90 backdrop-blur-md px-3 py-1 border-[2px] border-black dark:border-outline-variant/20 font-mono-label text-[11px] tracking-wider text-error rounded-full flex items-center gap-2 shadow-[0_2px_0_0_#000] dark:shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                          BREAKING
                        </span>
                        <span className="bg-white/90 dark:bg-surface/90 backdrop-blur-md px-3 py-1 border-[2px] border-black dark:border-outline-variant/20 font-mono-label text-[11px] tracking-wider text-black dark:text-on-surface rounded-full uppercase shadow-[0_2px_0_0_#000] dark:shadow-sm">
                          {featuredArticle.source}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col gap-4 z-20 -mt-24 md:-mt-32 relative">
                      <h2 className="text-2xl md:text-3xl font-headline-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 drop-shadow-md">
                        {featuredArticle.title}
                      </h2>
                      <p className="font-body-lg text-[15px] text-on-surface-variant line-clamp-3 bg-white/90 dark:bg-surface/80 backdrop-blur-sm p-4 rounded-xl border-[2px] border-black dark:border-outline-variant/20 shadow-[0_2px_0_0_#000] dark:shadow-none">
                        {featuredArticle.contentSnippet?.replace(new RegExp("<[^>]+>", "g"), "")}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-[18px]">satellite_alt</span>
                          <span className="font-mono-label text-xs text-on-surface-variant uppercase tracking-wider">{featuredArticle.source}</span>
                        </div>
                        <span className="font-mono-label text-xs tracking-wider text-outline">
                          {new Date(featuredArticle.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </article>
                )}

                {/* Side Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Market Data Snapshot Module (Static for now) */}
                  <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-mono-label text-[11px] tracking-widest text-on-surface-variant uppercase">Market Pulse</h3>
                      <span className="material-symbols-outlined text-primary text-[18px]">show_chart</span>
                    </div>
                    <div className="flex justify-between items-end bg-[#F0F4F8] dark:bg-surface-container p-4 rounded-xl border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                      <div>
                        <span className="font-mono-label text-[10px] tracking-wider text-on-surface-variant block mb-1 uppercase">NASDAQ AI INDX</span>
                        <span className="font-headline-sm text-xl font-bold text-primary block">14,285.42</span>
                      </div>
                      <span className="font-mono-label text-xs font-bold text-primary flex items-center bg-[#118AB2]/10 dark:bg-primary/10 px-2 py-1 rounded-md border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none">+1.24% <span className="material-symbols-outlined text-[14px] ml-1">arrow_upward</span></span>
                    </div>
                    <div className="flex justify-between items-end bg-[#F0F4F8] dark:bg-surface-container p-4 rounded-xl border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                      <div>
                        <span className="font-mono-label text-[10px] tracking-wider text-on-surface-variant block mb-1 uppercase">NIFTY 50</span>
                        <span className="font-headline-sm text-xl font-bold text-error block">22,143.90</span>
                      </div>
                      <span className="font-mono-label text-xs font-bold text-error flex items-center bg-[#EF476F]/10 dark:bg-error/10 px-2 py-1 rounded-md border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none">-0.45% <span className="material-symbols-outlined text-[14px] ml-1">arrow_downward</span></span>
                    </div>
                  </div>

                  {/* Secondary Stories */}
                  {secondaryArticles.map((article, idx) => (
                    <article 
                      key={idx}
                      className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 flex flex-col gap-4 group cursor-pointer hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md"
                      onClick={() => window.open(article.link, "_blank")}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={"font-mono-label text-[10px] tracking-wider px-2 py-1 rounded-md uppercase border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none " + (idx === 0 ? "bg-[#118AB2]/10 dark:bg-primary/10 text-[#118AB2] dark:text-primary" : "bg-[#F0F4F8] dark:bg-surface-container text-black dark:text-on-surface-variant")}>
                          {category === 'ALL' ? article.source.substring(0, 8) : category}
                        </span>
                        <span className="font-mono-label text-[10px] tracking-wider text-outline">
                          {new Date(article.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-[16px] font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-3 leading-snug">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-outline-variant/20">
                        <span className="material-symbols-outlined text-outline text-[16px]">terminal</span>
                        <span className="font-mono-label text-[11px] tracking-wider text-on-surface-variant uppercase">{article.source}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Other Stories Grid */}
              {otherArticles.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherArticles.map((article, idx) => (
                    <article 
                      key={idx}
                      className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 flex flex-col gap-4 group cursor-pointer hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md"
                      onClick={() => window.open(article.link, "_blank")}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono-label text-[10px] tracking-wider text-black dark:text-outline uppercase truncate max-w-[60%] bg-[#F0F4F8] dark:bg-surface-container border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none px-2 py-1 rounded-md">
                          {article.source}
                        </span>
                        <span className="font-mono-label text-[10px] tracking-wider text-outline">
                          {new Date(article.pubDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                      <h3 className="font-body-lg text-[16px] font-bold text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-3">
                        {article.title}
                      </h3>
                      <p className="font-body-sm text-[13px] text-on-surface-variant line-clamp-2 mt-auto pt-2">
                        {article.contentSnippet?.replace(new RegExp("<[^>]+>", "g"), "")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span></div>}>
      <NewsDashboard />
    </Suspense>
  );
}
