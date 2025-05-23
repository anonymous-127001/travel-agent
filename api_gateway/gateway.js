// This file will contain the main logic for the API Gateway using Node.js/Express.js
// It will handle incoming requests and route them to the appropriate microservices.

const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Middleware to parse JSON bodies (if needed for future POST requests)
app.use(express.json());
// Middleware to parse URL-encoded bodies (for query parameters)
app.use(express.urlencoded({ extended: true }));

// Define a GET route for flight searches
app.get('/api/flights/search', (req, res) => {
  console.log('API Gateway: /api/flights/search route hit.');
  console.log('Query Parameters:', req.query);

  // TODO: Validate query parameters (e.g., origin, destination, departureDate)

  // TODO: Make an actual call to the Flight Search microservice
  // This would involve:
  // 1. Constructing the request to the flights_service (e.g., using HTTP client like axios or node-fetch)
  //    Example: const flightServiceResponse = await axios.get('http://localhost:FLIGHT_SERVICE_PORT/search', { params: req.query });
  // 2. Handling the response from the flights_service
  // 3. Sending the relevant data back to the client

  // For now, send a mock success response
  res.json({
    message: "Flight search endpoint called successfully in API Gateway",
    queryParams: req.query,
    // TODO: Replace with actual data from Flight Search service
    // mockDataFromFlightService: flightServiceResponse.data 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API Gateway is running' });
});

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});

// To run this gateway: node api_gateway/gateway.js
