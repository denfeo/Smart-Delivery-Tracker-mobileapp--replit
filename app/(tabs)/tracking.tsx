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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment } from "@/contexts/DeliveryContext";

const { width } = Dimensions.get("window");

const STATUS_RU: Record<string, string> = {
  Transit: "В пути",
  Delivered: "Доставлено",
  "On Process": "Обработка",
  Pending: "Ожидает",
};

const TIMELINE_STEPS = [
  { key: "order", label: "Заказ принят", icon: "checkmark-circle" as const },
  { key: "pickup", label: "Забрано", icon: "cube-outline" as const },
  { key: "transit", label: "В пути", icon: "car-outline" as const },
  { key: "delivery", label: "Доставлено", icon: "home-outline" as const },
];

function AnimatedTruckIcon() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons name="truck-fast-outline" size={32} color={Colors.accent} />
    </Animated.View>
  );
}

function PulsePin() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2.5, { duration: 1200 }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1200 }), -1, false);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pinWrap}>
      <Animated.View style={[styles.pinRing, ringStyle]} />
      <View style={styles.pinDot}>
        <Ionicons name="location" size={13} color="#FFF" />
      </View>
    </View>
  );
}

function TimelineStep({
  step,
  index,
  activeStep,
}: {
  step: (typeof TIMELINE_STEPS)[0];
  index: number;
  activeStep: number;
}) {
  const isDone = index < activeStep;
  const isActive = index === activeStep;

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 80).springify()}
      style={styles.timelineStep}
    >
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineCircle,
            isDone && styles.timelineCircleDone,
            isActive && styles.timelineCircleActive,
          ]}
        >
          <Ionicons
            name={isDone ? "checkmark" : step.icon}
            size={14}
            color={isDone || isActive ? "#FFF" : Colors.textSecondary}
          />
        </View>
        {index < TIMELINE_STEPS.length - 1 && (
          <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text
          style={[
            styles.timelineLabel,
            (isDone || isActive) && styles.timelineLabelActive,
          ]}
        >
          {step.label}
        </Text>
        {isActive && (
          <Text style={styles.timelineStatusText}>Текущий статус</Text>
        )}
      </View>
    </Animated.View>
  );
}

function ShipmentPickerItem({
  item,
  isSelected,
  onPress,
}: {
  item: Shipment;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.97, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
      >
        <View style={styles.pickerItemInner}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={18}
            color={isSelected ? "#FFF" : Colors.textSecondary}
          />
          <View>
            <Text
              style={[styles.pickerItemId, isSelected && styles.pickerItemIdActive]}
            >
              #{item.trackingId}
            </Text>
            <Text
              style={[styles.pickerItemName, isSelected && styles.pickerItemNameActive]}
              numberOfLines={1}
            >
              {item.itemName}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const [selectedId, setSelectedId] = useState(shipments[0]?.id ?? "");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const selected = shipments.find((s) => s.id === selectedId) ?? shipments[0];

  const activeStep = selected
    ? selected.status === "Delivered"
      ? 4
      : selected.status === "Transit"
      ? 2
      : selected.status === "On Process"
      ? 1
      : 0
    : 0;

  const mapProgress = useSharedValue(0);
  const truckX = useSharedValue(0);
  const mapWidth = width - 40;

  useEffect(() => {
    if (!selected) return;
    const target = selected.progress;
    mapProgress.value = withTiming(target, { duration: 900 });
    truckX.value = withTiming((mapWidth - 52) * target, { duration: 900 });
  }, [selected?.id, selected?.progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${mapProgress.value * 100}%`,
  }));

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckX.value }],
  }));

  if (!selected) {
    return (
      <View style={[styles.root, { paddingTop: topPad }]}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="map-search-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Нет посылок для отслеживания</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push("/new-delivery")}>
            <Text style={styles.emptyBtnText}>Создать доставку</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Отслеживание</Text>
            <Text style={styles.headerSub}>Статус в реальном времени</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </Animated.View>

        {/* Shipment picker */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickerRow}
          >
            {shipments.map((s) => (
              <ShipmentPickerItem
                key={s.id}
                item={s}
                isSelected={s.id === selectedId}
                onPress={() => setSelectedId(s.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Map card */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.mapCard}>
          <View style={styles.mapCardAccentBar} />

          {/* Mock map */}
          <View style={styles.mockMap}>
            <View style={styles.mockMapGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.mockMapRow}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <View key={j} style={styles.mockMapCell} />
                  ))}
                </View>
              ))}
            </View>

            {/* Route line */}
            <View style={styles.routeLine}>
              <View style={styles.routeLineBg} />
              <Animated.View style={[styles.routeLineFill, progressBarStyle]} />
            </View>

            {/* Origin */}
            <View style={[styles.mapPin, { left: 8, bottom: 20 }]}>
              <View style={[styles.mapPinDot, { backgroundColor: Colors.info }]} />
              <Text style={styles.mapPinLabel} numberOfLines={1}>{selected.from}</Text>
            </View>

            {/* Truck */}
            <Animated.View style={[styles.truckPin, truckStyle]}>
              <AnimatedTruckIcon />
            </Animated.View>

            {/* Destination */}
            <PulsePin />
            <View style={[styles.mapPin, { right: 8, top: 20 }]}>
              <View style={[styles.mapPinDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.mapPinLabel} numberOfLines={1}>{selected.to}</Text>
            </View>
          </View>

          {/* Info row */}
          <View style={styles.mapInfoRow}>
            <View style={styles.mapInfoItem}>
              <Ionicons name="location-outline" size={15} color={Colors.accent} />
              <View>
                <Text style={styles.mapInfoLabel}>Откуда</Text>
                <Text style={styles.mapInfoValue} numberOfLines={1}>{selected.from}</Text>
              </View>
            </View>
            <View style={styles.mapInfoDivider} />
            <View style={styles.mapInfoItem}>
              <Ionicons name="flag-outline" size={15} color={Colors.success} />
              <View>
                <Text style={styles.mapInfoLabel}>Куда</Text>
                <Text style={styles.mapInfoValue} numberOfLines={1}>{selected.to}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Status card */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.statusCard}>
          <View style={styles.statusCardTop}>
            <View>
              <Text style={styles.statusCardId}>#{selected.trackingId}</Text>
              <Text style={styles.statusCardName}>{selected.itemName}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    selected.status === "Transit"
                      ? Colors.transit + "20"
                      : selected.status === "Delivered"
                      ? Colors.success + "20"
                      : Colors.info + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      selected.status === "Transit"
                        ? Colors.transit
                        : selected.status === "Delivered"
                        ? Colors.success
                        : Colors.info,
                  },
                ]}
              >
                {STATUS_RU[selected.status] ?? selected.status}
              </Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.etaText}>
              Ожидаем{" "}
              <Text style={{ color: Colors.accent, fontFamily: "Poppins_600SemiBold" }}>
                {selected.estimatedDate}
              </Text>
            </Text>
          </View>

          {/* Chat with courier */}
          {selected.courierId && (
            <Pressable
              style={styles.chatBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: "/chat/[id]", params: { id: selected.id } });
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={17} color="#FFF" />
              <Text style={styles.chatBtnText}>Написать курьеру</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Timeline */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>История движения</Text>
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, index) => (
              <TimelineStep key={step.key} step={step} index={index} activeStep={activeStep} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, paddingBottom: 18,
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.success + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  liveText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: Colors.success },
  pickerRow: { gap: 8, paddingBottom: 16 },
  pickerItem: {
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, elevation: 2,
  },
  pickerItemActive: { backgroundColor: Colors.accent },
  pickerItemInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  pickerItemId: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text },
  pickerItemIdActive: { color: "#FFF" },
  pickerItemName: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary, maxWidth: 120 },
  pickerItemNameActive: { color: "rgba(255,255,255,0.8)" },
  mapCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 22,
    overflow: "hidden", marginBottom: 16, elevation: 4,
  },
  mapCardAccentBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    backgroundColor: Colors.accent, zIndex: 10,
  },
  mockMap: {
    height: 180, backgroundColor: "#E8EFF5",
    overflow: "hidden", position: "relative", marginTop: 3,
  },
  mockMapGrid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  mockMapRow: { flex: 1, flexDirection: "row" },
  mockMapCell: { flex: 1, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.05)" },
  routeLine: {
    position: "absolute", bottom: 52, left: 30, right: 30, height: 3, borderRadius: 1.5, overflow: "hidden",
  },
  routeLineBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.1)" },
  routeLineFill: { position: "absolute", top: 0, left: 0, bottom: 0, backgroundColor: Colors.accent },
  truckPin: {
    position: "absolute", bottom: 36, left: 8,
  },
  mapPin: {
    position: "absolute", flexDirection: "row", alignItems: "center", gap: 4,
  },
  mapPinDot: { width: 10, height: 10, borderRadius: 5 },
  mapPinLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 10, color: Colors.text,
    backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5,
    maxWidth: 80,
  },
  pinWrap: {
    position: "absolute", right: 20, top: 14, width: 26, height: 26, alignItems: "center", justifyContent: "center",
  },
  pinRing: {
    position: "absolute", width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accent + "30", borderWidth: 1, borderColor: Colors.accent + "50",
  },
  pinDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  mapInfoRow: {
    flexDirection: "row", padding: 16, alignItems: "center",
  },
  mapInfoItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  mapInfoDivider: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: 12 },
  mapInfoLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary },
  mapInfoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text, maxWidth: 110 },
  statusCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 22, padding: 18, marginBottom: 16, elevation: 3,
  },
  statusCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  statusCardId: { fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.text },
  statusCardName: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  etaText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.textSecondary },
  chatBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 13, elevation: 3,
  },
  chatBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
  timelineCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 22, padding: 18, marginBottom: 16, elevation: 3,
  },
  timelineTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.text, marginBottom: 16 },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: "row", alignItems: "flex-start" },
  timelineLeft: { alignItems: "center", width: 36 },
  timelineCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  timelineCircleDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  timelineCircleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  timelineLine: { width: 2, height: 36, backgroundColor: Colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: Colors.success },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 24, paddingTop: 5 },
  timelineLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.textSecondary },
  timelineLabelActive: { color: Colors.text, fontFamily: "Poppins_600SemiBold" },
  timelineStatusText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.accent, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 120 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text, textAlign: "center" },
  emptyBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, marginTop: 8,
  },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
});
