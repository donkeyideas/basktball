"use client";

interface PlayerStat {
  value: string;
  label: string;
}

interface FeaturedPlayer {
  id: string;
  name: string;
  imageUrl: string;
  stats: PlayerStat[];
}

const defaultPlayers: FeaturedPlayer[] = [
  {
    id: "1",
    name: "LUKA DONČIĆ",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
    stats: [
      { value: "28.7", label: "PPG" },
      { value: "8.3", label: "RPG" },
      { value: "8.1", label: "APG" },
    ],
  },
  {
    id: "2",
    name: "GIANNIS",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    stats: [
      { value: "30.9", label: "PPG" },
      { value: "11.4", label: "RPG" },
      { value: "6.2", label: "APG" },
    ],
  },
  {
    id: "3",
    name: "LAMELO BALL",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
    stats: [
      { value: "26.5", label: "PPG" },
      { value: "5.1", label: "RPG" },
      { value: "7.8", label: "APG" },
    ],
  },
];

interface FeaturedPlayersProps {
  players?: FeaturedPlayer[];
}

function PlayerCard({ player }: { player: FeaturedPlayer }) {
  return (
    <div className="text-center">
      {/* Player Image */}
      <div
        className="player-img"
        style={{ backgroundImage: `url('${player.imageUrl}')` }}
      />

      {/* Player Stats */}
      <div className="player-stat">
        <div className="player-name">{player.name}</div>
        <div className="player-stats-row">
          {player.stats.map((stat, index) => (
            <div key={index} className="player-stat-item">
              <div className="player-stat-value">{stat.value}</div>
              <div className="player-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeaturedPlayers({ players = defaultPlayers }: FeaturedPlayersProps) {
  return (
    <div className="featured-players">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
        style={{
          backgroundImage: `url('https://cdn.nba.com/manage/2021/10/GettyImages-1340187444.jpg')`,
        }}
      />

      {/* Content */}
      <div className="featured-content">
        {players.map((player) => (
          <div key={player.id} className="player-highlight">
            <PlayerCard player={player} />
          </div>
        ))}
      </div>
    </div>
  );
}
