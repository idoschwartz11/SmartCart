import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Colors } from "../theme/colors";

export function SearchBar({
  value,
  onChangeText,
  onPressAdd,
  hint,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onPressAdd: () => void;
  hint?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPressAdd} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.addBtnText}>הוסף +</Text>
      </Pressable>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="מה להוסיף?"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          textAlign="right"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row-reverse",
    alignItems: "stretch",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Assistant_400Regular",
    color: Colors.text,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.muted,
    fontFamily: "Assistant_400Regular",
    textAlign: "right",
  },
  addBtn: {
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: Colors.tealDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
  },
});

