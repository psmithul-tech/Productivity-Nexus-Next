const Parser = require('rss-parser');
const parser = new Parser();
parser.parseURL('http://feeds.bbci.co.uk/news/world/asia/india/rss.xml')
  .then(feed => console.log('Items:', feed.items.length))
  .catch(err => console.error(err));
