import { NicheType } from '../types';

export interface CatalogFeed {
  id: string;
  name: string;
  url: string;
  niche: NicheType;
  description: string;
  rank: number;
}

export const RSS_CATALOG: CatalogFeed[] = [
  // TECH NICHE
  {
    id: "cat-tech-tc",
    name: "TechCrunch Innovations",
    url: "https://feeds.feedburner.com/TechCrunch/",
    niche: "tech",
    description: "Startup profiles, Silicon Valley deal-flow and raw venture analysis.",
    rank: 1
  },
  {
    id: "cat-tech-verge",
    name: "The Verge Tech Index",
    url: "https://www.theverge.com/rss/index.xml",
    niche: "tech",
    description: "Sleek coverage on consumer technology trends, culture, and science.",
    rank: 2
  },
  {
    id: "cat-tech-wired",
    name: "Wired Technology",
    url: "https://www.wired.com/feed/rss",
    niche: "tech",
    description: "Deep narrative journalism on cybersecurity, artificial intelligence, and digital sociology.",
    rank: 3
  },
  {
    id: "cat-tech-hn",
    name: "Hacker News RSS",
    url: "https://news.ycombinator.com/rss",
    niche: "tech",
    description: "The intellectual digital town square for computer science, startups, and systems.",
    rank: 4
  },
  {
    id: "cat-tech-eng",
    name: "Engadget Gear",
    url: "https://www.engadget.com/rss.xml",
    niche: "tech",
    description: "Granular hardware reviews and rapid consumer electronics announcements.",
    rank: 5
  },
  {
    id: "cat-tech-giz",
    name: "Gizmodo Space & Science",
    url: "https://gizmodo.com/rss",
    niche: "tech",
    description: "Futurism, technological reviews, and cultural criticism of digital systems.",
    rank: 6
  },
  {
    id: "cat-tech-ars",
    name: "Ars Technica OS & Tech",
    url: "https://feeds.feedburner.com/arstechnica/index",
    niche: "tech",
    description: "Heavy scientific peer-reviews, system architecture, and tech policy.",
    rank: 7
  },
  {
    id: "cat-tech-vb",
    name: "VentureBeat Intelligence",
    url: "https://venturebeat.com/feed/",
    niche: "tech",
    description: "Enterprise tech metrics, deep learning integration, and AI industry funding.",
    rank: 8
  },
  {
    id: "cat-tech-mr",
    name: "MacRumors Core",
    url: "https://feeds.macrumors.com/MacRumors-All",
    niche: "tech",
    description: "Comprehensive tracking of Apple's global hardware roadmap and gossip.",
    rank: 9
  },
  {
    id: "cat-tech-ap",
    name: "Android Police Hub",
    url: "https://www.androidpolice.com/feed/",
    niche: "tech",
    description: "Deconstructs Android systems, smartphone hardware, and software builds.",
    rank: 10
  },
  {
    id: "cat-tech-95m",
    name: "9to5Mac Apple Insider",
    url: "https://9to5mac.com/feed/",
    niche: "tech",
    description: "Premium daily leaks, spec sheets, and operating system overviews.",
    rank: 11
  },
  {
    id: "cat-tech-mash",
    name: "Mashable Digital Culture",
    url: "https://mashable.com/feed/",
    niche: "tech",
    description: "Fast-moving internet phenomena, social apps, and tech design.",
    rank: 12
  },
  {
    id: "cat-tech-rw",
    name: "ReadWrite Connected",
    url: "https://readwrite.com/feed/",
    niche: "tech",
    description: "Internet of Things, dynamic connected systems, and tech tutorials.",
    rank: 13
  },
  {
    id: "cat-tech-zd",
    name: "ZDNet Business Tech",
    url: "https://www.zdnet.com/news/rss.xml",
    niche: "tech",
    description: "IT strategy, enterprise software scaling, and computing indices.",
    rank: 14
  },
  {
    id: "cat-tech-sd",
    name: "Slashdot Systems Feed",
    url: "https://rss.slashdot.org/Slashdot/slashdotMain",
    niche: "tech",
    description: "Open-source projects, hardware architecture, and geek community logs.",
    rank: 15
  },
  {
    id: "cat-tech-cnet",
    name: "CNET News Central",
    url: "https://www.cnet.com/rss/news/",
    niche: "tech",
    description: "Expert product reviews, smart home guides, and high-frequency news.",
    rank: 16
  },
  {
    id: "cat-tech-tr",
    name: "TechRadar Global Spectator",
    url: "https://www.techradar.com/rss",
    niche: "tech",
    description: "DeepSpec comparisons of notebooks, flagships, and computing peripherals.",
    rank: 17
  },
  {
    id: "cat-tech-trp",
    name: "TechRepublic Enterprise IT",
    url: "https://www.techrepublic.com/rssfeeds/articles/",
    niche: "tech",
    description: "SaaS evaluations, network security protocols, and server infrastructure.",
    rank: 18
  },
  {
    id: "cat-tech-dt",
    name: "Digital Trends Matrix",
    url: "https://www.digitaltrends.com/feed/",
    niche: "tech",
    description: "Streaming setup recommendations, smart screens, and home cinema design.",
    rank: 19
  },
  {
    id: "cat-tech-gw",
    name: "GeekWire Pacific Tech",
    url: "https://www.geekwire.com/feed/",
    niche: "tech",
    description: "Pacific Northwest technology ecosystems, cloud titans, and innovation.",
    rank: 20
  },

  // SPORTS NICHE
  {
    id: "cat-sports-espn",
    name: "ESPN Global Scoreboard",
    url: "https://www.espn.com/espn/rss/news",
    niche: "sports",
    description: "Global league scores, transaction pipelines, and championship analytics.",
    rank: 1
  },
  {
    id: "cat-sports-nyt",
    name: "NYT Athletic Reports",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
    niche: "sports",
    description: "Pulitzer-grade longform sports sociology and investigative game logs.",
    rank: 2
  },
  {
    id: "cat-sports-ys",
    name: "Yahoo Sports Headlines",
    url: "https://sports.yahoo.com/rss/",
    niche: "sports",
    description: "High-frequency trade leaks, expert power rankings, and fantasy analyses.",
    rank: 3
  },
  {
    id: "cat-sports-cbs",
    name: "CBS Sports Network",
    url: "https://www.cbssports.com/rss/headlines",
    niche: "sports",
    description: "NCAA tracking, NFL draft specs, and professional golf tournament cards.",
    rank: 4
  },
  {
    id: "cat-sports-nbc",
    name: "NBC Sports Arena",
    url: "https://sports.nbcsports.com/feed/",
    niche: "sports",
    description: "Premier League analysis, Olympic trials, and NFL locker room dynamics.",
    rank: 5
  },
  {
    id: "cat-sports-br",
    name: "Bleacher Report Stream",
    url: "https://bleacherreport.com/articles/feed",
    niche: "sports",
    description: "Sports culture trends, sneaker drops, and fan community speculations.",
    rank: 6
  },
  {
    id: "cat-sports-fifa",
    name: "FIFA Global Soccer Index",
    url: "https://www.fifa.com/rss/index.xml",
    niche: "sports",
    description: "International football rankings, World Cup roadmaps, and global fixtures.",
    rank: 7
  },
  {
    id: "cat-sports-ts",
    name: "TalkSport Pitch Analysis",
    url: "https://talksport.com/feed/",
    niche: "sports",
    description: "Premier League transfer talk, boxing ringside briefings, and pundit panels.",
    rank: 8
  },
  {
    id: "cat-sports-skys",
    name: "Sky Sports Premier League",
    url: "https://www.skysports.com/rss/12040",
    niche: "sports",
    description: "Definitive European football analysis, tactical previews, and expert columns.",
    rank: 9
  },
  {
    id: "cat-sports-pft",
    name: "ProFootballTalk Gridiron",
    url: "https://profootballtalk.nbcsports.com/feed/",
    niche: "sports",
    description: "Unfiltered NFL contract negotiation news, injury tables, and trade whispers.",
    rank: 10
  },
  {
    id: "cat-sports-rgm",
    name: "RealGM Court-Wiretap",
    url: "https://basketball.realgm.com/rss/wiretap/0.xml",
    niche: "sports",
    description: "Raw NBA court transactions, minor league call-ups, and G-League briefs.",
    rank: 11
  },
  {
    id: "cat-sports-mlbtr",
    name: "MLB Trade Rumors Pipeline",
    url: "https://www.mlbtraderumors.com/feed",
    niche: "sports",
    description: "Every Single asset transaction, arbitration dispute, and salary spreadsheet in MLB.",
    rank: 12
  },
  {
    id: "cat-sports-sbn",
    name: "SB Nation Sports Guild",
    url: "https://www.sbnation.com/rss/index.xml",
    niche: "sports",
    description: "Team-by-team local fan reactions, visual sports comedy, and historic essays.",
    rank: 13
  },
  {
    id: "cat-sports-sn",
    name: "Sporting News Grid",
    url: "https://www.sportingnews.com/us/rss",
    niche: "sports",
    description: "Playoff predictors, draft board updates, and professional fight cards.",
    rank: 14
  },
  {
    id: "cat-sports-si",
    name: "Sports Illustrated Showcase",
    url: "https://www.si.com/.rss/full/",
    niche: "sports",
    description: "Legendary athlete portraits, deep-dive features, and sporting heritage review.",
    rank: 15
  },
  {
    id: "cat-sports-ds",
    name: "Deadspin Sports Critique",
    url: "https://deadspin.com/rss",
    niche: "sports",
    description: "No-holds-barred critiques of sporting executives, stadium politics, and culture.",
    rank: 16
  },
  {
    id: "cat-sports-gc",
    name: "Golf Channel Leaderboards",
    url: "https://www.golfchannel.com/feed",
    niche: "sports",
    description: "PGA tour card configurations, swing breakdown analytics, and major news.",
    rank: 17
  },
  {
    id: "cat-sports-mma",
    name: "MMA Fighting Ring",
    url: "https://www.mmafighting.com/rss/index.xml",
    niche: "sports",
    description: "Octagon matches, pre-fight weigh-ins, contract spats, and division ranks.",
    rank: 18
  },
  {
    id: "cat-sports-rwld",
    name: "Runner's World Endurance",
    url: "https://www.runnersworld.com/rss",
    niche: "sports",
    description: "High-mileage carbon shoe specs, marathon training sciences, and recovery logs.",
    rank: 19
  },
  {
    id: "cat-sports-f1",
    name: "Formula 1 Paddock",
    url: "https://www.formula1.com/content/fom-website/en/latest/all.xml",
    niche: "sports",
    description: "Telemetry updates, aerodynamic upgrade analyses, and paddock interview transcripts.",
    rank: 20
  },

  // HOLLYWOOD NICHE
  {
    id: "cat-hollywood-thr",
    name: "The Hollywood Reporter",
    url: "https://feeds.feedburner.com/thr/news",
    niche: "hollywood",
    description: "Definitive box office economics, labor disputes, and awards tracking.",
    rank: 1
  },
  {
    id: "cat-hollywood-tmz",
    name: "TMZ Celebrity Wire",
    url: "https://www.tmz.com/rss.xml",
    niche: "hollywood",
    description: "Aggressive, high-speed celebrity tracking, video leaks, and legal affairs.",
    rank: 2
  },
  {
    id: "cat-hollywood-var",
    name: "Variety Studio Insider",
    url: "https://variety.com/feed/",
    niche: "hollywood",
    description: "Production greenlights, executive shuffles, indie studio acquisitions.",
    rank: 3
  },
  {
    id: "cat-hollywood-ppl",
    name: "People Celebrity Daily",
    url: "https://people.com/celebrity/rss",
    niche: "hollywood",
    description: "Exclusive luxury weddings, positive star portraits, and domestic life columns.",
    rank: 4
  },
  {
    id: "cat-hollywood-eon",
    name: "E! Online Red Carpet",
    url: "https://www.eonline.com/rss",
    niche: "hollywood",
    description: "Sartorial gala evaluations, style upgrades, and award show schedules.",
    rank: 5
  },
  {
    id: "cat-hollywood-ew",
    name: "Entertainment Weekly Spec",
    url: "https://ew.com/feed/",
    niche: "hollywood",
    description: "Aesthetic series casting news, show timelines, and cinematic reviews.",
    rank: 6
  },
  {
    id: "cat-hollywood-per",
    name: "Gossipy Hollywood Insider",
    url: "https://perezhilton.com/feed/",
    niche: "hollywood",
    description: "Juicy gossip columns, social-media feud transcriptions, and star spats.",
    rank: 7
  },
  {
    id: "cat-hollywood-dl",
    name: "Deadline Studio-Leads",
    url: "https://deadline.com/feed/",
    niche: "hollywood",
    description: "Unfiltered entertainment deals, festival lineups, and showrunner announcements.",
    rank: 8
  },
  {
    id: "cat-hollywood-usw",
    name: "US Weekly Star-File",
    url: "https://www.usmagazine.com/feed/",
    niche: "hollywood",
    description: "Daily star interactions, style diaries, and luxury beach sightings.",
    rank: 9
  },
  {
    id: "cat-hollywood-et",
    name: "Entertainment Tonight Daily",
    url: "https://www.etonline.com/news/rss",
    niche: "hollywood",
    description: "Behind-the-scenes set visits, video interviews, and premier calendars.",
    rank: 10
  },
  {
    id: "cat-hollywood-pop",
    name: "PopSugar Celebrity Bubble",
    url: "https://www.popsugar.com/feed",
    niche: "hollywood",
    description: "Wellness trends, physical hacks of influencers, and star fashion edits.",
    rank: 11
  },
  {
    id: "cat-hollywood-hmg",
    name: "Hello! Magazine Royals",
    url: "https://www.hellomagazine.com/rss.xml",
    niche: "hollywood",
    description: "Royal family portraits, luxury estate walkthroughs, and high-society galas.",
    rank: 12
  },
  {
    id: "cat-hollywood-jj",
    name: "Just Jared Street Style",
    url: "https://www.justjared.com/feed/",
    niche: "hollywood",
    description: "High-resolution candid photos, movie shoot set captures, and star specs.",
    rank: 13
  },
  {
    id: "cat-hollywood-cos",
    name: "Cosmopolitan Star Life",
    url: "https://www.cosmopolitan.com/rss",
    niche: "hollywood",
    description: "Gossip columns, dating trends, pop-culture icons, and fashion checklists.",
    rank: 14
  },
  {
    id: "cat-hollywood-psix",
    name: "Page Six Manhattan VIP",
    url: "https://pagesix.com/feed/",
    niche: "hollywood",
    description: "Exclusive New York nightclub sightings, luxury penthouse deal-flows, and feuds.",
    rank: 15
  },
  {
    id: "cat-hollywood-itw",
    name: "InTouch Weekly News",
    url: "https://www.intouchweekly.com/feed/",
    niche: "hollywood",
    description: "Tabloid spec maps, breakups, exclusive family reports, and retro retrospectives.",
    rank: 16
  },
  {
    id: "cat-hollywood-dm",
    name: "Daily Mail Showbiz",
    url: "https://www.dailymail.co.uk/tvshowbiz/index.rss",
    niche: "hollywood",
    description: "Worldwide breaking star paparazzi runs, relationship gossip, and reality show briefs.",
    rank: 17
  },
  {
    id: "cat-hollywood-ro",
    name: "Radar Online Investigations",
    url: "https://radaronline.com/feed/",
    niche: "hollywood",
    description: "Star lawsuits, real-estate court records, and investigative tabloid reporting.",
    rank: 18
  },
  {
    id: "cat-hollywood-rs",
    name: "Rolling Stone Culture",
    url: "https://www.rollingstone.com/feed/",
    niche: "hollywood",
    description: "Music charts, celebrity covers, cinema reviews, and digital culture insights.",
    rank: 19
  },
  {
    id: "cat-hollywood-mtv",
    name: "MTV News Room",
    url: "https://www.rollingstone.com/feed/", // Fallback feed because MTV general RSS changed
    niche: "hollywood",
    description: "Modern star interviews, viral albums, and reality TV updates.",
    rank: 20
  },
  // TRAVELING NICHE
  {
    id: "cat-travel-skift",
    name: "Skift",
    url: "https://skift.com/feed/",
    niche: "traveling",
    description: "Travel business, airlines, hotels, and industry-defining tourism trends.",
    rank: 3
  },
  {
    id: "cat-travel-cnt",
    name: "Condé Nast Traveler",
    url: "https://www.cntraveler.com/feed/rss",
    niche: "traveling",
    description: "Luxury travel, pristine destinations, hotels, and expert travel guides.",
    rank: 4
  },
  {
    id: "cat-travel-tl",
    name: "Travel + Leisure",
    url: "https://www.travelandleisure.com/feed",
    niche: "traveling",
    description: "Travel inspiration, exotic destinations, hotel directories, and professional packing tips.",
    rank: 5
  },
  {
    id: "cat-travel-tpg",
    name: "The Points Guy",
    url: "https://thepointsguy.com/feed",
    niche: "traveling",
    description: "Flight deals, loyalty award programs, and credit-card travel hacking.",
    rank: 6
  },
  {
    id: "cat-travel-pulse",
    name: "TravelPulse",
    url: "https://www.travelpulse.com/rss/traveling.xml",
    niche: "traveling",
    description: "Travel agent news, destinations, cruise lines, and local hotel coverage.",
    rank: 7
  },
  {
    id: "cat-travel-lp",
    name: "Lonely Planet Articles",
    url: "https://www.lonelyplanet.com/news/rss",
    niche: "traveling",
    description: "Destination guides and practical, authentic travel ideas.",
    rank: 8
  },
  {
    id: "cat-travel-frommers",
    name: "Frommer’s",
    url: "https://www.frommers.com/rss",
    niche: "traveling",
    description: "Classic travel advice, hotel reviews, budget guides, and destination tips.",
    rank: 9
  },
  {
    id: "cat-travel-rick",
    name: "Rick Steves",
    url: "https://www.ricksteves.com/rss/podcast",
    niche: "traveling",
    description: "Europe travel, culture, practical travel tips, and guidebooks.",
    rank: 10
  }
];
