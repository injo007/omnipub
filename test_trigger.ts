import fetch from "node-fetch";

async function run() {
  const payload = {
    sourceTitle: "Hollywood Star spotted at local cafe",
    sourceUrl: "https://example.com/star-spotted",
    sourceDescription: "An anonymous source tells us that the famous Oscar-winning actress was spotted eating at a local organic cafe in Los Angeles yesterday morning. She was seen laughing and discussing what appeared to be a script with an indie director. Observers noted she was dressed in casual couture and wearing high-end smart spectacles. Representatives declined to comment.",
    writerId: "joan-fashion",
    niche: "hollywood",
    opportunityScore: 85,
    riskScore: 1,
    targetLength: "medium",
    targetSubstyle: "standard"
  };

  try {
    console.log("Sending POST request to /api/articles/create...");
    const response = await fetch("http://localhost:3000/api/articles/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log(`Response Status: ${response.status}`);
    
    let buffer = "";
    response.body.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          console.log("STEP:", obj.step);
          console.log("LOG:", obj.log);
          if (obj.detail) {
            console.log("DETAIL:", JSON.stringify(obj.detail, null, 2));
          }
        } catch (e) {
          console.log("RAW LINE:", line);
        }
      }
    });

    response.body.on("end", () => {
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          console.log("FINAL CHUNK:", obj);
        } catch (e) {
          console.log("RAW END:", buffer);
        }
      }
      console.log("Stream ended.");
    });
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

run();
