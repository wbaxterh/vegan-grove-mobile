/** Five tabs: Home, Places, Events, Feed, Messages. Glyphs are monospace codes, not icons. */

import { Tabs } from 'expo-router';
import { TabGlyph } from '@/components/ui/TabGlyph';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

const TABS: ReadonlyArray<{ name: string; title: string; code: string }> = [
  { name: 'index', title: 'Home', code: 'HOME' },
  { name: 'places', title: 'Places', code: 'MAP' },
  { name: 'events', title: 'Events', code: 'EVT' },
  { name: 'feed', title: 'Feed', code: 'FEED' },
  { name: 'messages', title: 'Messages', code: 'DM' },
];

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabGlyph code={tab.code} color={color} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
