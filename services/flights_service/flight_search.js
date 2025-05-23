// This file will contain the core logic for the Flight Search microservice.
// Responsibilities include:
// - Interacting with external flight APIs (e.g., Amadeus, Skyscanner)
// - Normalizing the data received from these APIs
// - Implementing ranking algorithms for search results
// - Caching results to improve performance and reduce API call frequency

// TODO: Replace this with actual external API integration (e.g., Amadeus, Skyscanner)
function fetchMockFlights(origin, destination, departureDate, returnDate, adults, cabinClass) {
  console.log(`Searching for flights:
    Origin: ${origin}
    Destination: ${destination}
    Departure Date: ${departureDate}
    Return Date: ${returnDate || 'N/A (one-way)'}
    Adults: ${adults || 1}
    Cabin Class: ${cabinClass || 'economy'}`);

  const mockFlights = [
    {
      provider_id: "provider_xyz_123",
      flight_legs: [
        {
          dep_airport: "JFK",
          dep_time: "2024-12-01T09:00:00Z",
          arr_airport: "ORD",
          arr_time: "2024-12-01T11:30:00Z",
          airline_code: "AA",
          fl_num: "101",
          leg_duration_minutes: 150
        },
        {
          dep_airport: "ORD",
          dep_time: "2024-12-01T13:00:00Z",
          arr_airport: "LAX",
          arr_time: "2024-12-01T15:30:00Z",
          airline_code: "AA",
          fl_num: "205",
          leg_duration_minutes: 210
        }
      ],
      total_journey_minutes: 360, // Sum of leg_duration_minutes + layover_duration_minutes
      layover_duration_minutes: 90, // Example, actual layover would be calculated based on leg times
      pricing_info: {
        total_fare: 350.75,
        currency_code: "USD",
        taxes: 45.20,
        base_fare: 305.55
      },
      num_stops: 1,
      tags: ["refundable", "wifi_available"]
    },
    {
      provider_id: "provider_abc_789",
      flight_legs: [
        {
          dep_airport: "JFK",
          dep_time: "2024-12-01T10:30:00Z",
          arr_airport: "LAX",
          arr_time: "2024-12-01T13:45:00Z",
          airline_code: "DL",
          fl_num: "DL402",
          leg_duration_minutes: 195 // 3h 15m
        }
      ],
      total_journey_minutes: 195,
      layover_duration_minutes: 0,
      pricing_info: {
        total_fare: 410.00,
        currency_code: "USD",
        taxes: 52.30,
        base_fare: 357.70
      },
      num_stops: 0,
      tags: ["direct_flight", "legroom_plus"]
    },
    {
      provider_id: "provider_ua_456",
      flight_legs: [
        {
          dep_airport: "JFK",
          dep_time: "2024-12-01T07:15:00Z",
          arr_airport: "DEN",
          arr_time: "2024-12-01T09:45:00Z",
          airline_code: "UA",
          fl_num: "UA303",
          leg_duration_minutes: 150
        },
        {
          dep_airport: "DEN",
          dep_time: "2024-12-01T11:00:00Z",
          arr_airport: "SFO", // Different destination for variety
          arr_time: "2024-12-01T12:45:00Z",
          airline_code: "UA",
          fl_num: "UA671",
          leg_duration_minutes: 105
        }
      ],
      total_journey_minutes: 255, // 150 + 105
      layover_duration_minutes: 75, // Example, actual layover would be calculated
      pricing_info: {
        total_fare: 320.50,
        currency_code: "USD",
        taxes: 40.10,
        base_fare: 280.40
      },
      num_stops: 1,
      tags: ["on_time_guarantee"]
    }
  ];

  const filteredFlights = mockFlights.filter(flight => {
    const firstLeg = flight.flight_legs[0];
    const lastLeg = flight.flight_legs[flight.flight_legs.length - 1];
    return firstLeg.dep_airport === origin && lastLeg.arr_airport === destination;
  });

  if (filteredFlights.length > 0) {
    return filteredFlights;
  } else {
    return [mockFlights[0], mockFlights[1]]; // Default if no direct match
  }
}

/**
 * Converts minutes to a string format "Xh Ym".
 * @param {number} totalMinutes - The total minutes to convert.
 * @returns {string} The formatted duration string.
 */
function formatDuration(totalMinutes) {
  if (typeof totalMinutes !== 'number' || totalMinutes < 0) {
    return 'N/A';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let durationString = "";
  if (hours > 0) {
    durationString += `${hours}h`;
  }
  if (minutes > 0) {
    if (hours > 0) durationString += " ";
    durationString += `${minutes}m`;
  }
  if (durationString === "") return "0m"; // Handle case where duration is 0
  return durationString;
}

/**
 * Normalizes raw flight data from a provider to the application's defined schema.
 * 
 * Target Schema (defined in services/flights_service/api_definition.md and schemas/normalized_flight_schema.json):
 * {
 *   "id": "string",
 *   "segments": [
 *     {
 *       "departureAirport": "string",
 *       "departureTime": "string",
 *       "arrivalAirport": "string",
 *       "arrivalTime": "string",
 *       "carrier": "string",
 *       "flightNumber": "string",
 *       "duration": "string"
 *     }
 *   ],
 *   "totalDuration": "string",
 *   "price": {
 *     "amount": "float",
 *     "currency": "string"
 *   },
 *   "stops": "integer",
 *   "co2Emissions": "integer | null" // TODO: Implement actual CO2 emission calculation/fetching
 * }
 */
function normalizeFlightData(rawFlights) {
  if (!Array.isArray(rawFlights)) {
    console.error("normalizeFlightData: Expected an array of raw flights, received:", rawFlights);
    return [];
  }

  return rawFlights.map(rawFlight => {
    // Map segments
    const segments = rawFlight.flight_legs.map(leg => ({
      departureAirport: leg.dep_airport,
      departureTime: leg.dep_time,
      arrivalAirport: leg.arr_airport,
      arrivalTime: leg.arr_time,
      carrier: leg.airline_code, // Assuming airline_code maps to carrier name/code
      flightNumber: leg.fl_num,
      duration: formatDuration(leg.leg_duration_minutes)
    }));

    // Calculate total duration (sum of leg durations + layovers)
    // The mock 'total_journey_minutes' already includes layovers.
    // If calculating from scratch:
    // const totalLegDuration = rawFlight.flight_legs.reduce((sum, leg) => sum + leg.leg_duration_minutes, 0);
    // const totalDurationMinutes = totalLegDuration + (rawFlight.layover_duration_minutes || 0);
    const totalDuration = formatDuration(rawFlight.total_journey_minutes);

    // Map pricing
    const price = {
      amount: rawFlight.pricing_info.total_fare,
      currency: rawFlight.pricing_info.currency_code
    };

    // TODO: Implement actual CO2 emission calculation or fetching.
    // For now, setting to null as per requirements.
    const co2Emissions = null; 

    return {
      id: rawFlight.provider_id, // Using provider_id as the unique ID
      segments: segments,
      totalDuration: totalDuration,
      price: price,
      stops: rawFlight.num_stops,
      co2Emissions: co2Emissions 
    };
  });
}

// Example of how to use fetchMockFlights and normalizeFlightData together:
// (async () => {
//   // 1. Fetch mock data (simulating an API call)
//   const rawFlightResults = await fetchMockFlights("JFK", "LAX", "2024-12-01");
//   console.log("Raw flights:", JSON.stringify(rawFlightResults, null, 2));

//   // 2. Normalize the data
//   const normalizedFlights = normalizeFlightData(rawFlightResults);
//   console.log("Normalized flights:", JSON.stringify(normalizedFlights, null, 2));

//   // You can also test with specific cases, e.g., a flight that wasn't directly matched
//   const otherRawFlights = await fetchMockFlights("MIA", "DCA", "2024-11-15");
//   const normalizedOtherFlights = normalizeFlightData(otherRawFlights);
//   console.log("Normalized other flights:", JSON.stringify(normalizedOtherFlights, null, 2));
// })();

// If this were a Node.js module, you might export it like this:
module.exports = { fetchMockFlights, normalizeFlightData, formatDuration };
