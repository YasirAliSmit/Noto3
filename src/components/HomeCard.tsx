import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightAccessory?: ReactNode;
  imageUri?: any;
  children?: ReactNode;
  mainStyle?: ViewStyle
};

export default function HomeCard({
  title,
  subtitle,
  onPress,
  rightAccessory,
  imageUri,
  children,
  mainStyle,
}: Props) {
  const content = (
    <View style={[styles.inner, mainStyle]}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
    </View>
  );

  if (imageUri) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
        <ImageBackground source={imageUri } style={styles.bg} imageStyle={styles.bgImage}>
          <View style={styles.overlay} />
          {content}
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    flex: 1,
  },
  bg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bgImage: {
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    opacity: 0.35,
    borderRadius: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  accessory: {
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
