import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/constants/theme";
import type { ObservationItem } from "../observations.types";

type Props = {
  item: ObservationItem;
  isInitial: boolean;
  /** Called with the photo URL when the thumbnail is tapped. */
  onPhotoPress?: (uri: string) => void;
};

export default function ObservationCard({ item, isInitial, onPhotoPress }: Props) {
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError,   setImgError]   = useState(false);

  const dateLabel = item.observedAt ?? item.createdAt;
  const formattedDate = dateLabel
    ? new Date(dateLabel.replace(" ", "T").replace(/\+(\d{2})$/, "+$1:00")).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <View style={styles.card}>
      {/* Photo thumbnail or placeholder */}
      <Pressable
        style={styles.thumb}
        onPress={item.photoKey && onPhotoPress ? () => onPhotoPress(item.photoKey!) : undefined}
        disabled={!item.photoKey || !onPhotoPress}
      >
        {item.photoKey && !imgError ? (
          <>
            <Image
              source={{ uri: item.photoKey }}
              style={styles.thumbImage}
              contentFit="cover"
              onLoadStart={() => setImgLoading(true)}
              onLoadEnd={()   => setImgLoading(false)}
              onError={()     => { setImgLoading(false); setImgError(true); }}
            />
            {imgLoading && (
              <ActivityIndicator
                size="small"
                color={Brand.primary}
                style={StyleSheet.absoluteFillObject}
              />
            )}
          </>
        ) : (
          <Ionicons name="image-outline" size={22} color={Brand.softGray} />
        )}
      </Pressable>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {isInitial && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>INITIAL</Text>
            </View>
          )}
          {item.title ? (
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
        </View>

        {item.noteText ? (
          <Text style={styles.note} numberOfLines={2}>
            {item.noteText}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {item.authorName ? (
            <View style={styles.footerItem}>
              <Ionicons name="person-outline" size={11} color={Brand.softGray} />
              <Text style={styles.footerText}>{item.authorName}</Text>
            </View>
          ) : null}
          {formattedDate ? (
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={11} color={Brand.softGray} />
              <Text style={styles.footerText}>{formattedDate}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Brand.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.pale,
  },

  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Brand.offWhite,
    borderWidth: 1,
    borderColor: Brand.pale,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },

  body: {
    flex: 1,
    gap: 4,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: Brand.amber,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Brand.white,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Brand.charcoal,
    flexShrink: 1,
  },

  note: {
    fontSize: 12,
    color: Brand.midGray,
    lineHeight: 17,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  footerText: {
    fontSize: 11,
    color: Brand.softGray,
  },
});
