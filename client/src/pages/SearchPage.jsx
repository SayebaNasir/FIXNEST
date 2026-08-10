import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import SearchFilters from '../components/SearchFilters';
import ProviderMap from '../components/ProviderMap';
import ProviderCard from '../components/ProviderCard';
import BookingModal from '../components/BookingModal';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Tag, ArrowRight, Compass, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchPage = () => {
  const { user, token, setIsLoginModalOpen } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // User location state (defaults to Aftabnagar, Dhaka)
  const [userLocation, setUserLocation] = useState({ lat: 23.7684, lng: 90.4237 });

  const [filters, setFilters] = useState({
    serviceType: '',
    rating: '',
    maxPrice: '',
    radius: '50'
  });

  // Get user's actual location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const fetchProviders = async (currentFilters, loc = userLocation) => {
    setLoading(true);
    try {
      const f = currentFilters || filters;
      let url = `http://localhost:5001/api/providers?lat=${loc.lat}&lng=${loc.lng}&radius=${f.radius}`;

      if (f.serviceType) url += `&serviceType=${f.serviceType}`;
      if (f.rating) url += `&rating=${f.rating}`;
      if (f.maxPrice) url += `&maxPrice=${f.maxPrice}`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setProviders(res.data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when filters or location change
  useEffect(() => {
    fetchProviders(filters, userLocation);
  }, [filters, userLocation]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || !token) {
        setFavoriteProviderIds([]);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/api/auth/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteProviderIds((res.data || []).map((provider) => provider._id));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    fetchFavorites();
  }, [user, token]);

  const handleFavoriteToggle = async (provider) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const isFavorite = favoriteProviderIds.includes(provider._id);

    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5001/api/auth/favorites/${provider._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteProviderIds((prev) => prev.filter((id) => id !== provider._id));
      } else {
        await axios.post(`http://localhost:5001/api/auth/favorites/${provider._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteProviderIds((prev) => [...prev, provider._id]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleBookNow = (provider) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  // Filter out the logged-in provider from search results & map so they cannot book themselves
  const displayProviders = providers.filter(p => {
    if (user?.role === 'provider') {
      const currentUserId = user.id || user._id;
      const providerUserId = p.userId?._id || p.userId;
      if (currentUserId && providerUserId && String(providerUserId) === String(currentUserId)) {
        return false;
      }
      if (user.email && p.email && p.email.toLowerCase() === user.email.toLowerCase()) {
        return false;
      }
      if (user.name && p.name && p.name.toLowerCase() === user.name.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO BANNER - Subtle Baby Pink & Purple Theme */}
        <header className="rounded-3xl border border-pink-200/70 bg-gradient-to-r from-pink-50/90 via-purple-50/90 to-pink-50/90 p-8 sm:p-10 shadow-sm relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/80 border border-pink-200 text-pink-600 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-pink-500" /> Trusted Local Home Services
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display">
                Find &amp; Book Local <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Experts in Minutes</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                Connect with verified plumbers, electricians, cleaners &amp; technicians. Enjoy automated notifications &amp; <strong>10% OFF Off-Peak Deals</strong>!
              </p>
            </div>

            {/* Off-Peak Quick Banner Card */}
            <div className="bg-white/90 border border-purple-200/80 rounded-3xl p-6 shadow-md flex flex-col justify-between gap-4 min-w-[280px]">
              <div>
                <div className="flex items-center gap-2 text-purple-600 text-xs font-black uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-pink-500" /> Off-Peak Savings
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-display">Book &amp; Save 10%</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Low demand time slots automatically qualify for 10% off rate.</p>
              </div>
              <Link 
                to="/offpeak-heatmap" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2"
              >
                View Off-Peak Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Map & Provider Grid */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Interactive Map */}
            <div className="bg-white/90 border border-purple-100 rounded-3xl p-4 shadow-sm overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-500" /> Interactive Provider Map
                </h3>
                <span className="text-xs text-slate-400 font-semibold">Within {filters.radius} km radius</span>
              </div>
              <ProviderMap
                providers={displayProviders}
                userLocation={userLocation}
                radius={Number(filters.radius)}
              />
            </div>

            {/* Provider Listing Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                  {loading ? (
                    <span className="text-slate-400 flex items-center gap-2 text-base">
                      <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      Searching Nearby Pros...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-pink-600">{displayProviders.length}</span> Verified Provider{displayProviders.length !== 1 ? 's' : ''} Available
                    </span>
                  )}
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white/60 border border-purple-100 rounded-3xl text-slate-400">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-400 border-t-transparent mb-4"></div>
                  <p className="font-semibold text-sm text-slate-600">Finding best home service experts near you...</p>
                </div>
              ) : displayProviders.length === 0 ? (
                <div className="text-center py-16 bg-white/80 rounded-3xl border border-pink-100 p-8">
                  <Search className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                  <p className="text-slate-800 font-extrabold text-lg">No providers found matching your criteria.</p>
                  <p className="text-slate-400 text-sm mt-1">Try expanding your search radius or selecting another service type.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayProviders.map(provider => (
                    <ProviderCard
                      key={provider._id}
                      provider={provider}
                      onBookNow={handleBookNow}
                      onToggleFavorite={handleFavoriteToggle}
                      isFavorite={favoriteProviderIds.includes(provider._id)}
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
