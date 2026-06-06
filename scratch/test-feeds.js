import Parser from 'rss-parser';
import fs from 'fs';

const feedsConfig = JSON.parse(fs.readFileSync('./config/news-feeds.json', 'utf8'));

async function testFeeds() {
  const parser = new Parser();
  let brokenFeeds = 0;
  
  for (const feed of feedsConfig.slice(0, 5)) { // Test a few
    try {
      console.log(`Testing ${feed.url}`);
      const xml = await fetch(feed.url, { signal: AbortSignal.timeout(5000) }).then(r => r.text());
      const parsed = await parser.parseString(xml);
      if (parsed.items.length === 0) console.log(`0 items for ${feed.url}`);
      const first = parsed.items[0];
      if (!first?.link) console.log(`NO LINK for ${feed.url}`);
    } catch (e) {
      console.log(`FAIL ${feed.url}: ${e.message}`);
      brokenFeeds++;
    }
  }
}
testFeeds();
