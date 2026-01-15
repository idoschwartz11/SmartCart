/**
 * SmartCart (Expo + React Native + TypeScript)
 *
 * Minimal dependency used for icons:
 *   - expo install @expo/vector-icons
 *
 * UI deps:
 *   - npx expo install expo-linear-gradient
 *   - npm i @expo-google-fonts/assistant
 */
import React, { useEffect } from "react";
import { I18nManager, StatusBar, StyleSheet, View } from "react-native";
import { ShoppingListScreen } from "./src/screens/ShoppingListScreen";
import { StoreProvider } from "./src/state/store";
import { Colors } from "./src/theme/colors";
import { useFonts, Assistant_400Regular, Assistant_700Bold } from "@expo-google-fonts/assistant";

export default function App() {
  const [fontsLoaded] = useFonts({
    Assistant_400Regular,
    Assistant_700Bold,
  });

  useEffect(() => {
    // Keep RTL consistent; on a fresh install this should already be RTL on Hebrew devices.
    // Note: forcing RTL at runtime may require a full reload to take effect.
    I18nManager.allowRTL(true);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <StoreProvider>
      <View style={styles.app}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.teal} translucent={false} />
        <ShoppingListScreen />
      </View>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});

