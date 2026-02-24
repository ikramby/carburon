import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import FleetScreen from './src/screens/FleetScreen';
import RoutesScreen from './src/screens/RoutesScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Dashboard: '⚡',
    Flotte: '🚌',
    Itinéraires: '🗺️',
    Rapports: '📊',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[label]}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Dashboard" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Flotte"
          component={FleetScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Flotte" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Itinéraires"
          component={RoutesScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Itinéraires" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Rapports"
          component={ReportsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Rapports" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1428',
    borderTopColor: '#1E2A45',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#00D4FF',
  },
});
