import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  onPress: () => void;
};

export default function BackToCurrentLocationButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn} hitSlop={10}>
      <Text style={styles.text}>My location</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontWeight: "600",
  },
});