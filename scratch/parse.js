const fs = require('fs');

const opmlStr = `
<?xml version='1.0' encoding='UTF-8' ?>
<opml version="1.0">
	<head>
		<title>Export from Plenary</title>
		<url>https://play.google.com/store/apps/details?id=com.spians.plenary</url>
	</head>
	<body>
		<outline text="India" title="India">
			<outline text="BBC News - India" title="BBC News - India" description="BBC News - India" xmlUrl="http://feeds.bbci.co.uk/news/world/asia/india/rss.xml" type="rss" />
			<outline text="India | The Guardian" title="India | The Guardian" description="Latest news and features from theguardian.com, the world's leading liberal voice" xmlUrl="https://www.theguardian.com/world/india/rss" type="rss" />
			<outline text="SEBI RSS Feed" title="SEBI RSS Feed" description="SEBI RSS Feed" xmlUrl="https://www.sebi.gov.in/sebirss.xml" type="rss" />
			<outline text="Times of India" title="Times of India" description="The Times of India: Breaking news, views, reviews, cricket from across India" xmlUrl="https://timesofindia.indiatimes.com/rssfeedstopstories.cms" type="rss" />
			<outline text="The Hindu - Home" title="The Hindu - Home" description="Default RSS Feed" xmlUrl="https://www.thehindu.com/feeder/default.rss" type="rss" />
			<outline text="NDTV News -   Topstories" title="NDTV News -   Topstories" description="NDTV.com provides the latest information from and in-depth coverage of India and the world. Find breaking news, India news, top stories, elections, politics, business, cricket, movies, lifestyle, health, live TV, videos, photos and more." xmlUrl="https://feeds.feedburner.com/ndtvnews-top-stories" type="rss" />
			<outline text="India Today | Latest Stories" title="India Today | Latest Stories" description="India Today" xmlUrl="https://www.indiatoday.in/rss/home" type="rss" />
			<outline text="Front Page | The Indian Express" title="Front Page | The Indian Express" description="Latest News, India News, Covid-19 News, Breaking News, Today's News Headlines Online" xmlUrl="http://indianexpress.com/print/front-page/feed/" type="rss" />
			<outline text="Top World News- News18.com" title="Top World News- News18.com" description="Latest news from World Section" xmlUrl="https://www.news18.com/rss/world.xml" type="rss" />
			<outline text="India News" title="India News" description="dnaindia.com delivers news and information on the latest top stories, sport, entertainment, business, technology, Mumbai, India, world and more." xmlUrl="https://www.dnaindia.com/feeds/india.xml" type="rss" />
			<outline text="Firstpost India Latest News" title="Firstpost India Latest News" description="Firstpost provides Latest News in India, Live News India, India Breaking News, todays India news, Top headlines of India" xmlUrl="https://www.firstpost.com/rss/india.xml" type="rss" />
			<outline text="Home Page" title="Home Page" description="Business News: Get latest stock share market news, financial news, economy news, company news, politics news, India news, breaking news, Indian economy news at Business Standard. Catch Nifty Sensex Live updates." xmlUrl="https://www.business-standard.com/rss/home_page_top_stories.rss" type="rss" />
			<outline text="Outlook India" title="Outlook India" description="outlook India" xmlUrl="https://www.outlookindia.com/rss/main/magazine" type="rss" />
			<outline text="Free Press Journal" title="Free Press Journal" description="Free Press Journal brings the Latest News & Top Breaking headlines on Politics and Current Affairs in India & around the World, Sports, Business, Bollywood" xmlUrl="https://www.freepressjournal.in/stories.rss" type="rss" />
			<outline text="Deccan Chronicle - Latest India news | Breaking news | Hyderabad News | World news | Business news | Politics | Technology news" title="Deccan Chronicle - Latest India news | Breaking news | Hyderabad News | World news | Business news | Politics | Technology news" description="Deccan Chronicle brings you the latest news, views, analysis and images from India and the world." xmlUrl="https://www.deccanchronicle.com/rss_feed/" type="rss" />
			<outline text="Moneycontrol Latest News" title="Moneycontrol Latest News" description="Latest News from Moneycontrol.com" xmlUrl="http://www.moneycontrol.com/rss/latestnews.xml" type="rss" />
			<outline text="Economic Times" title="Economic Times" description="The Economic Times: Latest business, finance, markets, stocks, company news from India." xmlUrl="https://economictimes.indiatimes.com/rssfeedsdefault.cms" type="rss" />
			<outline text="News, Latest News, Today's News Headlines, Breaking News, LIVE News - Oneindia" title="News, Latest News, Today's News Headlines, Breaking News, LIVE News - Oneindia" description="Read all latest news headlines from India and around the world, get today's breaking news and live updates on politics, elections, business, sports, economy, current affairs, results and more on Oneindia." xmlUrl="https://www.oneindia.com/rss/news-fb.xml" type="rss" />
			<outline text="Scroll.in" title="Scroll.in" description="A digital daily of things that matter." xmlUrl="http://feeds.feedburner.com/ScrollinArticles.rss" type="rss" />
			<outline text="The Financial Express" title="The Financial Express" description="Business News: Business News India, Business News Today, Latest Finance News, Business News Live" xmlUrl="https://www.financialexpress.com/feed/" type="rss" />
			<outline text="Business Line - Home" title="Business Line - Home" description="Default RSS Feed" xmlUrl="https://www.thehindubusinessline.com/feeder/default.rss" type="rss" />
			<outline text="TechGenyz" title="TechGenyz" description="News on Mobile, Gaming, AR, VR, Apps and Future Tech" xmlUrl="http://feeds.feedburner.com/techgenyz" type="rss" />
			<outline text="Top Stories News - Gujarat Samachar : World's Leading Gujarati Newspaper" title="Top Stories News - Gujarat Samachar : World's Leading Gujarati Newspaper" description="Top Stories News - Gujarat Samachar : World's Leading Gujarati Newspaper" xmlUrl="https://www.gujaratsamachar.com/rss/top-stories" type="rss" />
			<outline text="Marathi News: मराठी बातम्या,  Latest News in Marathi, Breaking Marathi News, Marathi News Paper | Maharashtra Times" title="Marathi News: मराठी बातम्या,  Latest News in Marathi, Breaking Marathi News, Marathi News Paper | Maharashtra Times" description="Get latest Marathi news from Maharashtra, India and World. Maharashtra Times, a Marathi news paper provides news in Marathi, Marathi batmya, today's news headlines from sports, entertainment, politics and more." xmlUrl="https://maharashtratimes.com/rssfeedsdefault.cms" type="rss" />
			<outline text="Loksattaदेश-विदेश &#8211; Loksatta" title="Loksattaदेश-विदेश &#8211; Loksatta" description="Marathi News" xmlUrl="https://www.loksatta.com/desh-videsh/feed/" type="rss" />
			<outline text="Latest News program News18 Lokmat" title="Latest News program News18 Lokmat" description="Latest news from program Section" xmlUrl="https://lokmat.news18.com/rss/program.xml" type="rss" />
			<outline text="OpIndia" title="OpIndia" description="bringing the 'right' side of India" xmlUrl="https://feeds.feedburner.com/opindia" type="rss" />
			<outline text="ThePrint" title="ThePrint" description="India’s digital platform for latest news and reports, insightful analyses, opinion on politics, policy, governance, economy, education, defence and culture." xmlUrl="https://theprint.in/feed/" type="rss" />
			<outline text="Swarajya" title="Swarajya" description="" xmlUrl="https://prod-qt-images.s3.amazonaws.com/production/swarajya/feed.xml" type="rss" />
			<outline text="Latest And Breaking Hindi News Headlines, News In Hindi | अमर उजाला हिंदी न्यूज़ | - Amar Ujala" title="Latest And Breaking Hindi News Headlines, News In Hindi | अमर उजाला हिंदी न्यूज़ | - Amar Ujala" description="Read breaking and latest breaking News in Hindi in India's No. 1 Leading Hindi Newspaper Amar Ujala covering breaking samachar in Hindi, election news, crime news, education news and more" xmlUrl="https://www.amarujala.com/rss/breaking-news.xml" type="rss" />
			<outline text="Navbharat Times" title="Navbharat Times" description="NavBharat Times a Hindi news portal brings news in Hindi from India and international news headlines, top stories on business, politics, sports and entertainment news" xmlUrl="https://navbharattimes.indiatimes.com/rssfeedsdefault.cms" type="rss" />
			<outline text="Patrika : India's Leading Hindi News Portal" title="Patrika : India's Leading Hindi News Portal" description="Patrika - A Hindi news portal brings latest news, headlines in hindi from India, world, business, politics, sports and entertainment!" xmlUrl="http://api.patrika.com/rss/india-news" type="rss" />
			<outline text="JansattaJansatta" title="JansattaJansatta" description="Hindi News, हिंदी समाचार, Live Hindi News, Latest India News, Hindi News Paper Today, Breaking News Headlines" xmlUrl="https://www.jansatta.com/feed/" type="rss" />
			<outline text="Live Hindustan Rss feed" title="Live Hindustan Rss feed" description="www.livehindustan.com delivers news and information on the latest top stories, Videsh, Desh, Cricket, Entertainment, Business, Life Style, Editors Artical and other related local news." xmlUrl="https://feed.livehindustan.com/rss/3127" type="rss" />
			<outline text="देश | दैनिक भास्कर" title="देश | दैनिक भास्कर" description="News in Hindi(हिन्दी में समाचार), Hindi News(हिंदी समाचार): देश के सबसे विश्वसनीय अख़बार पर पढ़ें ताज़ा ख़बरें। पढ़ें देश, विदेश, बॉलीवुड, लाइफस्टाइल और राजनीती की ब्रेकिंग ख़बरें. Read Latest Hindi News, Breaking News at Dainik Bhaskar" xmlUrl="https://www.bhaskar.com/rss-feed/1061/" type="rss" />
			<outline text="ઈન્ડિયા | દિવ્ય ભાસ્કર" title="ઈન્ડિયા | દિવ્ય ભાસ્કર" description="Latest National News Samachar - Find India\'s latest Samachar and News Headlines today at India\'s No. 1 gujarati news site www.divyabhaskar.co.in." xmlUrl="https://www.divyabhaskar.co.in/rss-feed/1037/" type="rss" />
		</outline>
	</body>
</opml>

<?xml version='1.0' encoding='UTF-8' ?>
<opml version="1.0">
	<head>
		<title>Export from Plenary</title>
		<url>https://play.google.com/store/apps/details?id=com.spians.plenary</url>
		<ownerName>Spians Labs</ownerName>
		<ownerEmail>info@spianslabs.com</ownerEmail>
	</head>
	<body>
		<outline text="Business & Economy" title="Business & Economy">
			<outline text="All News" title="All News" description="" xmlUrl="https://www.investing.com/rss/news.rss" type="rss" />
			<outline text="Bloomberg Quicktake" title="Bloomberg Quicktake" description="" xmlUrl="https://www.youtube.com/feeds/videos.xml?user=Bloomberg" type="rss" />
			<outline text="Breaking News on Seeking Alpha" title="Breaking News on Seeking Alpha" description="seekingalpha" xmlUrl="https://seekingalpha.com/market_currents.xml" type="rss" />
			<outline text="Business Insider" title="Business Insider" description="" xmlUrl="https://www.youtube.com/feeds/videos.xml?user=businessinsider" type="rss" />
			<outline text="Duct Tape Marketing" title="Duct Tape Marketing" description="Interviews with authors" xmlUrl="https://ducttape.libsyn.com/rss" type="rss" />
			<outline text="Economic Times" title="Economic Times" description="The Economic Times" xmlUrl="https://economictimes.indiatimes.com/rssfeedsdefault.cms" type="rss" />
			<outline text="Forbes - Business" title="Forbes - Business" description="Forbes - Business" xmlUrl="https://www.forbes.com/business/feed/" type="rss" />
			<outline text="Fortune" title="Fortune" description="Fortune 500 Daily" xmlUrl="https://fortune.com/feed" type="rss" />
			<outline text="HBR IdeaCast" title="HBR IdeaCast" description="A weekly podcast featuring the leading thinkers in business and management." xmlUrl="http://feeds.harvardbusiness.org/harvardbusiness/ideacast" type="rss" />
			<outline text="Home Page" title="Home Page" description="Business News" xmlUrl="https://www.business-standard.com/rss/home_page_top_stories.rss" type="rss" />
			<outline text="How I Built This with Guy Raz" title="How I Built This with Guy Raz" description="Guy Raz dives into the stories" xmlUrl="https://feeds.npr.org/510313/podcast.xml" type="rss" />
			<outline text="Startup Stories - Mixergy" title="Startup Stories - Mixergy" description="Business tips for startups by proven entrepreneurs" xmlUrl="https://feeds.feedburner.com/Mixergy-main-podcast" type="rss" />
			<outline text="The Blog of Author Tim Ferriss" title="The Blog of Author Tim Ferriss" description="Tim Ferriss" xmlUrl="https://tim.blog/feed/" type="rss" />
			<outline text="The Growth Show" title="The Growth Show" description="It’s never been easier" xmlUrl="http://thegrowthshow.hubspot.libsynpro.com/" type="rss" />
			<outline text="US Top News and Analysis" title="US Top News and Analysis" description="CNBC" xmlUrl="https://www.cnbc.com/id/100003114/device/rss/rss.html" type="rss" />
			<outline text="Yahoo Finance" title="Yahoo Finance" description="At Yahoo Finance" xmlUrl="https://finance.yahoo.com/news/rssindex" type="rss" />
		</outline>
	</body>
</opml>

<?xml version='1.0' encoding='UTF-8' ?>
<opml version="1.0">
	<head>
		<title>Export from Plenary</title>
		<url>https://play.google.com/store/apps/details?id=com.spians.plenary</url>
		<ownerName>Spians Labs</ownerName>
		<ownerEmail>info@spianslabs.com</ownerEmail>
	</head>
	<body>
		<outline text="Sports" title="Sports">
			<outline text="BBC Sport - Sport" title="BBC Sport - Sport" description="BBC Sport - Sport" xmlUrl="http://feeds.bbci.co.uk/sport/rss.xml" type="rss" />
			<outline text="Reddit Sports" title="Reddit Sports" description="Sports News and Highlights from the NFL, NBA, NHL, MLB, MLS, and leagues around the world." xmlUrl="https://www.reddit.com/r/sports.rss" type="rss" />
			<outline text="Sports News - Latest Sports and Football News | Sky News" title="Sports News - Latest Sports and Football News | Sky News" description="The best sports coverage from around the world, covering: Football, Cricket, Golf, Rugby, WWE, Boxing, Tennis and much more." xmlUrl="http://feeds.skynews.com/feeds/rss/sports.xml" type="rss" />
			<outline text="Sportskeeda" title="Sportskeeda" description="Sports Writers Unite" xmlUrl="https://www.sportskeeda.com/feed" type="rss" />
			<outline text="Yahoo! Sports - News, Scores, Standings, Rumors, Fantasy Games" title="Yahoo! Sports - News, Scores, Standings, Rumors, Fantasy Games" description="Yahoo! Sports - Comprehensive news, scores, standings, fantasy games, rumors, and more" xmlUrl="https://sports.yahoo.com/rss/" type="rss" />
			<outline text="www.espn.com - TOP" title="www.espn.com - TOP" description="Latest TOP news from www.espn.com" xmlUrl="https://www.espn.com/espn/rss/news" type="rss" />
		</outline>
	</body>
</opml>

<?xml version='1.0' encoding='UTF-8' ?>
<opml version="1.0">
	<head>
		<title>Export from Plenary</title>
		<url>https://play.google.com/store/apps/details?id=com.spians.plenary</url>
		<ownerName>Spians Labs</ownerName>
		<ownerEmail>info@spianslabs.com</ownerEmail>
	</head>
	<body>
		<outline text="Space" title="Space">
			<outline text="/r/space: news, articles and discussion" title="/r/space: news, articles and discussion" description="Share & discuss informative content on: * Astrophysics * Cosmology * Space Exploration * Planetary Science * Astrobiology" xmlUrl="https://www.reddit.com/r/space/.rss?format=xml" type="rss" />
			<outline text="NASA Breaking News" title="NASA Breaking News" description="A RSS news feed containing the latest NASA news articles and press releases." xmlUrl="https://www.nasa.gov/rss/dyn/breaking_news.rss" type="rss" />
			<outline text="New Scientist - Space" title="New Scientist - Space" description="New Scientist - Space" xmlUrl="https://www.newscientist.com/subject/space/feed/" type="rss" />
			<outline text="Sky & Telescope" title="Sky & Telescope" description="The essential guide to astronomy" xmlUrl="https://www.skyandtelescope.com/feed/" type="rss" />
			<outline text="Space | The Guardian" title="Space | The Guardian" description="Latest news and features from theguardian.com, the world's leading liberal voice" xmlUrl="https://www.theguardian.com/science/space/rss" type="rss" />
			<outline text="Space.com" title="Space.com" description="Get the latest space exploration, innovation and astronomy news. Space.com celebrates humanity's ongoing expansion across the final frontier." xmlUrl="https://www.space.com/feeds/all" type="rss" />
			<outline text="SpaceX" title="SpaceX" description="" xmlUrl="https://www.youtube.com/feeds/videos.xml?user=spacexchannel" type="rss" />
		</outline>
	</body>
</opml>
`;

const result = [];
let currentCategory = "";

const lines = opmlStr.split('\n');
for (const line of lines) {
    // Check for category outline
    const catMatch = line.match(/<outline text="([^"]+)" title="([^"]+)" *>/);
    if (catMatch) {
        currentCategory = catMatch[1];
        // Handle Business & Economy mapping
        if (currentCategory === "Business & Economy") {
            currentCategory = "Business";
        }
        continue;
    }

    // Check for feed outline
    const xmlMatch = line.match(/xmlUrl="([^"]+)"/);
    const titleMatch = line.match(/title="([^"]+)"/);
    if (xmlMatch && titleMatch && currentCategory) {
        result.push({
            category: currentCategory,
            title: titleMatch[1],
            url: xmlMatch[1]
        });
    }
}

fs.writeFileSync('config/news-feeds.json', JSON.stringify(result, null, 2));
console.log('Saved ' + result.length + ' feeds to config/news-feeds.json');
