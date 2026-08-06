import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ProviderMap = ({ providers, userLocation, radius }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [map, userLocation]);

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm z-0 relative">
      <MapContainer 
        center={[userLocation.lat, userLocation.lng]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Your Location</Popup>
        </Marker>
        
        {/* Radius Circle */}
        <Circle 
          center={[userLocation.lat, userLocation.lng]}
          radius={radius * 1000} // convert km to meters
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1 }}
        />

        {/* Provider Markers */}
        {providers.map(provider => {
          if (provider.location && provider.location.coordinates) {
            // MongoDB GeoJSON is [lng, lat], Leaflet is [lat, lng]
            const [lng, lat] = provider.location.coordinates;
            return (
              <Marker key={provider._id} position={[lat, lng]}>
                <Popup>
                  <div className="font-medium text-slate-900">{provider.name}</div>
                  <div className="text-sm text-slate-600">{provider.serviceType}</div>
                  <div className="text-sm font-bold text-primary-600">৳{provider.pricePerHour}/hr</div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default ProviderMap;
