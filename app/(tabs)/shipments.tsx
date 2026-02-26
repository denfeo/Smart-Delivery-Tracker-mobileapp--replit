import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment, ShipmentStatus } from "@/contexts/DeliveryContext";

const FILTERS: (ShipmentStatus | "All")[] = ["All", "Transit", "On Process", "Delivered", "Pending"];

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Transit"
      ? Colors.transit
      : status === "Delivered"
      ? Colors.success
      : status === "On Process"
      ? Colors.info
      : Colors.accent;
  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function ShipmentRow({ item, onDelete }: { item: Shipment; onDelete: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const iconBg =
    item.status === "Delivered"
      ? Colors.success + "15"
      : item.status === "Transit"
      ? Colors.transit + "15"
      : Colors.accent + "15";
  const iconColor =
    item.status === "Delivered"
      ? Colors.success
      : item.status === "Transit"
      ? Colors.transit
      : Colors.accent;

  return (
    <Animated.View entering={FadeInRight} style={animStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/shipment/[id]", params: { id: item.id } });
        }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert("Delete Shipment", "Remove this shipment from your list?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        }}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons
            name={item.status === "Delivered" ? "package-variant-closed-check" : "package-variant"}
            size={24}
            color={iconColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTrackingId}>ID: {item.trackingId}</Text>
          <Text style={styles.rowItemName} numberOfLines={1}>{item.itemName}</Text>
          <View style={styles.rowMeta}>
            <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.rowMetaText}>{item.from} → {item.to}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <StatusBadge status={item.status} />
          <Text style={styles.rowDate}>{item.createdDate}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const { shipments, deleteShipment } = useDelivery();
  const [filter, setFilter] = useState<ShipmentStatus | "All">("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const filtered = filter === "All" ? shipments : shipments.filter((s) => s.status === filter);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shipments</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/new-delivery");
          }}
        >
          <Ionicons name="add" size={22} color={Colors.textLight} />
        </Pressable>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        renderItem={({ item }) => {
          const active = filter === item;
          return (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(item);
              }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
        style={styles.filtersList}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShipmentRow item={item} onDelete={() => deleteShipment(item.id)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed-remove" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>No shipments</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "All" ? "Create your first delivery" : `No ${filter} shipments`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersList: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textLight,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTrackingId: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  rowItemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  rowMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  rowDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
