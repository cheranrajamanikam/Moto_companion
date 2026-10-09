import React, { useState } from 'react';
import type { MatchFilterOptions } from "@/types/rider";
import { Search, SlidersHorizontal, RotateCcw, ShieldCheck, Gauge, MapPin } from 'lucide-react';

interface FilterPanelProps {
  filters: MatchFilterOptions;
  onFilterChange: (newFilters: MatchFilterOptions) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, city: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as any });
  };

  const handleMinCCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, minCC: Number(e.target.value) });
  };

  const handleMaxCCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, maxCC: Number(e.target.value) });
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, maxDistanceKm: Number(e.target.value) });
  };

  const handleKycToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, kycOnly: e.target.checked });
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, experienceLevel: e.target.value as any });
  };

  const handleMinRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, minRating: Number(e.target.value) });
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by rider name, city, or motorcycle model..."
            value={filters.searchQuery || ''}
            onChange={handleSearchChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={filters.sortBy || 'BEST_MATCH'}
            onChange={handleSortChange}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500"
          >
            <option value="BEST_MATCH">⚡ Best Match Score</option>
            <option value="NEAREST">📍 Nearest Distance</option>
            <option value="HIGHEST_RATED">★ Highest Rated</option>
            <option value="MOST_EXPERIENCED">🏆 Most Experienced</option>
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
              isExpanded
                ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Expanded Detailed Filters */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800 space-y-4 animate-fade-in text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* CC Range Slider */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-orange-400" />
                  Engine CC Range
                </span>
                <span className="font-mono text-orange-400 font-bold">
                  {filters.minCC || 100} - {filters.maxCC || 1000} CC
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 block">Min CC</label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={filters.minCC || 100}
                    onChange={handleMinCCChange}
                    className="w-full accent-orange-500 bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Max CC</label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={filters.maxCC || 1000}
                    onChange={handleMaxCCChange}
                    className="w-full accent-orange-500 bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Max Distance Slider */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Max Distance
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {filters.maxDistanceKm || 500} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="1000"
                step="25"
                value={filters.maxDistanceKm || 500}
                onChange={handleDistanceChange}
                className="w-full accent-amber-500 bg-slate-800 mt-2"
              />
            </div>

            {/* City Dropdown */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-300 block">Location / City</label>
              <select
                value={filters.city || 'ALL'}
                onChange={handleCityChange}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Cities</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            {/* Experience & Rating */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 block">Experience & Rating</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.experienceLevel || 'ALL'}
                  onChange={handleExperienceChange}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">All Exp</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermed.</option>
                  <option value="Experienced">Experienced</option>
                </select>

                <select
                  value={filters.minRating || 0}
                  onChange={handleMinRatingChange}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-orange-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.0}>★ 4.0+</option>
                  <option value={4.5}>★ 4.5+</option>
                  <option value={4.8}>★ 4.8+</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={filters.kycOnly || false}
                onChange={handleKycToggle}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Show Only KYC Verified Profiles
              </span>
            </label>

            <button
              onClick={onReset}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
