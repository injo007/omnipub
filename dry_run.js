const data = {
  niche: "Travel",
  sourceTitle: "New Requirements for Thailand Tourism 2026",
  sourceUrl: "https://example.com/thailand-tourism-2026",
  sourceDescription: "Thailand introduces a mandatory $50 hotel fee starting January 15th, 2026. The new digital visa requirement is currently open for processing. We tried the portal and it crashed.",
  writerId: "auto",
  opportunityScore: 92,
  riskScore: 2,
  inlineImageMode: "none"
};

fetch("http://localhost:3000/api/articles/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
})
.then(res => res.text())
.then(text => console.log("Dry Run Output:", text))
.catch(err => console.error("Dry Run Error:", err));
