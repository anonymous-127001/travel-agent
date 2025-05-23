# TODO.md — Travel-Agent Project

## 1. Vision & Scope
Build a **multi-channel travel-planning agent** that can search, aggregate, and book flights, hotels, ground transport, and experiences in response to free-form user requests, then generate an optimized itinerary and keep the traveler updated in real time.

---

## 2. Core Features (MVP → V1)

| Priority | Feature | Description | Key Tasks |
|----------|---------|-------------|-----------|
| 🟢 P0 | **Project Setup & Core Service Placeholders** | Initial directory structure, service placeholders, READMEs, and configuration notes created. | `DONE` |
| 🟢 P0 | **Flight search** | Query multiple GDS/OTA APIs, return sortable result set (price, duration, stops, CO₂). | `[Initial structure created] - DONE` <br> `Define detailed API for gateway communication (services/flights_service/api_definition.md) - DONE` <br> `Develop MOCK API integration module (fetchMockFlights in flight_search.js) - DONE` <br> `Implement basic JSON schema normalization (normalizeFlightData in flight_search.js) - DONE` <br> `Add basic unit tests (flight_search.test.js) - DONE` <br> `Update API Gateway with placeholder route (/api/flights/search in api_gateway/gateway.js) - DONE` <br> `Develop REAL API integration module (Amadeus / Skyscanner)` <br> `Implement advanced ranking & caching logic` <br> `Integrate with API Gateway for request/response flow` |
| 🟢 P0 | **Hotel search** | Fetch hotels & vacation rentals with filters (price, stars, amenities, distance). | `[Initial structure created]` → `Develop API integration module (RapidAPI-Hotels / Booking.com)` → `Implement geo-filter service` → `Define detailed API for gateway` |
| 🟢 P0 | **Itinerary builder** | Auto-propose day-by-day plan (flights → lodging → activities). | `[Initial structure created]` → `Design and implement graph model for time slots` → `Develop optimization algorithms for travel time vs. user prefs` → `Define detailed API for gateway` |
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
