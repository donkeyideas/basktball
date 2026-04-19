import React from 'react';
import { Text, Linking, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts } from '@/constants/Colors';

const TOKEN_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)|(@[a-zA-Z0-9_]+)/gi;

interface LinkifiedTextProps {
  text: string;
  style?: object;
}

export function LinkifiedText({ text, style }: LinkifiedTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(TOKEN_REGEX.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`t-${lastIndex}`} style={style}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }

    const token = match[0];

    if (token.startsWith('http')) {
      let displayUrl = token;
      try {
        const u = new URL(token);
        displayUrl = u.hostname + (u.pathname !== '/' ? u.pathname : '');
        if (displayUrl.length > 35) displayUrl = displayUrl.slice(0, 32) + '...';
      } catch {
        // keep full URL
      }
      parts.push(
        <Text
          key={`u-${match.index}`}
          style={linkStyles.link}
          onPress={() => Linking.openURL(token)}
        >
          {displayUrl}
        </Text>
      );
    } else if (token.startsWith('@')) {
      const handle = token.slice(1);
      parts.push(
        <Text
          key={`m-${match.index}`}
          style={linkStyles.mention}
          onPress={() => router.push(`/user/${handle}`)}
        >
          {token}
        </Text>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`t-${lastIndex}`} style={style}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return <Text style={style}>{parts}</Text>;
}

const linkStyles = StyleSheet.create({
  link: {
    color: Colors.orange,
    fontFamily: Fonts.barlow,
    fontSize: 14,
  },
  mention: {
    color: Colors.orange,
    fontFamily: Fonts.barlowSemiBold,
    fontWeight: '600',
    fontSize: 14,
  },
});
