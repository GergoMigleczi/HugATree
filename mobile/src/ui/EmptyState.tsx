import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
};

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={32} color={Brand.softGray} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { alignItems: "center", paddingTop: 48, gap: 8 },
  title: { fontSize: 15, fontWeight: "700", color: Brand.softGray },
  sub:   { fontSize: 12, color: Brand.softGray, textAlign: "center", lineHeight: 18 },
});
