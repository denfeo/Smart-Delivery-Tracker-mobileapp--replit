import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDelivery, ChatMessage } from "@/contexts/DeliveryContext";

const QUICK_REPLIES = [
  "Where is my package?",
  "How long until delivery?",
  "Please leave at door",
];

const COURIER_REPLIES = [
  "Your package is on its way!",
  "I'll be there in about 2 hours.",
  "No problem, I'll leave it at the door.",
  "I'm currently in traffic, will update soon.",
  "Your package has been safely picked up.",
  "Arriving in approximately 30 minutes.",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowCourier]}
    >
      {!isUser && (
        <View style={styles.courierDot}>
          <Text style={styles.courierDotText}>KO</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCourier]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextCourier]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeCourier]}>
          {time}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shipments, sendMessage } = useDelivery();
  const [text, setText] = useState("");
  const [isCourierTyping, setIsCourierTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const shipment = shipments.find((s) => s.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!shipment) return null;

  const handleSend = (customText?: string) => {
    const msg = customText ?? text.trim();
    if (!msg) return;
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(shipment.id, msg, "user");

    // Simulate courier typing and reply
    setIsCourierTyping(true);
    const delay = 1200 + Math.random() * 1200;
    setTimeout(() => {
      setIsCourierTyping(false);
      const reply = COURIER_REPLIES[Math.floor(Math.random() * COURIER_REPLIES.length)];
      sendMessage(shipment.id, reply, "courier");
    }, delay);

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const messages = [...(shipment.messages ?? [])].reverse();

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{shipment.courierAvatar}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{shipment.courierName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {isCourierTyping ? "Typing..." : "Online"}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.callBtn}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="call-outline" size={20} color={Colors.text} />
        </Pressable>
      </View>

      {/* Shipment Badge */}
      <View style={styles.shipmentBadge}>
        <Ionicons name="cube-outline" size={13} color={Colors.accent} />
        <Text style={styles.shipmentBadgeText}>
          {shipment.trackingId} · {shipment.itemName}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isCourierTyping ? (
              <View style={styles.typingContainer}>
                <View style={styles.courierDot}>
                  <Text style={styles.courierDotText}>{shipment.courierAvatar}</Text>
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { opacity: 0.4 }]} />
                    <View style={[styles.typingDot, { opacity: 0.7 }]} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Replies */}
        <View>
          <FlatList
            horizontal
            data={QUICK_REPLIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSend(item)}
                style={styles.quickReply}
              >
                <Text style={styles.quickReplyText}>{item}</Text>
              </Pressable>
            )}
          />

          {/* Input */}
          <View style={[styles.inputRow, { paddingBottom: bottomPad + 8 }]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
            />
            <Pressable
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!text.trim()}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#FFF",
  },
  headerName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  onlineText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.success,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  shipmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent + "12",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shipmentBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowCourier: {
    justifyContent: "flex-start",
  },
  courierDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  courierDotText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#FFF",
  },
  bubble: {
    maxWidth: "72%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.text,
    borderBottomRightRadius: 4,
  },
  bubbleCourier: {
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#FFF",
  },
  bubbleTextCourier: {
    color: Colors.text,
  },
  bubbleTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  bubbleTimeUser: {
    color: "rgba(255,255,255,0.5)",
  },
  bubbleTimeCourier: {
    color: Colors.textSecondary,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  typingBubble: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.textSecondary,
  },
  quickRepliesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickReply: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickReplyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
