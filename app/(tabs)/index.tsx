import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Shipment } from "@/contexts/DeliveryContext";

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
  );
}

function ShipmentCard({ item }: { item: Shipment }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/shipment/[id]", params: { id: item.id } });
        }}
        style={styles.shipmentCard}
      >
        <View style={styles.shipmentCardLeft}>
          <View style={styles.packageIconWrap}>
            <MaterialCommunityIcons name="package-variant-closed" size={26} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackingId}>ID: {item.trackingId}</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </Pressable>
    </Animated.View>
  );
}

function QuickActionCard({
  title,
  subtitle,
  iconName,
  color,
  onPress,
}: {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.quickCard, animStyle]}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{ flex: 1 }}
      >
        <View style={[styles.quickCardIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={iconName} size={28} color={color} />
        </View>
        <Text style={styles.quickCardTitle}>{title}</Text>
        <Text style={styles.quickCardSubtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const currentShipment = shipments.find((s) => s.status !== "Delivered") ?? shipments[0];
  const recent = shipments.slice(0, 3);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.deliveryToRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.deliveryToLabel}>Delivery to</Text>
            </View>
            <Text style={styles.deliveryAddress}>11/2 Diriyah, Riyadh</Text>
          </View>
          <Pressable
            style={styles.notificationBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shipments..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="options-outline" size={22} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            title="New Delivery"
            subtitle="Create shipment"
            iconName="add-circle-outline"
            color={Colors.accent}
            onPress={() => router.push("/new-delivery")}
          />
          <QuickActionCard
            title="Track Package"
            subtitle="Real-time status"
            iconName="navigate-outline"
            color={Colors.info}
            onPress={() => router.push("/(tabs)/tracking")}
          />
        </View>

        {/* Current Shipment */}
        {currentShipment && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Shipment</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/shipments")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <Pressable
              style={styles.currentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/shipment/[id]", params: { id: currentShipment.id } });
              }}
            >
              <View style={styles.currentCardTop}>
                <View>
                  <Text style={styles.currentTrackingId}>ID: {currentShipment.trackingId}</Text>
                  <Text style={styles.currentItemName}>{currentShipment.itemName}</Text>
                </View>
                <StatusBadge status={currentShipment.status} />
              </View>

              <View style={styles.progressLabelRow}>
                <Text style={styles.awayLabel}>
                  {currentShipment.status === "Transit" ? "4h Away" : currentShipment.status}
                </Text>
              </View>

              <ProgressBar progress={currentShipment.progress} />

              <View style={styles.locationRow}>
                <View>
                  <Text style={styles.locationDate}>{currentShipment.createdDate}</Text>
                  <Text style={styles.locationCity}>{currentShipment.from}</Text>
                </View>
                <MaterialCommunityIcons name="package-variant" size={40} color="#E0C090" style={styles.packageImg} />
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.locationDate}>Estimated {currentShipment.estimatedDate}</Text>
                  <Text style={styles.locationCity}>{currentShipment.to}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Recent Shipments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Shipment</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shipments")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recent.map((item) => (
          <ShipmentCard key={item.id} item={item} />
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  deliveryToRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deliveryToLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deliveryAddress: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
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
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
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
    fontSize: 12,
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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  currentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  currentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  currentTrackingId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  currentItemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressLabelRow: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  awayLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E0E0E6",
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E6",
  },
  progressLineActive: {
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
  packageImg: {
    opacity: 0.8,
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
  shipmentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shipmentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  packageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingId: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  itemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
