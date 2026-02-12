import React, { useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import InitialStackNavigator from './InitialStack';
import AppStackNavigator from './AppStack';
import { useRootFlowStore } from '../store/useRootFlowStore';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};

export default function RootNavigator() {
  const isInitialFlow = useRootFlowStore((state) => state.isInitialFlow);
 

  return (
    <NavigationContainer theme={navTheme}>
      {isInitialFlow ? <InitialStackNavigator /> : <AppStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  enterButton: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  enterButtonLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
