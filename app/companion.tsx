/**
 * Ivy, the companion, as a modal. Streams replies over SSE. Conversations are
 * ephemeral unless pinned (privacy rule 7); pinning UI is TODO(m2).
 */

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { TextField } from '@/components/ui/TextField';
import { errorMessage } from '@/lib/api/client';
import { streamCompanionChat } from '@/lib/api/companion';
import type { CompanionMessage } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, radius, space } from '@/theme/tokens';

/** Local thread entry: a stable id so React keys survive reordering and streaming edits. */
type ThreadMessage = CompanionMessage & { id: string };

interface BubbleProps {
  message: CompanionMessage;
}

function Bubble({ message }: BubbleProps) {
  const { colors } = useTheme();
  const mine = message.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        mine ? styles.bubbleMine : styles.bubbleIvy,
        { backgroundColor: mine ? colors.primary : colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.bubbleText, { color: mine ? colors.onPrimary : colors.text }]}>
        {message.content || '…'}
      </Text>
    </View>
  );
}

export default function CompanionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);
  const nextId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return () => abort.current?.abort();
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft('');
    setError(null);
    const at = new Date().toISOString();
    const userId = `m${nextId.current++}`;
    const replyId = `m${nextId.current++}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', content: text, at },
      { id: replyId, role: 'assistant', content: '', at },
    ]);
    setStreaming(true);
    abort.current = new AbortController();
    try {
      await streamCompanionChat(
        text,
        conversationId.current,
        {
          onConversationId: (id) => {
            conversationId.current = id;
          },
          onDelta: (delta) => {
            setMessages((prev) => {
              const next = prev.slice();
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = { ...last, content: last.content + delta };
              }
              return next;
            });
            scrollRef.current?.scrollToEnd({ animated: true });
          },
        },
        abort.current.signal,
      );
    } catch (e) {
      setError(errorMessage(e, 'Ivy did not answer.'));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.bg, paddingTop: space.lg }]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <SectionLabel tone="primary">companion :: ivy</SectionLabel>
          <Text style={[styles.title, { color: colors.text }]}>Ask Ivy</Text>
        </View>
        <Button label="Close" variant="ghost" mono onPress={() => router.back()} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.intro}>
            <Text style={[styles.introText, { color: colors.muted }]}>
              Places, events, going vegan, drafting an outreach message, planning a first sanctuary
              visit. Ivy knows your handle and interests, nothing else.
            </Text>
            <Badge label="unpinned chats expire in 24h" />
          </View>
        ) : (
          messages.map((message) => <Bubble key={message.id} message={message} />)
        )}
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </ScrollView>

      <View
        style={[
          styles.composer,
          { paddingBottom: insets.bottom + space.md, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.grow}>
          <TextField
            label="message"
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about a sanctuary day"
            onSubmitEditing={send}
            returnKeyType="send"
          />
        </View>
        <Button label="Send" onPress={send} loading={streaming} disabled={!draft.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.h2, fontWeight: '700', fontFamily: fonts.mono },
  thread: { flex: 1 },
  threadContent: { padding: space.lg, gap: space.sm },
  intro: { gap: space.md },
  introText: { fontSize: fontSize.body, lineHeight: 22 },
  bubble: { maxWidth: '85%', padding: space.md, borderRadius: radius.lg, borderWidth: 1 },
  bubbleMine: { alignSelf: 'flex-end' },
  bubbleIvy: { alignSelf: 'flex-start' },
  bubbleText: { fontSize: fontSize.body, lineHeight: 22 },
  error: { fontSize: fontSize.small },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
  },
  grow: { flex: 1 },
});
