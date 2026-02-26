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
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, ShipmentStatus } from "@/contexts/DeliveryContext";

const STATUS_RU: Record<string, string> = {
  Transit: "В пути",
  Delivered: "Доставлено",
  "On Process": "Обработка",
  Pending: "Ожидает",
};

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
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{STATUS_RU[status] ?? status}</Text>
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const steps = ["Принято", "Отправлено", "В пути", "Доставлено"];
  const activeStep = Math.floor(progress * (steps.length - 1));
  return (
    <View>
      <View style={styles.progressContainer}>
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            <View style={[styles.progressDot, i <= activeStep && styles.progressDotActive]} />
            {i < steps.length - 1 && (
              <View style={[styles.progressLine, i < activeStep && styles.progressLineActive]} />
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
        <Text style={styles.notFound}>Посылка не найдена</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const handleStatusUpdate = (status: ShipmentStatus) => {
    Alert.alert(
      "Обновить статус",
      `Изменить статус на "${STATUS_RU[status] ?? status}"?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Обновить",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateStatus(shipment.id, status);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Удалить посылку",
      "Удалить эту посылку безвозвратно?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            deleteShipment(shipment.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
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
        <Text style={styles.headerTitle}>Детали посылки</Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 30 }]}
      >
        {/* Main Info */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <View>
              <Text style={styles.trackingLabel}>Номер трекинга</Text>
              <Text style={styles.trackingId}>{shipment.trackingId}</Text>
            </View>
            <StatusBadge status={shipment.status} />
          </View>
          <View style={styles.itemRow}>
            <View style={styles.packageIconWrap}>
              <MaterialCommunityIcons name="package-variant-closed" size={36} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{shipment.itemName}</Text>
              <Text style={styles.itemMeta}>{shipment.quantity} · {shipment.weight}</Text>
            </View>
          </View>
          <ProgressBar progress={shipment.progress} />
        </Animated.View>

        {/* Route */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Маршрут</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationCol}>
              <View style={styles.locationDot} />
              <Text style={styles.locationLabel}>Откуда</Text>
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
              <Text style={styles.locationLabel}>Куда</Text>
              <Text style={styles.locationCity}>{shipment.to}</Text>
              <Text style={styles.locationDate}>Ожид. {shipment.estimatedDate}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Order Details */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Детали заказа</Text>
          <View style={styles.detailGrid}>
            {[
              { label: "Клиент", value: shipment.customer },
              { label: "Стоимость", value: shipment.orderCost },
              { label: "Количество", value: shipment.quantity },
              { label: "Вес", value: shipment.weight },
            ].map((item) => (
              <View key={item.label} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Update Status */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Обновить статус</Text>
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
                  style={[styles.statusBtn, { borderColor: color }, active && { backgroundColor: color }]}
                >
                  <Text style={[styles.statusBtnText, { color: active ? "#FFF" : color }]}>
                    {STATUS_RU[status] ?? status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Courier */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Курьер</Text>
          <View style={styles.courierRow}>
            <View style={styles.courierAvatar}>
              <Text style={styles.courierAvatarText}>{shipment.courierAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{shipment.courierName}</Text>
              <Text style={styles.courierRole}>Назначенный курьер</Text>
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
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Pressable
            style={styles.trackBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/tracking");
            }}
          >
            <Ionicons name="map-outline" size={18} color="#FFF" />
            <Text style={styles.trackBtnText}>Посмотреть на карте</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.cardBackground,
    alignItems: "center", justifyContent: "center", elevation: 2,
  },
  headerTitle: {
    flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 18, color: Colors.text, textAlign: "center",
  },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent + "15",
    alignItems: "center", justifyContent: "center",
  },
  content: { paddingHorizontal: 20, gap: 14 },
  mainCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 22, padding: 18, elevation: 4,
  },
  mainCardTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16,
  },
  trackingLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
  trackingId: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text, marginTop: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  packageIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.accent + "12", alignItems: "center", justifyContent: "center",
  },
  itemName: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.text },
  itemMeta: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  progressContainer: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.accent },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  progressLineActive: { backgroundColor: Colors.accent },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.textSecondary },
  progressLabelActive: { color: Colors.accent, fontFamily: "Poppins_600SemiBold" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  card: { backgroundColor: Colors.cardBackground, borderRadius: 22, padding: 18, elevation: 2 },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.text, marginBottom: 14 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationCol: { flex: 1 },
  locationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, marginBottom: 6 },
  locationArrow: {
    flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center",
  },
  locationLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  locationLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary },
  locationCity: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text, marginTop: 2 },
  locationDate: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  detailItem: { width: "45%" },
  detailLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
  detailValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.text, marginTop: 2 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  statusBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  courierRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  courierAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  courierAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#FFF" },
  courierName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.text },
  courierRole: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  trackBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.text, borderRadius: 16, paddingVertical: 16,
  },
  trackBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#FFF" },
  notFound: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.text },
  backBtn: {
    marginTop: 12, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  backBtnText: { fontFamily: "Poppins_600SemiBold", color: "#FFF", fontSize: 14 },
});
