import React, { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { SummaryCard } from "../components/SummaryCard";
import { ActionButton } from "../components/ActionButton";
import { SearchBar } from "../components/SearchBar";
import { CategorySection } from "../components/CategorySection";
import { ListItemRow } from "../components/ListItemRow";
import { CompareModal } from "../components/CompareModal";
import { CATALOG, CATEGORIES_ORDER } from "../data/catalog";
import { formatIls } from "../data/prices";
import { Colors } from "../theme/colors";
import { useStore } from "../state/store";

function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    out[item.category] = out[item.category] ?? [];
    out[item.category].push(item);
  }
  return out;
}

export function ShoppingListScreen() {
  const { state, dispatch, derived, data } = useStore();
  const [query, setQuery] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);

  const catalog = data.catalog;

  const hint = useMemo(() => {
    const q = query.trim();
    if (!q) return undefined;
    const matches = catalog.filter((c) => c.nameHe.includes(q));
    if (matches.length === 0) return "לא נמצא מוצר — אפשר להוסיף כפריט מותאם";
    return `נמצאו: ${matches.slice(0, 3).map((m) => m.nameHe).join(" • ")}${matches.length > 3 ? "…" : ""}`;
  }, [query, catalog]);

  const estimatedTotal = useMemo(() => {
    let sum = 0;
    for (const item of state.items) {
      const avg = derived.averageNationalPriceById[item.id] ?? 0;
      sum += avg * (item.qty || 0);
    }
    return sum;
  }, [state.items, derived.averageNationalPriceById]);

  const savingsVsAvg = Math.max(0, derived.averageTotal - derived.cheapestTotal);

  const itemsWithIcons = useMemo(() => {
    const iconById = new Map(catalog.map((c) => [c.id, c.icon]));
    return state.items.map((i) => ({
      ...i,
      icon: iconById.get(i.id) ?? "🧾",
    }));
  }, [state.items, catalog]);

  const grouped = useMemo(() => groupByCategory(itemsWithIcons), [itemsWithIcons]);

  const onAdd = () => {
    const nameHe = query.trim();
    if (!nameHe) return;
    dispatch({ type: "add", payload: { nameHe } });
    setQuery("");
  };

  const onShare = async () => {
    const lines = state.items
      .filter((i) => i.qty > 0)
      .map((i) => `- ${i.nameHe} × ${i.qty}${i.checked ? " ✓" : ""}`);
    const message = `הרשימה שלנו\n\n${lines.join("\n")}\n\nסה״כ משוער: ${formatIls(estimatedTotal)}`;
    try {
      await Share.share({ message });
    } catch {
      // no-op
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeTop}>
        <Header
          onShare={onShare}
          onInStore={() => Alert.alert("מצב סופר", "דמו: כאן ניתן להפעיל מצב 'אני בסופר'.")}
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <SummaryCard
            title="סה״כ משוער"
            rightIconName="information-circle-outline"
            main={formatIls(estimatedTotal)}
            sub="מחושב לפי ממוצע ארצי משוער לכל מוצר"
          />
          <SummaryCard
            title="הסופר הזול ביותר"
            rightIconName="pricetag-outline"
            main={`${derived.cheapestChain}`}
            sub={`${formatIls(derived.cheapestTotal)} • חסכון מול ממוצע: ${formatIls(savingsVsAvg)}`}
            ctaText="לחץ להשוואה מלאה"
            onPressCta={() => setCompareOpen(true)}
            variant="highlight"
          />
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            title="סרוק מוצר או מדבקה"
            icon={<Ionicons name="camera-outline" size={18} color="#fff" />}
            onPress={() => Alert.alert("סריקה", "דמו: סריקה אינה זמינה בגרסת הדמו.")}
            variant="primary"
          />
          <ActionButton
            title="הצע פריטים עם AI"
            icon={<Ionicons name="sparkles-outline" size={18} color={Colors.tealDark} />}
            onPress={() => Alert.alert("AI", "דמו: הצעות AI אינן זמינות בגרסת הדמו.")}
            variant="secondary"
          />
        </View>

        <SearchBar value={query} onChangeText={setQuery} onPressAdd={onAdd} hint={hint} />

        {!!query.trim() && (
          <View style={styles.suggestionsWrap}>
            {catalog.filter((c) => c.nameHe.includes(query.trim()))
              .slice(0, 6)
              .map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    dispatch({ type: "add", payload: { nameHe: c.nameHe, category: c.category } });
                    setQuery("");
                  }}
                  style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.75 }]}
                >
                  <Text style={styles.suggestionText}>{c.nameHe}</Text>
                  <Text style={styles.suggestionIcon}>{c.icon}</Text>
                </Pressable>
              ))}
          </View>
        )}

        {CATEGORIES_ORDER.filter((cat) => (grouped[cat] ?? []).length > 0).map((cat) => (
          <CategorySection key={cat} title={cat} count={(grouped[cat] ?? []).length}>
            {(grouped[cat] ?? []).map((item) => (
              <ListItemRow
                key={item.id}
                icon={item.icon}
                nameHe={item.nameHe}
                avgNational={derived.averageNationalPriceById[item.id] ?? 0}
                qty={item.qty}
                checked={item.checked}
                onPressCompare={() => setCompareOpen(true)}
                onInc={() => dispatch({ type: "incQty", payload: { id: item.id } })}
                onDec={() => dispatch({ type: "decQty", payload: { id: item.id } })}
                onRemove={() => dispatch({ type: "remove", payload: { id: item.id } })}
                onToggleChecked={() => dispatch({ type: "toggleChecked", payload: { id: item.id } })}
              />
            ))}
          </CategorySection>
        ))}

        <View style={{ height: 26 }} />
      </ScrollView>

      <CompareModal
        visible={compareOpen}
        onClose={() => setCompareOpen(false)}
        items={state.items}
        totalsByChain={derived.totalsByChain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeTop: {
    backgroundColor: Colors.teal,
  },
  scroll: {
    paddingBottom: 30,
    paddingTop: 12,
  },
  summaryRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  actionsRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  suggestion: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "right",
  },
  suggestionIcon: {
    fontSize: 16,
  },
});

