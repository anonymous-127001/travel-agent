// This file will contain the core logic for the Flight Search microservice.
// Responsibilities include:
// - Interacting with external flight APIs (e.g., Amadeus, Skyscanner), web scrapers.
// - Normalizing the data received from these sources.
// - Implementing ranking algorithms for search results.
// - Caching results to improve performance and reduce API call frequency.

const { scrapeFlights } = require('./scrapers/flight_scraper');

// TODO: Replace this with actual external API integration (e.g., Amadeus, Skyscanner)
function fetchMockFlights(params) {
  const { origin, destination, departureDate, returnDate, adults, cabinClass } = params;
  console.log(`fetchMockFlights: Searching for flights:
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
      total_journey_minutes: 360,
      layover_duration_minutes: 90,
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
          leg_duration_minutes: 195
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
    return [mockFlights[0], mockFlights[1]];
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
  if (durationString === "") return "0m";
  return durationString;
}

/**
 * Normalizes raw flight data from different providers (mock API, scraper) to the application's defined schema.
 */
function normalizeFlightData(rawFlights, dataSourceType = "mockApi") {
  if (!Array.isArray(rawFlights)) {
    console.error("normalizeFlightData: Expected an array of raw flights, received:", rawFlights);
    return [];
  }

  return rawFlights.map((rawFlight, index) => {
    if (dataSourceType === "scraper") {
      // --- Normalization logic for scraped data ---
      let id = `scraped_fl_${Date.now()}_${index}`; // Generate a unique ID for scraped flights
      
      // Simplified parsing for price (example: "USD 275.50" or "$310.00")
      let amount = null;
      let currency = "USD"; // Default currency
      if (rawFlight.price_details) {
        const priceMatch = rawFlight.price_details.match(/([\d\.]+)/);
        if (priceMatch) amount = parseFloat(priceMatch[1]);
        if (rawFlight.price_details.includes("USD")) currency = "USD"; // Basic check
        // TODO: Add more robust currency parsing if needed
      }

      // Simplified parsing for stops (example: "1 stop (XYZ)" or "Non-stop")
      let stops = 0;
      if (rawFlight.stops_description) {
        if (rawFlight.stops_description.toLowerCase() === "non-stop") {
          stops = 0;
        } else {
          const stopsMatch = rawFlight.stops_description.match(/(\d+)/);
          if (stopsMatch) stops = parseInt(stopsMatch[1], 10);
          // TODO: More robust parsing for various "stops" descriptions
        }
      }
      
      // Simplified parsing for departure/arrival info and duration
      // Example: "JFK at 08:00 AM" -> "JFK"
      // TODO: Implement robust parsing for times and full duration calculation
      const departureAirport = rawFlight.departure_info ? rawFlight.departure_info.split(' ')[0] : "N/A";
      const arrivalAirport = rawFlight.arrival_info ? rawFlight.arrival_info.split(' ')[0] : "N/A";
      
      return {
        id: id,
        segments: [ // Creating a single segment for simplicity from scraped data
          {
            departureAirport: departureAirport,
            departureTime: "N/A", // TODO: Parse from rawFlight.departure_info
            arrivalAirport: arrivalAirport,
            arrivalTime: "N/A", // TODO: Parse from rawFlight.arrival_info
            carrier: rawFlight.scraped_airline_name || "N/A",
            flightNumber: "N/A", // Typically not available directly in simple scrapes
            duration: rawFlight.duration_raw || "N/A" // Use raw duration string
          }
        ],
        totalDuration: rawFlight.duration_raw || "N/A", // Use raw duration string
        price: {
          amount: amount,
          currency: currency
        },
        stops: stops,
        co2Emissions: null // TODO: Implement actual CO2 emission calculation/fetching
      };

    } else { // Default to "mockApi" or other future direct API structures
      // --- Normalization logic for mock API data (original logic) ---
      const segments = rawFlight.flight_legs.map(leg => ({
        departureAirport: leg.dep_airport,
        departureTime: leg.dep_time,
        arrivalAirport: leg.arr_airport,
        arrivalTime: leg.arr_time,
        carrier: leg.airline_code,
        flightNumber: leg.fl_num,
        duration: formatDuration(leg.leg_duration_minutes)
      }));

      const totalDuration = formatDuration(rawFlight.total_journey_minutes);
      const price = {
        amount: rawFlight.pricing_info.total_fare,
        currency: rawFlight.pricing_info.currency_code
      };
      const co2Emissions = null;

      return {
        id: rawFlight.provider_id,
        segments: segments,
        totalDuration: totalDuration,
        price: price,
        stops: rawFlight.num_stops,
        co2Emissions: co2Emissions
      };
    }
  });
}

/**
 * Fetches flight data using the web scraper and normalizes it.
 * @param {object} params - Search parameters (origin, destination, departureDate).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized flight data.
 */
async function getFlightsViaScraper(params) {
  console.log("getFlightsViaScraper: Using scraper for params:", params);
  const rawScrapedData = await scrapeFlights(params.origin, params.destination, params.departureDate);
  console.log("getFlightsViaScraper: Raw scraped data:", JSON.stringify(rawScrapedData, null, 2));
  const normalizedData = normalizeFlightData(rawScrapedData, "scraper");
  console.log("getFlightsViaScraper: Normalized scraped data:", JSON.stringify(normalizedData, null, 2));
  return normalizedData;
}


/**
 * Main handler for flight search requests.
 * Decides the data source based on parameters or configuration.
 * @param {object} params - Search parameters (origin, destination, departureDate, etc.).
 * @param {string} dataSource - The source to use: "mockApi", "scraper", "realApi".
 * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized flight data.
 */
async function flightSearchHandler(params, dataSource = "mockApi") {
  console.log(`flightSearchHandler: Received search for ${params.origin} to ${params.destination} on ${params.departureDate}, using dataSource: ${dataSource}`);
  
  if (dataSource === "scraper") {
    return getFlightsViaScraper(params);
  } else if (dataSource === "mockApi") {
    // fetchMockFlights is synchronous, so no await needed here.
    // If it were async, we'd use: const rawData = await fetchMockFlights(params);
    const rawData = fetchMockFlights(params);
    return normalizeFlightData(rawData, "mockApi"); // Explicitly pass dataSourceType
  }
  // else if (dataSource === "realApi") {
  //   // TODO: Implement logic for real API calls
  //   // const rawRealApiData = await fetchFromRealApi(params);
  //   // return normalizeFlightData(rawRealApiData, "realApi");
  //   console.warn("Real API data source not yet implemented.");
  //   return [];
  // } 
  else {
    console.warn(`Unknown data source: ${dataSource}. Defaulting to empty results.`);
    return [];
  }
}


// Example of how to use the flightSearchHandler:
// (async () => {
//   const searchParams = { origin: "JFK", destination: "LAX", departureDate: "2024-12-01" };

//   console.log("\n--- Testing with Mock API ---");
//   const mockApiResults = await flightSearchHandler(searchParams, "mockApi");
//   console.log("Results from Mock API:", JSON.stringify(mockApiResults, null, 2));

//   console.log("\n--- Testing with Scraper ---");
//   const scraperResults = await flightSearchHandler(searchParams, "scraper");
//   console.log("Results from Scraper:", JSON.stringify(scraperResults, null, 2));

//   // Example for a non-existent data source
//   // const unknownResults = await flightSearchHandler(searchParams, "nonExistentSource");
//   // console.log("Results from Non-Existent Source:", JSON.stringify(unknownResults, null, 2));
// })();


module.exports = {
  fetchMockFlights, // Kept for direct testing if needed
  normalizeFlightData,
  formatDuration,
  scrapeFlights, // Exporting for completeness, though mainly used internally by getFlightsViaScraper
  getFlightsViaScraper,
  flightSearchHandler
};
