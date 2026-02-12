import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';

type BackButtonProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  iconSize?: number;
  iconColor?: string;
};

const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  accessibilityLabel = 'Go back',
  iconSize = 20,
  iconColor,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, onPress]);

  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: colors.border }, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <ChevronLeft size={iconSize} color={iconColor ?? colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackButton;
