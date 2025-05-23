const { fetchMockFlights, normalizeFlightData, formatDuration } = require('../flight_search');

describe('Flight Search Logic', () => {
  describe('formatDuration', () => {
    test('should correctly format 0 minutes', () => {
      expect(formatDuration(0)).toBe('0m');
    });
    test('should correctly format 30 minutes', () => {
      expect(formatDuration(30)).toBe('30m');
    });
    test('should correctly format 60 minutes', () => {
      expect(formatDuration(60)).toBe('1h');
    });
    test('should correctly format 90 minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
    });
    test('should correctly format 125 minutes', () => {
      expect(formatDuration(125)).toBe('2h 5m');
    });
    test('should handle negative numbers', () => {
      expect(formatDuration(-30)).toBe('N/A');
    });
    test('should handle non-numeric input', () => {
      expect(formatDuration('abc')).toBe('N/A');
    });
  });

  describe('fetchMockFlights', () => {
    test('should return an array of flights', () => {
      const flights = fetchMockFlights("JFK", "LAX", "2024-12-01");
      expect(Array.isArray(flights)).toBe(true);
      expect(flights.length).toBeGreaterThan(0);
    });

    test('should return flights for a known origin/destination pair (JFK to LAX)', () => {
      const flights = fetchMockFlights("JFK", "LAX", "2024-12-01");
      expect(flights.length).toBeGreaterThan(0);
      flights.forEach(flight => {
        expect(flight.flight_legs[0].dep_airport).toBe("JFK");
        expect(flight.flight_legs[flight.flight_legs.length - 1].arr_airport).toBe("LAX");
      });
    });

    test('should return default flights if no match is found (e.g., MIA to DCA)', () => {
      // Based on current mock logic, it returns two default flights
      const flights = fetchMockFlights("MIA", "DCA", "2024-12-01");
      expect(Array.isArray(flights)).toBe(true);
      expect(flights.length).toBe(2); // Default behavior returns 2 flights
      // Check if these are the expected default flights (provider_xyz_123 and provider_abc_789)
      expect(flights.some(f => f.provider_id === "provider_xyz_123")).toBe(true);
      expect(flights.some(f => f.provider_id === "provider_abc_789")).toBe(true);
    });

    test('each flight object in the mock response should have essential properties', () => {
      const flights = fetchMockFlights("JFK", "LAX", "2024-12-01"); // Any valid query
      flights.forEach(flight => {
        expect(flight).toHaveProperty('provider_id');
        expect(flight).toHaveProperty('flight_legs');
        expect(Array.isArray(flight.flight_legs)).toBe(true);
        expect(flight.flight_legs.length).toBeGreaterThan(0);
        flight.flight_legs.forEach(leg => {
          expect(leg).toHaveProperty('dep_airport');
          expect(leg).toHaveProperty('arr_airport');
          expect(leg).toHaveProperty('airline_code');
          expect(leg).toHaveProperty('fl_num');
          expect(leg).toHaveProperty('leg_duration_minutes');
        });
        expect(flight).toHaveProperty('total_journey_minutes');
        expect(flight).toHaveProperty('pricing_info');
        expect(flight.pricing_info).toHaveProperty('total_fare');
        expect(flight.pricing_info).toHaveProperty('currency_code');
        expect(flight).toHaveProperty('num_stops');
      });
    });
  });

  describe('normalizeFlightData', () => {
    // Get a sample raw flight from fetchMockFlights to use for normalization test
    const sampleRawFlights = fetchMockFlights("JFK", "LAX", "2024-12-01");
    const rawFlightToNormalize = sampleRawFlights.find(f => f.provider_id === "provider_xyz_123"); // 1-stop

    if (!rawFlightToNormalize) {
      throw new Error("Could not find provider_xyz_123 for testing normalizeFlightData. Check mock data.");
    }
    
    const normalizedFlights = normalizeFlightData([rawFlightToNormalize]);
    const normalizedFlight = normalizedFlights[0];

    test('should correctly transform a sample raw flight object', () => {
      expect(Array.isArray(normalizedFlights)).toBe(true);
      expect(normalizedFlights.length).toBe(1);
      expect(normalizedFlight).toBeDefined();
    });

    test('id should be correctly mapped', () => {
      expect(normalizedFlight.id).toBe(rawFlightToNormalize.provider_id);
    });

    test('segments array should be created with correct departure/arrival airports and times', () => {
      expect(Array.isArray(normalizedFlight.segments)).toBe(true);
      expect(normalizedFlight.segments.length).toBe(rawFlightToNormalize.flight_legs.length);
      
      normalizedFlight.segments.forEach((segment, index) => {
        const rawLeg = rawFlightToNormalize.flight_legs[index];
        expect(segment.departureAirport).toBe(rawLeg.dep_airport);
        expect(segment.departureTime).toBe(rawLeg.dep_time);
        expect(segment.arrivalAirport).toBe(rawLeg.arr_airport);
        expect(segment.arrivalTime).toBe(rawLeg.arr_time);
        expect(segment.carrier).toBe(rawLeg.airline_code);
        expect(segment.flightNumber).toBe(rawLeg.fl_num);
        expect(segment.duration).toBe(formatDuration(rawLeg.leg_duration_minutes));
      });
    });

    test('totalDuration should be correctly calculated and formatted', () => {
      // total_journey_minutes in mock data includes layovers
      const expectedTotalDuration = formatDuration(rawFlightToNormalize.total_journey_minutes);
      expect(normalizedFlight.totalDuration).toBe(expectedTotalDuration);
    });

    test('price object should be correctly structured', () => {
      expect(normalizedFlight.price).toBeDefined();
      expect(normalizedFlight.price.amount).toBe(rawFlightToNormalize.pricing_info.total_fare);
      expect(normalizedFlight.price.currency).toBe(rawFlightToNormalize.pricing_info.currency_code);
    });

    test('stops count should be correct', () => {
      expect(normalizedFlight.stops).toBe(rawFlightToNormalize.num_stops);
    });

    test('co2Emissions should be present and null (as per current implementation)', () => {
      expect(normalizedFlight).toHaveProperty('co2Emissions');
      expect(normalizedFlight.co2Emissions).toBeNull();
    });

    test('should return an empty array if input is not an array', () => {
      expect(normalizeFlightData(null)).toEqual([]);
      expect(normalizeFlightData({})).toEqual([]);
      expect(normalizeFlightData(undefined)).toEqual([]);
    });
  });
});

// To run tests:
// 1. Make sure you are in the `services/flights_service` directory.
// 2. Run `npm test`
// (You might need to update the test script in package.json first: "test": "jest")
