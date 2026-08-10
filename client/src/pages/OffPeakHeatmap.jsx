import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Flame, Clock, Tag, TrendingDown, Percent, ArrowRight, ShieldCheck, Sparkles, Filter, CheckCircle2, X, Star, MapPin, Briefcase } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import { AuthContext } from '../context/AuthContext';

const OffPeakHeatmap = () => {
  const { user, setIsLoginModalOpen } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  
  // Off-Peak Provider Selection Modal state
  const [activeTimeSlot, setActiveTimeSlot] = useState(null);
  const [offPeakProviders, setOffPeakProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Booking Modal state
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const serviceTypes = ['Plumbing', 'Electrical', 'Cleaning', 'Appliance Repair', 'Painting', 'Carpentry'];
  const daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchHeatmapData();
  }, [selectedService, selectedDay]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedService) params.serviceType = selectedService;
      if (selectedDay) params.day = selectedDay;

      const res = await axios.get('http://localhost:5001/api/analytics/offpeak-heatmap', { params });
      setAnalyticsData(res.data);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOffPeakProviders = async (hour) => {
    setActiveTimeSlot(hour);
    setLoadingProviders(true);
    try {
      const params = { time: hour };
      if (selectedService) params.serviceType = selectedService;
      if (selectedDay) params.day = selectedDay;

      const res = await axios.get('http://localhost:5001/api/analytics/offpeak-providers', { params });
      setOffPeakProviders(res.data.providers || []);
    } catch (error) {
      console.error('Error fetching off-peak providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleBookProvider = (provider) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedProvider(provider);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Hero / Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Real Provider Demand Analytics
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Off-Peak Time Slot <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">Deals &amp; Discounts</span>
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                Save money on home services! Book during low-demand hours and automatically get <strong>10% OFF</strong> your hourly service rate.
              </p>
            </div>

            {/* Banner Discount Badge */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl flex items-center gap-5 min-w-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Percent className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Off-Peak Guarantee</div>
                <div className="text-2xl font-black text-white">Save 10% OFF</div>
                <div className="text-xs text-slate-300 mt-0.5">Applied automatically on off-peak slots</div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {analyticsData?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
                  <Tag className="w-4 h-4" /> Available Off-Peak Deals
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">{analyticsData.stats.totalIdleSlots} Time Slots</div>
                <div className="text-xs text-slate-400 mt-1">Providers ready &amp; 10% OFF</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase">
                  <TrendingDown className="w-4 h-4" /> Demand Threshold
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">&lt; 3 Jobs/Slot</div>
                <div className="text-xs text-slate-400 mt-1">Low demand hours</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase">
                  <Flame className="w-4 h-4" /> Peak Hours
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">{analyticsData.stats.totalPeakSlots} Slots</div>
                <div className="text-xs text-slate-400 mt-1">Standard rate hours</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                  <ShieldCheck className="w-4 h-4" /> Unavailable Slots
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">{analyticsData.stats.totalUnavailableSlots || 0} Slots</div>
                <div className="text-xs text-slate-400 mt-1">No providers available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Controls / Filter Bar */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Filter className="w-5 h-5 text-indigo-400" /> Filter Time Slot Deals:
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Service Types</option>
              {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Days of Week</option>
              {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {(selectedService || selectedDay) && (
              <button
                onClick={() => { setSelectedService(''); setSelectedDay(''); }}
                className="text-xs text-slate-400 hover:text-white underline px-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider">Time Slot Status:</span>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-400"></span>
              <span className="text-slate-300 font-medium">Off-Peak Slot (<strong>10% OFF</strong>)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-500 border border-amber-400"></span>
              <span className="text-slate-300 font-medium">Moderate Demand (Standard Rate)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-400"></span>
              <span className="text-slate-300 font-medium">High Demand (Busy Hours)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-slate-700"></span>
              <span className="text-slate-500 font-medium">No Provider Available</span>
            </div>
          </div>
        </div>

        {/* TIME SLOTS GRID */}
        {loading ? (
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Analyzing time slot deals...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {analyticsData?.timeSlotsAnalytics.map(slot => {
              const isOffPeak = slot.isOffPeak;
              const hasProvider = slot.hasProvider;

              return (
                <div
                  key={slot.hour}
                  className={`rounded-2xl border p-5 shadow-xl transition-all flex flex-col justify-between ${
                    isOffPeak
                      ? 'bg-gradient-to-br from-emerald-950/70 via-slate-800 to-slate-900 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/30'
                      : hasProvider
                      ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-900/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-lg text-white flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${isOffPeak ? 'text-emerald-400' : 'text-slate-400'}`} /> {slot.hour}
                      </span>
                      {isOffPeak ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black rounded-lg animate-pulse">
                          10% OFF
                        </span>
                      ) : hasProvider ? (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-lg">
                          Standard
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-500 text-xs font-medium rounded-lg">
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="text-slate-400">Demand Level:</span>
                        <span className="font-semibold capitalize text-white">
                          {slot.demandLevel === 'low' ? 'Low (Off-Peak)' : slot.demandLevel === 'medium' ? 'Moderate' : slot.demandLevel === 'high' ? 'High Demand' : 'No Provider'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="text-slate-400">Available Providers:</span>
                        <span className={`font-bold ${hasProvider ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {slot.availableProviders} Pro{slot.availableProviders !== 1 ? 's' : ''} Ready
                        </span>
                      </div>
                    </div>

                    {isOffPeak && (
                      <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Book during {slot.hour} and get 10% discount on hourly rate!</span>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={!hasProvider}
                    onClick={() => hasProvider && handleOpenOffPeakProviders(slot.hour)}
                    className={`w-full mt-5 font-black py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 ${
                      isOffPeak
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                        : hasProvider
                        ? 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {hasProvider ? (
                      <>View Providers at {slot.hour} {isOffPeak && '(Save 10%)'} <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      'No Providers Available'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* OFF-PEAK PROVIDERS MODAL */}
      {activeTimeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 to-slate-900 flex justify-between items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> 10% Off-Peak Special Active
                </div>
                <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-emerald-400" /> Providers Available at {activeTimeSlot}
                </h2>
              </div>
              <button 
                onClick={() => setActiveTimeSlot(null)} 
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body / Provider List */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingProviders ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading available providers for {activeTimeSlot}...
                </div>
              ) : offPeakProviders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-lg">No unbooked providers available at {activeTimeSlot}.</p>
                  <p className="text-sm text-slate-500 mt-1">Please try another time slot.</p>
                </div>
              ) : (
                offPeakProviders.map(provider => (
                  <div key={provider._id} className="bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{provider.name}</h3>
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-full">
                          {provider.serviceType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                        {provider.rating > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {provider.rating} ({provider.reviewCount})
                          </span>
                        )}
                        {provider.address && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {provider.address}
                          </span>
                        )}
                        {provider.experience && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {provider.experience}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Book Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 line-through">৳{provider.originalPrice}/hr</div>
                        <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                          ৳{provider.discountedPrice}/hr
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded uppercase">10% OFF</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookProvider(provider)}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
                      >
                        Book Now (10% OFF) <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
          initialSlot={{ time: activeTimeSlot }}
        />
      )}
    </div>
  );
};

export default OffPeakHeatmap;
