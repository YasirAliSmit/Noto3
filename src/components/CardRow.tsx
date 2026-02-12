import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

export default function CardRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      {React.Children.toArray(children).map((child, index) => (
        <View key={index} style={[styles.item, index === 0 ? styles.itemSpacing : undefined]}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
  },
  itemSpacing: {
    marginRight: 12,
  },
});
