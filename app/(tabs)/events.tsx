/**
 * Events: upcoming actions from `/api/events?from=`. Each card says when,
 * where (as much as the organizer allows), and who is hosting. Counts, never
 * identities.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { errorMessage } from '@/lib/api/client';
import { listEvents } from '@/lib/api/events';
import type { Event, EventType } from '@/lib/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

const TYPE_LABEL: Record<EventType, string> = {
  protest: 'protest',
  vigil: 'vigil',
  outreach: 'outreach',
  potluck: 'potluck',
  sanctuary_day: 'sanctuary day',
  screening: 'screening',
  meeting: 'meeting',
  other: 'action',
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const { colors } = useTheme();
  const where =
    event.detailsAfterRsvp && !event.myRsvp
      ? `${event.venueName} (address after RSVP)`
      : event.venueName;
  return (
    <Card edge={event.myRsvp ? 'primary' : 'none'} accessibilityLabel={event.title}>
      <View style={styles.badges}>
        <Badge label={TYPE_LABEL[event.type]} tone="primary" />
        {event.status === 'cancelled' ? <Badge label="cancelled" tone="danger" /> : null}
      </View>
      <Text style={[styles.when, { color: colors.accent2 }]}>{formatWhen(event.startsAt)}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{where}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {event.hostName ? `Hosted by ${event.hostName}` : `Hosted by a ${event.hostType}`}
        {` · ${event.rsvpCount} going`}
      </Text>
    </Card>
  );
}

export default function EventsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const from = useMemo(() => new Date().toISOString(), []);

  const eventsQuery = useQuery({
    queryKey: ['events', { from }],
    queryFn: ({ signal }) => listEvents({ from }, signal),
  });
  const events = eventsQuery.data?.items ?? [];

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={events}
        keyExtractor={(event) => event.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + space.md }]}
        onRefresh={() => eventsQuery.refetch()}
        refreshing={eventsQuery.isRefetching}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionLabel>events :: upcoming</SectionLabel>
            <Text style={[styles.h1, { color: colors.text }]}>Actions this month</Text>
            <Text style={[styles.lede, { color: colors.muted }]}>
              Vigils, outreach, sanctuary days, potlucks. RSVPs are private; organizers see who,
              everyone else sees how many.
            </Text>
          </View>
        }
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>
            {eventsQuery.isLoading
              ? 'Loading upcoming actions'
              : eventsQuery.isError
                ? errorMessage(eventsQuery.error)
                : 'Nothing scheduled yet. Groves post here as they plan.'}
          </Text>
        }
        ListFooterComponent={
          <View style={styles.support}>
            <SectionLabel>support</SectionLabel>
            <Text style={[styles.meta, { color: colors.muted }]}>
              Organizers create events from their grove. Creating and RSVPing from the app is
              TODO(m2).
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  header: { gap: space.xs, marginBottom: space.md },
  h1: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: -0.5 },
  lede: { fontSize: fontSize.body, lineHeight: 22 },
  badges: { flexDirection: 'row', gap: space.xs },
  when: { fontFamily: fonts.mono, fontSize: fontSize.small, letterSpacing: 0.5 },
  title: { fontSize: fontSize.h2, fontWeight: '600' },
  meta: { fontSize: fontSize.small, lineHeight: 18 },
  empty: {
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: space.xl,
  },
  support: { marginTop: space.xl, gap: space.sm },
});
