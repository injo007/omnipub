import fs from "fs";
const data = JSON.parse(fs.readFileSync("db.json", "utf8"));

const hollywoodFeeds = (data.feeds || []).filter(f => f.niche === 'hollywood');
console.log('Hollywood feeds:', hollywoodFeeds.map(f => f.name));
