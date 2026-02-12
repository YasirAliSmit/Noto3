import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type ScreenGradientProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenGradient({ children, style }: ScreenGradientProps) {
  return (
    <LinearGradient
      colors={['#0F2027', '#203A43', '#2C5364']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
