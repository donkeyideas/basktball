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
}

interface ScoreRowProps {
  game: Game;
  onPress?: () => void;
}

export function ScoreRow({ game, onPress }: ScoreRowProps) {
  const { homeTeam, awayTeam, status, statusText, quarter, time } = game;

  const isFinal = status === 'final';
  const isLive = status === 'live';
  const homeWins = isFinal && homeTeam.score > awayTeam.score;
  const awayWins = isFinal && awayTeam.score > homeTeam.score;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.statusCol}>
        <RowStatusBadge
          status={status}
          quarter={quarter}
          time={time}
          statusText={statusText}
        />
      </View>

      <View style={styles.teamsCol}>
        <TeamRow
          team={awayTeam}
          isWinner={awayWins}
          isLive={isLive}
          label="AWAY"
        />
        <View style={styles.teamSeparator} />
        <TeamRow
          team={homeTeam}
          isWinner={homeWins}
          isLive={isLive}
          label="HOME"
        />
      </View>
    </TouchableOpacity>
  );
}

function TeamRow({
  team,
  isWinner,
  isLive,
}: {
  team: Team;
  isWinner: boolean;
  isLive: boolean;
  label: string;
}) {
  return (
    <View style={styles.teamRow}>
      <View style={styles.teamInfo}>
        <View style={styles.miniLogo}>
          <Text style={styles.miniLogoText}>{team.abbr}</Text>
        </View>
        <View style={styles.teamNames}>
          <Text
            style={[
              styles.teamName,
              isWinner && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {team.name}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.teamScore,
          isWinner && styles.winnerScore,
          isLive && styles.liveScoreText,
        ]}
      >
        {team.score}
      </Text>
      {isWinner && <View style={styles.winIndicator} />}
    </View>
  );
}

function RowStatusBadge({
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
  if (status === 'live') {
    return (
      <View style={styles.statusBadge}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        {quarter ? (
          <Text style={styles.quarterText}>{quarter}</Text>
        ) : null}
        {time ? (
          <Text style={styles.timeText}>{time}</Text>
        ) : null}
      </View>
    );
  }

  if (status === 'final') {
    return (
      <View style={styles.statusBadge}>
        <Text style={styles.finalText}>{statusText || 'FINAL'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusBadge}>
      <Text style={styles.scheduledText}>{statusText || 'UPCOMING'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  statusCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingRight: 12,
  },
  statusBadge: {
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    marginRight: 4,
  },
  liveText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    color: Colors.red,
    letterSpacing: 1,
  },
  quarterText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  timeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  finalText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  scheduledText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  teamsCol: {
    flex: 1,
  },
  teamSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  miniLogoText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  teamNames: {
    flex: 1,
  },
  teamName: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  winnerName: {
    color: Colors.textPrimary,
  },
  teamScore: {
    fontFamily: Fonts.anton,
    fontSize: 22,
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  winnerScore: {
    color: Colors.textPrimary,
  },
  liveScoreText: {
    color: Colors.textPrimary,
  },
  winIndicator: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    backgroundColor: Colors.orange,
    marginLeft: 8,
  },
});
