import fs from "fs";

const dbPath = "db.json";
const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));

let updated = 0;
// We know that discovered lifestyle feeds have niche = "lifestyle". 
// But in db.feeds, because of the bug, they have niche = "hollywood".
const customFeeds = data.customDiscoveredFeeds || [];
const customUrls = {};
customFeeds.forEach(f => { customUrls[f.url] = f.niche; });

data.feeds.forEach(f => {
  if (customUrls[f.url] && f.niche !== customUrls[f.url]) {
    console.log(`Fixing niche for ${f.name} from ${f.niche} to ${customUrls[f.url]}`);
    f.niche = customUrls[f.url];
    // Bump timestamp so it overrides firestore when quota is back
    f.lastSyncedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); 
    updated++;
  }
});

if (updated > 0) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log(`Fixed ${updated} feeds in db.json`);
} else {
  console.log("No feeds needed fixing.");
}
