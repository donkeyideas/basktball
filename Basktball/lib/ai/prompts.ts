// AI Content Generation Prompts

export const SYSTEM_PROMPTS = {
  // Base system prompt for all basketball content
  base: `You are an expert basketball analyst and sports writer for Basktball.com.
You write engaging, data-driven content about basketball across NBA, WNBA, NCAA, and international leagues.
Your writing style is:
- Professional but accessible
- Data-focused with specific statistics
- Engaging and conversational
- Concise and impactful
Always cite specific statistics when available. Never make up statistics.`,

  // Game recap writer
  gameRecap: `You are a professional sports journalist writing game recaps for Basktball.com.
Your recaps should:
- Lead with the final score and key storyline
- Highlight top performers with specific stats
- Mention key moments or runs that decided the game
- Include relevant context (playoff implications, streaks, etc.)
- Be concise (2-3 paragraphs max)
Write in present tense for immediacy. Be factual and engaging.`,

  // Player analysis expert
  playerAnalysis: `You are a basketball analytics expert writing player analysis for Basktball.com.
Your analysis should:
- Focus on recent performance trends
- Use advanced metrics when relevant (PER, TS%, Usage Rate)
- Compare to season/career averages
- Identify strengths and areas of improvement
- Provide fantasy/betting relevance when appropriate
Be analytical but accessible to casual fans.`,

  // Betting insights analyst
  bettingInsights: `You are a sports betting analyst for Basktball.com.
Your insights should:
- Focus on statistical edges and trends
- Mention relevant ATS (against the spread) records
- Identify key matchups that could affect outcomes
- Note injury impacts on lines
- Be objective and data-driven
DISCLAIMER: Always remind readers that betting involves risk. Never guarantee outcomes.`,

  // Fantasy basketball expert
  fantasyTips: `You are a fantasy basketball expert for Basktball.com.
Your tips should:
- Identify high-value plays for DFS
- Highlight favorable matchups
- Note rest situations and back-to-backs
- Include projected stats when relevant
- Suggest sleeper picks with reasoning
Focus on actionable advice for both cash games and tournaments.`,

  // Game preview writer
  gamePreview: `You are a professional sports journalist writing game previews for Basktball.com.
Your previews should:
- Build excitement for the upcoming matchup
- Highlight key players to watch from both teams
- Mention recent team form and head-to-head records if relevant
- Discuss potential storylines and what to watch for
- Be engaging and informative (2-3 paragraphs max)
Write with enthusiasm while remaining factual and analytical.`,

  // Trending story writer
  trending: `You are a basketball journalist writing trending stories for Basktball.com.
Your stories should:
- Cover the most talked-about topics in basketball
- Provide context and analysis, not just news
- Include relevant statistics and quotes
- Be engaging and shareable
- Have a clear angle or perspective
Write with authority but remain objective.`,
};

// Content generation prompt templates
export const PROMPT_TEMPLATES = {
  gameRecap: (game: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    topPerformers: Array<{ name: string; stats: string }>;
    keyMoments?: string[];
    context?: string;
  }) => `Write a game recap for the following basketball game:

**Final Score:** ${game.awayTeam} ${game.awayScore} - ${game.homeTeam} ${game.homeScore}

**Top Performers:**
${game.topPerformers.map((p) => `- ${p.name}: ${p.stats}`).join("\n")}

${game.keyMoments ? `**Key Moments:**\n${game.keyMoments.map((m) => `- ${m}`).join("\n")}` : ""}

${game.context ? `**Context:** ${game.context}` : ""}

Write a 2-3 paragraph recap that captures the essence of this game.`,

  playerAnalysis: (player: {
    name: string;
    team: string;
    position: string;
    recentStats: string;
    seasonAverages: string;
    careerAverages?: string;
    context?: string;
  }) => `Write an analysis of the following player's recent performance:

**Player:** ${player.name}
**Team:** ${player.team}
**Position:** ${player.position}

**Recent Game Stats:** ${player.recentStats}
**Season Averages:** ${player.seasonAverages}
${player.careerAverages ? `**Career Averages:** ${player.careerAverages}` : ""}

${player.context ? `**Context:** ${player.context}` : ""}

Write a 2-paragraph analysis of this player's recent performance and what to expect going forward.`,

  bettingInsights: (game: {
    homeTeam: string;
    awayTeam: string;
    spread: string;
    overUnder: string;
    homeRecord: string;
    awayRecord: string;
    homeAtsRecord?: string;
    awayAtsRecord?: string;
    injuries?: string[];
    trends?: string[];
  }) => `Provide betting insights for the following upcoming game:

**Matchup:** ${game.awayTeam} @ ${game.homeTeam}
**Spread:** ${game.spread}
**Over/Under:** ${game.overUnder}

**Records:**
- ${game.homeTeam}: ${game.homeRecord}${game.homeAtsRecord ? ` (ATS: ${game.homeAtsRecord})` : ""}
- ${game.awayTeam}: ${game.awayRecord}${game.awayAtsRecord ? ` (ATS: ${game.awayAtsRecord})` : ""}

${game.injuries ? `**Injuries:** ${game.injuries.join(", ")}` : ""}

${game.trends ? `**Trends:**\n${game.trends.map((t) => `- ${t}`).join("\n")}` : ""}

Provide 2-3 key insights for bettors to consider. Include a disclaimer about betting risk.`,

  fantasyTips: (slate: {
    date: string;
    topPlays: Array<{ name: string; salary: string; matchup: string; projection?: string }>;
    valueTargets: Array<{ name: string; salary: string; reason: string }>;
    fades: Array<{ name: string; reason: string }>;
  }) => `Provide fantasy basketball tips for the following DFS slate:

**Date:** ${slate.date}

**Top Plays:**
${slate.topPlays.map((p) => `- ${p.name} ($${p.salary}) vs ${p.matchup}${p.projection ? ` - Proj: ${p.projection}` : ""}`).join("\n")}

**Value Targets:**
${slate.valueTargets.map((p) => `- ${p.name} ($${p.salary}) - ${p.reason}`).join("\n")}

**Potential Fades:**
${slate.fades.map((p) => `- ${p.name} - ${p.reason}`).join("\n")}

Write a fantasy breakdown with specific recommendations for cash games and tournaments.`,

  trending: (topic: {
    headline: string;
    summary: string;
    keyStats?: string[];
    quotes?: string[];
    context?: string;
  }) => `Write a trending story about the following basketball topic:

**Headline:** ${topic.headline}
**Summary:** ${topic.summary}

${topic.keyStats ? `**Key Stats:**\n${topic.keyStats.map((s) => `- ${s}`).join("\n")}` : ""}

${topic.quotes ? `**Quotes:**\n${topic.quotes.map((q) => `"${q}"`).join("\n")}` : ""}

${topic.context ? `**Context:** ${topic.context}` : ""}

Write a 3-4 paragraph story that covers this topic with analysis and insight.`,

  // Game preview
  gamePreview: (game: {
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    homeRecord?: string;
    awayRecord?: string;
    homeKeyPlayers?: string[];
    awayKeyPlayers?: string[];
    context?: string;
  }) => `Write a preview for the following upcoming basketball game:

**Matchup:** ${game.awayTeam} @ ${game.homeTeam}
**Date:** ${game.gameDate}

${game.homeRecord ? `**${game.homeTeam} Record:** ${game.homeRecord}` : ""}
${game.awayRecord ? `**${game.awayTeam} Record:** ${game.awayRecord}` : ""}

${game.homeKeyPlayers ? `**${game.homeTeam} Key Players:** ${game.homeKeyPlayers.join(", ")}` : ""}
${game.awayKeyPlayers ? `**${game.awayTeam} Key Players:** ${game.awayKeyPlayers.join(", ")}` : ""}

${game.context ? `**Context:** ${game.context}` : ""}

Write a 2-3 paragraph preview that builds excitement and highlights what to watch for in this game.`,

  // Quick stat summary
  quickStats: (player: {
    name: string;
    stats: Record<string, number | string>;
  }) => `Summarize the following player stats in one engaging sentence:

**Player:** ${player.name}
**Stats:** ${Object.entries(player.stats)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ")}

Write ONE sentence that captures the essence of this performance.`,

  // Game prediction
  gamePrediction: (game: {
    homeTeam: string;
    awayTeam: string;
    homeRecord: string;
    awayRecord: string;
    homeStats: string;
    awayStats: string;
    injuries?: string[];
    context?: string;
  }) => `Predict the outcome of the following game:

**Matchup:** ${game.awayTeam} (${game.awayRecord}) @ ${game.homeTeam} (${game.homeRecord})

**Team Stats:**
- ${game.homeTeam}: ${game.homeStats}
- ${game.awayTeam}: ${game.awayStats}

${game.injuries ? `**Injuries:** ${game.injuries.join(", ")}` : ""}
${game.context ? `**Context:** ${game.context}` : ""}

Provide:
1. Your predicted winner
2. Predicted score
3. Confidence level (low/medium/high)
4. Key factor that will decide the game

Format as JSON: {"winner": "", "score": "", "confidence": "", "keyFactor": ""}`,
};

// Token limits by content type
export const TOKEN_LIMITS = {
  gameRecap: 400,
  gamePreview: 400,
  playerAnalysis: 350,
  bettingInsights: 300,
  fantasyTips: 400,
  trending: 500,
  quickStats: 50,
  gamePrediction: 200,
};

// Temperature settings by content type
export const TEMPERATURE_SETTINGS = {
  gameRecap: 0.7,
  gamePreview: 0.7,
  playerAnalysis: 0.6,
  bettingInsights: 0.5, // More factual
  fantasyTips: 0.6,
  trending: 0.8, // More creative
  quickStats: 0.5,
  gamePrediction: 0.5, // More analytical
};
