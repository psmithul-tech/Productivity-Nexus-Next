import { AGENTS } from "@/lib/agents";
import Parser from 'rss-parser';
import feedsConfigData from '@/config/news-feeds.json';
import { unstable_cache } from 'next/cache';
import { callOpenRouter } from '@/lib/openrouter';

type Feed = { category: string; title: string; url: string; };
const feedsConfig = feedsConfigData as Feed[];

export const getArticlesForCategory = unstable_cache(
  async (category: string) => {
    const feeds = category.toUpperCase() === 'ALL'
      ? feedsConfig
      : feedsConfig.filter(f => f.category.toUpperCase() === category.toUpperCase());
    const fetchFeed = async (feedUrl: string, sourceName: string) => {
      try {
        const parser = new Parser({
          customFields: {
            item: [
              ['media:content', 'media:content'],
              ['enclosure', 'enclosure']
            ]
          }
        });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        
        const response = await fetch(feedUrl, {
          signal: controller.signal,
          next: { revalidate: 900 }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const xml = await response.text();
        const feed = await parser.parseString(xml);
        
        return feed.items.slice(0, 5).map(item => {
          let image_url = (item as any).enclosure?.url || (item as any)['media:content']?.['$']?.url;
          if (!image_url && item.content) {
            const match = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (match) image_url = match[1];
          }

          return {
            title: item.title,
            link: item.link || item.guid,
            pubDate: item.pubDate || item.isoDate,
            contentSnippet: (item.contentSnippet || item.content || "").substring(0, 200),
            source: sourceName,
            image_url: image_url || null
          };
        });
      } catch (e) {
        console.warn(`Failed to parse feed ${sourceName}: ${(e as Error).message}`);
        return [];
      }
    };

    const results = await Promise.allSettled(feeds.map(f => fetchFeed(f.url, f.title)));
    
    let articles: any[] = [];
    results.forEach(res => {
      if (res.status === 'fulfilled') {
        articles = articles.concat(res.value);
      }
    });

    // Sort by pubDate desc (handle missing dates gracefully)
    articles.sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return timeB - timeA;
    });

    return articles.slice(0, 100);
  },
  ['news-articles-category'],
  { revalidate: 900 }
);

export async function generateDailyNewsSummary() {
  const categories = ["India", "Business", "Sports", "Space"];
  let promptText = "Here are the top recent news articles from various categories:\n\n";
  
  for (const cat of categories) {
    const articles = await getArticlesForCategory(cat);
    const top10 = articles.slice(0, 10);
    promptText += `### ${cat} News:\n`;
    top10.forEach((a, i) => {
      promptText += `${i + 1}. [${a.source}] ${a.title} - ${a.contentSnippet}\n`;
    });
    promptText += "\n";
  }
  
  promptText += "Please provide a detailed and engaging summary of the most important news that has happened today from these articles. Break it down by category. Use bullet points and bold text to highlight key information in a detailed way. Keep the tone informative and premium.";

  const text = await callOpenRouter(promptText, undefined, { 
    model: AGENTS.RESEARCH_DIRECTOR, 
    temperature: 0.7, 
    maxTokens: 1500 
  });

  return text || "No news summary could be generated at this time.";
}
