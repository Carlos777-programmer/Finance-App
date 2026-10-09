import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ContasScreen from './src/screens/ContasScreen';
import FaturasScreen from './src/screens/FaturasScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import MentorScreen from './src/screens/MentorScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#00F5D4',
          tabBarInactiveTintColor: '#69758A',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ color }) => {
            let iconName;

            if (route.name === 'Home') iconName = 'grid';
            else if (route.name === 'Contas') iconName = 'credit-card';
            else if (route.name === 'Analytics') iconName = 'pie-chart';
            else if (route.name === 'Mentor') iconName = 'shield';
            else if (route.name === 'Faturas') iconName = 'file-text';

            return <Feather name={iconName} size={19} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarLabel: 'Painel' }}
        />
        <Tab.Screen
          name="Contas"
          component={ContasScreen}
          options={{ tabBarLabel: 'Contas' }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ tabBarLabel: 'Análise' }}
        />
        <Tab.Screen
          name="Mentor"
          component={MentorScreen}
          options={{ tabBarLabel: 'Mentor' }}
        />
        <Tab.Screen
          name="Faturas"
          component={FaturasScreen}
          options={{ tabBarLabel: 'CSV' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#05070A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    height: 62,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});