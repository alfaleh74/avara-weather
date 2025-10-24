# ✈️ Avara Weather - Live Flight Tracker

A real-time flight tracking application that displays live aircraft positions from around the world using the OpenSky Network API. Built with Next.js, React, and Leaflet.

![Flight Tracker](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## Features

- 🌍 **Interactive World Map** - Powered by MapLibre GL with a beautiful dark theme
- ✈️ **Real-time Flight Data** - Live aircraft positions with automatic updates
- 📊 **Detailed Flight Information** - View callsign, altitude, speed, heading, and more
- 🎯 **Click to Inspect** - Click on any aircraft to see detailed information
- 🟢 **Live Status Indicator** - Real-time connection status monitoring
- 🛡️ **Rate Limit Compliant** - Respects OpenSky Network API limits (400 requests/day)
- 🌙 **Modern UI** - Beautiful dark theme with smooth animations
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Technologies Used

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **MapLibre GL** - High-performance interactive map library
- **Tailwind CSS 4** - Utility-first CSS framework
- **OpenSky Network API** - Free flight tracking data

## OpenSky Network API Integration

This application uses the [OpenSky Network REST API](https://openskynetwork.github.io/opensky-api/rest.html) to fetch real-time flight data. The OpenSky Network is a non-profit association that provides free flight tracking data.

### API Endpoint Used

```
GET https://opensky-network.org/api/states/all
```

### Data Retrieved

- **ICAO24**: Unique aircraft identifier
- **Callsign**: Flight callsign (e.g., "AAL123")
- **Position**: Latitude and longitude coordinates
- **Altitude**: Barometric and geometric altitude
- **Velocity**: Ground speed in m/s
- **Heading**: True track in degrees
- **Vertical Rate**: Climb/descent rate
- **Origin Country**: Aircraft registration country
- **On Ground Status**: Whether the aircraft is on the ground

### Rate Limiting & Compliance

**OpenSky Network Rate Limits:**
- **Anonymous users**: 100 requests/day, minimum 10 seconds between requests
- **Authenticated users**: 400 requests/day (free account)

**How This App Stays Compliant:**
- ✅ Implements caching to minimize API calls
- ✅ Uses efficient data fetching strategies
- ✅ Exponential backoff on rate limit errors
- ✅ Respects API rate limits with appropriate intervals

**For higher limits**: Sign up for a free OpenSky account and configure credentials (see Setup below)

📚 **Detailed documentation**: See `OPENSKY_RATE_LIMITS.md`

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun

### Quick Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd avara-weather
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

The application will start fetching live flight data and display aircraft on the map!

## Project Structure

```
avara-weather/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── flights/
│   │   │       └── route.js          # OpenSky API integration
│   │   ├── globals.css               # Global styles and Leaflet customization
│   │   ├── layout.js                 # Root layout
│   │   └── page.js                   # Main page component
│   └── components/
│       ├── FlightMap.js              # Interactive map component
│       └── FlightInfoPanel.js        # Flight details panel
├── public/                            # Static assets
├── package.json
└── README.md
```

## Usage

### Viewing Flights

1. When you open the application, you'll see a world map with aircraft markers
2. Each blue plane icon represents an active flight
3. The position and rotation of each icon shows the aircraft's location and heading

### Inspecting Flight Details

1. Click on any aircraft marker to open the flight information panel
2. The panel displays:
   - Callsign and flight status
   - ICAO24 address and origin country
   - Current position (latitude/longitude)
   - Altitude (in both meters and feet)
   - Ground speed (in km/h and knots)
   - Heading and direction
   - Vertical rate (climb/descent)
   - Last contact time
   - Position data source (ADS-B, MLAT, etc.)

### Refreshing Data

- Data automatically refreshes at regular intervals
- The map updates dynamically as new flight data arrives
- Connection status is displayed in the interface

## API Routes

### GET `/api/flights`

Fetches current flight states from OpenSky Network.

**Query Parameters:**
- `lamin` (optional): Minimum latitude for bounding box
- `lomin` (optional): Minimum longitude for bounding box
- `lamax` (optional): Maximum latitude for bounding box
- `lomax` (optional): Maximum longitude for bounding box

**Response:**
```json
{
  "time": 1234567890,
  "count": 12345,
  "flights": [
    {
      "icao24": "abc123",
      "callsign": "AAL123",
      "origin_country": "United States",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "baro_altitude": 10000,
      "velocity": 250,
      "true_track": 180,
      "on_ground": false,
      ...
    }
  ]
}
```

## Customization

### Changing the Map Theme

Edit the map style configuration in `src/components/map/constants.jsx` to customize the map appearance.

### Adjusting Refresh Interval

In `src/hooks/useFlightData.js`, modify the update interval to adjust how frequently flight data is fetched.

### Custom Plane Icons

Modify the plane icon processing in `src/components/graphics/PlaneIconProcessor.jsx` to customize the aircraft markers.

## Performance Considerations

- The application handles thousands of simultaneous aircraft efficiently
- Map markers are optimized with Leaflet's clustering capabilities
- API responses are cached to reduce server load
- Client-side filtering removes invalid data points

## Known Limitations

- OpenSky Network API has rate limits for anonymous users
- Some aircraft may not have complete data (e.g., missing callsign or altitude)
- Real-time updates are limited to 10-second intervals
- Historical flight data is not available through this interface

## Future Enhancements

- [ ] Add flight search functionality
- [ ] Implement flight path tracking and history
- [ ] Add airport information and markers
- [ ] Create filter options (by airline, altitude, speed, etc.)
- [ ] Add heatmap visualization
- [ ] Implement user authentication for higher API limits
- [ ] Add weather overlay integration
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [OpenSky Network](https://opensky-network.org/) for providing free flight data
- [MapLibre GL](https://maplibre.org/) for the mapping library
- [Next.js](https://nextjs.org/) team for the amazing framework

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ by the Avara Weather team
