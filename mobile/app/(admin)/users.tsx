import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Brand } from "@/constants/theme";
import { getAdminUsersApi, deactivateUserApi } from "@/src/features/admin/admin.api";
import type { AdminUser } from "@/src/features/admin/admin.types";

export default function AdminUsersScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg      = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg  = isDark ? Brand.darkCard  : Brand.white;
  const textCol = isDark ? Brand.offWhite  : Brand.charcoal;
  const subCol  = isDark ? Brand.softGray  : Brand.midGray;
  const border  = isDark ? Brand.deep      : Brand.pale;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsersApi();
      setUsers(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function confirmDeactivate(user: AdminUser) {
    Alert.alert(
      "Deactivate account",
      `Are you sure you want to deactivate ${user.email}? They will no longer be able to log in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => doDeactivate(user),
        },
      ]
    );
  }

  async function doDeactivate(user: AdminUser) {
    try {
      await deactivateUserApi(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u))
      );
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to deactivate user");
    }
  }

  function renderItem({ item }: { item: AdminUser }) {
    const isActive = item.is_active;
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardMain}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? Brand.primary : Brand.softGray }]} />
          <View style={styles.cardText}>
            <Text style={[styles.email, { color: textCol }]} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={[styles.meta, { color: subCol }]}>
              {item.display_name ?? "No display name"} · {item.role}
            </Text>
          </View>
        </View>
        {isActive ? (
          <Pressable
            onPress={() => confirmDeactivate(item)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deactivateBtn,
              { borderColor: "#E53935", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="ban-outline" size={14} color="#E53935" />
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </Pressable>
        ) : (
          <View style={[styles.inactiveBadge, { borderColor: border }]}>
            <Text style={[styles.inactiveBadgeText, { color: subCol }]}>Inactive</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textCol} />
        </Pressable>
        <Text style={[styles.title, { color: textCol }]}>User Management</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <Text style={[styles.stateText, { color: subCol }]}>Loading users…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.stateText, { color: "#E53935" }]}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retryBtn}>
            <Text style={{ color: Brand.primary, fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Brand.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.stateText, { color: subCol }]}>No users found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 32, alignItems: "flex-start" },
  title: { fontSize: 17, fontWeight: "700" },

  list: { padding: 16, gap: 10 },

  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardText:  { flex: 1 },
  email:     { fontSize: 14, fontWeight: "600" },
  meta:      { fontSize: 12, marginTop: 2 },

  deactivateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  deactivateBtnText: { fontSize: 12, fontWeight: "600", color: "#E53935" },

  inactiveBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  inactiveBadgeText: { fontSize: 12 },

  center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  stateText: { fontSize: 14 },
  retryBtn:  { marginTop: 12 },
});
