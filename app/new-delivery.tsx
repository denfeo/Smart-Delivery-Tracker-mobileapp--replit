import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, Courier } from "@/contexts/DeliveryContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  optional,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  optional?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label} {optional && <Text style={styles.optional}>(optional)</Text>}
      </Text>
      <View style={styles.fieldBox}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.fieldInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
        />
      </View>
    </View>
  );
}

function CourierPicker({
  couriers,
  selectedId,
  onSelect,
}: {
  couriers: Courier[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Assign Courier</Text>
      <View style={styles.courierPicker}>
        {couriers.map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(c.id);
              }}
              style={[styles.courierOption, active && styles.courierOptionActive]}
            >
              <View style={[styles.courierAvatar, active && styles.courierAvatarActive]}>
                <Text style={[styles.courierAvatarText, active && { color: "#FFF" }]}>
                  {c.avatar}
                </Text>
              </View>
              <Text
                style={[styles.courierName, active && styles.courierNameActive]}
                numberOfLines={1}
              >
                {c.name.split(" ")[0]}
              </Text>
              <View style={styles.courierRating}>
                <Ionicons name="star" size={10} color={active ? Colors.accentLight : Colors.transit} />
                <Text style={[styles.courierRatingText, active && { color: Colors.accentLight }]}>
                  {c.rating}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function NewDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const { addShipment, couriers } = useDelivery();

  const [itemName, setItemName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customer, setCustomer] = useState("");
  const [orderCost, setOrderCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedCourierId, setSelectedCourierId] = useState(couriers[0]?.id ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = () => {
    if (!itemName.trim() || !from.trim() || !to.trim() || !customer.trim()) {
      Alert.alert("Missing Fields", "Please fill in item name, from, to, and customer name.");
      return;
    }
    const courier = couriers.find((c) => c.id === selectedCourierId) ?? couriers[0];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fmt = (d: Date) =>
      `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;

    addShipment({
      itemName: itemName.trim(),
      status: "On Process",
      from: from.trim(),
      to: to.trim(),
      createdDate: fmt(today),
      estimatedDate: fmt(tomorrow),
      customer: customer.trim(),
      orderCost: orderCost.trim() ? `$${orderCost.trim()}` : "$0.00",
      quantity: quantity.trim() ? `${quantity.trim()} Box` : "1 Box",
      weight: weight.trim() ? `${weight.trim()} Kg` : "1 Kg",
      courierId: courier.id,
      courierName: courier.name,
      courierAvatar: courier.avatar,
      progress: 0.2,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
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
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>New Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 30 }]}
        bottomOffset={60}
        keyboardShouldPersistTaps="handled"
      >
        {/* Package Info */}
        <Text style={styles.sectionTitle}>Package Info</Text>
        <Field
          label="Item Name"
          placeholder="e.g. MacBook Pro"
          value={itemName}
          onChangeText={setItemName}
          icon="cube-outline"
        />
        <Field
          label="Quantity"
          placeholder="e.g. 1"
          value={quantity}
          onChangeText={setQuantity}
          icon="layers-outline"
          keyboardType="numeric"
          optional
        />
        <Field
          label="Weight (Kg)"
          placeholder="e.g. 2.5"
          value={weight}
          onChangeText={setWeight}
          icon="scale-outline"
          keyboardType="decimal-pad"
          optional
        />

        {/* Route */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Route</Text>
        <Field
          label="From"
          placeholder="e.g. Diriyah, Riyadh"
          value={from}
          onChangeText={setFrom}
          icon="radio-button-on-outline"
        />
        <Field
          label="To"
          placeholder="e.g. Jawhra, Jeddah"
          value={to}
          onChangeText={setTo}
          icon="location-outline"
        />

        {/* Customer */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Customer</Text>
        <Field
          label="Customer Name"
          placeholder="e.g. Ahmad Kawsar"
          value={customer}
          onChangeText={setCustomer}
          icon="person-outline"
        />
        <Field
          label="Order Cost"
          placeholder="e.g. 120.00"
          value={orderCost}
          onChangeText={setOrderCost}
          icon="card-outline"
          keyboardType="decimal-pad"
          optional
        />

        {/* Courier */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Courier</Text>
        <CourierPicker
          couriers={couriers}
          selectedId={selectedCourierId}
          onSelect={setSelectedCourierId}
        />

        {/* Submit */}
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
          <Text style={styles.submitBtnText}>Create Shipment</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  optional: {
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    fontSize: 12,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  courierPicker: {
    flexDirection: "row",
    gap: 10,
  },
  courierOption: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  courierOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "08",
  },
  courierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  courierAvatarActive: {
    backgroundColor: Colors.accent,
  },
  courierAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  courierName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  courierNameActive: {
    color: Colors.accent,
  },
  courierRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  courierRatingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.transit,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#FFF",
  },
});
