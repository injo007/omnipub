import fetch from "node-fetch";

async function testRSS(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  console.log("Length:", text.length, "Status:", res.status);
  console.log(text.substring(0, 100));
}

testRSS("https://trends.google.com/trending/rss?geo=US");
