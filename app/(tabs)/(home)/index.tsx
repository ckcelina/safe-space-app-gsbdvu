
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { modalDemos } from "@/components/homeData";
import { DemoCard } from "@/components/DemoCard";

// Safe memoryCache wrapper to prevent crashes
const safeMemoryCache = {
  getPeopleList: () => {
    try {
      // @ts-ignore - memoryCache may not exist
      if (typeof global.memoryCache?.getPeopleList === 'function') {
        // @ts-ignore
        return global.memoryCache.getPeopleList() || [];
      }
      console.warn("memoryCache missing method getPeopleList — using empty fallback");
      return [];
    } catch (e) {
      console.warn("memoryCache missing method getPeopleList — using empty fallback");
      return [];
    }
  },
  
  setPeopleList: (list: any[]) => {
    try {
      // @ts-ignore
      if (typeof global.memoryCache?.setPeopleList === 'function') {
        // @ts-ignore
        global.memoryCache.setPeopleList(list);
      }
    } catch (e) {
      // Skip if setPeopleList is missing
    }
  },
  
  getTopicsList: () => {
    try {
      // @ts-ignore
      if (typeof global.memoryCache?.getTopicsList === 'function') {
        // @ts-ignore
        return global.memoryCache.getTopicsList() || [];
      }
      console.warn("memoryCache missing method getTopicsList — using empty fallback");
      return [];
    } catch (e) {
      console.warn("memoryCache missing method getTopicsList — using empty fallback");
      return [];
    }
  },
  
  setTopicsList: (list: any[]) => {
    try {
      // @ts-ignore
      if (typeof global.memoryCache?.setTopicsList === 'function') {
        // @ts-ignore
        global.memoryCache.setTopicsList(list);
      }
    } catch (e) {
      // Skip if setTopicsList is missing
    }
  },
};

export default function HomeScreen() {
  const theme = useTheme();

  // Safe cache initialization - won't crash if methods are missing
  React.useEffect(() => {
    safeMemoryCache.getPeopleList();
    safeMemoryCache.getTopicsList();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    paddingBottom: 100, // Extra padding for floating tab bar
  },
});
