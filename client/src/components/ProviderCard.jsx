import React, { useContext } from 'react';
import { Star, MapPin, Clock, CalendarCheck, ShieldCheck, Heart, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-pink-300 relative">
      
      {/* Top Header Card - Subtle Pink & Lavender Purple */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 p-6 border-b border-pink-100 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors font-display">
              {provider.name}
            </h3>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" /> {provider.serviceType}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-xs shrink-0">
            <Star className="w-3.5 h-3.5 fill-slate-950" />
            <span>{provider.rating > 0 ? provider.rating : 'New'}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-6 flex flex-col justify-between space-y-5">
        <div>
          {/* Verification & Review Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {provider.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Pro
              </span>
            )}
            <span className="rounded-full bg-purple-50/80 border border-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              {provider.reviewCount || 0} reviews
            </span>
            <span className="rounded-full bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-1 text-[11px] font-extrabold">
              10% Off-Peak 🏷️
            </span>
          </div>

          {/* Location & Rate */}
          <div className="space-y-2.5 text-sm text-slate-600">
            {provider.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 w-4 h-4 text-pink-500 shrink-0" />
                <span className="text-slate-600 text-xs font-medium line-clamp-2">{provider.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-pink-50/40 p-3 rounded-2xl border border-pink-100/60">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Clock className="w-4 h-4 text-purple-500" /> Hourly Rate
              </div>
              <span className="font-extrabold text-base text-slate-900 font-display">
                ৳{provider.pricePerHour} <span className="text-xs font-normal text-slate-500">/ hr</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleFavoriteToggle}
              className={`rounded-2xl border py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isFavorite 
                  ? 'border-pink-200 bg-pink-50 text-pink-600 shadow-xs' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-600 text-pink-600' : 'text-slate-400'}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </button>

            <Link
              to={`/provider/${provider._id}`}
              className="rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 py-2.5 text-center text-xs font-bold text-purple-700 transition-all shadow-xs flex items-center justify-center gap-1"
            >
              Profile <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
            </Link>
          </div>

          <button
            onClick={() => (typeof onBookNow === 'function' ? onBookNow(provider) : null)}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold py-3 text-xs transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" /> Book Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
