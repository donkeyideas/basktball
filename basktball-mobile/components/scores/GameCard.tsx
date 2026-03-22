import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface Team {
  abbr: string;
  name: string;
  score: number;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'live' | 'final' | 'scheduled';
  statusText?: string;
  quarter?: string;
  time?: string;
  broadcast?: string;
}

interface GameCardProps {
  game: Game;
  onPress?: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  const { homeTeam, awayTeam, status, statusText, quarter, time } = game;

  const isLive = status === 'live';
  const isFinal = status === 'final';
  const homeWins = isFinal && homeTeam.score > awayTeam.score;
  const awayWins = isFinal && awayTeam.score > homeTeam.score;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <StatusBadge status={status} quarter={quarter} time={time} statusText={statusText} />

      <View style={styles.matchup}>
        <TeamBlock team={awayTeam} isWinner={awayWins} isLive={isLive} />

        <View style={styles.divider}>
          <Text style={styles.vs}>
            {status === 'scheduled' ? 'VS' : '-'}
          </Text>
        </View>

        <TeamBlock team={homeTeam} isWinner={homeWins} isLive={isLive} />
      </View>

      {statusText && status === 'scheduled' ? (
        <Text style={styles.scheduledTime}>{statusText}</Text>
      ) : null}

      {game.broadcast ? (
        <Text style={styles.broadcastLabel}>{game.broadcast}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function TeamBlock({
  team,
  isWinner,
  isLive,
}: {
  team: Team;
  isWinner: boolean;
  isLive: boolean;
}) {
  return (
    <View style={styles.teamBlock}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>{team.abbr}</Text>
      </View>
      <Text
        style={[
          styles.teamAbbr,
          isWinner && styles.winnerText,
        ]}
        numberOfLines={1}
      >
        {team.abbr}
      </Text>
      <Text
        style={[
          styles.score,
          isWinner && styles.winnerScore,
          isLive && styles.liveScore,
        ]}
      >
        {team.score}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
  quarter,
  time,
  statusText,
}: {
  status: Game['status'];
  quarter?: string;
  time?: string;
  statusText?: string;
}) {
  const badgeStyle = [
    styles.badge,
    status === 'live' && styles.badgeLive,
    status === 'final' && styles.badgeFinal,
    status === 'scheduled' && styles.badgeScheduled,
  ];

  const label =
    status === 'live'
      ? `${quarter ?? ''} ${time ?? ''}`.trim() || 'LIVE'
      : status === 'final'
      ? statusText || 'FINAL'
      : statusText || 'UPCOMING';

  return (
    <View style={styles.badgeRow}>
      <View style={badgeStyle}>
        {status === 'live' && <View style={styles.liveDot} />}
        <Text style={[styles.badgeText, status === 'live' && styles.badgeTextLive]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    width: 200,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeLive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  badgeFinal: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeScheduled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginRight: 5,
  },
  badgeText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeTextLive: {
    color: Colors.red,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: {
    alignItems: 'center',
    flex: 1,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  teamAbbr: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  winnerText: {
    color: Colors.textPrimary,
  },
  score: {
    fontFamily: Fonts.anton,
    fontSize: 24,
    color: Colors.textSecondary,
  },
  winnerScore: {
    color: Colors.textPrimary,
  },
  liveScore: {
    color: Colors.textPrimary,
  },
  divider: {
    paddingHorizontal: 6,
    paddingTop: 14,
  },
  vs: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  scheduledTime: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
  },
  broadcastLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
