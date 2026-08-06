import React from 'react';
import { Star, MapPin, Clock, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProviderCard = ({ provider, onBookNow }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{provider.name}</h3>
            <span className="inline-block mt-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
              {provider.serviceType}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold">{provider.rating}</span>
            <span className="text-sm">({provider.reviewCount})</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{provider.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">৳{provider.pricePerHour} / hour</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to={`/provider/${provider._id}`}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-center py-2.5 rounded-lg font-medium transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={() => onBookNow(provider)}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
