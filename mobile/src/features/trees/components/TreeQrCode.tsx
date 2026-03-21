import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { getPublicTreeUrl } from "../utils/getPublicTreeUrl";

type Props = {
  visible: boolean;
  treeId: number | null;
  onClose: () => void;
};

export default function TreeQrCode({ visible, treeId, onClose }: Props) {
  const qrValue = useMemo(() => {
    if (treeId == null) return "";
    console.log("Generating QR code for tree ID:", getPublicTreeUrl(treeId));
    return getPublicTreeUrl(treeId);
  }, [treeId]);

  if (treeId == null) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>Tree QR Code</Text>
          <Text style={styles.subtitle}>Tree ID: {treeId}</Text>

          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={220} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 18,
  },
  qrWrap: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
  },
  url: {
    marginTop: 16,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});