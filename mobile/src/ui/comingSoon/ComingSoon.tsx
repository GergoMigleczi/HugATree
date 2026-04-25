import React from "react";
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Brand } from "@/constants/theme";

type ComingSoonProps = {
  title?: string;
  subtitle?: string;
  showHomeButton?: boolean;
};

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
  subtitle = "We're working on something exciting. Stay tuned!",
  showHomeButton = true,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();

  const bg      = isDark ? Brand.charcoal : Brand.offWhite;
  const cardBg  = isDark ? Brand.darkCard : Brand.white;
  const textCol = isDark ? Brand.offWhite : Brand.charcoal;
  const subCol  = isDark ? Brand.softGray : Brand.midGray;
  const border  = isDark ? Brand.deep     : Brand.pale;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      
      {/* ── Home / Back Button ── */}
      {showHomeButton && (
        <SafeAreaView
          style={styles.backWrap}
          edges={["top"]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => router.replace("/")} // ensures it goes home reliably
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={textCol}
            />
            <Text style={[styles.backText, { color: textCol }]}>
              Home
            </Text>
          </Pressable>
        </SafeAreaView>
      )}

      {/* ── Content ── */}
      <View style={styles.container}>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <Text style={[styles.title, { color: Brand.primary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: subCol }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },

  /* Back button */
  backWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Main content */
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});