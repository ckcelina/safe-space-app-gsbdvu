
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  headerBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  headerBackgroundColor = "transparent",
  style,
}: Props) {
  return (
    <View style={[{ flex: 1, backgroundColor: headerBackgroundColor }, style]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: headerBackgroundColor }} />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}
