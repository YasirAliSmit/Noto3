import React from 'react';
import { Platform, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Variant = 'title' | 'subtitle' | 'body' | 'caption';

type AppTextProps = TextProps & {
  variant?: Variant;
};

const variantBase: Record<Variant, TextStyle> = {
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
  },
  caption: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
};

const AppText: React.FC<AppTextProps> = ({ variant = 'body', style, children, ...rest }) => {
  const { colors, dark } = useTheme();
  const primary = colors?.text ?? '#FFFFFF';
  const secondary = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

  const colorStyle: TextStyle = {
    color: variant === 'caption' ? secondary : primary,
  };

  return (
    <Text {...rest} style={[styles.base, variantBase[variant], colorStyle, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    includeFontPadding: false,
  },
});

export default AppText;
