import React from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";

type Props = {
  value: string | null; // local device URI, null if none selected
  onChange: (uri: string | null) => void;
};

export default function PhotoPicker({ value, onChange }: Props) {
  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library in Settings."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow camera access in Settings."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  }

  function promptSource() {
    Alert.alert("Add photo", undefined, [
      { text: "Camera",        onPress: pickFromCamera  },
      { text: "Photo Library", onPress: pickFromLibrary },
      { text: "Cancel",        style: "cancel"          },
    ]);
  }

  if (value) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        <Pressable
          style={styles.removeBtn}
          onPress={() => onChange(null)}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={24} color={Brand.charcoal} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.addBtn} onPress={promptSource}>
      <Ionicons name="camera-outline" size={28} color={Brand.softGray} />
      <Text style={styles.addBtnText}>Add a photo</Text>
      <Text style={styles.addBtnSub}>Camera or library</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    backgroundColor: Brand.offWhite,
    paddingVertical: 36,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Brand.midGray,
  },
  addBtnSub: {
    fontSize: 12,
    color: Brand.softGray,
  },

  previewWrap: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Brand.white,
    borderRadius: 12,
  },
});
