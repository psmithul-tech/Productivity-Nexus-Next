import { db } from "../lib/db";
import {
  usersTable,
  userProfilesTable,
  watchProgressTable,
  mediaRatingsTable,
  searchActivityTable,
} from "../lib/db/schema";
import { sql } from "drizzle-orm";

const ANIME_TITLES = [
  { id: "16498", title: "Attack on Titan" },
  { id: "21", title: "One Piece" },
  { id: "113415", title: "Jujutsu Kaisen" },
  { id: "101922", title: "Demon Slayer" },
  { id: "1535", title: "Death Note" },
  { id: "11061", title: "Hunter x Hunter" },
  { id: "5114", title: "Fullmetal Alchemist: Brotherhood" },
  { id: "31964", title: "Boku no Hero Academia" },
  { id: "28851", title: "Koe no Katachi" },
  { id: "113415", title: "Chainsaw Man" },
  { id: "21459", title: "Boku dake ga Inai Machi" },
  { id: "112231", title: "Spy x Family" },
  { id: "9253", title: "Steins;Gate" },
  { id: "20665", title: "Shigatsu wa Kimi no Uso" },
  { id: "21087", title: "One Punch Man" },
];

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Slice of Life", "Sports"];
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Japan", "Brazil", "Germany", "France", "Spain", "India"];

// Helper to get random item from array
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get multiple random items
function sampleSize<T>(arr: T[], n: number): T[] {
  const result = [...arr].sort(() => 0.5 - Math.random());
  return result.slice(0, n);
}

// Helper to get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random past date
function randomDatePastMonths(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * months));
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  return date;
}

async function main() {
  console.log("Fetching users...");
  let users = await db.select().from(usersTable);
  
  if (users.length === 0) {
    console.log("No users found. Creating 10 mock users...");
    for (let i = 1; i <= 10; i++) {
      await db.insert(usersTable).values({
        email: `mockuser${i}@example.com`,
        name: `Mock User ${i}`,
        googleId: `mock-google-${i}`,
      }).onConflictDoNothing();
    }
    users = await db.select().from(usersTable);
  }
  
  console.log(`Found ${users.length} users. Generating recommendation data...`);

  for (const user of users) {
    console.log(`Processing user: ${user.name} (${user.id})`);
    
    // 1. Profile Data
    try {
      await db.insert(userProfilesTable).values({
        userId: user.googleId || user.id.toString(),
        age: randomInt(18, 45),
        country: sample(COUNTRIES),
        favoriteGenres: sampleSize(GENRES, 2),
      }).onConflictDoNothing();
    } catch(e) { console.error("Error creating profile", e); }

    const uid = user.googleId || user.id.toString();

    // 2. Watch History (generate 5-12 watches per user)
    const numWatches = randomInt(5, 12);
    const watchedAnime = sampleSize(ANIME_TITLES, numWatches);
    
    for (const anime of watchedAnime) {
      const episodesWatched = randomInt(1, 24);
      try {
        await db.insert(watchProgressTable).values({
          userId: uid,
          animeId: anime.title, // using title as id for mock
          animeTitle: anime.title,
          episode: episodesWatched.toString(),
          position: randomInt(500, 1200),
          duration: 1400,
          updatedAt: randomDatePastMonths(3),
        });
      } catch(e) { console.error("Error creating watch progress", e); }
    }

    // 3. Media Ratings (generate 3-8 ratings)
    const numRatings = randomInt(3, 8);
    const ratedAnime = sampleSize(ANIME_TITLES, numRatings);
    for (const anime of ratedAnime) {
      const rating = randomInt(3, 5); // mostly positive to be realistic
      try {
        await db.insert(mediaRatingsTable).values({
          userId: uid,
          mediaId: anime.title,
          mediaTitle: anime.title,
          rating: rating,
          isLiked: rating >= 4,
          createdAt: randomDatePastMonths(6),
        });
      } catch(e) { console.error("Error creating rating", e); }
    }

    // 4. Search Activity (generate 8-15 searches)
    const numSearches = randomInt(8, 15);
    for (let i = 0; i < numSearches; i++) {
      const searchAnime = sample(ANIME_TITLES);
      // Sometimes they search genre, sometimes partial title
      const isGenreSearch = Math.random() > 0.7;
      const query = isGenreSearch ? sample(GENRES) : searchAnime.title.substring(0, randomInt(3, searchAnime.title.length));
      
      const didClick = Math.random() > 0.3; // 70% click rate
      
      try {
        await db.insert(searchActivityTable).values({
          userId: uid,
          searchQuery: query,
          clickedMediaId: didClick ? searchAnime.title : null,
          clickedMediaTitle: didClick ? searchAnime.title : null,
          createdAt: randomDatePastMonths(2),
        });
      } catch(e) { console.error("Error creating search log", e); }
    }
  }

  console.log("Mock data generation complete!");
  process.exit(0);
}

main().catch(console.error);
