import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { CHAINS, ChainName, formatIls, PRICES } from "../data/prices";
import { ShoppingItem } from "../state/store";

function rowMin(chainPrices: Array<{ chain: ChainName; price: number }>): number {
  let m = Number.POSITIVE_INFINITY;
  for (const c of chainPrices) m = Math.min(m, c.price);
  return m === Number.POSITIVE_INFINITY ? 0 : m;
}

export function CompareModal({
  visible,
  onClose,
  items,
  totalsByChain,
}: {
  visible: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  totalsByChain: Record<ChainName, number>;
}) {
  const sortedChains = useMemo(() => {
    return [...CHAINS].sort((a, b) => (totalsByChain[a] ?? 0) - (totalsByChain[b] ?? 0));
  }, [totalsByChain]);

  const cheapest = sortedChains[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>השוואת מחירים מלאה</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>סה״כ לפי רשת</Text>
            <View style={styles.chainList}>
              {sortedChains.map((chain) => {
                const isBest = chain === cheapest;
                return (
                  <View key={chain} style={[styles.chainRow, isBest && styles.chainRowBest]}>
                    <View style={styles.chainLeft}>
                      {isBest && <Ionicons name="checkmark-circle" size={18} color={Colors.green} />}
                      <Text style={[styles.chainTotal, isBest && styles.chainTotalBest]}>
                        {formatIls(totalsByChain[chain] ?? 0)}
                      </Text>
                    </View>
                    <Text style={[styles.chainName, isBest && styles.chainNameBest]}>{chain}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>טבלת השוואה</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                {sortedChains.map((chain) => (
                  <Text key={chain} style={styles.tableHeaderCell} numberOfLines={1}>
                    {chain}
                  </Text>
                ))}
                <Text style={[styles.tableHeaderCell, styles.tableHeaderFirst]} numberOfLines={1}>
                  מוצר
                </Text>
              </View>

              {items
                .filter((i) => i.qty > 0)
                .map((item) => {
                  const prices = sortedChains.map((chain) => ({
                    chain,
                    price: (PRICES[chain][item.id] ?? 0) * item.qty,
                  }));
                  const min = rowMin(prices);
                  return (
                    <View key={item.id} style={styles.tableRow}>
                      {prices.map(({ chain, price }) => {
                        const isMin = price === min && price > 0;
                        return (
                          <View key={chain} style={[styles.tableCell, isMin && styles.tableCellMin]}>
                            <Text style={[styles.tableCellText, isMin && styles.tableCellTextMin]}>
                              {price > 0 ? formatIls(price) : "—"}
                            </Text>
                          </View>
                        );
                      })}
                      <View style={[styles.tableCell, styles.tableFirst]}>
                        <Text style={styles.tableProduct} numberOfLines={1}>
                          {item.nameHe} × {item.qty}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.closeBtnText}>סגור</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.backdrop,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "86%",
    backgroundColor: Colors.bg,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.muted,
    textAlign: "right",
    marginBottom: 10,
  },
  chainList: {
    gap: 8,
  },
  chainRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chainRowBest: {
    borderColor: "rgba(33,181,115,0.35)",
    backgroundColor: Colors.greenSoft,
  },
  chainName: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  chainNameBest: {
    color: Colors.green,
  },
  chainLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  chainTotal: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "left",
  },
  chainTotalBest: {
    color: Colors.green,
  },
  table: {
    marginTop: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tableHeaderRow: {
    flexDirection: "row-reverse",
    backgroundColor: "#F0FBF8",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderCell: {
    width: 92,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.muted,
    textAlign: "right",
  },
  tableHeaderFirst: {
    flex: 1,
    width: "auto",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCell: {
    width: 92,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  tableCellMin: {
    backgroundColor: Colors.greenSoft,
  },
  tableCellText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  tableCellTextMin: {
    color: Colors.green,
  },
  tableFirst: {
    flex: 1,
    width: "auto",
  },
  tableProduct: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
    color: Colors.text,
    textAlign: "right",
  },
  closeBtn: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: Colors.tealDark,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Assistant_700Bold",
  },
});

