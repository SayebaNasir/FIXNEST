import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const SearchFilters = ({ filters, setFilters }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
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
            value={filters.serviceType}
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
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Minimum Rating</label>
          <select
            name="rating"
            value={filters.rating}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">Any Rating</option>
            <option value="4.5">⭐ 4.5 &amp; up</option>
            <option value="4.0">⭐ 4.0 &amp; up</option>
            <option value="3.5">⭐ 3.5 &amp; up</option>
            <option value="3.0">⭐ 3.0 &amp; up</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max Price (৳/hr)</label>
          <select
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">Any Price</option>
            <option value="300">Up to ৳300/hr</option>
            <option value="500">Up to ৳500/hr</option>
            <option value="700">Up to ৳700/hr</option>
            <option value="1000">Up to ৳1000/hr</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="uppercase tracking-wider">Search Radius</span>
            <span className="text-pink-600 font-extrabold">{filters.radius} km</span>
          </div>
          <input
            type="range"
            name="radius"
            min="1"
            max="50"
            value={filters.radius}
            onChange={handleFilterChange}
            className="w-full accent-pink-500 cursor-pointer h-2 bg-pink-100 rounded-lg"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 py-3 font-bold text-xs text-slate-600 transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
