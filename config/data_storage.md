# Data Storage Technologies

This file outlines the planned data storage technologies for the travel planning application.

## Relational Data
- **Postgres:**
  - **Use Case:** To be used for storing relational data such as user profiles, flight and hotel bookings, itinerary details, and other structured data that requires ACID properties and complex querying capabilities.

## Caching and Session Management
- **Redis:**
  - **Use Case:** To be employed for caching frequently accessed data (e.g., search results, API responses), managing user sessions, and handling real-time data feeds or notifications.

## Object Storage
- **S3 (or compatible service):**
  - **Use Case:** Intended for storing large binary objects like user-uploaded documents (e.g., visa copies, passport scans), images (e.g., hotel pictures, destination photos), application logs, and backups.
