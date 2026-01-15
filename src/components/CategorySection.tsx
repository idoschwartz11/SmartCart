import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export function CategorySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  badge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(33,181,115,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.green,
  },
  body: {
    gap: 10,
  },
});

