import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void;
};

export default function BackToCurrentLocationButton({ onPress }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable onPress={onPress} style={styles.btn} hitSlop={10}>
        <Text style={styles.text}>My location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  btn: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
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