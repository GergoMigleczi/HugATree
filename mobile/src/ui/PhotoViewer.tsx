import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  /** Full URL of the photo to display. Pass null to hide the viewer. */
  uri: string | null;
  onClose: () => void;
};

/**
 * Full-screen photo viewer modal.
 * Tap the close button or press back to dismiss.
 */
export default function PhotoViewer({ uri, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={uri !== null}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <Image
          source={{ uri: uri ?? "" }}
          style={styles.image}
          resizeMode="contain"
        />
        <Pressable
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={12}
        >
          <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
  },
});
