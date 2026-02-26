import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ShipmentStatus = "Transit" | "Delivered" | "On Process" | "Pending";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "courier";
  timestamp: Date;
}

export interface Shipment {
  id: string;
  trackingId: string;
  itemName: string;
  status: ShipmentStatus;
  from: string;
  to: string;
  createdDate: string;
  estimatedDate: string;
  customer: string;
  orderCost: string;
  quantity: string;
  weight: string;
  courierId: string;
  courierName: string;
  courierAvatar: string;
  progress: number;
  messages: ChatMessage[];
}

export interface Courier {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  deliveries: number;
}

interface DeliveryContextValue {
  shipments: Shipment[];
  couriers: Courier[];
  addShipment: (data: Omit<Shipment, "id" | "trackingId" | "messages">) => void;
  updateStatus: (id: string, status: ShipmentStatus) => void;
  sendMessage: (shipmentId: string, text: string, sender: "user" | "courier") => void;
  deleteShipment: (id: string) => void;
}

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

const STORAGE_KEY = "deliverease_shipments";

const COURIERS: Courier[] = [
  { id: "c1", name: "Khalid Omor", avatar: "KO", rating: 4.9, deliveries: 1243 },
  { id: "c2", name: "Ahmad Kawsar", avatar: "AK", rating: 4.7, deliveries: 876 },
  { id: "c3", name: "Sarah Johnson", avatar: "SJ", rating: 4.8, deliveries: 654 },
];

const SEED_SHIPMENTS: Shipment[] = [
  {
    id: "s1",
    trackingId: "H314315796",
    itemName: "Mac Mini M4 Pro",
    status: "Transit",
    from: "Diriyah, Riyadh",
    to: "Jawhra, Jeddah",
    createdDate: "18 Oct 2025",
    estimatedDate: "19 Oct 2025",
    customer: "Ahmad Kawsar",
    orderCost: "$120.00",
    quantity: "1 Box",
    weight: "10 Kg",
    courierId: "c1",
    courierName: "Khalid Omor",
    courierAvatar: "KO",
    progress: 0.55,
    messages: [
      {
        id: "m1",
        text: "Hello! I've picked up your package and am on my way.",
        sender: "courier",
        timestamp: new Date("2025-10-18T10:00:00"),
      },
      {
        id: "m2",
        text: "Great, thanks! How long until delivery?",
        sender: "user",
        timestamp: new Date("2025-10-18T10:05:00"),
      },
      {
        id: "m3",
        text: "About 4 hours. I'll send an update when I'm close.",
        sender: "courier",
        timestamp: new Date("2025-10-18T10:07:00"),
      },
    ],
  },
  {
    id: "s2",
    trackingId: "K37856307",
    itemName: "Sonos Speaker",
    status: "Delivered",
    from: "Al Olaya, Riyadh",
    to: "Al Hamra, Jeddah",
    createdDate: "15 Oct 2025",
    estimatedDate: "16 Oct 2025",
    customer: "Fatima Al-Rashid",
    orderCost: "$85.00",
    quantity: "1 Box",
    weight: "5 Kg",
    courierId: "c2",
    courierName: "Ahmad Kawsar",
    courierAvatar: "AK",
    progress: 1,
    messages: [
      {
        id: "m1",
        text: "Package delivered! Please confirm receipt.",
        sender: "courier",
        timestamp: new Date("2025-10-16T14:00:00"),
      },
      {
        id: "m2",
        text: "Confirmed, thank you!",
        sender: "user",
        timestamp: new Date("2025-10-16T14:10:00"),
      },
    ],
  },
  {
    id: "s3",
    trackingId: "D93021548",
    itemName: "DJI Drone",
    status: "On Process",
    from: "King Fahd District",
    to: "Al Andalus, Jeddah",
    createdDate: "19 Oct 2025",
    estimatedDate: "21 Oct 2025",
    customer: "Khalid Ibrahim",
    orderCost: "$210.00",
    quantity: "1 Box",
    weight: "3.5 Kg",
    courierId: "c3",
    courierName: "Sarah Johnson",
    courierAvatar: "SJ",
    progress: 0.2,
    messages: [
      {
        id: "m1",
        text: "Your shipment is being processed at our warehouse.",
        sender: "courier",
        timestamp: new Date("2025-10-19T09:00:00"),
      },
    ],
  },
];

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setShipments(
            parsed.map((s: Shipment) => ({
              ...s,
              messages: (s.messages || []).map((m: ChatMessage) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            }))
          );
        } else {
          setShipments(SEED_SHIPMENTS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SHIPMENTS));
        }
      } catch {
        setShipments(SEED_SHIPMENTS);
      }
    })();
  }, []);

  const persist = useCallback(async (data: Shipment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const addShipment = useCallback(
    (data: Omit<Shipment, "id" | "trackingId" | "messages">) => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const nums = Math.floor(Math.random() * 900000000 + 100000000);
      const newShipment: Shipment = {
        ...data,
        id: Crypto.randomUUID(),
        trackingId: `${letter}${nums}`,
        messages: [
          {
            id: Crypto.randomUUID(),
            text: "Your shipment has been registered. We'll keep you updated!",
            sender: "courier",
            timestamp: new Date(),
          },
        ],
      };
      const updated = [newShipment, ...shipments];
      setShipments(updated);
      persist(updated);
    },
    [shipments, persist]
  );

  const updateStatus = useCallback(
    (id: string, status: ShipmentStatus) => {
      const updated = shipments.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              progress:
                status === "Delivered"
                  ? 1
                  : status === "Transit"
                  ? 0.55
                  : status === "On Process"
                  ? 0.2
                  : 0.05,
            }
          : s
      );
      setShipments(updated);
      persist(updated);
    },
    [shipments, persist]
  );

  const sendMessage = useCallback(
    (shipmentId: string, text: string, sender: "user" | "courier") => {
      const updated = shipments.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: Crypto.randomUUID(),
                  text,
                  sender,
                  timestamp: new Date(),
                },
              ],
            }
          : s
      );
      setShipments(updated);
      persist(updated);
    },
    [shipments, persist]
  );

  const deleteShipment = useCallback(
    (id: string) => {
      const updated = shipments.filter((s) => s.id !== id);
      setShipments(updated);
      persist(updated);
    },
    [shipments, persist]
  );

  const value = useMemo(
    () => ({
      shipments,
      couriers: COURIERS,
      addShipment,
      updateStatus,
      sendMessage,
      deleteShipment,
    }),
    [shipments, addShipment, updateStatus, sendMessage, deleteShipment]
  );

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used within DeliveryProvider");
  return ctx;
}
