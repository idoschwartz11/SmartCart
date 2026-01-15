import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

export function Header({
  onShare,
  onInStore,
}: {
  onShare: () => void;
  onInStore: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        <Pressable onPress={onShare} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="share-social-outline" size={20} color={Colors.tealDark} />
        </Pressable>

        <Text style={styles.title}>הרשימה שלנו</Text>

        <Pressable onPress={onInStore} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.9 }]}>
          <View style={styles.pillRow}>
            <Text style={styles.pillText}>אני בסופר</Text>
            <Ionicons name="cart-outline" size={18} color={Colors.tealDark} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.teal,
    paddingBottom: 18,
  },
  wrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Assistant_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },
  pillRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Assistant_700Bold",
    color: Colors.tealDark,
    textAlign: "right",
  },
});

