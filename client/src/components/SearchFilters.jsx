import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const SearchFilters = ({ filters = {}, setFilters, onFilterChange }) => {
  const updateFilters = (updater) => {
    if (typeof setFilters === 'function') {
      setFilters(updater);
    }
    if (typeof onFilterChange === 'function') {
      const nextFilters = typeof updater === 'function' ? updater(filters) : updater;
      onFilterChange(nextFilters);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilters(prev => ({ ...(prev || {}), [name]: value }));
  };

  const handleReset = () => {
    updateFilters({
      serviceType: '',
      rating: '',
      maxPrice: '',
      radius: '50'
    });
  };

  return (
    <div className="rounded-3xl border border-pink-100 bg-white/95 p-6 shadow-sm backdrop-blur-md text-slate-800 sticky top-24">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 p-4 border border-pink-100">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-pink-100 p-2 text-pink-600">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 font-display">Refine Search</h2>
            <p className="text-xs text-slate-500">Filter local providers</p>
          </div>
        </div>
      </div>

      {/* Quick Badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-1 text-[11px] font-bold text-purple-700">
          Verified Experts
        </span>
        <span className="rounded-full bg-pink-50 border border-pink-200/80 px-2.5 py-1 text-[11px] font-bold text-pink-600">
          10% Off-Peak Deals
        </span>
      </div>

      {/* Filter Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Service Type</label>
          <select
            name="serviceType"
            value={filters.serviceType || ''}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">All Service Types</option>
            <option value="Plumbing">🔧 Plumbing</option>
            <option value="Electrical">⚡ Electrical</option>
            <option value="Carpentry">🪚 Carpentry</option>
            <option value="Cleaning">🧹 Cleaning</option>
            <option value="Appliance Repair">🔌 Appliance Repair</option>
            <option value="Painting">🎨 Painting</option>
            <option value="AC Repair">❄️ AC Repair</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Min Rating</label>
          <select
            name="rating"
            value={filters.rating || ''}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">Any Rating</option>
            <option value="4.5">⭐️ 4.5 &amp; Above</option>
            <option value="4.0">⭐️ 4.0 &amp; Above</option>
            <option value="3.5">⭐️ 3.5 &amp; Above</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Max Price / Hour</label>
            <span className="text-xs font-black text-pink-600">
              {filters.maxPrice ? `৳${filters.maxPrice}` : 'Any'}
            </span>
          </div>
          <input
            type="range"
            name="maxPrice"
            min="200"
            max="1500"
            step="50"
            value={filters.maxPrice || '1500'}
            onChange={handleFilterChange}
            className="w-full accent-pink-600 bg-slate-200 rounded-lg h-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Search Distance</label>
            <span className="text-xs font-black text-purple-600">{filters.radius || '50'} km</span>
          </div>
          <select
            name="radius"
            value={filters.radius || '50'}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
            <option value="50">Within 50 km (All Dhaka)</option>
          </select>
        </div>

        <button
          onClick={handleReset}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
