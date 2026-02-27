import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment } from "@/contexts/DeliveryContext";

const STATUS_RU: Record<string, string> = {
  Transit: "В пути",
  Delivered: "Доставлено",
  "On Process": "Обработка",
  Pending: "Ожидает",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

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

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let frame: ReturnType<typeof setTimeout>;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const tick = () => {
      start = Math.min(start + step, target);
      setDisplayed(start);
      if (start < target) frame = setTimeout(tick, 40);
    };
    const initial = setTimeout(tick, delay);
    return () => { clearTimeout(initial); clearTimeout(frame); };
  }, [target, delay]);
  return <Text style={styles.statNum}>{displayed}</Text>;
}

function StatCard({
  icon,
  label,
  count,
  color,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statCardIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <AnimatedCounter target={count} delay={delay} />
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function AnimatedProgressDots({ progress }: { progress: number }) {
  const steps = ["Принято", "Отправлено", "В пути", "Доставлено"];
  const activeStep = Math.floor(progress * (steps.length - 1));
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressDots}>
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            <View style={[styles.progressDot, i <= activeStep && styles.progressDotActive]} />
            {i < steps.length - 1 && (
              <View style={styles.progressLineContainer}>
                <View style={styles.progressLineBase} />
                {i < activeStep && <View style={styles.progressLineFill} />}
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function ShipmentCard({ item, index }: { item: Shipment; index: number }) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <Animated.View style={scaleStyle}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: "/shipment/[id]", params: { id: item.id } });
          }}
          style={styles.shipmentCard}
        >
          <View style={[styles.packageIconWrap, { backgroundColor: (STATUS_RU[item.status] ? (item.status === "Delivered" ? Colors.success : Colors.accent) : Colors.accent) + "15" }]}>
            <MaterialCommunityIcons
              name={item.status === "Delivered" ? "package-variant-closed-check" : "package-variant-closed"}
              size={24}
              color={item.status === "Delivered" ? Colors.success : Colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackingId}>#{item.trackingId}</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
            <View style={styles.routeRow}>
              <Ionicons name="radio-button-on" size={9} color={Colors.accent} />
              <Text style={styles.routeText} numberOfLines={1}>{item.from}</Text>
              <Ionicons name="arrow-forward" size={9} color={Colors.textSecondary} />
              <Text style={styles.routeText} numberOfLines={1}>{item.to}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function QuickActionCard({
  title, subtitle, iconName, color, bgColor, onPress, delay,
}: {
  title: string; subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string; bgColor: string;
  onPress: () => void; delay: number;
}) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
      <Animated.View style={[styles.quickCard, { backgroundColor: bgColor }, scaleStyle]}>
        <Pressable
          onPressIn={() => (scale.value = withSpring(0.94, { damping: 15 }))}
          onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
          style={{ flex: 1 }}
        >
          <View style={[styles.quickCardIcon, { backgroundColor: color + "22" }]}>
            <Ionicons name={iconName} size={26} color={color} />
          </View>
          <Text style={[styles.quickCardTitle, { color: bgColor === Colors.accent ? "#FFF" : Colors.text }]}>{title}</Text>
          <Text style={[styles.quickCardSubtitle, { color: bgColor === Colors.accent ? "rgba(255,255,255,0.72)" : Colors.textSecondary }]}>{subtitle}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const [refreshing, setRefreshing] = useState(false);
  const currentShipment = shipments.find((s) => s.status !== "Delivered") ?? shipments[0];
  const recent = shipments.slice(0, 4);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const inTransitCount = shipments.filter((s) => s.status === "Transit").length;
  const deliveredCount = shipments.filter((s) => s.status === "Delivered").length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <View style={styles.deliveryToRow}>
              <Ionicons name="location" size={13} color={Colors.accent} />
              <Text style={styles.deliveryAddress}>Москва, Арбат 11/2</Text>
            </View>
          </View>
          <Pressable
            style={styles.notificationBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="notifications-outline" size={21} color={Colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск посылок..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="options-outline" size={21} color="#FFF" />
          </Pressable>
        </Animated.View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon="cube-outline" label="Всего" count={shipments.length} color={Colors.info} delay={100} />
          <StatCard icon="car-outline" label="В пути" count={inTransitCount} color={Colors.transit} delay={160} />
          <StatCard icon="checkmark-circle-outline" label="Доставлено" count={deliveredCount} color={Colors.success} delay={220} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            title="Новая доставка" subtitle="Создать посылку"
            iconName="add-circle-outline" color="#FFF" bgColor={Colors.accent}
            onPress={() => router.push("/new-delivery")} delay={280}
          />
          <QuickActionCard
            title="Отследить" subtitle="Статус в реальном времени"
            iconName="navigate-outline" color={Colors.info} bgColor={Colors.cardBackground}
            onPress={() => router.push("/(tabs)/tracking")} delay={320}
          />
        </View>

        {/* Current Shipment */}
        {currentShipment && (
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Текущая посылка</Text>
              <Pressable onPress={() => router.push("/(tabs)/shipments")}>
                <Text style={styles.seeAll}>Все →</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.currentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/shipment/[id]", params: { id: currentShipment.id } });
              }}
            >
              <View style={styles.cardAccentBar} />
              <View style={styles.currentCardTop}>
                <View>
                  <Text style={styles.currentTrackingId}>#{currentShipment.trackingId}</Text>
                  <Text style={styles.currentItemName}>{currentShipment.itemName}</Text>
                </View>
                <StatusBadge status={currentShipment.status} />
              </View>
              <View style={styles.estimatedRow}>
                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.estimatedLabel}>
                  {currentShipment.status === "Transit" ? "~4 часа до доставки" : STATUS_RU[currentShipment.status] ?? currentShipment.status}
                </Text>
              </View>
              <AnimatedProgressDots progress={currentShipment.progress} />
              <View style={styles.locationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationDate}>{currentShipment.createdDate}</Text>
                  <Text style={styles.locationCity} numberOfLines={1}>{currentShipment.from}</Text>
                </View>
                <View style={styles.truckWrap}>
                  <MaterialCommunityIcons name="truck-fast-outline" size={28} color={Colors.accent} />
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.locationDate}>Ожидаем {currentShipment.estimatedDate}</Text>
                  <Text style={styles.locationCity} numberOfLines={1}>{currentShipment.to}</Text>
                </View>
              </View>

              {/* Chat shortcut */}
              {currentShipment.courierId && (
                <Pressable
                  style={styles.chatShortcut}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/chat/[id]", params: { id: currentShipment.id } });
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.accent} />
                  <Text style={styles.chatShortcutText}>Написать курьеру</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
                </Pressable>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* Recent Shipments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Недавние посылки</Text>
          <Pressable onPress={() => router.push("/(tabs)/shipments")}>
            <Text style={styles.seeAll}>Все →</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed-remove" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Нет посылок. Создайте первую!</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push("/new-delivery")}>
              <Text style={styles.emptyBtnText}>+ Новая доставка</Text>
            </Pressable>
          </Animated.View>
        ) : (
          recent.map((item, i) => <ShipmentCard key={item.id} item={item} index={i} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, paddingBottom: 14,
  },
  greeting: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text, marginBottom: 4 },
  deliveryToRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  deliveryAddress: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.textSecondary },
  notificationBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBackground,
    alignItems: "center", justifyContent: "center", elevation: 2,
  },
  notifDot: {
    position: "absolute", top: 9, right: 9, width: 9, height: 9,
    borderRadius: 4.5, backgroundColor: Colors.accent, borderWidth: 2, borderColor: Colors.cardBackground,
  },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, gap: 8, elevation: 1,
  },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.text },
  filterBtn: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.text,
    alignItems: "center", justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 14, alignItems: "center", elevation: 2,
    borderTopWidth: 3, borderTopColor: Colors.accent,
  },
  statCardIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  statNum: { fontFamily: "Poppins_700Bold", fontSize: 22, color: Colors.text },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary, textAlign: "center" },
  quickActions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  quickCard: {
    flex: 1, borderRadius: 20, padding: 16, minHeight: 128, elevation: 3,
  },
  quickCardIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  quickCardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  quickCardSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: Colors.text },
  seeAll: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.accent },
  currentCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 22, padding: 18, marginBottom: 24,
    overflow: "hidden", elevation: 4,
  },
  cardAccentBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    backgroundColor: Colors.accent, borderTopLeftRadius: 22, borderTopRightRadius: 22,
  },
  currentCardTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 8, marginTop: 6,
  },
  currentTrackingId: { fontFamily: "Poppins_700Bold", fontSize: 17, color: Colors.text },
  currentItemName: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  estimatedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  estimatedLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, color: Colors.textSecondary },
  progressWrap: { marginBottom: 14 },
  progressDots: { flexDirection: "row", alignItems: "center" },
  progressDot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: "#E0E0E6" },
  progressDotActive: { backgroundColor: Colors.accent },
  progressLineContainer: {
    flex: 1, height: 3, backgroundColor: "#E0E0E6", borderRadius: 1.5, overflow: "hidden", position: "relative",
  },
  progressLineBase: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#E0E0E6" },
  progressLineFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.accent },
  locationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationDate: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textSecondary },
  locationCity: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text, marginTop: 2 },
  truckWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent + "12",
    alignItems: "center", justifyContent: "center",
  },
  chatShortcut: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent + "10", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 12,
  },
  chatShortcutText: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.accent },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  shipmentCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 18, padding: 14,
    flexDirection: "row", alignItems: "center", marginBottom: 10, elevation: 2, gap: 12,
  },
  packageIconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  trackingId: { fontFamily: "Poppins_700Bold", fontSize: 13, color: Colors.text },
  itemName: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  routeText: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.textSecondary, maxWidth: 70 },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: Colors.textSecondary, textAlign: "center" },
  emptyBtn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
});
