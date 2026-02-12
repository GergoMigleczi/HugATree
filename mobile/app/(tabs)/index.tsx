import { Alert, Button, Text, useColorScheme, View, StyleSheet } from "react-native";
import { useAuth } from "@/src/features/auth/AuthProvider";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import { HomeGrid, type GridItem } from "../../src/features/home/components/HomeGrid";
import { getPins } from "../../src/features/map/map.api";
import type { Pin } from "../../src/features/map/map.types";

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const styles = {
    screen: { flex: 1, paddingTop: 100, backgroundColor: isDark ? "#000" : "#fff" },
    title: { fontSize: 22, fontWeight: "600" as const, color: isDark ? "#fff" : "#000" },
    text: { color: isDark ? "#fff" : "#000" },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#666" : "#ccc",
      padding: 10,
      borderRadius: 8,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#111" : "#fff",
    },
    link: { color: isDark ? "#9cf" : "#06f" },
  };

  async function handleLogout() {
    try {
      await logout();
      // No navigation needed – auth layout will redirect to (auth)
    } catch (e: any) {
      Alert.alert("Logout failed", e.message);
    }
  }
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);

  // Lightweight approach: fetch a small set for preview
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getPins();
        if (!cancelled) setPins(data);
      } catch {
        // ignore for preview; you can show empty map tile
        if (!cancelled) setPins([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items: GridItem[] = [
    {
      type: "map",
      id: "map-preview",
      cols: 2,
      rows: 2,
      pins,
      onPress: () => router.push("/map"),
    },
    {
      type: "tile",
      id: "stats",
      title: "Statistics",
      subtitle: "Overview",
      cols: 1,
      rows: 1,
      onPress: () => router.push("/stats"),
    },
    {
      type: "tile",
      id: "reports",
      title: "Reports",
      subtitle: "Issues & checks",
      cols: 1,
      rows: 1,
      onPress: () => router.push("/reports"),
    },
    {
      type: "tile",
      id: "add-tree",
      title: "Add tree",
      subtitle: "New record",
      cols: 2,
      rows: 1,
      onPress: () => router.push("/add-tree"),
    },
  ];

  return (
    <ScrollView style={styles.screen}>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.text}>
          Welcome{user?.display_name ? `, ${user.display_name}` : ""} 👋
        </Text>
        <Text style={styles.text}>{user?.email}</Text>
      </View>

      <Button title="Logout" onPress={handleLogout} />
      <HomeGrid items={items} />
    </ScrollView>
  );
}