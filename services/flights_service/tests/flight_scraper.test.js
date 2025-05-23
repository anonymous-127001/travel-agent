const { scrapeFlights } = require('../scrapers/flight_scraper');
const { getFlightsViaScraper, flightSearchHandler, normalizeFlightData } = require('../flight_search');

describe('Flight Scraper Module and Integration', () => {
  const testParams = { origin: "TEST_ORIGIN", destination: "TEST_DEST", departureDate: "2024-01-01" };

  // --- Tests for scrapeFlights (from scrapers/flight_scraper.js) ---
  describe('scrapeFlights', () => {
    test('should return an array of sample flight data', async () => {
      const results = await scrapeFlights(testParams.origin, testParams.destination, testParams.departureDate);
      expect(Array.isArray(results)).toBe(true);
      // Based on the current hardcoded data in scrapeFlights:
      expect(results.length).toBe(2); 
    });

    test('sample data from scrapeFlights should have expected raw structure', async () => {
      const results = await scrapeFlights(testParams.origin, testParams.destination, testParams.departureDate);
      results.forEach(flight => {
        expect(flight).toHaveProperty('scraped_airline_name');
        expect(flight).toHaveProperty('departure_info');
        expect(flight).toHaveProperty('arrival_info');
        expect(flight).toHaveProperty('price_details');
        expect(flight).toHaveProperty('stops_description');
        expect(flight).toHaveProperty('duration_raw');
      });
      // Check if origin and destination are incorporated in the sample data
      expect(results[0].departure_info).toContain(testParams.origin);
      expect(results[0].arrival_info).toContain(testParams.destination);
    });
  });

  // --- Tests for getFlightsViaScraper (from flight_search.js) ---
  describe('getFlightsViaScraper', () => {
    test('should return an array of normalized flight objects', async () => {
      const results = await getFlightsViaScraper(testParams);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0); // Expecting the 2 sample scraped items to be normalized
    });

    test('normalized flight objects from getFlightsViaScraper should have key properties', async () => {
      const results = await getFlightsViaScraper(testParams);
      results.forEach(flight => {
        expect(flight).toHaveProperty('id');
        expect(typeof flight.id).toBe('string');
        expect(flight).toHaveProperty('segments');
        expect(Array.isArray(flight.segments)).toBe(true);
        expect(flight.segments.length).toBeGreaterThan(0); // Each scraped item becomes one segment
        expect(flight).toHaveProperty('totalDuration');
        expect(flight).toHaveProperty('price');
        expect(flight.price).toHaveProperty('amount');
        expect(flight.price).toHaveProperty('currency');
        expect(flight).toHaveProperty('stops');
        expect(flight).toHaveProperty('co2Emissions', null); // Currently hardcoded to null
      });
    });

    test('simplified parsing in normalizeFlightData for scraped data should work via getFlightsViaScraper', async () => {
      const results = await getFlightsViaScraper(testParams);
      const firstFlight = results[0]; // From "AirScraper One" in scrapeFlights mock

      // Test price parsing (e.g., "USD 275.50")
      expect(firstFlight.price.amount).toBe(275.50);
      expect(firstFlight.price.currency).toBe("USD");

      // Test stops parsing (e.g., "1 stop (XYZ)")
      expect(firstFlight.stops).toBe(1);

      const secondFlight = results[1]; // From "FlyScrape Airways"
       // Test price parsing (e.g., "$310.00")
      expect(secondFlight.price.amount).toBe(310.00);
      expect(secondFlight.price.currency).toBe("USD"); // Default
      // Test stops parsing (e.g., "Non-stop")
      expect(secondFlight.stops).toBe(0);

      // Test segment details (simplified)
      expect(firstFlight.segments[0].departureAirport).toBe(testParams.origin);
      expect(firstFlight.segments[0].arrivalAirport).toBe(testParams.destination);
      expect(firstFlight.segments[0].carrier).toBe("AirScraper One");
    });
  });

  // --- Tests for flightSearchHandler (from flight_search.js) ---
  describe('flightSearchHandler', () => {
    test('should return normalized data from scraper when dataSource is "scraper"', async () => {
      const results = await flightSearchHandler(testParams, "scraper");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2); // Expecting 2 items from the scraper's sample data
      results.forEach(flight => {
        expect(flight).toHaveProperty('id');
        expect(flight.id.startsWith('scraped_fl_')).toBe(true);
        expect(flight).toHaveProperty('segments');
        expect(flight).toHaveProperty('price');
        expect(flight.price.amount).not.toBeNull();
      });
    });

    test('should return normalized data from mock API when dataSource is "mockApi"', async () => {
      const mockApiParams = { origin: "JFK", destination: "LAX", departureDate: "2024-12-01" };
      const results = await flightSearchHandler(mockApiParams, "mockApi");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0); // fetchMockFlights returns 2 items for JFK-LAX
      
      results.forEach(flight => {
        expect(flight).toHaveProperty('id');
        // Check if the ID matches one of the mock provider IDs
        expect(["provider_xyz_123", "provider_abc_789", "provider_ua_456"].includes(flight.id)).toBe(true);
        expect(flight).toHaveProperty('segments');
        expect(flight.segments.length).toBeGreaterThanOrEqual(1);
        expect(flight).toHaveProperty('price');
        expect(flight.price.amount).toBeGreaterThan(0);
      });
    });

    test('should return empty array for unknown dataSource', async () => {
        const results = await flightSearchHandler(testParams, "nonExistentSource");
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
    });
  });
});

// To run tests:
// 1. Make sure you are in the `services/flights_service` directory.
// 2. Run `npm test`
// This will run all `*.test.js` files in the directory, including `flight_search.test.js` and `flight_scraper.test.js`.
