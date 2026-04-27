import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { Brand } from "@/constants/theme";
import { getAdminUsersApi, setUserActiveApi, type AdminUser } from "@/src/features/admin/admin.api";

export default function AdminScreen() {
  const { user: currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg      = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg  = isDark ? Brand.darkCard  : Brand.white;
  const textCol = isDark ? Brand.offWhite  : Brand.charcoal;
  const subCol  = isDark ? Brand.softGray  : Brand.midGray;
  const borderCl = isDark ? Brand.deep     : Brand.pale;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsersApi();
      setUsers(data.users);
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Admin access required</Text>
      </View>
    );
  }

  async function handleToggle(targetUser: AdminUser) {
    if (targetUser.id === currentUser?.id) {
      Alert.alert("Not allowed", "You cannot deactivate your own account.");
      return;
    }

    const next = !targetUser.is_active;
    const action = next ? "activate" : "deactivate";

    Alert.alert(
      `${next ? "Activate" : "Deactivate"} account`,
      `Are you sure you want to ${action} ${targetUser.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Activate" : "Deactivate",
          style: next ? "default" : "destructive",
          onPress: async () => {
            setTogglingId(targetUser.id);
            try {
              await setUserActiveApi(targetUser.id, next);
              setUsers((prev) =>
                prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: next } : u))
              );
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Failed to update account status");
            } finally {
              setTogglingId(null);
            }
          },
        },
      ]
    );
  }

  function renderUser({ item }: { item: AdminUser }) {
    const isSelf = item.id === currentUser?.id;
    const isToggling = togglingId === item.id;

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCl }]}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.display_name ?? item.email)[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: textCol }]} numberOfLines={1}>
                {item.display_name ?? item.email}
              </Text>
              {item.admin_flag && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.email, { color: subCol }]} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={[styles.status, { color: item.is_active ? Brand.primary : Brand.amber }]}>
              {item.is_active ? "Active" : "Deactivated"}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {isToggling ? (
            <ActivityIndicator size="small" color={Brand.primary} />
          ) : (
            <Switch
              testID={`toggle-${item.id}`}
              value={item.is_active}
              onValueChange={() => handleToggle(item)}
              disabled={isSelf}
              trackColor={{ false: borderCl, true: Brand.mid }}
              thumbColor={item.is_active ? Brand.primary : subCol}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCl }]}>
        <Pressable testID="back-btn" onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={textCol} />
        </Pressable>
        <Text style={[styles.title, { color: textCol }]}>Admin Dashboard</Text>
        <Pressable onPress={fetchUsers} hitSlop={10} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={Brand.primary} />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={[styles.summaryRow]}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: borderCl }]}>
          <Text style={[styles.summaryValue, { color: textCol }]}>{users.length}</Text>
          <Text style={[styles.summaryLabel, { color: subCol }]}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: borderCl }]}>
          <Text style={[styles.summaryValue, { color: Brand.primary }]}>
            {users.filter((u) => u.is_active).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: subCol }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: borderCl }]}>
          <Text style={[styles.summaryValue, { color: Brand.amber }]}>
            {users.filter((u) => !u.is_active).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: subCol }]}>Deactivated</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: subCol }]}>Users</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Brand.amber} />
          <Text style={[styles.emptyText, { color: subCol }]}>{error}</Text>
          <Pressable onPress={fetchUsers} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn:    { padding: 4 },
  refreshBtn: { padding: 4, marginLeft: "auto" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
    flex: 1,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardLeft:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  cardInfo:  { flex: 1, minWidth: 0 },
  cardRight: { marginLeft: 12 },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.deep,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: Brand.offWhite, fontWeight: "700", fontSize: 16 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name:    { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  email:   { fontSize: 12, marginTop: 1 },
  status:  { fontSize: 11, fontWeight: "600", marginTop: 2 },

  adminBadge: {
    backgroundColor: Brand.amber,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  adminBadgeText: { color: Brand.charcoal, fontSize: 9, fontWeight: "700", textTransform: "uppercase" },

  centered:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  retryBtn:  { marginTop: 4, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Brand.primary, borderRadius: 8 },
  retryText: { color: Brand.white, fontWeight: "700" },
});
