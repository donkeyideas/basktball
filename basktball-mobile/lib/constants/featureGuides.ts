export type FeatureVariant = 'court' | 'fire' | 'challenge' | 'poll' | 'score' | 'tool' | 'standard';

export interface FeatureItem {
  title: string;
  description: string;
  route: string;
  variant: FeatureVariant;
  category: 'social' | 'data' | 'tools';
}

export interface FeatureGuide extends FeatureItem {
  tagline: string;
  howItWorks: string[];
  highlights: string[];
  exampleTitle: string;
  exampleContent: string;
}

export const FEATURE_GUIDES: FeatureGuide[] = [
  // ─── LIVE BASKETBALL DATA ───
  {
    title: 'Live Scores',
    description: 'Real-time scores for NBA, WNBA, and NCAA games. Box scores, player stats, and game details updated every 30 seconds.',
    route: '/(tabs)/scores',
    variant: 'score',
    category: 'data',
    tagline: 'Every game. Every score. Updated every 30 seconds.',
    howItWorks: [
      'Open the Scores tab to see today\'s games across NBA, WNBA, and NCAA.',
      'Live games show real-time scores with quarter and clock info.',
      'Tap any game to see the full box score with individual player stats.',
      'Browse upcoming games, live action, and final results all in one place.',
    ],
    highlights: [
      'Multi-league support: NBA, WNBA, NCAA Men\'s, NCAA Women\'s',
      'Auto-refreshing scores updated every 30 seconds',
      'Full box scores with player-by-player breakdowns',
      'Date navigation to browse past and future games',
    ],
    exampleTitle: 'Game Night',
    exampleContent: 'Lakers 108 - Celtics 104, 4th Quarter, 2:34 remaining. LeBron: 32 PTS, 8 REB, 7 AST. Tatum: 28 PTS, 9 REB. Tap to see the full box score.',
  },
  {
    title: 'Standings',
    description: 'Conference standings with win-loss records, streaks, playoff positioning, and play-in race tracking.',
    route: '/(tabs)/scores',
    variant: 'score',
    category: 'data',
    tagline: 'The race for the playoffs. Every seed. Every game matters.',
    howItWorks: [
      'View current standings for NBA, WNBA, or NCAA leagues.',
      'Toggle between Eastern Conference, Western Conference, or both.',
      'See W-L records, win percentage, games behind, streaks, and last 10 games.',
      'Playoff cutoff lines show which teams are in, in the play-in, or out.',
    ],
    highlights: [
      'Playoff and play-in cutoff lines clearly marked',
      'Home and away records for every team',
      'Current streak tracking (W/L notation)',
      'Conference and division breakdowns',
    ],
    exampleTitle: 'Playoff Race',
    exampleContent: 'Eastern Conference: #1 Celtics (58-24), #6 Cavaliers (48-34) -- playoff cutoff. #7 Pacers (47-35), #10 Bulls (39-43) -- play-in range. Every game counts.',
  },
  {
    title: 'Schedule',
    description: 'Weekly game schedule with live scores, tipoff times, and broadcast info across all leagues.',
    route: '/(tabs)/scores',
    variant: 'score',
    category: 'data',
    tagline: 'Plan your week. Never miss tip-off.',
    howItWorks: [
      'View a 7-day calendar of games across NBA, WNBA, and NCAA.',
      'Navigate between weeks with previous/next buttons.',
      'Live games show real-time scores with a pulsing indicator.',
      'See tipoff times and broadcast network info for scheduled games.',
    ],
    highlights: [
      'Weekly calendar view with day-by-day breakdown',
      'Live score integration for in-progress games',
      'Broadcast info shows which network is carrying each game',
      'Current day highlighted for quick reference',
    ],
    exampleTitle: 'This Week in Basketball',
    exampleContent: 'Tuesday: GSW @ LAL 7:30 PM (TNT), BOS @ MIL 9:00 PM (ESPN). Wednesday: 8 games on tap. Thursday: PHX @ DEN 8:00 PM (TNT). Plan your week.',
  },
  {
    title: 'Stats Leaders',
    description: 'Top 25 statistical leaders in points, rebounds, assists, steals, blocks, and shooting percentages.',
    route: '/(tabs)/scores',
    variant: 'score',
    category: 'data',
    tagline: 'The numbers don\'t lie. See who leads the league.',
    howItWorks: [
      'Browse the top 25 players in 7 stat categories.',
      'Toggle between PPG, RPG, APG, SPG, BPG, FG%, and 3P%.',
      'Top 3 leaders are highlighted with orange badges.',
      'Tap any player to see their full profile and career stats.',
    ],
    highlights: [
      'Seven stat categories covering every aspect of the game',
      'Top 3 players highlighted with special badges',
      'Games played shown alongside per-game averages',
      'Tap through to full player profiles',
    ],
    exampleTitle: 'Scoring Race',
    exampleContent: 'PPG Leaders: #1 Luka Doncic 33.9, #2 Giannis 31.5, #3 SGA 30.1. Tap any name to see their full stat line, shot chart, and game log.',
  },
  {
    title: 'Teams',
    description: 'Browse all 30 NBA teams, 12 WNBA teams, and hundreds of NCAA programs with rosters and stats.',
    route: '/(tabs)/scores',
    variant: 'standard',
    category: 'data',
    tagline: 'Every team. Every league. All in one place.',
    howItWorks: [
      'Browse teams across NBA, WNBA, NCAA Men\'s, and NCAA Women\'s.',
      'Filter by conference (Eastern or Western) or search by name.',
      'Teams are organized by division with logos and city names.',
      'Tap any team to see their roster, schedule, and detailed stats.',
    ],
    highlights: [
      'Multi-league support covering pro and college basketball',
      'Search by team name, city, or abbreviation',
      'Division grouping for easy conference browsing',
      'Full team detail pages with rosters and analytics',
    ],
    exampleTitle: 'Finding Your Team',
    exampleContent: 'NBA Western Conference, Pacific Division: Golden State Warriors, Los Angeles Lakers, LA Clippers, Phoenix Suns, Sacramento Kings. Tap to see rosters, stats, and schedules.',
  },
  {
    title: 'News',
    description: 'Basketball news from ESPN, The Athletic, and more. Covering NBA, WNBA, NCAA, and international leagues.',
    route: '/(tabs)/',
    variant: 'standard',
    category: 'data',
    tagline: 'Breaking news. Trade rumors. Every league covered.',
    howItWorks: [
      'Browse the latest basketball news from top sources.',
      'Articles are tagged by league: NBA, WNBA, NCAAM, NCAAW, European.',
      'Each article shows the headline, summary, source, and publication time.',
      'Tap to read the full article from the original source.',
    ],
    highlights: [
      'Multi-source aggregation from ESPN, The Athletic, and more',
      'Color-coded league badges for quick identification',
      'Relative timestamps show how fresh each article is',
      'Cover image previews for every story',
    ],
    exampleTitle: 'Breaking News',
    exampleContent: 'NBA | 2h ago: "Lakers exploring blockbuster trade for All-Star guard, sources say." -- via The Athletic. Tap to read the full report and drop your take on The Court.',
  },

  // ─── THE COURT (SOCIAL) ───
  {
    title: 'The Court',
    description: 'The social hub for basketball fans. Post takes, debate, vote, create polls, share GIFs, and @mention users.',
    route: '/(tabs)/court',
    variant: 'court',
    category: 'social',
    tagline: 'Step onto the court. Every take, every debate, every game.',
    howItWorks: [
      'Open The Court to see the latest takes from basketball fans worldwide.',
      'Post your own take -- share opinions on any game, player, or trade.',
      'React with Fire or Brick to boost or bury takes in the rankings.',
      'Attach GIFs, create polls, @mention users, and share links with auto-previews.',
    ],
    highlights: [
      'Real-time feed of basketball takes from the community',
      'Fire & Brick voting system surfaces the best content',
      'GIF picker, polls, @mentions, and link previews built in',
      'Reply threads for in-depth debates',
    ],
    exampleTitle: 'Game Night on the Court',
    exampleContent: '@HoopsFanatic42 posts: "LeBron is still the best player in the league and it\'s not even close." -- 89 Fires, 23 Bricks, 34 replies. The debate is ON.',
  },
  {
    title: 'Fire & Brick',
    description: 'The community-driven voting system. Fire the takes you love. Brick the ones you don\'t.',
    route: '/(tabs)/court',
    variant: 'fire',
    category: 'social',
    tagline: 'Light it up or lay a brick. You decide what rises.',
    howItWorks: [
      'See a take you agree with? Tap the fire icon to boost it.',
      'Disagree? Hit the brick to push it down the rankings.',
      'Takes with more fires rise to the top. Heavily bricked takes sink.',
      'Your votes shape what the community sees -- surface the best basketball takes.',
    ],
    highlights: [
      'One-tap voting on every take in the feed',
      'Fire and brick counts displayed on every post',
      'High-fire takes get surfaced to more users',
      'Community-driven curation -- no algorithm, just votes',
    ],
    exampleTitle: 'A Hot Take Gets Fired Up',
    exampleContent: '"Wemby is going to win MVP in his second season." -- 214 Fires, 67 Bricks. The people have spoken: this take is ON FIRE.',
  },
  {
    title: 'Challenges',
    description: 'Head-to-head debates between fans. Put your take against someone else\'s and let the community decide.',
    route: '/(tabs)/court',
    variant: 'challenge',
    category: 'social',
    tagline: 'Head-to-head. Fan vs. fan. Settle it on the court.',
    howItWorks: [
      'Challenge another user to a take-off on any basketball topic.',
      'Both sides post their take. The community votes on who had the better call.',
      'When the game is played or the outcome is decided, receipts get pulled.',
      'Winners earn bragging rights and build their win-loss record.',
    ],
    highlights: [
      'Direct fan-vs-fan matchups with community voting',
      'Challenge anyone on any basketball topic',
      'Win/loss records tracked on your profile',
      'Settled by the community -- no bias, just votes',
    ],
    exampleTitle: 'The Playoff Showdown',
    exampleContent: '@NBAExpert vs @CourtVision: "Who wins the Finals?" Lakers vs Celtics. 1,203 votes cast. Lakers lead 54% to 46%. The court has spoken.',
  },
  {
    title: 'Polls',
    description: 'Create community polls on any basketball debate. Up to 4 options, custom timer, live results.',
    route: '/(tabs)/court',
    variant: 'poll',
    category: 'social',
    tagline: 'Ask the court. Get the verdict.',
    howItWorks: [
      'Tap the compose button and select the POLL option.',
      'Add 2 to 4 options for the community to vote on.',
      'Set a duration from 1 hour to 7 days.',
      'Watch the results roll in as the community weighs in.',
    ],
    highlights: [
      'Create polls with up to 4 options',
      'Flexible duration from 1 hour to 7 days',
      'Live percentage updates as votes come in',
      'Integrated right into your take -- no separate page needed',
    ],
    exampleTitle: 'The MVP Debate',
    exampleContent: 'POLL: "Who should win MVP?" Jokic 38% | Luka 29% | SGA 22% | Giannis 11%. 2,847 votes. 6 hours remaining.',
  },

  // ─── TOOLS ───
  {
    title: 'Advanced Metrics',
    description: 'Deep dive into PER, TS%, VORP, BPM, Win Shares, and other advanced analytics with interactive calculators.',
    route: '/tools',
    variant: 'tool',
    category: 'tools',
    tagline: 'Beyond the box score. The analytics that matter.',
    howItWorks: [
      'Browse 8 advanced metrics with detailed explanations and formulas.',
      'Each metric includes a "What\'s Good?" benchmark guide.',
      'Use the interactive calculator to compute TS% and eFG% with custom inputs.',
      'See league leaders ranked by each advanced stat.',
    ],
    highlights: [
      'PER, TS%, eFG%, VORP, BPM, Win Shares, USG%, AST%',
      'Benchmark guides explain what good, average, and elite values look like',
      'Interactive shooting efficiency calculator',
      'Formula breakdowns for every metric',
    ],
    exampleTitle: 'Analytics Deep Dive',
    exampleContent: 'Nikola Jokic: PER 31.2 (Elite, >20 is excellent). TS% 64.1% (Elite, >60% is excellent). VORP 8.4 (MVP level, >6.0). The numbers say MVP.',
  },
  {
    title: 'Game Predictor',
    description: 'AI-powered game predictions using historical data, team form, home/away records, and player availability.',
    route: '/tools',
    variant: 'tool',
    category: 'tools',
    tagline: 'AI-powered predictions. Know the odds before tip-off.',
    howItWorks: [
      'Select home and away teams from the dropdown.',
      'The AI model analyzes historical matchups, current form, and player availability.',
      'Get win probability, predicted score, spread, and total projections.',
      'See the key factors driving each prediction with impact values.',
    ],
    highlights: [
      'Win probability with visual percentage bars',
      'Predicted final score, spread, and total',
      'Confidence rating color-coded by strength',
      'Key factor breakdown showing what drives the prediction',
    ],
    exampleTitle: 'Tonight\'s Matchup',
    exampleContent: 'Lakers vs Celtics: Win probability -- Celtics 62%, Lakers 38%. Predicted score: 112-105. Spread: Celtics -7. Confidence: 74% (High).',
  },
  {
    title: 'Fantasy Optimizer',
    description: 'Build and optimize your fantasy basketball lineup with salary cap management and value-based recommendations.',
    route: '/tools',
    variant: 'tool',
    category: 'tools',
    tagline: 'Maximize your lineup. Dominate your league.',
    howItWorks: [
      'Build your lineup with PG, SG, SF, PF, and C positions.',
      'Stay under the $50,000 salary cap with the real-time tracker.',
      'Sort players by value, projected points, or salary to find bargains.',
      'Use auto-optimize to generate the highest-value lineup instantly.',
    ],
    highlights: [
      'Real-time salary cap tracking as you build',
      'Player value metric (points per $1000) finds sleepers',
      'Position and health status filters',
      'One-tap auto-optimize for instant lineup generation',
    ],
    exampleTitle: 'Lineup Optimization',
    exampleContent: 'Optimized lineup: PG Luka ($9,800), SG SGA ($8,200), SF LeBron ($9,100), PF Giannis ($10,500), C Jokic ($11,000). Total: $48,600. Projected: 287.4 pts.',
  },
  {
    title: 'Draft Analyzer',
    description: 'NBA Draft prospect big board with scouting reports, player comparisons, college stats, and projected picks.',
    route: '/tools',
    variant: 'tool',
    category: 'tools',
    tagline: 'Scout the next generation. Know the prospects.',
    howItWorks: [
      'Browse the big board of ranked draft prospects.',
      'Filter by position or search by name.',
      'Each prospect shows college stats, physical attributes, and projected pick.',
      'Read scouting reports with strengths and areas to improve.',
    ],
    highlights: [
      'Full big board with prospect rankings',
      'Scouting reports with strengths and weaknesses',
      'NBA player comparisons for each prospect',
      'College stats: PPG, RPG, APG, FG%, 3P%, FT%',
    ],
    exampleTitle: 'Top Prospect',
    exampleContent: '#1 Cooper Flagg, Duke. 6\'9" 205 lbs. PPG: 18.2, RPG: 8.5, APG: 3.1. Strengths: Elite two-way play, court vision. Comparison: Paul George. Projected: #1 overall.',
  },

  // ─── MORE FEATURES ───
  {
    title: 'Search',
    description: 'Find users, takes, and players across the entire platform with real-time results.',
    route: '/(tabs)/search',
    variant: 'standard',
    category: 'social',
    tagline: 'Find it. Follow it. React to it.',
    howItWorks: [
      'Open the Search tab and start typing.',
      'Search for users by name or handle to find and follow them.',
      'Search for players to see their stats and game info.',
      'Find specific takes by content or topic.',
    ],
    highlights: [
      'Unified search across users, takes, and players',
      'Real-time results as you type',
      'Player profiles with stats and game history',
      'Discover new users and follow the best takes',
    ],
    exampleTitle: 'Finding the Action',
    exampleContent: 'Search "LeBron trade" -- results show 47 takes debating the latest trade rumors, 3 users with "LeBron" in their handle, and LeBron\'s player profile.',
  },
  {
    title: 'Notifications',
    description: 'Push notifications for fires, bricks, replies, mentions, and more. Never miss what matters.',
    route: '/notifications',
    variant: 'standard',
    category: 'social',
    tagline: 'Never miss a reaction. The court keeps you posted.',
    howItWorks: [
      'Get push notifications when someone fires or bricks your take.',
      'See when someone replies to your take or mentions you.',
      'Tap any notification to jump directly to the conversation.',
      'Manage notification preferences in Settings.',
    ],
    highlights: [
      'Push notifications for fires, bricks, replies, and mentions',
      'Notification center shows all your recent activity',
      'One-tap navigation to the relevant take or thread',
      'Customizable notification preferences',
    ],
    exampleTitle: 'You\'ve Been Mentioned',
    exampleContent: '@HoopsFanatic42 mentioned you: "Remember when @YourHandle said the Nuggets would repeat? Pull the receipts!" Tap to respond.',
  },
];
