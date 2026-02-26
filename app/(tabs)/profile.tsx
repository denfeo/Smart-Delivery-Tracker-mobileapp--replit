import React, { useState, useEffect } from "react";
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
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery } from "@/contexts/DeliveryContext";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const total = target;
    const duration = 900;
    const step = 30;
    const increment = total / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= total) {
        setDisplayed(total);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <Text style={styles.statValue}>
      {displayed}
      {suffix}
    </Text>
  );
}

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  delay?: number;
};

function SettingRow({
  icon,
  label,
  color = Colors.text,
  rightElement,
  onPress,
  delay = 0,
}: SettingRowProps) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Animated.View style={scaleStyle}>
        <Pressable
          onPressIn={() => { if (onPress) scale.value = withSpring(0.98, { damping: 15 }); }}
          onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
          onPress={() => {
            if (onPress) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }
          }}
          style={styles.settingRow}
        >
          <View style={[styles.settingIconWrap, { backgroundColor: color + "15" }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <Text style={[styles.settingLabel, { color }]}>{label}</Text>
          <View style={{ flex: 1 }} />
          {rightElement ?? (
            onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} /> : null
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { shipments, clearAllData } = useDelivery();
  const [notifications, setNotifications] = useState(true);
  const [liveTracking, setLiveTracking] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalDeliveries = shipments.length;
  const inTransit = shipments.filter((s) => s.status === "Transit").length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;

  const handleClear = () => {
    Alert.alert(
      "Очистить данные",
      "Все посылки будут удалены. Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

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
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>АК</Text>
            </View>
            <View style={styles.premiumBadge}>
              <MaterialCommunityIcons name="crown" size={11} color="#FFD60A" />
            </View>
          </View>
          <View>
            <Text style={styles.profileName}>Алексей Кузнецов</Text>
            <Text style={styles.profileEmail}>aleksey@example.com</Text>
            <View style={styles.premiumChip}>
              <MaterialCommunityIcons name="crown" size={11} color="#FFD60A" />
              <Text style={styles.premiumText}>Премиум участник</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
          <View style={styles.statItem}>
            <AnimatedCounter target={totalDeliveries} />
            <Text style={styles.statLabel}>Всего</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AnimatedCounter target={inTransit} />
            <Text style={styles.statLabel}>В пути</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AnimatedCounter target={delivered} />
            <Text style={styles.statLabel}>Доставлено</Text>
          </View>
        </Animated.View>

        {/* Account section */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Text style={styles.sectionLabel}>Аккаунт</Text>
          <View style={styles.card}>
            <SettingRow
              icon="person-circle-outline"
              label="Личные данные"
              color={Colors.info}
              onPress={() => {}}
              delay={160}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="location-outline"
              label="Сохранённые адреса"
              color={Colors.accent}
              onPress={() => {}}
              delay={200}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="card-outline"
              label="Способы оплаты"
              color={Colors.success}
              onPress={() => {}}
              delay={240}
            />
          </View>
        </Animated.View>

        {/* Preferences section */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <Text style={styles.sectionLabel}>Настройки</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              label="Уведомления"
              color={Colors.warning}
              delay={280}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={(v) => {
                    setNotifications(v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Platform.OS === "android" ? Colors.cardBackground : undefined}
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="navigate-outline"
              label="Слежение в реальном времени"
              color={Colors.transit}
              delay={320}
              rightElement={
                <Switch
                  value={liveTracking}
                  onValueChange={(v) => {
                    setLiveTracking(v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Platform.OS === "android" ? Colors.cardBackground : undefined}
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="language-outline"
              label="Язык: Русский"
              color={Colors.info}
              onPress={() => {}}
              delay={360}
            />
          </View>
        </Animated.View>

        {/* Support section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={styles.sectionLabel}>Поддержка</Text>
          <View style={styles.card}>
            <SettingRow
              icon="help-circle-outline"
              label="Центр помощи"
              color={Colors.info}
              onPress={() => {}}
              delay={400}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubble-ellipses-outline"
              label="Написать в поддержку"
              color={Colors.success}
              onPress={() => {}}
              delay={440}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="star-outline"
              label="Оценить приложение"
              color={Colors.warning}
              onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
              delay={480}
            />
          </View>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View entering={FadeInDown.delay(520).springify()}>
          <Text style={styles.sectionLabel}>Данные</Text>
          <View style={styles.card}>
            <SettingRow
              icon="trash-outline"
              label="Очистить все данные"
              color="#FF3B30"
              onPress={handleClear}
              delay={520}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(560).springify()} style={styles.versionRow}>
          <Text style={styles.versionText}>Версия 1.0.0 • Orbix Delivery</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingTop: 10, paddingBottom: 24,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 24, color: "#FFF" },
  premiumBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.cardBackground,
  },
  profileName: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text },
  profileEmail: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  premiumChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFD60A20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6,
    alignSelf: "flex-start",
  },
  premiumText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#B8860B" },
  statsRow: {
    flexDirection: "row", backgroundColor: Colors.cardBackground, borderRadius: 22,
    padding: 20, marginBottom: 24, alignItems: "center", elevation: 3,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 26, color: Colors.text },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  sectionLabel: {
    fontFamily: "Poppins_700Bold", fontSize: 15, color: Colors.text,
    marginBottom: 10, marginTop: 4,
  },
  card: { backgroundColor: Colors.cardBackground, borderRadius: 22, marginBottom: 20, overflow: "hidden", elevation: 2 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },
  versionRow: { alignItems: "center", paddingVertical: 8 },
  versionText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
});
