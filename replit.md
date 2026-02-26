# Orbix Delivery — Приложение для отслеживания доставок

## Overview
Полнофункциональное мобильное приложение для отслеживания посылок с интерфейсом на русском языке, анимациями в реальном времени, чатом с курьером и полным циклом управления логистикой.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router (file-based routing)
- **Backend**: Express.js with TypeScript on port 5000
- **State**: React Context + AsyncStorage (local persistence)
- **Fonts**: Poppins (Google Fonts) via @expo-google-fonts/poppins
- **UI**: Custom design with coral/orange accent (#FF5A36), dark cards, clean white backgrounds

## Features
- **Home Screen**: Current shipment card with progress bar, quick action buttons, recent shipments list
- **Shipments Screen**: Full list with status filters (All/Transit/On Process/Delivered/Pending), long press to delete
- **Tracking Screen**: Animated map view with pulsing courier location, delivery timeline, dark detail card with courier contact
- **Chat Screen**: Real-time messaging with courier, quick replies, simulated courier responses, inverted FlatList
- **New Delivery**: Form to create shipments with courier selection
- **Shipment Detail**: Full detail view, status update buttons, route info, courier contact
- **Profile Screen**: User stats, settings with toggles, support links

## App Structure
```
app/
  _layout.tsx          # Root layout with providers (QueryClient, DeliveryProvider, Keyboard)
  (tabs)/
    _layout.tsx        # Tab layout (NativeTabs on iOS 26+, Classic Tabs otherwise)
    index.tsx          # Home
    shipments.tsx      # Shipments list
    tracking.tsx       # Location tracking
    profile.tsx        # User profile
  new-delivery.tsx     # Modal for creating new shipment
  shipment/[id].tsx    # Shipment detail
  chat/[id].tsx        # Chat with courier

contexts/
  DeliveryContext.tsx  # Global state: shipments, couriers, messages, CRUD actions

constants/
  colors.ts            # Design tokens (accent: #FF5A36)
```

## Design
- Accent color: `#FF5A36` (coral/orange)
- Background: `#F7F7F9`
- Dark card: `#1C1C1E`
- Font: Poppins (Regular, Medium, SemiBold, Bold)
- Inspired by the Orbix Studio UI design reference

## Running
- Frontend: `npm run expo:dev` (port 8081)
- Backend: `npm run server:dev` (port 5000)
