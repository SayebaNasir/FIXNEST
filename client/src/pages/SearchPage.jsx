import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import SearchFilters from '../components/SearchFilters';
import ProviderMap from '../components/ProviderMap';
import ProviderCard from '../components/ProviderCard';
import BookingModal from '../components/BookingModal';

import { AuthContext } from '../context/AuthContext';

const SearchPage = () => {
  const { user, setIsLoginModalOpen } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default user location (Aftabnagar, Dhaka)
  const defaultLocation = { lat: 23.7684, lng: 90.4237 };

  const [filters, setFilters] = useState({
    serviceType: '',
    rating: '',
    maxPrice: '',
    radius: '50'
  });

  const fetchProviders = async (currentFilters) => {
    setLoading(true);
    try {
      const f = currentFilters || filters;
      let url = `http://localhost:5000/api/providers?lat=${defaultLocation.lat}&lng=${defaultLocation.lng}&radius=${f.radius}`;

      if (f.serviceType) url += `&serviceType=${f.serviceType}`;
      if (f.rating) url += `&rating=${f.rating}`;
      if (f.maxPrice) url += `&maxPrice=${f.maxPrice}`;

      const res = await axios.get(url);
      setProviders(res.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when filters change
  useEffect(() => {
    fetchProviders(filters);
  }, [filters]);

  const handleBookNow = (provider) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Find Professionals Near You</h1>
          <p className="mt-2 text-lg text-slate-600">Discover top-rated home service providers in your area.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SearchFilters
              filters={filters}
              setFilters={setFilters}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <ProviderMap
              providers={providers}
              userLocation={defaultLocation}
              radius={Number(filters.radius)}
            />

            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {loading ? 'Searching...' : `${providers.length} Provider${providers.length !== 1 ? 's' : ''} Found`}
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-lg">No providers found matching your criteria.</p>
                  <p className="text-slate-400 mt-2">Try adjusting your filters or increasing the search radius.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {providers.map(provider => (
                    <ProviderCard
                      key={provider._id}
                      provider={provider}
                      onBookNow={handleBookNow}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
        />
      )}
    </div>
  );
};

export default SearchPage;
