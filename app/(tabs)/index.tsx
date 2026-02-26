import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Dimensions,
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

function AnimatedProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(300, withTiming(progress, { duration: 900 }));
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

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
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
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
          <View style={styles.shipmentCardLeft}>
            <View style={styles.packageIconWrap}>
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
          </View>
          <StatusBadge status={item.status} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function QuickActionCard({
  title,
  subtitle,
  iconName,
  color,
  bgColor,
  onPress,
  delay,
}: {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
      <Animated.View style={[styles.quickCard, { backgroundColor: bgColor }, scaleStyle]}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.95, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{ flex: 1 }}
      >
        <View style={[styles.quickCardIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={iconName} size={26} color={color} />
        </View>
        <Text style={[styles.quickCardTitle, { color: bgColor === Colors.accent ? "#FFF" : Colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.quickCardSubtitle, { color: bgColor === Colors.accent ? "rgba(255,255,255,0.7)" : Colors.textSecondary }]}>
          {subtitle}
        </Text>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const currentShipment = shipments.find((s) => s.status !== "Delivered") ?? shipments[0];
  const recent = shipments.slice(0, 4);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
            <View style={styles.deliveryToRow}>
              <Ionicons name="location" size={13} color={Colors.accent} />
              <Text style={styles.deliveryToLabel}>Доставка в</Text>
            </View>
            <Text style={styles.deliveryAddress}>Москва, Арбат 11/2</Text>
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
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск посылок..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <Pressable
            style={styles.filterBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="options-outline" size={21} color="#FFF" />
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            title="Новая доставка"
            subtitle="Создать посылку"
            iconName="add-circle-outline"
            color="#FFF"
            bgColor={Colors.accent}
            onPress={() => router.push("/new-delivery")}
            delay={120}
          />
          <QuickActionCard
            title="Отследить"
            subtitle="Статус в реальном времени"
            iconName="navigate-outline"
            color={Colors.info}
            bgColor={Colors.cardBackground}
            onPress={() => router.push("/(tabs)/tracking")}
            delay={180}
          />
        </View>

        {/* Current Shipment */}
        {currentShipment && (
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Текущая посылка</Text>
              <Pressable onPress={() => router.push("/(tabs)/shipments")}>
                <Text style={styles.seeAll}>Все</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.currentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/shipment/[id]", params: { id: currentShipment.id } });
              }}
            >
              {/* Accent bar */}
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
                  {currentShipment.status === "Transit"
                    ? "~4 часа до доставки"
                    : STATUS_RU[currentShipment.status] ?? currentShipment.status}
                </Text>
              </View>

              <AnimatedProgressBar progress={currentShipment.progress} />

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
            </Pressable>
          </Animated.View>
        )}

        {/* Recent Shipments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Недавние посылки</Text>
          <Pressable onPress={() => router.push("/(tabs)/shipments")}>
            <Text style={styles.seeAll}>Все</Text>
          </Pressable>
        </View>
        {recent.map((item, i) => (
          <ShipmentCard key={item.id} item={item} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 18,
  },
  deliveryToRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  deliveryToLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deliveryAddress: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.cardBackground,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 26,
  },
  quickCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
    elevation: 3,
  },
  quickCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  quickCardSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.text,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  currentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
    overflow: "hidden",
    elevation: 4,
  },
  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accent,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  currentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    marginTop: 6,
  },
  currentTrackingId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.text,
  },
  currentItemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  estimatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  estimatedLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressWrap: {
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#E0E0E6",
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
  },
  progressLineContainer: {
    flex: 1,
    height: 3,
    backgroundColor: "#E0E0E6",
    borderRadius: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  progressLineBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E0E0E6",
  },
  progressLineFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.accent,
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationDate: {
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
  truckWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  shipmentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  shipmentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  packageIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.accent + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: Colors.text,
  },
  itemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  routeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    maxWidth: 70,
  },
});
