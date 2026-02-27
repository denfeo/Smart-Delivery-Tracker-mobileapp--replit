import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  PanResponder,
  Animated as RNAnimated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeOutLeft,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment } from "@/contexts/DeliveryContext";

const STATUS_LABELS: Record<string, string> = {
  Transit: "В пути",
  Delivered: "Доставлено",
  "On Process": "Обработка",
  Pending: "Ожидает",
};

const STATUS_COLORS: Record<string, string> = {
  Transit: Colors.transit,
  Delivered: Colors.success,
  "On Process": Colors.info,
  Pending: Colors.accent,
};

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "Transit", label: "В пути" },
  { key: "On Process", label: "Обработка" },
  { key: "Delivered", label: "Доставлено" },
  { key: "Pending", label: "Ожидает" },
];

const SWIPE_THRESHOLD = -70;

function SwipeableRow({
  item,
  index,
  onDelete,
}: {
  item: Shipment;
  index: number;
  onDelete: (id: string) => void;
}) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        const x = Math.min(0, Math.max(-120, g.dx));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          RNAnimated.spring(translateX, { toValue: -88, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
          setSwiped(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
          setSwiped(false);
        }
      },
    })
  ).current;

  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = STATUS_COLORS[item.status] ?? Colors.accent;

  const close = () => {
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
    setSwiped(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Удалить посылку",
      `Удалить "${item.itemName}"?`,
      [
        { text: "Отмена", style: "cancel", onPress: close },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(item.id);
          },
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).springify()} style={styles.swipeContainer}>
      {/* Delete background */}
      <View style={styles.deleteBackground}>
        <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={22} color="#FFF" />
          <Text style={styles.deleteBtnText}>Удалить</Text>
        </Pressable>
      </View>

      <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <Animated.View style={scaleStyle}>
          <Pressable
            onPressIn={() => { if (!swiped) scale.value = withSpring(0.97, { damping: 15 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
            onPress={() => {
              if (swiped) { close(); return; }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/shipment/[id]", params: { id: item.id } });
            }}
            style={styles.row}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: color + "15" }]}>
              <MaterialCommunityIcons
                name={item.status === "Delivered" ? "package-variant-closed-check" : "package-variant-closed"}
                size={26}
                color={color}
              />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowItemName} numberOfLines={1}>{item.itemName}</Text>
              <Text style={styles.rowTrackingId}>#{item.trackingId}</Text>
              <View style={styles.rowRoute}>
                <Ionicons name="radio-button-on" size={9} color={Colors.accent} />
                <Text style={styles.rowRouteText} numberOfLines={1}>{item.from}</Text>
                <Ionicons name="chevron-forward" size={9} color={Colors.textSecondary} />
                <Text style={styles.rowRouteText} numberOfLines={1}>{item.to}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={[styles.statusBadge, { backgroundColor: color + "15" }]}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
              <View style={styles.swipeHint}>
                <Ionicons name="chevron-back" size={11} color={Colors.textSecondary} />
                <Ionicons name="chevron-back" size={11} color={Colors.border} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </RNAnimated.View>
    </Animated.View>
  );
}

export default function ShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const { shipments, deleteShipment } = useDelivery();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = shipments.filter((s) => {
    const matchesFilter = activeFilter === "all" || s.status === activeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      s.itemName.toLowerCase().includes(q) ||
      s.trackingId.toLowerCase().includes(q) ||
      s.from.toLowerCase().includes(q) ||
      s.to.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const counts: Record<string, number> = {
    all: shipments.length,
    Transit: shipments.filter((s) => s.status === "Transit").length,
    "On Process": shipments.filter((s) => s.status === "On Process").length,
    Delivered: shipments.filter((s) => s.status === "Delivered").length,
    Pending: shipments.filter((s) => s.status === "Pending").length,
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Мои посылки</Text>
          <Text style={styles.headerSub}>{shipments.length} посылок · потяните влево для удаления</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/new-delivery"); }}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию или номеру..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.key;
          return (
            <Pressable
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(item.key); }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{item.label}</Text>
              <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                  {counts[item.key] ?? 0}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SwipeableRow item={item} index={index} onDelete={deleteShipment} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed-remove" size={56} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Посылок не найдено</Text>
            <Text style={styles.emptySubtitle}>Попробуйте изменить фильтры или создать новую доставку</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push("/new-delivery")}>
              <Ionicons name="add-circle-outline" size={17} color="#FFF" />
              <Text style={styles.emptyBtnText}>Новая доставка</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 10,
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center", elevation: 4,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, elevation: 1,
  },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.text },
  filtersRow: { paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: Colors.cardBackground,
  },
  filterChipActive: { backgroundColor: Colors.accent },
  filterChipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.textSecondary },
  filterChipTextActive: { color: "#FFF" },
  filterCount: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterCountText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: Colors.textSecondary },
  filterCountTextActive: { color: "#FFF" },
  list: { paddingHorizontal: 20 },
  swipeContainer: { marginBottom: 10, position: "relative", overflow: "hidden", borderRadius: 18 },
  deleteBackground: {
    position: "absolute", right: 0, top: 0, bottom: 0, width: 88,
    backgroundColor: "#FF3B30", borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  deleteBtn: { alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 16 },
  deleteBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#FFF" },
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.cardBackground, borderRadius: 18, padding: 14, elevation: 2,
  },
  rowIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowInfo: { flex: 1, marginRight: 6 },
  rowItemName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.text },
  rowTrackingId: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  rowRoute: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rowRouteText: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.textSecondary, maxWidth: 65 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  swipeHint: { flexDirection: "row", alignItems: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text, marginTop: 8 },
  emptySubtitle: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16, elevation: 3,
  },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
});
