import React, { useMemo, useRef, useState } from "react";
import { Brand } from "@/constants/theme";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { getPublicTreeUrl } from "../utils/getPublicTreeUrl";

type Props = {
  visible: boolean;
  treeId: number | null;
  onClose: () => void;
};

export default function TreeQrCode({ visible, treeId, onClose }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const qrRef = useRef<QRCode | null>(null);

  const qrValue = useMemo(() => {
    if (treeId == null) return "";
    return getPublicTreeUrl(treeId);
  }, [treeId]);

  async function handleDownload() {
    if (treeId == null || !qrRef.current || isSaving) return;

    try {
      setIsSaving(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

      const base64Png: string = await new Promise((resolve, reject) => {
        try {
          qrRef.current?.toDataURL((data) => {
            if (!data) {
              reject(new Error("Could not generate QR image."));
              return;
            }
            resolve(data);
          });
        } catch (err) {
          reject(err);
        }
      });

      const fileUri = `${FileSystem.cacheDirectory}tree-${treeId}-qr.png`;

      await FileSystem.writeAsStringAsync(fileUri, base64Png, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: `Tree ${treeId} QR Code`,
      });
    } catch (error) {
      console.error("Failed to save/share QR code", error);
      Alert.alert("Error", "Failed to create QR image.");
    } finally {
      setIsSaving(false);
    }
  }

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
            <QRCode
              value={qrValue}
              size={220}
              getRef={(c) => {
                qrRef.current = c;
              }}
            />
          </View>

          <Text style={styles.url} numberOfLines={2}>
            {qrValue}
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleDownload}
              disabled={isSaving}
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? "Preparing..." : "Download QR"}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
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
    backgroundColor: "rgba(28,39,33,0.6)", // Brand.charcoal w/ opacity
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
    backgroundColor: Brand.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: Brand.charcoal,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Brand.charcoal,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.midGray,
    marginBottom: 18,
  },
  qrWrap: {
    backgroundColor: Brand.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.pale,
  },
  url: {
    marginTop: 16,
    fontSize: 12,
    color: Brand.midGray,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: Brand.mint,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: Brand.deep,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});