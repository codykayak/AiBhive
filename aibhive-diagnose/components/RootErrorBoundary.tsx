import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  error: Error;
  retry: () => void;
};

/**
 * Expo Router ErrorBoundary — shows the real message so Expo Go crashes are actionable.
 */
export function ErrorBoundary({ error, retry }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Something went wrong</Text>
      <ScrollView style={styles.box} contentContainerStyle={{ padding: 14 }}>
        <Text style={styles.message} selectable>
          {error?.message || String(error)}
        </Text>
        {error?.stack ? (
          <Text style={styles.stack} selectable>
            {error.stack.split('\n').slice(0, 12).join('\n')}
          </Text>
        ) : null}
      </ScrollView>
      <Pressable onPress={retry} style={styles.btn}>
        <Text style={styles.btnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.amber,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  box: {
    maxHeight: 280,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    marginBottom: 16,
  },
  message: {
    color: theme.colors.mist,
    fontSize: 15,
    lineHeight: 22,
  },
  stack: {
    marginTop: 12,
    color: theme.colors.steel,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'SpaceMono',
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.amber,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    color: theme.colors.bg,
    fontWeight: '800',
    fontSize: 15,
  },
});
