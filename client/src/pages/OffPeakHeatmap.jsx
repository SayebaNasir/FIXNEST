import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Flame, Clock, Tag, TrendingDown, Percent, ArrowRight, ShieldCheck, Sparkles, Filter, CheckCircle2, X, Star, MapPin, Briefcase } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const OffPeakHeatmap = () => {
  const { user, token, setIsLoginModalOpen } = useContext(AuthContext);
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
  }, [selectedService, selectedDay, token]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedService) params.serviceType = selectedService;
      if (selectedDay) params.day = selectedDay;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/analytics/offpeak-heatmap`, { params, headers });
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

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/analytics/offpeak-providers`, { params, headers });
      
      const filtered = (res.data.providers || []).filter(p => {
        if (user?.role === 'provider') {
          const currentUserId = user.id || user._id;
          const providerUserId = p.userId?._id || p.userId;
          if (currentUserId && providerUserId && String(providerUserId) === String(currentUserId)) return false;
          if (user.name && p.name && p.name.toLowerCase() === user.name.toLowerCase()) return false;
        }
        return true;
      });

      setOffPeakProviders(filtered);
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
    <div className="min-h-screen text-slate-800 pb-20">
      {/* Hero / Header Section - Subtle Light Baby Pink & Purple */}
      <div className="bg-gradient-to-r from-pink-50/90 via-purple-50/90 to-pink-50/90 border-b border-pink-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/80 border border-pink-200 text-pink-600 text-xs font-black uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 text-pink-500" /> Time-Slot Demand Analytics
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                Off-Peak Time Slot <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Deals &amp; Discounts</span>
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed font-medium">
                Save money on home services! Book during low-demand hours and automatically get <strong>10% OFF</strong> your hourly service rate.
              </p>
            </div>

            {/* Banner Discount Badge */}
            <div className="bg-white/90 border border-purple-200/80 rounded-3xl p-6 shadow-sm flex items-center gap-5 min-w-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0 shadow-inner">
                <Percent className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-black text-purple-600 uppercase tracking-wider">Off-Peak Guarantee</div>
                <div className="text-2xl font-black text-slate-900 font-display">Save 10% OFF</div>
                <div className="text-xs text-slate-500 mt-0.5">Applied automatically on off-peak slots</div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {analyticsData?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-pink-100">
              <div className="bg-white/90 border border-pink-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-pink-600 uppercase">
                  <Tag className="w-4 h-4" /> Available Off-Peak Deals
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-display">{analyticsData.stats.totalIdleSlots} Time Slots</div>
                <div className="text-xs text-slate-500 mt-1">10% discount ready</div>
              </div>

              <div className="bg-white/90 border border-purple-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase">
                  <TrendingDown className="w-4 h-4" /> Demand Threshold
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-display">&lt; 3 Jobs/Slot</div>
                <div className="text-xs text-slate-500 mt-1">Low demand hours</div>
              </div>

              <div className="bg-white/90 border border-pink-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase">
                  <Flame className="w-4 h-4" /> Peak Hours
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-display">{analyticsData.stats.totalPeakSlots} Slots</div>
                <div className="text-xs text-slate-500 mt-1">Standard rate hours</div>
              </div>

              <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase">
                  <ShieldCheck className="w-4 h-4" /> Unavailable Slots
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-display">{analyticsData.stats.totalUnavailableSlots || 0} Slots</div>
                <div className="text-xs text-slate-500 mt-1">No providers available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Controls / Filter Bar */}
        <div className="bg-white/90 border border-pink-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <Filter className="w-5 h-5 text-purple-600" /> Filter Time Slot Deals:
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-pink-300 focus:outline-none"
            >
              <option value="">All Service Types</option>
              {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-pink-300 focus:outline-none"
            >
              <option value="">All Days of Week</option>
              {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {(selectedService || selectedDay) && (
              <button
                onClick={() => { setSelectedService(''); setSelectedDay(''); }}
                className="text-xs font-bold text-pink-600 hover:underline px-2 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 p-4 rounded-2xl border border-pink-100 text-xs">
          <span className="font-extrabold text-slate-700 uppercase tracking-wider">Time Slot Status:</span>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-pink-500 border border-pink-400"></span>
              <span className="text-slate-700 font-bold">Off-Peak Slot (<strong>10% OFF</strong>)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-400 border border-purple-300"></span>
              <span className="text-slate-700 font-medium">Moderate Demand (Standard Rate)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-400 border border-rose-300"></span>
              <span className="text-slate-700 font-medium">High Demand (Busy Hours)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300"></span>
              <span className="text-slate-500 font-medium">No Provider Available</span>
            </div>
          </div>
        </div>

        {/* TIME SLOTS GRID */}
        {loading ? (
          <div className="bg-white/60 border border-pink-100 rounded-3xl p-16 text-center text-slate-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                  className={`rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isOffPeak
                      ? 'bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-pink-50/90 border-pink-300 shadow-md shadow-pink-100 hover:border-pink-400'
                      : slot.demandLevel === 'medium'
                      ? 'bg-gradient-to-br from-purple-50/90 to-indigo-50/80 border-purple-300 shadow-sm hover:border-purple-400'
                      : slot.demandLevel === 'high'
                      ? 'bg-gradient-to-br from-rose-50 to-pink-100/70 border-rose-300 shadow-sm hover:border-rose-400'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-lg text-slate-900 flex items-center gap-2 font-display">
                        <Clock className={`w-5 h-5 ${isOffPeak ? 'text-pink-500' : slot.demandLevel === 'medium' ? 'text-purple-500' : slot.demandLevel === 'high' ? 'text-rose-500' : 'text-slate-400'}`} /> {slot.hour}
                      </span>
                      {isOffPeak ? (
                        <span className="px-2.5 py-1 bg-pink-100 text-pink-700 border border-pink-200 text-xs font-black rounded-xl animate-pulse">
                          10% OFF
                        </span>
                      ) : slot.demandLevel === 'medium' ? (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl">
                          Standard
                        </span>
                      ) : slot.demandLevel === 'high' ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl">
                          Busy Hours
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-500 text-xs font-medium rounded-xl">
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="text-slate-500">Demand Level:</span>
                        <span className="font-bold capitalize text-slate-900">
                          {slot.demandLevel === 'low' ? 'Low (Off-Peak)' : slot.demandLevel === 'medium' ? 'Moderate' : slot.demandLevel === 'high' ? 'High Demand' : 'No Provider'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="text-slate-500">Available Providers:</span>
                        <span className={`font-bold ${hasProvider ? 'text-pink-600' : 'text-slate-400'}`}>
                          {slot.availableProviders} Pro{slot.availableProviders !== 1 ? 's' : ''} Ready
                        </span>
                      </div>
                    </div>

                    {isOffPeak && (
                      <div className="mt-4 p-2.5 rounded-2xl bg-pink-100/60 border border-pink-200 text-xs text-pink-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>Book during {slot.hour} and get 10% discount on hourly rate!</span>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={!hasProvider}
                    onClick={() => hasProvider && handleOpenOffPeakProviders(slot.hour)}
                    className={`w-full mt-5 font-black py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 ${
                      isOffPeak
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md shadow-pink-200 cursor-pointer'
                        : hasProvider
                        ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-pink-100 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 flex justify-between items-center">
              <div>
                {offPeakProviders[0]?.isOffPeak ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-pink-600 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> 10% Off-Peak Special Active
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-purple-600 uppercase tracking-wider">
                    <Tag className="w-4 h-4" /> Standard Rate Time Slot
                  </div>
                )}
                <h2 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2 font-display">
                  <Clock className="w-6 h-6 text-purple-600" /> Providers Available at {activeTimeSlot}
                </h2>
              </div>
              <button 
                onClick={() => setActiveTimeSlot(null)} 
                className="p-2 hover:bg-white text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body / Provider List */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingProviders ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading available providers for {activeTimeSlot}...
                </div>
              ) : offPeakProviders.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-lg font-bold">No unbooked providers available at {activeTimeSlot}.</p>
                  <p className="text-xs text-slate-400 mt-1">Please try another time slot.</p>
                </div>
              ) : (
                offPeakProviders.map(provider => (
                  <div key={provider._id} className="bg-white border border-pink-100 hover:border-pink-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 font-display">{provider.name}</h3>
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-full">
                          {provider.serviceType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        {provider.rating > 0 && (
                          <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {provider.rating} ({provider.reviewCount})
                          </span>
                        )}
                        {provider.address && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-pink-500" /> {provider.address}
                          </span>
                        )}
                        {provider.experience && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Briefcase className="w-3.5 h-3.5 text-purple-500" /> {provider.experience}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Book Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <div className="text-right">
                        {provider.isOffPeak ? (
                          <>
                            <div className="text-xs text-slate-400 line-through">৳{provider.originalPrice}/hr</div>
                            <div className="text-lg font-black text-pink-600 flex items-center gap-1.5 font-display">
                              ৳{provider.discountedPrice}/hr
                              <span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 text-[10px] font-black rounded uppercase">10% OFF</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-black text-slate-900 font-display">
                            ৳{provider.originalPrice}/hr
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleBookProvider(provider)}
                        className={`px-5 py-2.5 font-extrabold rounded-2xl text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          provider.isOffPeak
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-pink-200'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                        }`}
                      >
                        {provider.isOffPeak ? 'Book Now (10% OFF)' : 'Book Now (Standard Rate)'} <ArrowRight className="w-4 h-4" />
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
