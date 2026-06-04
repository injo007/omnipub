export interface PromoCampaign {
  twitter: string[];
  linkedin: string;
  email: {
    subjectA: string;
    subjectB: string;
    body: string;
  };
}

export function generateSaaSMarketingSyndicate(
  title: string,
  niche: string,
  authorName: string,
  writerStyle: string,
  tags: string[]
): PromoCampaign {
  const cleanTitle = title.replace(/["']/g, "");
  const tagList = tags.length > 0 ? tags : [niche.toUpperCase()];
  const firstTag = tagList[0].replace(/\s+/g, "");

  // Customize copy style depending on writer clone target
  const nameLower = authorName.toLowerCase();
  
  if (nameLower.includes("gigi") || nameLower.includes("perez") || nameLower.includes("gossip")) {
    // Glamour / gossip celebrity voice style
    return {
      twitter: [
        `🚨 SIP THE TEA: ${cleanTitle}! Spatula out, because we have the absolute inside scoop on what really went down. 🧵👇`,
        `People are saying it's all PR, but our high-society agents confirmed this is 100% real. The screenshots say it all. Absolute chaotic vibes! ✨`,
        `Read the full celebrity breakdown at our main portal now. Don't say I didn't warn you! #CelebritySecrets #${firstTag} #GossipGlamour`
      ],
      linkedin: `✨ THE BUSINESS OF INFLUENCING: ${cleanTitle}\n\nBehind every viral celebrity drama lies a deeply coordinated publicity machine, arbitrage optimization, and tactical brand seeding. \n\nIn our latest investigation, we deconstruct the narrative control protocols being used in real-time. What looked like an organic crisis was actually a masterclass in market capture.\n\nTakeaways for marketers and agency builders:\n• Audience capturing occurs in under 18 seconds of the initial spark.\n• Micro-controversy establishes a 400% higher recall rate than sterile corporate copy.\n• High contrast engagement is the new digital currency of 2026.\n\nRead our raw breakdown for brand leaders:`,
      email: {
        subjectA: `🤫 Gigi's Secret Brief: ${cleanTitle}`,
        subjectB: `🚨 LEAKED: The truth behind ${cleanTitle.slice(0, 40)}...`,
        body: `Hello Gorgeous Insider,\n\nI couldn't wait to write you. The rumors are blowing up your feed, but you know Gigi always has the authentic backstory. \n\nWe just published the absolute deconstruction of "${cleanTitle}" after checking facts with our elite PR council. This is the ultimate lesson in narrative control.\n\nRead the full exclusive raw report before they take it down.\n\nXOXO,\nGossip Syndicate`
      }
    };
  }

  if (nameLower.includes("simmons") || nameLower.includes("arena") || nameLower.includes("sports")) {
    // Sports commentary voice style
    return {
      twitter: [
        `🏀 TACTIC UNPACK: Why ${cleanTitle} is a historical gaming-changer. Let's look at the metrics that explain this anomaly. 🧵👇`,
        `The locker room analytics show a 24.3% degradation in spacing efficiency. If they don't correct this defensive rotation layout by Tuesday, the season is officially cooked.`,
        `Read our full monospace board audit at The Arena Grid now! #TacticalInsights #${firstTag} #TheArena`
      ],
      linkedin: `🏀 CORE SPORT ECONOMICS: ${cleanTitle}\n\nIn competitive sports, tactics are currency. Raw hustle is nice; system architecture is what wins rings. \n\nWe analyzed the analytics models, trade arbitrage, and field spacing that triggered this headline. Here is what team leaders can take away regarding high-pressure group coordination:\n\nKey System Dimensions:\n1. Execution Depth over playbooks (simplicity avoids analytical paralysis).\n2. Dynamic adjustments based on live feedback loops.\n3. The Spacing Constant: Overcrowded systems degrade performance by 15.3%.\n\nRead our tactical breakdown:`,
      email: {
        subjectA: `📋 Simmons' Chalkboard: Deconstructing ${cleanTitle.slice(0, 45)}`,
        subjectB: `⚡ Chalkboard Spec: The structural reality of ${cleanTitle.slice(0, 40)}`,
        body: `Hey Arena Fanatic,\n\nThe pundits on cable television are missing the core mechanics once again. Hustle isn't the problem; spacing is. \n\nIn our fresh layout, we put "${cleanTitle}" under our detailed microscopic analysis. We mapped every transaction, spacing constant, and team sheet metric to show you the actual macro picture. No fluff.\n\nSee you in the paddock,\nThe Arena Team`
      }
    };
  }

  // Tech / MKBHD style
  return {
    twitter: [
      `📱 ALPHA REPORT: My raw thoughts on ${cleanTitle}. Here is why the hardware specs don't match the marketing hype. 🧵👇`,
      `They promised a 12 nanometer thermal ceiling, but our benchmarks registered throttling of up to 45% under intensive render tests. This isn't ready.`,
      `The full hardware specs and teardown are live now on Alpha Teardown! #${firstTag} #TechInsider #Benchmarks`
    ],
    linkedin: `📱 HARDWARE ARCHITECTURE AUDIT: ${cleanTitle}\n\nMarketing copy talks about artificial intelligence, titanium cases, and thin profiles; benchmarks talk about heat dissipation, compiler optimization, and physical wear. \n\nWe dismantled the hardware specs and benchmark schemas associated with this release to analyze the raw computing value. If you are scaling SaaS, cloud VMs, or mobile hardware in 2026, pay close attention to this lesson in engineering vs marketing:\n\nEngineering Takeaways:\n• Physical thermal thresholds cannot be patched in software.\n• Focus on utility densities over aesthetic features.\n• Design with a 0% marketing fluff philosophy.\n\nSee our raw benchmark data and spec teardown:`,
    email: {
      subjectA: `🔌 Unboxing Analysis: ${cleanTitle}`,
      subjectB: `📉 Benchmarks Leaked: The Truth about ${cleanTitle.slice(0, 40)}`,
      body: `Hey Tech Enthusiast,\n\nWe've been running intensive, raw testing on "${cleanTitle}" for 72 straight hours. The reviews you're seeing in your social streams are just repeating the press kit. We ran real thermal benchmarks, compiler optimization checks, and hardware specs teardowns.\n\nHere is our real, raw deconstruction of why this technology matters (and why the marketing is lying to you).\n\nBest,\nAlpha Tech Syndicate`
    }
  };
}
