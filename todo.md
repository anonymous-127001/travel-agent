# TODO.md — Travel-Agent Project

## 1. Vision & Scope
Build a **multi-channel travel-planning agent** that can search, aggregate, and book flights, hotels, ground transport, and experiences in response to free-form user requests, then generate an optimized itinerary and keep the traveler updated in real time.

---

## 2. Core Features (MVP → V1)

| Priority | Feature | Description | Key Tasks |
|----------|---------|-------------|-----------|
| 🟢 P0 | **Flight search** | Query multiple GDS/OTA APIs, return sortable result set (price, duration, stops, CO₂). | `Integrate Amadeus / Skyscanner API` → `Normalize JSON schema` → `Rank & cache results` |
| 🟢 P0 | **Hotel search** | Fetch hotels & vacation rentals with filters (price, stars, amenities, distance). | `Integrate RapidAPI-Hotels / Booking.com` → `Geo-filter service` |
| 🟢 P0 | **Itinerary builder** | Auto-propose day-by-day plan (flights → lodging → activities). | `Graph model for time slots` → `Optimize travel time vs. user prefs` |
| 🟡 P1 | **User profile & prefs** | Store passports, loyalty numbers, seat prefs, budget, interests. | `Auth (OAuth2)` → `Encrypted vault` |
| 🟡 P1 | **Price alerts** | Notify when fare/hotel drops below threshold. | `Background scheduler` → `Webhook/email/push` |
| 🟡 P1 | **Real-time status** | Flight delays, gate changes, weather warnings. | `AviationStack API` → `Twilio SMS push` |
| 🟠 P2 | **Group trips** | Split payments, invite friends, merge preferences. | `Shared cart` → `Conflict-resolver algorithm` |
| 🟠 P2 | **Expense tracker** | Aggregate receipts, export to Excel. | `OCR for e-receipts` → `Currency conversion` |
| 🟣 P3 | **AI concierge chat** | Ongoing chat in app / WhatsApp for mid-trip changes. | `LangChain + RAG over booking data` |

---

## 3. System Architecture (High-Level)

```text
[Client Apps]  ←REST/GraphQL→  [API Gateway]  →  [Service Mesh]
   • Web (React)                 |             ├── Flights Service
   • iOS / Android (Flutter)     |             ├── Hotels Service
                                 |             ├── Itinerary Service
                                 |             └── Notification Service
                └── Auth (JWT)  ←┴→  Postgres | Redis | S3
