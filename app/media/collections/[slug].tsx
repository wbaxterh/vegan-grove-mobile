/** Collection: the editor's ordered list under a name and a description. */

import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaHeader } from '@/components/media/MediaHeader';
import { MediaListRow } from '@/components/media/MediaListRow';
import { openMedia } from '@/components/media/navigation';
import { Screen } from '@/components/ui/Screen';
import { errorMessage, isApiError } from '@/lib/api/client';
import { getMediaCollection } from '@/lib/api/media';
import { mediaKeys } from '@/lib/query/media';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, fonts, space } from '@/theme/tokens';

export default function CollectionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();

  const query = useQuery({
    queryKey: mediaKeys.collection(slug),
    queryFn: ({ signal }) => getMediaCollection(slug, signal),
    enabled: slug.length > 0,
  });
  const collection = query.data;
  const items = collection?.items ?? [];

  let emptyText = 'No titles in this collection yet.';
  if (query.isPending) emptyText = 'loading';
  else if (isApiError(query.error) && query.error.status === 404) {
    emptyText = 'This collection is not published.';
  } else if (query.isError) emptyText = errorMessage(query.error);

  return (
    <Screen scroll={false} padded={false} contentStyle={styles.fill}>
      <View style={styles.top}>
        <MediaHeader kicker="learn // collection" />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MediaListRow item={item} onPress={() => openMedia(item.slug)} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xxl }]}
        onRefresh={() => query.refetch()}
        refreshing={query.isRefetching}
        initialNumToRender={8}
        windowSize={7}
        ListHeaderComponent={
          collection ? (
            <View style={styles.header}>
              <Text style={[styles.name, { color: colors.text }]}>{collection.name}</Text>
              {collection.description ? (
                <Text style={[styles.description, { color: colors.muted }]}>
                  {collection.description}
                </Text>
              ) : null}
              <Text style={[styles.count, { color: colors.muted }]}>
                {`${items.length} ${items.length === 1 ? 'TITLE' : 'TITLES'}`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: query.isError && !query.isPending ? colors.danger : colors.muted },
            ]}
          >
            {emptyText}
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { paddingTop: space.sm },
  list: { paddingHorizontal: space.lg, gap: space.sm },
  header: { gap: space.xs, marginBottom: space.md },
  name: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: -0.5 },
  description: { fontSize: fontSize.body, lineHeight: 22 },
  count: { fontFamily: fonts.mono, fontSize: fontSize.mono, letterSpacing: 1 },
  empty: { fontSize: fontSize.body, lineHeight: 22, textAlign: 'center', paddingTop: space.xl },
});
