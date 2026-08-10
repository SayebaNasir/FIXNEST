import React, { useContext } from 'react';
import { Star, MapPin, Clock, CalendarCheck, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ProviderCard = ({ provider, onBookNow, onToggleFavorite, isFavorite = false }) => {
  const { user, token, setIsLoginModalOpen } = useContext(AuthContext);

  const handleFavoriteToggle = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (typeof onToggleFavorite === 'function') {
      await onToggleFavorite(provider);
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5001/api/auth/favorites/${provider._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`http://localhost:5001/api/auth/favorites/${provider._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      window.location.reload();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary-700 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-tight">{provider.name}</h3>
            <div className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white/90">
              {provider.serviceType}
            </div>
          </div>
          <div className="rounded-full bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900">
            ★ {provider.rating}
          </div>
        </div>
      </div>

      <div className="flex-1 p-5">
        <div className="flex flex-wrap gap-2">
          {provider.verificationStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {provider.reviewCount || 0} reviews
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 w-4 h-4 text-primary-600" />
            <span>{provider.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-slate-800">৳{provider.pricePerHour} / hour</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <span className="flex items-center justify-center gap-2"><Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} /> {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}</span>
          </button>
          <Link
            to={`/provider/${provider._id}`}
            className="rounded-2xl bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            View Full Profile
          </Link>
          <button
            onClick={() => (typeof onBookNow === 'function' ? onBookNow(provider) : null)}
            className="rounded-2xl bg-primary-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            Book This Provider
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
