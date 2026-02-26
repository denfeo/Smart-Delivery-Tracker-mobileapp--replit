import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment } from "@/contexts/DeliveryContext";

const { width } = Dimensions.get("window");
const MAP_HEIGHT = 280;

function PulsingDot() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.2]) }],
  }));

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseOuter, outerStyle]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

function MapView({ shipment }: { shipment: Shipment }) {
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapBg}>
        {/* Grid lines for map feel */}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.mapGridH, { top: (MAP_HEIGHT / 6) * i }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.mapGridV, { left: (width / 8) * i }]} />
        ))}

        {/* Route path */}
        <View style={styles.routeLine}>
          <View style={styles.routeLineSegment1} />
          <View style={styles.routeLineSegment2} />
        </View>

        {/* Origin dot */}
        <View style={[styles.originDot, { bottom: 60, left: 60 }]}>
          <Ionicons name="navigate" size={18} color={Colors.text} />
        </View>

        {/* Destination pin */}
        <View style={[styles.destinationPin, { top: 50, right: 80 }]}>
          <View style={styles.pinCircle}>
            <View style={styles.pinInner} />
          </View>
          <View style={styles.pinStem} />
        </View>

        {/* Current position */}
        <View style={[styles.courierPosition, { bottom: 95, left: 140 }]}>
          <PulsingDot />
        </View>
      </View>

      {/* Map overlay gradient */}
      <View style={styles.mapOverlay} pointerEvents="none" />
    </View>
  );
}

function ProgressTimeline({ progress }: { progress: number }) {
  const steps = [
    { label: "Order Placed", icon: "checkmark-circle" as const, done: true },
    { label: "Picked Up", icon: "checkmark-circle" as const, done: progress > 0.1 },
    { label: "In Transit", icon: progress > 0.4 ? "checkmark-circle" as const : "radio-button-on" as const, done: progress > 0.4 },
    { label: "Delivered", icon: "checkmark-circle" as const, done: progress >= 1 },
  ];
  return (
    <View style={styles.timeline}>
      {steps.map((step, i) => (
        <View key={i} style={styles.timelineStep}>
          <View style={styles.timelineLeft}>
            <Ionicons
              name={step.icon}
              size={20}
              color={step.done ? Colors.accent : Colors.border}
            />
            {i < steps.length - 1 && (
              <View style={[styles.timelineConnector, step.done && styles.timelineConnectorActive]} />
            )}
          </View>
          <Text style={[styles.timelineLabel, step.done && styles.timelineLabelActive]}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ShipmentSelector({
  shipments,
  selected,
  onSelect,
}: {
  shipments: Shipment[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorContent}>
      {shipments.map((s) => {
        const active = s.id === selected;
        return (
          <Pressable
            key={s.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(s.id);
            }}
            style={[styles.selectorChip, active && styles.selectorChipActive]}
          >
            <Text style={[styles.selectorText, active && styles.selectorTextActive]} numberOfLines={1}>
              {s.trackingId}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const activeShipments = shipments.filter((s) => s.status !== "Delivered");
  const [selectedId, setSelectedId] = useState(activeShipments[0]?.id ?? shipments[0]?.id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selected = shipments.find((s) => s.id === selectedId) ?? shipments[0];

  if (!selected) {
    return (
      <View style={[styles.root, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>No active shipments</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push("/new-delivery")}>
          <Text style={styles.emptyBtnText}>Create Delivery</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Location Tracking</Text>
        <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
        </Pressable>
      </View>

      {/* Selector */}
      <ShipmentSelector
        shipments={shipments}
        selected={selectedId}
        onSelect={setSelectedId}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      >
        {/* Map */}
        <MapView shipment={selected} />

        {/* Dark Detail Card */}
        <View style={styles.detailCard}>
          {/* Booking ID & Status */}
          <View style={styles.detailCardHeader}>
            <View>
              <Text style={styles.detailLabel}>Booking Id:</Text>
              <Text style={styles.detailBookingId}>{selected.trackingId}</Text>
            </View>
            <View>
              <Text style={[styles.detailLabel, { textAlign: "right" }]}>Status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{selected.status}</Text>
              </View>
            </View>
          </View>

          {/* Progress timeline */}
          <ProgressTimeline progress={selected.progress} />

          {/* Dates */}
          <View style={styles.datesRow}>
            <View>
              <Text style={styles.detailLabel}>Created, {selected.createdDate}</Text>
              <Text style={styles.detailCity}>{selected.from}</Text>
            </View>
            <MaterialCommunityIcons name="package-variant" size={50} color="#C0924A" />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.detailLabel}>Estimated, {selected.estimatedDate}</Text>
              <Text style={styles.detailCity}>{selected.to}</Text>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Form</Text>
              <Text style={styles.metaValue}>{selected.from}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>To</Text>
              <Text style={styles.metaValue}>{selected.to}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaValue}>{selected.customer}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Order Cost</Text>
              <Text style={styles.metaValue}>{selected.orderCost}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Quantity</Text>
              <Text style={styles.metaValue}>{selected.quantity}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Weight</Text>
              <Text style={styles.metaValue}>{selected.weight}</Text>
            </View>
          </View>

          {/* Courier */}
          <View style={styles.courierRow}>
            <View style={styles.courierAvatarCircle}>
              <Text style={styles.courierAvatarText}>{selected.courierAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{selected.courierName}</Text>
              <Text style={styles.courierRole}>Courier</Text>
            </View>
            <Pressable
              style={[styles.courierActionBtn, { backgroundColor: Colors.accent }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="call" size={18} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.courierActionBtn, { backgroundColor: "#FFF" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/chat/[id]", params: { id: selected.id } });
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.text} />
            </Pressable>
          </View>
        </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  selectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  selectorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectorTextActive: {
    color: "#FFF",
  },
  mapContainer: {
    height: MAP_HEIGHT,
    marginHorizontal: 0,
    overflow: "hidden",
  },
  mapBg: {
    flex: 1,
    backgroundColor: "#E8EFF4",
    position: "relative",
  },
  mapGridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#D0DBE2",
  },
  mapGridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#D0DBE2",
  },
  routeLine: {
    position: "absolute",
    bottom: 80,
    left: 80,
    width: 220,
    height: 2,
  },
  routeLineSegment1: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 100,
    height: 2,
    backgroundColor: "#888",
    borderRadius: 1,
  },
  routeLineSegment2: {
    position: "absolute",
    bottom: 0,
    left: 100,
    width: 120,
    height: 2,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#AAA",
  },
  originDot: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  destinationPin: {
    position: "absolute",
    alignItems: "center",
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  pinStem: {
    width: 2,
    height: 8,
    backgroundColor: Colors.accent,
  },
  courierPosition: {
    position: "absolute",
  },
  pulseWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseOuter: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "transparent",
  },
  detailCard: {
    backgroundColor: Colors.darkCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    marginTop: -14,
  },
  detailCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  detailBookingId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.transit,
    marginTop: 4,
  },
  statusPillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFF",
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  timelineStep: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  timelineLeft: {
    alignItems: "center",
  },
  timelineConnector: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 2,
  },
  timelineConnectorActive: {
    backgroundColor: Colors.accent,
  },
  timelineLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  timelineLabelActive: {
    color: "rgba(255,255,255,0.85)",
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: Colors.darkCardSecondary,
    borderRadius: 14,
    padding: 14,
  },
  detailCity: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metaItem: {
    width: "45%",
  },
  metaLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  metaValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 2,
  },
  courierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  courierAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  courierAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#FFF",
  },
  courierName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  courierRole: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  courierActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginTop: 12,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFF",
  },
});
