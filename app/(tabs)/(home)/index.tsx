
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useThemeContext } from "@/contexts/ThemeContext";
import { modalDemos } from "@/components/homeData";
import { DemoCard } from "@/components/DemoCard";

export default function HomeScreen() {
  const { colors } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={modalDemos}
        renderItem={({ item }) => <DemoCard item={item} />}
        keyExtractor={(item) => item.route}
        contentContainerStyle={styles.listContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
});
