import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_LOCATION = {
  lat: 23.8103,
  lng: 90.4125
};

const formatAddress = (properties = {}) => {
  const parts = [
    properties.name,
    properties.street
      ? `${properties.street}${properties.housenumber ? ` ${properties.housenumber}` : ''}`
      : null,
    properties.district,
    properties.city,
    properties.state,
    properties.country
  ].filter(Boolean);

  return [...new Set(parts)].join(', ');
};

const MapController = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    if (location?.lat && location?.lng) {
      map.flyTo(
        [location.lat, location.lng],
        15,
        {
          duration: 0.8
        }
      );
    }
  }, [location, map]);

  return null;
};

const LocationMarker = ({ location, onLocationChange }) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    }
  });

  if (!location?.lat || !location?.lng) {
    return null;
  }

  return (
    <Marker
      position={[location.lat, location.lng]}
      draggable={true}
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target;
          const position = marker.getLatLng();

          onLocationChange(
            position.lat,
            position.lng
          );
        }
      }}
    />
  );
};

const LocationPicker = ({
  address,
  lat,
  lng,
  onChange
}) => {
  const initialLocation = {
    lat: Number(lat) || DEFAULT_LOCATION.lat,
    lng: Number(lng) || DEFAULT_LOCATION.lng
  };

  const [location, setLocation] = useState(initialLocation);
  const [search, setSearch] = useState(address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  useEffect(() => {
    setSearch(address || '');
  }, [address]);

  useEffect(() => {
    if (lat && lng) {
      setLocation({
        lat: Number(lat),
        lng: Number(lng)
      });
    }
  }, [lat, lng]);

  useEffect(() => {
    const query = search.trim();

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Don't search if the text already represents
    // the currently selected address.
    if (query === address) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const response = await axios.get(
          `${API_URL}/api/geocode/search`,
          {
            params: {
              q: query,
              lat: location.lat,
              lon: location.lng
            },
            signal: controller.signal
          }
        );

        setSuggestions(response.data.features || []);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error(
            'Location search error:',
            error
          );
        }
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, address, location.lat, location.lng]);

  const reverseGeocode = async (newLat, newLng) => {
    try {
      setReverseLoading(true);

      const response = await axios.get(
        `${API_URL}/api/geocode/reverse`,
        {
          params: {
            lat: newLat,
            lon: newLng
          }
        }
      );

      const feature = response.data?.features?.[0];

      const newAddress = feature
        ? formatAddress(feature.properties)
        : `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;

      setSearch(newAddress);
      setLocation({
        lat: newLat,
        lng: newLng
      });

      onChange({
        address: newAddress,
        lat: newLat,
        lng: newLng
      });
    } catch (error) {
      console.error(
        'Reverse geocoding error:',
        error
      );

      setLocation({
        lat: newLat,
        lng: newLng
      });

      onChange({
        address: search,
        lat: newLat,
        lng: newLng
      });
    } finally {
      setReverseLoading(false);
    }
  };

  const handleSelect = (feature) => {
    const [newLng, newLat] =
      feature.geometry.coordinates;

    const newAddress =
      formatAddress(feature.properties) ||
      feature.properties?.name ||
      'Selected location';

    setSearch(newAddress);
    setSuggestions([]);

    setLocation({
      lat: newLat,
      lng: newLng
    });

    onChange({
      address: newAddress,
      lat: newLat,
      lng: newLng
    });
  };

  const handleMapLocationChange = (
    newLat,
    newLng
  ) => {
    reverseGeocode(newLat, newLng);
  };

  return (
    <div className="space-y-3">

      <div className="relative">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Service Location <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Search your address..."
          className="w-full rounded-xl border border-slate-300 p-3 pr-10 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
        />

        {searching && (
          <div className="absolute right-3 top-[42px] text-xs text-slate-400">
            Searching...
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

            {suggestions.map((feature, index) => {
              const title =
                formatAddress(feature.properties) ||
                feature.properties?.name ||
                'Unknown location';

              return (
                <button
                  type="button"
                  key={`${feature.properties?.osm_id || index}`}
                  onClick={() =>
                    handleSelect(feature)
                  }
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 border-slate-100 transition-colors"
                >
                  <div className="flex gap-3">
                    <span className="text-primary-600">
                      📍
                    </span>

                    <div>
                      <div className="font-medium text-slate-900">
                        {feature.properties?.name ||
                          title}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {title}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 h-[350px] relative">

        <MapContainer
          center={[
            location.lat,
            location.lng
          ]}
          zoom={13}
          style={{
            height: '100%',
            width: '100%'
          }}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            location={location}
          />

          <LocationMarker
            location={location}
            onLocationChange={
              handleMapLocationChange
            }
          />

        </MapContainer>

        <div className="absolute bottom-3 left-3 right-3 z-[500] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600 shadow">
          📍 Click anywhere on the map or drag the marker to fine-tune your location.
        </div>

        {reverseLoading && (
          <div className="absolute top-3 right-3 z-[500] bg-white px-3 py-2 rounded-lg shadow text-xs text-slate-600">
            Finding address...
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500">
        Selected location:{' '}
        <span className="font-medium text-slate-700">
          {search || 'No location selected'}
        </span>
      </div>

    </div>
  );
};

export default LocationPicker;