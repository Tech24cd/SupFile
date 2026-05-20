import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { Colors } from '@/utils/colors'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color: focused ? Colors.brand[600] : Colors.gray[400] }]}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 64,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="files" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📁" label="Fichiers" focused={focused} />,
      }} />
      <Tabs.Screen name="search" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Recherche" focused={focused} />,
      }} />
      <Tabs.Screen name="dashboard" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
      }} />
      <Tabs.Screen name="share" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🔗" label="Partages" focused={focused} />,
      }} />
      <Tabs.Screen name="trash" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🗑️" label="Corbeille" focused={focused} />,
      }} />
      <Tabs.Screen name="settings" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Réglages" focused={focused} />,
      }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', gap: 2, paddingTop: 4 },
  tabEmoji: { fontSize: 22, opacity: 0.5 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
})
