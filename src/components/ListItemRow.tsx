import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { formatIls } from "../data/prices";

export function ListItemRow({
  icon,
  nameHe,
  avgNational,
  qty,
  checked,
  onPressCompare,
  onInc,
  onDec,
  onRemove,
  onToggleChecked,
}: {
  icon: string;
  nameHe: string;
  avgNational: number;
  qty: number;
  checked: boolean;
  onPressCompare: () => void;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  onToggleChecked: () => void;
}) {
  return (
    <View style={[styles.card, checked && styles.cardChecked]}>
      <View style={[styles.sideStripe, checked && styles.sideStripeChecked]} />
      {/* checkbox far right (RTL) */}
      <Pressable onPress={onToggleChecked} style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.8 }]}>
        <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
          {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </Pressable>

      <View style={styles.middle}>
        <Text style={[styles.name, checked && styles.nameChecked]} numberOfLines={1}>
          {nameHe}
        </Text>
        <Pressable onPress={onPressCompare} style={({ pressed }) => [styles.subWrap, pressed && { opacity: 0.75 }]}>
          <Text style={styles.sub} numberOfLines={1}>
            ממוצע ארצי משוער: {formatIls(avgNational)} • לחץ להשוואה
          </Text>
        </Pressable>
        <View style={styles.controlsRow}>
          <Pressable onPress={onInc} style={({ pressed }) => [styles.qBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="add" size={16} color={Colors.text} />
          </Pressable>
          <Text style={styles.qtyText}>{qty}</Text>
          <Pressable onPress={onDec} style={({ pressed }) => [styles.qBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="remove" size={16} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.leftSide}>
        <Pressable onPress={onRemove} style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </Pressable>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardChecked: {
    opacity: 0.75,
  },
  sideStripe: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "rgba(26,174,159,0.35)",
  },
  sideStripeChecked: {
    backgroundColor: "rgba(33,181,115,0.45)",
  },
  checkbox: {
    padding: 4,
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(26,174,159,0.40)",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  nameChecked: {
    textDecorationLine: "line-through",
    color: Colors.muted,
  },
  subWrap: {
    marginTop: 4,
  },
  sub: {
    fontSize: 12,
    color: Colors.muted,
    fontFamily: "Assistant_400Regular",
    textAlign: "right",
  },
  controlsRow: {
    marginTop: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  qBtn: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    minWidth: 18,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  leftSide: {
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 10,
  },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: Colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(33,181,115,0.22)",
  },
  emoji: {
    fontSize: 18,
  },
});

