# Travel-Agent Project

## Vision & Scope
Build a **multi-channel travel-planning agent** that can search, aggregate, and book flights, hotels, ground transport, and experiences in response to free-form user requests, then generate an optimized itinerary and keep the traveler updated in real time.

## System Architecture (High-Level)
```text
[Client Apps]  ←REST/GraphQL→  [API Gateway]  →  [Service Mesh]
   • Web (React)                 |             ├── Flights Service
   • iOS / Android (Flutter)     |             ├── Hotels Service
                                 |             ├── Itinerary Service
                                 |             └── Notification Service
                └── Auth (JWT)  ←┴→  Postgres | Redis | S3
```

## Project Structure

This project is organized into the following main directories:

- **`api_gateway/`**: Contains the API Gateway, which acts as a single entry point for all client requests and routes them to the appropriate backend services.
- **`client_apps/`**: Intended for client-side applications (e.g., web app built with React, mobile apps built with Flutter). *(Currently contains a .gitkeep file)*
- **`config/`**: Holds all configuration files for the application, including database connection details, API keys, and environment-specific settings.
- **`services/`**: Houses the various microservices that make up the backend of the application. Each service is responsible for a specific domain (e.g., flights, hotels, itinerary, authentication, notifications).
  - **`services/auth_service/`**: Manages user authentication and authorization.
  - **`services/flights_service/`**: Handles flight search and booking functionalities.
  - **`services/hotels_service/`**: Manages hotel search and booking.
  - **`services/itinerary_service/`**: Responsible for building and managing user itineraries.
  - **`services/notification_service/`**: Handles sending notifications to users. *(Currently contains a .gitkeep file)*
