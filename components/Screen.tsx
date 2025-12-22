
import React from "react";
import { View, StyleProp, ViewStyle, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <StatusBar barStyle="light-content" backgroundColor={topColor} />
      <SafeAreaView 
        edges={['top', 'left', 'right']} 
        style={{ flex: 1, backgroundColor: topColor }}
      >
        <View style={[{ flex: 1 }, style]}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
