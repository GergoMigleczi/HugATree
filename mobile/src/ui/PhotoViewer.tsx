import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  /** Full URL of the photo to display. Pass null to hide the viewer. */
  uri: string | null;
  onClose: () => void;
};

/**
 * Full-screen photo viewer modal.
 * - Pinch to zoom (up to 4×)
 * - Spinner while the image loads over the network
 * - Graceful error state if the image fails to load
 * - Close button respects safe-area insets; hardware back supported
 */
export default function PhotoViewer({ uri, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  function handleOpen() {
    // Reset state each time the viewer becomes visible
    setLoading(true);
    setError(false);
  }

  return (
    <Modal
      visible={uri !== null}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <StatusBar hidden />
      <View style={styles.container}>

        {/* Zoomable image — ScrollView gives us pinch-to-zoom for free on iOS */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
          centerContent
        >
          <Image
            source={{ uri: uri ?? "" }}
            style={{ width, height }}
            contentFit="contain"
            onLoadStart={() => { setLoading(true); setError(false); }}
            onLoadEnd={()   =>   setLoading(false)}
            onError={()     => { setLoading(false); setError(true); }}
          />
        </ScrollView>

        {/* Loading spinner — centred over the image */}
        {loading && !error && (
          <ActivityIndicator
            size="large"
            color="rgba(255,255,255,0.85)"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        )}

        {/* Error state — broken image icon */}
        {error && (
          <View style={styles.errorWrap} pointerEvents="none">
            <Ionicons name="image-outline" size={56} color="rgba(255,255,255,0.35)" />
          </View>
        )}

        {/* Close button */}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
  },
});
