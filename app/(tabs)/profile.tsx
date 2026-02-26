import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useDelivery } from "@/contexts/DeliveryContext";

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  toggle,
  onToggle,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={styles.settingRow}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? Colors.accent + "15" : Colors.background }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.accent : Colors.textSecondary} />
      </View>
      <Text style={[styles.settingLabel, danger && { color: Colors.accent }]}>{label}</Text>
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle?.(v);
          }}
          trackColor={{ false: Colors.border, true: Colors.accent }}
          thumbColor="#FFF"
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />}
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { shipments } = useDelivery();
  const [notifications, setNotifications] = useState(true);
  const [liveTracking, setLiveTracking] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalShipments = shipments.length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;
  const inTransit = shipments.filter((s) => s.status === "Transit").length;

  const handleClearData = () => {
    Alert.alert("Clear All Data", "This will remove all shipments. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Done", "All data cleared. Restart the app to see changes.");
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>AK</Text>
          </View>
          <Text style={styles.userName}>Ahmad Kawsar</Text>
          <Text style={styles.userEmail}>ahmad.kawsar@gmail.com</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={12} color={Colors.accent} />
            <Text style={styles.memberText}>Premium Member</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(totalShipments)} color={Colors.accent} />
          <StatCard label="Delivered" value={String(delivered)} color={Colors.success} />
          <StatCard label="In Transit" value={String(inTransit)} color={Colors.transit} />
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingRow
              icon="person-outline"
              label="Personal Info"
              onPress={() => Alert.alert("Personal Info", "Edit your profile information")}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="location-outline"
              label="Saved Addresses"
              value="3 saved"
              onPress={() => Alert.alert("Addresses", "Manage saved delivery addresses")}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="card-outline"
              label="Payment Methods"
              onPress={() => Alert.alert("Payment", "Manage payment methods")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              label="Push Notifications"
              toggle={notifications}
              onToggle={setNotifications}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="navigate-outline"
              label="Live Tracking"
              toggle={liveTracking}
              onToggle={setLiveTracking}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="language-outline"
              label="Language"
              value="English"
              onPress={() => Alert.alert("Language", "Select your preferred language")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <SettingRow
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => Alert.alert("Help", "Visit our help center")}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubble-outline"
              label="Contact Support"
              onPress={() => Alert.alert("Support", "support@deliverease.com")}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="star-outline"
              label="Rate the App"
              onPress={() => Alert.alert("Rate Us", "Thank you for your feedback!")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow
              icon="trash-outline"
              label="Clear All Data"
              onPress={handleClearData}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>DeliverEase v1.0.0</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#FFF",
  },
  userName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  userEmail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.accent + "15",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  memberText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 62,
  },
  version: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingBottom: 12,
  },
});
