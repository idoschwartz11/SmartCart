import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";

export function SummaryCard({
  title,
  rightIconName,
  main,
  sub,
  ctaText,
  onPressCta,
  variant = "default",
}: {
  title: string;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  main: string;
  sub?: string;
  ctaText?: string;
  onPressCta?: () => void;
  variant?: "default" | "highlight";
}) {
  const gradientColors =
    variant === "highlight"
      ? (["#E7FAF2", "#EAFBF7", "#FFFFFF"] as const)
      : (["#FFF3E7", "#F3FBF7", "#FFFFFF"] as const);

  return (
    <View style={[styles.card, variant === "highlight" && styles.highlight]}>
      <LinearGradient colors={[...gradientColors]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.grad}>
        <View style={styles.topRow}>
          {!!rightIconName && <Ionicons name={rightIconName} size={18} color={Colors.muted} />}
          <Text style={styles.title}>{title}</Text>
        </View>

        <Text style={styles.main}>{main}</Text>
        {!!sub && <Text style={styles.sub}>{sub}</Text>}

        {!!ctaText && !!onPressCta && (
          <Pressable onPress={onPressCta} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}>
            <Text style={styles.ctaText}>{ctaText}</Text>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  highlight: {
    borderColor: "rgba(26,174,159,0.35)",
    backgroundColor: Colors.card,
  },
  grad: {
    borderRadius: 18,
    padding: 14,
  },
  topRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Assistant_700Bold",
    color: Colors.muted,
    textAlign: "right",
  },
  main: {
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  sub: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.muted,
    fontFamily: "Assistant_400Regular",
    textAlign: "right",
    lineHeight: 16,
  },
  cta: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(33,181,115,0.28)",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.green,
    textAlign: "center",
  },
});

