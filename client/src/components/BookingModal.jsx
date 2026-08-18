import React, { useState, useEffect, useContext } from 'react';
import { X, Calendar, Clock, Tag, Sparkles, Zap } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BOOKING_AMOUNT = 200; // ৳
const PREMIUM_DISCOUNT = 0.05; // 5%

const BookingModal = ({ isOpen, onClose, provider, initialSlot }) => {
  const { token, user, refreshProfile } = useContext(AuthContext);
  const isPremium = user?.role === 'premium_user';
  const discountedAmount = BOOKING_AMOUNT - BOOKING_AMOUNT * PREMIUM_DISCOUNT;
  const rewardPoints = user?.rewardPoints || 0;
  const pointsValue = rewardPoints * 3;

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userAddress: '',
    description: '',
    date: '',
    time: '',
    isEmergency: false,
    redeemPoints: false,
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [offPeakInfo, setOffPeakInfo] = useState({ isOffPeak: false, discountPercentage: 0 });

  useEffect(() => {
    if (isOpen && refreshProfile) {
      refreshProfile();
    }
  }, [isOpen]); // Run only when modal opens

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const next7DaysArr = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        };
      });

      let initialDate = '';
      if (initialSlot && initialSlot.day) {
        const matchingDay = next7DaysArr.find((d) => d.dayName === initialSlot.day);
        if (matchingDay) initialDate = matchingDay.date;
      }

      setFormData({
        userName: user?.name || '',
        userEmail: user?.email || '',
        userAddress: '',
        description: '',
        date: initialDate,
        time: initialSlot?.time || '',
        isEmergency: false,
        redeemPoints: false,
      });
      setStatus('idle');
      setErrorMessage('');
      setOffPeakInfo({ isOffPeak: false, discountPercentage: 0 });
    }
  }, [isOpen, initialSlot]); // Removed user from dependencies to prevent infinite loops and form resets

  // Check off-peak discount whenever time slot changes
  useEffect(() => {
    if (formData.time) {
      axios
        .get('http://localhost:5001/api/analytics/check-slot', {
          params: { time: formData.time },
        })
        .then((res) => {
          setOffPeakInfo(res.data);
        })
        .catch((err) => {
          console.error('Error checking slot off-peak status:', err);
        });
    } else {
      setOffPeakInfo({ isOffPeak: false, discountPercentage: 0 });
    }
  }, [formData.time]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleEmergency = () => {
    setFormData((prev) => ({ ...prev, isEmergency: !prev.isEmergency }));
  };

  const toggleRedeemPoints = () => {
    if (rewardPoints > 0) {
      setFormData((prev) => ({ ...prev, redeemPoints: !prev.redeemPoints }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const baseAmount = isPremium ? discountedAmount : BOOKING_AMOUNT;
      const discountFromPoints = formData.redeemPoints ? Math.min(pointsValue, baseAmount) : 0;
      
      const bookingRes = await axios.post('http://localhost:5001/api/bookings', {
        ...formData,
        providerId: provider._id,
        userId: user?._id,
        amount: baseAmount - discountFromPoints,
        isEmergency: isPremium ? formData.isEmergency : false,
      });

      setStatus('redirecting');
      const bookingId = bookingRes.data.booking._id;
      const paymentRes = await axios.post(
        `http://localhost:5001/api/payment/init/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = paymentRes.data.GatewayPageURL;
    } catch (error) {
      console.error('Booking failed', error);
      setErrorMessage(error.response?.data?.message || 'Failed to submit request. Please try again.');
      setStatus('error');
    }
  };

  // Get available dates (next 7 days; premium users can also book same-day)
  const today = new Date();
  const dayCount = isPremium ? 8 : 7;
  const dayOffset = isPremium ? 0 : 1;
  const next7Days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + dayOffset);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  });

  // Find slots for selected date
  const selectedDayName = formData.date
    ? new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' })
    : '';
  const availableSlotsObj = (provider.availability || []).find((a) => a.day === selectedDayName);
  const availableSlots = availableSlotsObj ? availableSlotsObj.slots : [];

  const isValidEmail = (email) => {
    return /@gmail\.com$|@yahoo\.com$/i.test(email);
  };

  const isFormValid =
    formData.userName.trim() !== '' &&
    formData.userEmail.trim() !== '' &&
    isValidEmail(formData.userEmail) &&
    formData.userAddress.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.date !== '' &&
    formData.time !== '';

  const basePrice = provider.pricePerHour || 0;
  const discountedPrice = offPeakInfo.isOffPeak ? Math.round(basePrice * 0.9) : basePrice;

  const baseBookingAmount = isPremium ? discountedAmount : BOOKING_AMOUNT;
  const discountFromPoints = formData.redeemPoints ? Math.min(pointsValue, baseBookingAmount) : 0;
  const finalDisplayAmount = baseBookingAmount - discountFromPoints;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-pink-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
              Direct Service Booking
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5 font-display">Book {provider.name}</h2>
            <span className="text-xs text-purple-700 font-bold">{provider.serviceType}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white text-slate-400 hover:text-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {status === 'redirecting' ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 bg-pink-100 text-pink-600 border border-pink-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display">Redirecting to Secure Payment...</h3>
              <p className="text-slate-600 text-sm max-w-xs mx-auto">
                Your booking request has been created. Taking you to SSLCommerz to complete payment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PREMIUM BOOKING AMOUNT */}
              <div
                className={`rounded-2xl p-4 flex items-center justify-between border ${
                  isPremium ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <p className={`text-xs font-black uppercase tracking-wider ${isPremium ? 'text-purple-700' : 'text-slate-700'}`}>
                    Booking Amount
                  </p>
                  {isPremium && (
                    <p className="text-[11px] text-pink-700 mt-0.5">5% premium discount applied automatically</p>
                  )}
                  {formData.redeemPoints && (
                    <p className="text-[11px] text-green-700 mt-0.5">Reward points discount applied</p>
                  )}
                </div>
                <div className="text-right">
                  {(isPremium || formData.redeemPoints) && <p className="text-xs text-slate-400 line-through">৳{BOOKING_AMOUNT}</p>}
                  <p className={`text-lg font-black ${isPremium || formData.redeemPoints ? 'text-purple-700' : 'text-slate-900'}`}>
                    ৳{finalDisplayAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* REWARD POINTS TOGGLE */}
              {rewardPoints > 0 && (
                <button
                  type="button"
                  onClick={toggleRedeemPoints}
                  className={`w-full rounded-2xl p-4 flex items-center justify-between border transition-colors ${
                    formData.redeemPoints ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className={`w-4 h-4 ${formData.redeemPoints ? 'text-green-600' : 'text-yellow-500'}`} />
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${formData.redeemPoints ? 'text-green-700' : 'text-slate-700'}`}>
                        Redeem Reward Points
                      </p>
                      <p className={`text-[11px] mt-0.5 ${formData.redeemPoints ? 'text-green-600' : 'text-slate-500'}`}>
                        You have {rewardPoints} points (Worth ৳{pointsValue}). Use them to get a discount!
                      </p>
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      formData.redeemPoints ? 'bg-green-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.redeemPoints ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              )}


              {/* PREMIUM EMERGENCY TOGGLE */}
              {isPremium && (
                <button
                  type="button"
                  onClick={toggleEmergency}
                  className={`w-full rounded-2xl p-4 flex items-center justify-between border transition-colors ${
                    formData.isEmergency ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Zap className={`w-4 h-4 ${formData.isEmergency ? 'text-red-600' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${formData.isEmergency ? 'text-red-700' : 'text-slate-700'}`}>
                        Emergency Request
                      </p>
                      <p className={`text-[11px] mt-0.5 ${formData.isEmergency ? 'text-red-500' : 'text-slate-400'}`}>
                        Flag this as urgent for faster provider response
                      </p>
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      formData.isEmergency ? 'bg-red-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isEmergency ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder="Sadia Binte Kamal"
                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gmail / Yahoo Email
                  </label>
                  <input
                    required
                    type="email"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleChange}
                    placeholder="user@gmail.com"
                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                  {formData.userEmail && !isValidEmail(formData.userEmail) && (
                    <p className="text-rose-500 text-[11px] mt-1">Must end with @gmail.com or @yahoo.com</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Location Address
                </label>
                <input
                  required
                  type="text"
                  name="userAddress"
                  value={formData.userAddress}
                  onChange={handleChange}
                  placeholder="E.g. Dhanmondi 27, House 45, Dhaka"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Describe Service Requirements
                </label>
                <textarea
                  required
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Describe the job in detail..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" /> Date
                  </label>
                  <select
                    required
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  >
                    <option value="">Select a date</option>
                    {next7Days.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.date} ({d.dayName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Time Slot
                  </label>
                  <select
                    required
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={!formData.date || availableSlots.length === 0}
                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 border p-3 text-xs text-slate-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">{availableSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OFF-PEAK DISCOUNT BANNER */}
              {formData.time && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    offPeakInfo.isOffPeak
                      ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-pink-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {offPeakInfo.isOffPeak ? (
                        <span className="flex items-center gap-1.5 text-pink-600 font-extrabold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-pink-500" /> Off-Peak Special Active!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Tag className="w-4 h-4 text-slate-400" /> Hourly Service Rate
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {offPeakInfo.isOffPeak ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">৳{basePrice}/hr</span>
                          <span className="text-lg font-black text-pink-600">৳{discountedPrice}/hr</span>
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 font-black text-[10px] rounded uppercase">
                            10% OFF
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-slate-900">৳{basePrice}/hr</span>
                      )}
                    </div>
                  </div>
                  {offPeakInfo.isOffPeak && (
                    <p className="text-[11px] text-pink-700 mt-1.5 leading-relaxed">
                      You selected an off-peak time slot! Enjoy 10% discount on hourly rates automatically.
                    </p>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || status === 'submitting'}
                className={`w-full mt-6 font-black py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 shadow-md ${
                  isFormValid && status !== 'submitting'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-pink-200 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                {status === 'submitting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Booking Request...
                  </>
                ) : (
                  'Confirm Booking Request'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
