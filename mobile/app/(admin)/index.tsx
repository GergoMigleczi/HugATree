import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { Brand } from "@/constants/theme";
import { HomeGrid, type GridItem } from "@/src/features/home/components/HomeGrid";
import { useEffect } from "react";

const LOGO = require("@/assets/images/logo.png");

const ACCENTS = {
  forest: Brand.deep,
  amber: Brand.amber,
  teal: Brand.mid,
} as const;

export default function AdminHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg = isDark ? Brand.darkCard : Brand.white;
  const textCol = isDark ? Brand.offWhite : Brand.charcoal;
  const subCol = isDark ? Brand.softGray : Brand.midGray;
  const borderCl = isDark ? Brand.deep : Brand.pale;

  const navigation = useNavigation();

    useEffect(() => {
    navigation.setOptions({
        headerShown: false,
    });
    }, [navigation]);

  async function handleLogout() {
    try {
      await logout();
    } catch (e: any) {
      Alert.alert("Logout failed", e.message);
    }
  }

  const firstName = user?.display_name?.split(" ")[0] ?? "Admin";

  const items: GridItem[] = [
    {
      type: "map",
      id: "admin-map-preview",
      cols: 2,
      rows: 1,
      onPress: () => router.push({
        pathname: "/map",
        params: { mode: "adminApproval" },
        }),
    },
    {
      type: "tile",
      id: "user-management",
      title: "User Management",
      subtitle: "Manage app users",
      cols: 2,
      rows: 1,
      icon: "people-outline",
      accent: ACCENTS.forest,
      onPress: () => router.push("/(admin)/users"),
    },
    {
      type: "tile",
      id: "pending-requests",
      title: "Pending Requests",
      subtitle: "Review approvals",
      cols: 2,
      rows: 1,
      icon: "time-outline",
      accent: ACCENTS.amber,
      onPress: () => router.push("/(admin)/pending-requests"),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                
                {/* 👇 Back button */}
                <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                style={({ pressed }) => [
                    styles.backBtn,
                    {
                    backgroundColor: cardBg,
                    borderColor: borderCl,
                    opacity: pressed ? 0.7 : 1,
                    },
                ]}
                >
                <Ionicons name="arrow-back" size={20} color={subCol} />
                </Pressable>

                {/* Logo */}
                <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />

                <View style={styles.headerText}>
                <Text style={[styles.greeting, { color: textCol }]}>
                    Admin Panel
                </Text>
                <Text style={[styles.userEmail, { color: subCol }]}>
                    Welcome, {firstName}
                </Text>
                </View>
            </View>
        </View>

        {/* Admin banner */}
        <View style={styles.adminBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Brand.primary} />

          <Text style={[styles.adminBannerText, { color: textCol }]}>
            Manage maps, users, and pending requests
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: subCol }]}>
          Admin actions
        </Text>

        <HomeGrid items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
},
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  adminBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  adminBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 2,
  },
});