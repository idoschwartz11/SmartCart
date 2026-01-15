import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export function ActionButton({
  title,
  icon,
  onPress,
  variant = "primary",
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.title, variant === "primary" ? styles.titlePrimary : styles.titleSecondary]}>
          {title}
        </Text>
        <View style={styles.iconWrap}>{icon}</View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primary: {
    backgroundColor: Colors.teal,
  },
  secondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Assistant_700Bold",
    textAlign: "right",
    flexShrink: 1,
  },
  titlePrimary: {
    color: "#FFFFFF",
  },
  titleSecondary: {
    color: Colors.text,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
});

