'use client';

import { useState } from 'react';
import FlightMap from '@/components/FlightMap';
import FlightInfoPanel from '@/components/FlightInfoPanel';

export default function Home() {
  const [selectedFlight, setSelectedFlight] = useState(null);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <FlightMap onFlightSelect={setSelectedFlight} />
      {selectedFlight && (
        <FlightInfoPanel 
          flight={selectedFlight} 
          onClose={() => setSelectedFlight(null)} 
        />
      )}
    </main>
  );
}
