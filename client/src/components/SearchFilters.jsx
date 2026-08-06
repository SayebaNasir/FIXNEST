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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary-600" />
        Find Professionals
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
          <select
            name="serviceType"
            value={filters.serviceType}
            onChange={handleFilterChange}
            className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500"
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
            className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500"
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
            className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500"
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
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
