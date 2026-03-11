import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts } from '@/constants/Colors';

interface Player {
  id: string;
  name: string;
  initials: string;
  team: string;
  pts: number;
  reb: number;
  ast: number;
}

interface PlayerCardProps {
  player: Player;
  onPress?: () => void;
}

export function PlayerCard({ player, onPress }: PlayerCardProps) {
  const { name, initials, team, pts, reb, ast } = player;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <Text style={styles.playerName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.teamName}>{team}</Text>

      <View style={styles.statsRow}>
        <StatColumn label="PTS" value={pts} />
        <View style={styles.statDivider} />
        <StatColumn label="REB" value={reb} />
        <View style={styles.statDivider} />
        <StatColumn label="AST" value={ast} />
      </View>
    </TouchableOpacity>
  );
}

function StatColumn({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 18,
    color: Colors.orange,
    letterSpacing: 0.5,
  },
  playerName: {
    fontFamily: Fonts.anton,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  teamName: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 11,
    color: Colors.orange,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
