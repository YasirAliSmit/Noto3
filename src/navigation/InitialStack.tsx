import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PolyglotPalette from '../modules/preferences/PolyglotPalette';
import HorizonLaunchGuide from '../modules/welcome/HorizonLaunchGuide';
import { InitialStackParamList } from './types';

const Stack = createNativeStackNavigator<InitialStackParamList>();

const InitialStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PolyglotPalette">
    <Stack.Screen name="PolyglotPalette" component={PolyglotPalette} />
    <Stack.Screen name="HorizonLaunchGuide" component={HorizonLaunchGuide} />
  </Stack.Navigator>
);

export default InitialStackNavigator;
