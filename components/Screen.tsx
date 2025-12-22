
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

type Props = {
  children: React.ReactNode;
  topColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  topColor = "#0B66C3",
  style,
}: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: topColor }}>
      <StatusBar style="light" translucent={false} backgroundColor={topColor} />
      <SafeAreaView 
        edges={['top', 'left', 'right']} 
        style={{ backgroundColor: 'transparent' }}
      >
        <View style={[{ flex: 1 }, style]}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
