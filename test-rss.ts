import fetch from "node-fetch";

async function testRSS(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  console.log("Length:", text.length);
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let rawItems = [];
  while ((match = itemRegex.exec(text)) !== null && rawItems.length < 5) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title(?:[^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : "";
      rawItems.push(title);
  }
  console.log("Found:", rawItems);
}

testRSS("https://news.google.com/rss/search?q=ChatGPT&hl=en-US&gl=US&ceid=US:en");
