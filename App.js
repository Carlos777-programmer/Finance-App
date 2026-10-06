import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ContasScreen from './src/screens/ContasScreen';
import FaturasScreen from './src/screens/FaturasScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#161B26',
              borderTopColor: '#262E3D',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#7C3AED',
            tabBarInactiveTintColor: '#6B7280',
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Início') iconName = 'home';
              else if (route.name === 'Contas') iconName = 'credit-card';
              else if (route.name === 'Faturas CSV') iconName = 'file-text';

              return <Feather name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Início" component={HomeScreen} />
          <Tab.Screen name="Contas" component={ContasScreen} />
          <Tab.Screen name="Faturas CSV" component={FaturasScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}