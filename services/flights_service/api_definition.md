# Flight Search API Definition

This document defines the API for the Flight Search service.

## Request Format

- **Method:** `GET`
- **Endpoint:** `/api/flights/search`

### Query Parameters:

-   `origin` (string, IATA code, e.g., "JFK") - **Required**
-   `destination` (string, IATA code, e.g., "LAX") - **Required**
-   `departureDate` (string, YYYY-MM-DD) - **Required**
-   `returnDate` (string, YYYY-MM-DD) - Optional (for one-way searches)
-   `adults` (integer, default: 1) - Optional
-   `children` (integer, default: 0) - Optional
-   `infants` (integer, default: 0) - Optional
-   `cabinClass` (string, e.g., "economy", "business", "first") - Optional
-   `maxStops` (integer) - Optional

## Response Format (Success - 200 OK)

A JSON array of flight objects.

**Example Flight Object:**

```json
[
  {
    "id": "fl_abc123xyz789",
    "segments": [
      {
        "departureAirport": "JFK",
        "departureTime": "2024-12-01T09:00:00Z",
        "arrivalAirport": "ORD",
        "arrivalTime": "2024-12-01T11:30:00Z",
        "carrier": "AA",
        "flightNumber": "AA123",
        "duration": "2h 30m"
      },
      {
        "departureAirport": "ORD",
        "departureTime": "2024-12-01T13:00:00Z",
        "arrivalAirport": "LAX",
        "arrivalTime": "2024-12-01T15:15:00Z",
        "carrier": "AA",
        "flightNumber": "AA456",
        "duration": "3h 15m"
      }
    ],
    "totalDuration": "6h 15m",
    "price": {
      "amount": 350.75,
      "currency": "USD"
    },
    "stops": 1,
    "co2Emissions": 180 
  }
]
```

### Flight Object Details:

-   `id` (string): Unique identifier for this flight option.
-   `segments` (array of segment objects): Represents each leg of the journey. For direct flights, this array will contain a single segment.
    -   `departureAirport` (string): IATA code of the departure airport for this segment.
    -   `departureTime` (string): ISO 8601 datetime of departure for this segment.
    -   `arrivalAirport` (string): IATA code of the arrival airport for this segment.
    -   `arrivalTime` (string): ISO 8601 datetime of arrival for this segment.
    -   `carrier` (string): Name or IATA code of the airline operating this segment.
    -   `flightNumber` (string): Flight number for this segment.
    -   `duration` (string): Duration of this segment (e.g., "2h 30m").
-   `totalDuration` (string): Total duration of the entire journey, including layovers (e.g., "5h 15m").
-   `price` (object):
    -   `amount` (float): The total price of the flight.
    -   `currency` (string): Currency code for the price (e.g., "USD").
-   `stops` (integer): Number of layovers.
-   `co2Emissions` (integer, optional): Estimated CO2 emissions for the flight in kilograms.

## Error Responses

-   **`400 Bad Request`**:
    -   **Reason:** Required query parameters are missing or invalid (e.g., malformed date, invalid IATA code).
    -   **Response Body Example:**
        ```json
        {
          "error": "Bad Request",
          "message": "Missing required parameter: destination"
        }
        ```
-   **`500 Internal Server Error`**:
    -   **Reason:** An unexpected error occurred on the server while processing the request (e.g., issue with an external API provider, database error).
    -   **Response Body Example:**
        ```json
        {
          "error": "Internal Server Error",
          "message": "An unexpected error occurred. Please try again later."
        }
        ```
