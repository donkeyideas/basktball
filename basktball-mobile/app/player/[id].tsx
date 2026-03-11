import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';
import { useTheme } from '@/lib/theme/ThemeContext';

const API_BASE = 'https://www.basktball.com';

interface PlayerData {
  id: string;
  name: string;
  team: string;
  teamAbbr: string;
  position: string;
  height: string;
  weight: number;
  headshotUrl: string;
}

interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  mpg: number;
  tov: number;
  gamesPlayed: number;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

export default function PlayerDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  async function fetchPlayer() {
    try {
      const res = await fetch(`${API_BASE}/api/players/${id}`);
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setStats(data.stats);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to fetch player:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLAYER</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error || !player) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLAYER</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Player data unavailable</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlayer}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderStatCard(label: string, value: string | number) {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </View>
    );
  }

  function renderEfficiencyBar(label: string, value: number, color: string) {
    return (
      <View style={styles.effRow}>
        <Text style={styles.effLabel}>{label}</Text>
        <View style={styles.effBarContainer}>
          <View style={[styles.effBarFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.effValue}>{value.toFixed(1)}%</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLAYER</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Player Info */}
        <View style={styles.playerInfo}>
          {player.headshotUrl ? (
            <Image source={{ uri: player.headshotUrl }} style={styles.headshot} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials(player.name)}</Text>
            </View>
          )}
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.playerMeta}>
            <Text style={styles.playerTeam}>{player.teamAbbr}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
          <View style={styles.playerDetails}>
            {player.height ? <Text style={styles.playerDetail}>{player.height}</Text> : null}
            {player.height && player.weight ? <View style={styles.metaDotSmall} /> : null}
            {player.weight ? <Text style={styles.playerDetail}>{player.weight} lbs</Text> : null}
            {stats?.gamesPlayed ? (
              <>
                <View style={styles.metaDotSmall} />
                <Text style={styles.playerDetail}>{stats.gamesPlayed} GP</Text>
              </>
            ) : null}
          </View>
        </View>

        {stats && (
          <>
            {/* Season Stats Row */}
            <View style={styles.statsRow}>
              {renderStatCard('PPG', stats.ppg.toFixed(1))}
              {renderStatCard('RPG', stats.rpg.toFixed(1))}
              {renderStatCard('APG', stats.apg.toFixed(1))}
              {renderStatCard('MPG', stats.mpg.toFixed(1))}
            </View>

            {/* Extended Stats */}
            <View style={styles.extendedStatsRow}>
              {renderStatCard('SPG', stats.spg.toFixed(1))}
              {renderStatCard('BPG', stats.bpg.toFixed(1))}
              {renderStatCard('TOV', stats.tov.toFixed(1))}
              {renderStatCard('GP', stats.gamesPlayed)}
            </View>

            {/* Shooting Efficiency */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>SHOOTING EFFICIENCY</Text>
              <View style={styles.effContainer}>
                {renderEfficiencyBar('FG%', stats.fgPct, Colors.orange)}
                {renderEfficiencyBar('3PT%', stats.threePct, Colors.blue)}
                {renderEfficiencyBar('FT%', stats.ftPct, '#10B981')}
              </View>
            </View>

            {/* Detailed Stats Table */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>DETAILED STATISTICS</Text>
              <View style={styles.tableCard}>
                {[
                  { label: 'Points Per Game', value: stats.ppg.toFixed(1) },
                  { label: 'Rebounds Per Game', value: stats.rpg.toFixed(1) },
                  { label: 'Assists Per Game', value: stats.apg.toFixed(1) },
                  { label: 'Steals Per Game', value: stats.spg.toFixed(1) },
                  { label: 'Blocks Per Game', value: stats.bpg.toFixed(1) },
                  { label: 'Minutes Per Game', value: stats.mpg.toFixed(1) },
                  { label: 'Turnovers', value: stats.tov.toFixed(1) },
                  { label: 'Field Goal %', value: `${stats.fgPct.toFixed(1)}%` },
                  { label: 'Three Point %', value: `${stats.threePct.toFixed(1)}%` },
                  { label: 'Free Throw %', value: `${stats.ftPct.toFixed(1)}%` },
                ].map((row, i) => (
                  <View key={i} style={[styles.detailRow, i % 2 === 0 && styles.detailRowAlt]}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Error
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  errorText: {
    fontFamily: Fonts.barlow,
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Player Info
  playerInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headshot: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontFamily: Fonts.anton,
    fontSize: 32,
    color: '#FFFFFF',
  },
  playerName: {
    fontFamily: Fonts.anton,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 1,
    textAlign: 'center',
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  playerTeam: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.orange,
    letterSpacing: 1,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  },
  playerPosition: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaDotSmall: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  playerDetail: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  extendedStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 20,
    color: colors.text,
  },
  statCardLabel: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Section
  sectionContainer: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.barlowBold,
    fontSize: 14,
    color: Colors.orange,
    letterSpacing: 2,
    marginBottom: 12,
  },
  // Efficiency Bars
  effContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  effRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  effLabel: {
    fontFamily: Fonts.barlowBold,
    fontSize: 12,
    color: colors.textSecondary,
    width: 40,
  },
  effBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  effBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  effValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: colors.text,
    width: 50,
    textAlign: 'right',
  },
  // Detailed Stats Table
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  detailRowAlt: {
    backgroundColor: 'rgba(128,128,128,0.06)',
  },
  detailLabel: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: colors.text,
  },
  });
}
