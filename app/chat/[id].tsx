import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery } from "@/contexts/DeliveryContext";

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
};

const COURIER_REPLIES = [
  "Да, посылка уже в пути! Буду у вас примерно через 2 часа.",
  "Сейчас нахожусь на перекрёстке Ленина и Садовой. Двигаюсь к вам.",
  "Пожалуйста, будьте дома в период с 14:00 до 16:00.",
  "Хорошо, понял! Позвоню за 15 минут до прибытия.",
  "Посылка упакована надёжно, всё в порядке.",
  "Могу оставить у консьержа, если вас не будет дома.",
  "Ваш заказ прошёл проверку на нашем складе.",
];

function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
      -1, false
    );
    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1, false
      );
    }, 150);
    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1, false
      );
    }, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.typingBubble}>
      <Animated.View style={[styles.typingDot, s1]} />
      <Animated.View style={[styles.typingDot, s2]} />
      <Animated.View style={[styles.typingDot, s3]} />
    </Animated.View>
  );
}

function ChatBubble({ msg, index }: { msg: Message; index: number }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 30).springify()}
      style={[styles.bubbleRow, msg.fromUser && styles.bubbleRowRight]}
    >
      {!msg.fromUser && (
        <View style={styles.courierAvatar}>
          <Text style={styles.courierAvatarText}>К</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          msg.fromUser ? styles.bubbleUser : styles.bubbleCourier,
        ]}
      >
        <Text style={[styles.bubbleText, msg.fromUser && styles.bubbleTextUser]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, msg.fromUser && styles.bubbleTimeUser]}>
          {msg.timestamp}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shipments } = useDelivery();
  const shipment = shipments.find((s) => s.id === id);
  const flatListRef = useRef<FlatList>(null);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Здравствуйте! Я ваш курьер. Посылка уже у меня.",
      fromUser: false,
      timestamp: "09:14",
    },
    {
      id: "2",
      text: "Ожидайте доставку сегодня в течение дня.",
      fromUser: false,
      timestamp: "09:15",
    },
  ]);
  const [input, setInput] = useState("");
  const [isCourierTyping, setIsCourierTyping] = useState(false);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      fromUser: true,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      setIsCourierTyping(true);
      setTimeout(() => {
        setIsCourierTyping(false);
        const reply = COURIER_REPLIES[Math.floor(Math.random() * COURIER_REPLIES.length)];
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: reply,
            fromUser: false,
            timestamp: now(),
          },
        ]);
      }, 1200 + Math.random() * 1200);
    }, 400);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.courierAvatarLarge}>
            <Text style={styles.courierAvatarLargeText}>К</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {shipment?.courierName ?? "Курьер"}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>В сети</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Shipment info banner */}
      {shipment && (
        <View style={styles.shipmentBanner}>
          <Ionicons name="cube-outline" size={14} color={Colors.accent} />
          <Text style={styles.shipmentBannerText} numberOfLines={1}>
            #{shipment.trackingId} · {shipment.itemName}
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ChatBubble msg={item} index={index} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={isCourierTyping ? <TypingDots /> : null}
      />

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: botPad + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Написать сообщение..."
          placeholderTextColor={Colors.textSecondary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <Pressable
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.background, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  courierAvatarLarge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
  },
  courierAvatarLargeText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#FFF" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  onlineText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.success },
  shipmentBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent + "10",
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  shipmentBannerText: {
    fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.text, flex: 1,
  },
  messageList: {
    paddingHorizontal: 16, paddingVertical: 16, gap: 8,
  },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 6 },
  bubbleRowRight: { flexDirection: "row-reverse" },
  courierAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
  },
  courierAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#FFF" },
  bubble: {
    maxWidth: "72%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleCourier: {
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
    elevation: 2,
  },
  bubbleText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextUser: { color: "#FFF" },
  bubbleTime: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: "right" },
  bubbleTimeUser: { color: "rgba(255,255,255,0.7)" },
  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.cardBackground, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14, marginLeft: 38, marginBottom: 6,
    alignSelf: "flex-start", elevation: 2,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textSecondary },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
