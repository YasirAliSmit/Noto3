import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../theme/colors';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function GradientButton({ title, onPress, style }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.wrap, style]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <View  style={{paddingVertical:12}} >
          <Text style={styles.text}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 16,
  },
  text: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
