import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, ShipmentStatus } from "@/contexts/DeliveryContext";

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

function ProgressBar({ progress }: { progress: number }) {
  const steps = ["Confirmed", "Dispatched", "In Transit", "Delivered"];
  const activeStep = Math.floor(progress * (steps.length - 1));
  return (
    <View>
      <View style={styles.progressContainer}>
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            <View
              style={[
                styles.progressDot,
                i <= activeStep && styles.progressDotActive,
              ]}
            />
            {i < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  i < activeStep && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.progressLabels}>
        {steps.map((step, i) => (
          <Text
            key={i}
            style={[styles.progressLabel, i <= activeStep && styles.progressLabelActive]}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const STATUSES: ShipmentStatus[] = ["Pending", "On Process", "Transit", "Delivered"];

export default function ShipmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shipments, updateStatus, deleteShipment } = useDelivery();

  const shipment = shipments.find((s) => s.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!shipment) {
    return (
      <View style={[styles.root, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={styles.notFound}>Shipment not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleStatusUpdate = (status: ShipmentStatus) => {
    Alert.alert("Update Status", `Change status to "${status}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          updateStatus(shipment.id, status);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Shipment", "Remove this shipment permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteShipment(shipment.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backCircle}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Shipment Detail</Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 30 }]}
      >
        {/* Main Info */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <View>
              <Text style={styles.trackingLabel}>Tracking ID</Text>
              <Text style={styles.trackingId}>{shipment.trackingId}</Text>
            </View>
            <StatusBadge status={shipment.status} />
          </View>
          <View style={styles.itemRow}>
            <MaterialCommunityIcons name="package-variant-closed" size={40} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{shipment.itemName}</Text>
              <Text style={styles.itemMeta}>{shipment.quantity} · {shipment.weight}</Text>
            </View>
          </View>
          <ProgressBar progress={shipment.progress} />
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Information</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationCol}>
              <View style={styles.locationDot} />
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationCity}>{shipment.from}</Text>
              <Text style={styles.locationDate}>{shipment.createdDate}</Text>
            </View>
            <View style={styles.locationArrow}>
              <View style={styles.locationLine} />
              <MaterialCommunityIcons name="truck-delivery-outline" size={24} color={Colors.accent} />
              <View style={styles.locationLine} />
            </View>
            <View style={[styles.locationCol, { alignItems: "flex-end" }]}>
              <View style={[styles.locationDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationCity}>{shipment.to}</Text>
              <Text style={styles.locationDate}>Est. {shipment.estimatedDate}</Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={styles.detailGrid}>
            {[
              { label: "Customer", value: shipment.customer },
              { label: "Order Cost", value: shipment.orderCost },
              { label: "Quantity", value: shipment.quantity },
              { label: "Weight", value: shipment.weight },
            ].map((item) => (
              <View key={item.label} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Update Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map((status) => {
              const active = shipment.status === status;
              const color =
                status === "Transit"
                  ? Colors.transit
                  : status === "Delivered"
                  ? Colors.success
                  : status === "On Process"
                  ? Colors.info
                  : Colors.accent;
              return (
                <Pressable
                  key={status}
                  onPress={() => handleStatusUpdate(status)}
                  style={[
                    styles.statusBtn,
                    { borderColor: color },
                    active && { backgroundColor: color },
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: active ? "#FFF" : color }]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Courier */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Courier</Text>
          <View style={styles.courierRow}>
            <View style={styles.courierAvatar}>
              <Text style={styles.courierAvatarText}>{shipment.courierAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{shipment.courierName}</Text>
              <Text style={styles.courierRole}>Assigned Courier</Text>
            </View>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="call" size={18} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: Colors.info + "15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/chat/[id]", params: { id: shipment.id } });
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.info} />
            </Pressable>
          </View>
        </View>

        {/* View on map */}
        <Pressable
          style={styles.trackBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/tracking");
          }}
        >
          <Ionicons name="map-outline" size={18} color="#FFF" />
          <Text style={styles.trackBtnText}>View on Map</Text>
        </Pressable>
      </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  mainCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mainCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  trackingLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trackingId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.text,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  itemName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  itemMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
  },
  progressLineActive: {
    backgroundColor: Colors.accent,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
  },
  progressLabelActive: {
    color: Colors.accent,
    fontFamily: "Poppins_600SemiBold",
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
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationCol: {
    flex: 1,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    marginBottom: 6,
  },
  locationArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  locationLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  locationLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  locationCity: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },
  locationDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  detailItem: {
    width: "45%",
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  courierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  courierAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  courierAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FFF",
  },
  courierName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  courierRole: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.text,
    borderRadius: 16,
    paddingVertical: 16,
  },
  trackBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFF",
  },
  notFound: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
    fontSize: 14,
  },
});
