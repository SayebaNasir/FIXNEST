import React from 'react';
import { Search, Filter } from 'lucide-react';

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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white/15 p-2">
            <Filter className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Refine Your Search</h2>
            <p className="text-sm text-slate-300">Find the right match quickly</p>
          </div>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">Verified experts</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Flexible pricing</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Fast booking</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
          <select
            name="serviceType"
            value={filters.serviceType}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">All Services</option>
            <option value="Plumbing">🔧 Plumbing</option>
            <option value="Electrical">⚡ Electrical</option>
            <option value="Carpentry">🪚 Carpentry</option>
            <option value="Cleaning">🧹 Cleaning</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Rating</label>
          <select
            name="rating"
            value={filters.rating}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Any Rating</option>
            <option value="4.5">⭐ 4.5 & up</option>
            <option value="4.0">⭐ 4.0 & up</option>
            <option value="3.5">⭐ 3.5 & up</option>
            <option value="3.0">⭐ 3.0 & up</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Price (৳/hr)</label>
          <select
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Any Price</option>
            <option value="300">Up to ৳300/hr</option>
            <option value="500">Up to ৳500/hr</option>
            <option value="700">Up to ৳700/hr</option>
            <option value="1000">Up to ৳1000/hr</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Search Radius</label>
          <input
            type="range"
            name="radius"
            min="1"
            max="50"
            value={filters.radius}
            onChange={handleFilterChange}
            className="w-full accent-primary-600"
          />
          <div className="text-right text-xs text-slate-500 mt-1">{filters.radius} km</div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-200 flex items-center justify-center gap-2"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
