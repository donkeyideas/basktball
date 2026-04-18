import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Fonts } from '@/constants/Colors';
import { LinkifiedText } from '@/components/content/LinkifiedText';
import { LinkPreviewCard } from '@/components/content/LinkPreviewCard';

interface Author {
  name: string;
  handle: string;
  avatarColor?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  position: number;
}

export interface TakePoll {
  id: string;
  totalVotes: number;
  endsAt: string | null;
  options: PollOption[];
  votes?: { optionId: string }[];
}

export interface Take {
  id: string;
  author: Author;
  content: string;
  gameTag?: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  createdAt: string;
  mediaUrl?: string | null;
  linkPreview?: {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    videoEmbedUrl: string | null;
    videoProvider: string | null;
  } | null;
  poll?: TakePoll | null;
}

interface TakeCardProps {
  take: Take;
  onPress?: () => void;
  onFire?: () => void;
  onBrick?: () => void;
  onPollVote?: (takeId: string, optionId: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export function TakeCard({ take, onPress, onFire, onBrick, onPollVote }: TakeCardProps) {
  const { author, content, gameTag, fireCount, brickCount, replyCount, repostCount, createdAt } =
    take;
  const initials = getInitials(author.name);
  const avatarBg = author.avatarColor || Colors.orange;
  const [votingId, setVotingId] = useState<string | null>(null);

  const handlePollVote = (optionId: string) => {
    if (votingId) return;
    setVotingId(optionId);
    onPollVote?.(take.id, optionId);
    setTimeout(() => setVotingId(null), 1000);
  };

  // Poll rendering helper
  const renderPoll = () => {
    if (!take.poll || take.poll.options.length === 0) return null;

    const userVotedOptionId = take.poll.votes?.[0]?.optionId || null;
    const hasVoted = !!userVotedOptionId;
    const pollEnded = take.poll.endsAt ? new Date() > new Date(take.poll.endsAt) : false;
    const showResults = hasVoted || pollEnded;
    const totalVotes = take.poll.totalVotes || 0;

    return (
      <View style={pollStyles.container}>
        {take.poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isUserVote = userVotedOptionId === option.id;

          if (showResults) {
            return (
              <View key={option.id} style={pollStyles.resultRow}>
                <View
                  style={[
                    pollStyles.resultBar,
                    {
                      width: `${pct}%`,
                      backgroundColor: isUserVote
                        ? 'rgba(255,107,53,0.2)'
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                />
                <View style={pollStyles.resultContent}>
                  <Text
                    style={[
                      pollStyles.resultText,
                      isUserVote && pollStyles.resultTextActive,
                    ]}
                  >
                    {isUserVote ? '\u2713 ' : ''}
                    {option.text}
                  </Text>
                  <Text
                    style={[
                      pollStyles.resultPct,
                      isUserVote && pollStyles.resultPctActive,
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>
              </View>
            );
          }

          // Voteable option
          return (
            <TouchableOpacity
              key={option.id}
              style={pollStyles.voteButton}
              onPress={() => handlePollVote(option.id)}
              disabled={!!votingId}
              activeOpacity={0.7}
            >
              <Text style={pollStyles.voteButtonText}>
                {votingId === option.id ? 'Voting...' : option.text}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Poll footer */}
        <View style={pollStyles.footer}>
          <Text style={pollStyles.footerText}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </Text>
          <Text style={pollStyles.footerText}>
            {pollEnded
              ? 'Poll ended'
              : take.poll.endsAt
                ? (() => {
                    const hoursLeft = Math.max(
                      0,
                      Math.ceil(
                        (new Date(take.poll!.endsAt!).getTime() - Date.now()) / 3600000
                      )
                    );
                    return hoursLeft > 24
                      ? `${Math.floor(hoursLeft / 24)}d left`
                      : `${hoursLeft}h left`;
                  })()
                : 'Open poll'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName} numberOfLines={1}>
              {author.name}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{author.handle}
            </Text>
          </View>
        </View>

        <Text style={styles.timestamp}>{createdAt}</Text>
      </View>

      <LinkifiedText
        text={take.linkPreview ? content.replace(take.linkPreview.url, '').trim() : content}
        style={styles.body}
      />

      {take.mediaUrl && (
        <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
          <Image source={{ uri: take.mediaUrl }} style={{ width: '100%', height: 200 }} contentFit="contain" />
        </View>
      )}

      {take.linkPreview && <LinkPreviewCard preview={take.linkPreview} />}

      {gameTag ? (
        <View style={styles.gameTagRow}>
          <View style={styles.gameTag}>
            <Text style={styles.gameTagText}>{gameTag}</Text>
          </View>
        </View>
      ) : null}

      {renderPoll()}

      <View style={styles.reactionBar}>
        <TouchableOpacity
          style={styles.reactionButton}
          onPress={onFire}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.reactionLabel}>F</Text>
          <Text style={styles.reactionCount}>{formatCount(fireCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reactionButton}
          onPress={onBrick}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.reactionLabel}>B</Text>
          <Text style={styles.reactionCount}>{formatCount(brickCount)}</Text>
        </TouchableOpacity>

        <View style={styles.reactionButton}>
          <Text style={styles.reactionLabel}>R</Text>
          <Text style={styles.reactionCount}>{formatCount(replyCount)}</Text>
        </View>

        <View style={styles.reactionButton}>
          <Text style={styles.reactionLabel}>RP</Text>
          <Text style={styles.reactionCount}>{formatCount(repostCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 6,
    flexShrink: 0,
  },
  handle: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textTertiary,
    flexShrink: 1,
  },
  timestamp: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: Colors.textTertiary,
    marginLeft: 8,
    flexShrink: 0,
  },
  body: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 10,
  },
  gameTagRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gameTag: {
    borderWidth: 1,
    borderColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gameTagText: {
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.orange,
    letterSpacing: 0.5,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  reactionLabel: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.textTertiary,
    marginRight: 4,
    letterSpacing: 0.5,
  },
  reactionCount: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

const pollStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  resultRow: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resultText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  resultTextActive: {
    fontFamily: Fonts.barlowBold,
    fontWeight: '700',
    color: Colors.orange,
  },
  resultPct: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 8,
  },
  resultPctActive: {
    color: Colors.orange,
  },
  voteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  voteButtonText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  footerText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
});
