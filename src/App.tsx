import React, { useEffect, useState } from 'react';
import { Car, Clock, LogOut } from 'lucide-react';

interface ParkingSpot {
  id: string;
  spot_number: string;
  is_occupied: boolean;
  vehicle_type: string | null;
  floor_number: number;
}

interface ParkingRecord {
  id: string;
  spot_id: string;
  vehicle_number: string;
  entry_time: string;
  exit_time: string | null;
  amount_paid: number;
}

const API_URL = 'http://localhost:3000/api';

function App() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);

  useEffect(() => {
    fetchParkingSpots();
    fetchActiveRecords();
    
    const interval = setInterval(() => {
      fetchParkingSpots();
      fetchActiveRecords();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchParkingSpots = async () => {
    try {
      const response = await fetch(`${API_URL}/spots`);
      const data = await response.json();
      setSpots(data);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    }
  };

  const fetchActiveRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/active-records`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleParkVehicle = async () => {
    if (!selectedSpot || !vehicleNumber) return;

    try {
      const response = await fetch(`${API_URL}/park`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotId: selectedSpot.id,
          vehicleNumber,
        }),
      });

      if (!response.ok) throw new Error('Failed to park vehicle');

      fetchParkingSpots();
      fetchActiveRecords();
      setSelectedSpot(null);
      setVehicleNumber('');
    } catch (error) {
      console.error('Error parking vehicle:', error);
    }
  };

  const handleVehicleExit = async (recordId: string) => {
    try {
      const response = await fetch(`${API_URL}/exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId }),
      });

      if (!response.ok) throw new Error('Failed to process vehicle exit');

      fetchParkingSpots();
      fetchActiveRecords();
    } catch (error) {
      console.error('Error processing vehicle exit:', error);
    }
  };

  // Group spots by floor
  const spotsByFloor = spots.reduce((acc, spot) => {
    if (!acc[spot.floor_number]) {
      acc[spot.floor_number] = [];
    }
    acc[spot.floor_number].push(spot);
    return acc;
  }, {} as Record<number, ParkingSpot[]>);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Car className="mr-2" /> Parking Lot Management
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parking Spots */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Available Spots</h2>
            <div className="space-y-6">
              {Object.entries(spotsByFloor).map(([floor, floorSpots]) => (
                <div key={floor} className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-700">Floor {floor}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {floorSpots.map((spot) => (
                      <button
                        key={spot.id}
                        onClick={() => !spot.is_occupied && setSelectedSpot(spot)}
                        onMouseEnter={() => setHoveredSpot(spot.id)}
                        onMouseLeave={() => setHoveredSpot(null)}
                        disabled={spot.is_occupied}
                        className={`
                          relative p-4 rounded-lg text-center transition-all duration-200
                          ${spot.is_occupied
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }
                          ${selectedSpot?.id === spot.id ? 'ring-2 ring-green-500 shadow-lg' : ''}
                          ${hoveredSpot === spot.id && !spot.is_occupied ? 'transform scale-105' : ''}
                        `}
                      >
                        <p className="font-bold text-lg">{spot.spot_number}</p>
                        {hoveredSpot === spot.id && !spot.is_occupied && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-800 text-white text-xs py-1 px-2 rounded">
                            Click to select
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parking Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Park Vehicle</h2>
            {selectedSpot ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Spot
                  </label>
                  <p className="mt-1 text-lg font-semibold text-green-800">
                    Spot {selectedSpot.spot_number} (Floor {selectedSpot.floor_number})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="Enter vehicle number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={handleParkVehicle}
                  disabled={!vehicleNumber}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Park Vehicle
                </button>
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel Selection
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select an available parking spot from the grid to begin
                </p>
              </div>
            )}
          </div>

          {/* Active Parking */}
          <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2" /> Active Parking
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => {
                    const spot = spots.find((s) => s.id === record.spot_id);
                    return (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {spot?.spot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {record.vehicle_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(record.entry_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {Math.floor(
                            (Date.now() - new Date(record.entry_time).getTime()) /
                              (1000 * 60)
                          )}{' '}
                          minutes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleVehicleExit(record.id)}
                            className="text-red-600 hover:text-red-900 flex items-center transition-colors duration-200"
                          >
                            <LogOut className="w-4 h-4 mr-1" /> Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;