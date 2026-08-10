import React, { useState, useEffect, useContext } from 'react';
import { X, Calendar, Clock, Tag, Percent, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BookingModal = ({ isOpen, onClose, provider, initialSlot }) => {
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userAddress: '',
    description: '',
    date: '',
    time: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [offPeakInfo, setOffPeakInfo] = useState({ isOffPeak: false, discountPercentage: 0 });
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const next7DaysArr = Array.from({length: 7}, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          dayName: d.toLocaleDateString('en-US', { weekday: 'long' })
        };
      });

      let initialDate = '';
      if (initialSlot && initialSlot.day) {
        const matchingDay = next7DaysArr.find(d => d.dayName === initialSlot.day);
        if (matchingDay) initialDate = matchingDay.date;
      }
      
      setFormData({
        userName: '', userEmail: '', userAddress: '', description: '', 
        date: initialDate, 
        time: initialSlot?.time || ''
      });
      setStatus('idle');
      setErrorMessage('');
      setOffPeakInfo({ isOffPeak: false, discountPercentage: 0 });
    }
  }, [isOpen, initialSlot]);

  // Check off-peak discount whenever time slot changes
  useEffect(() => {
    if (formData.time) {
      axios.get('http://localhost:5001/api/analytics/check-slot', {
        params: { time: formData.time }
      }).then(res => {
        setOffPeakInfo(res.data);
      }).catch(err => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      await axios.post('http://localhost:5001/api/bookings', {
        ...formData,
        providerId: provider._id
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData({
          userName: '', userEmail: '', userAddress: '', description: '', date: '', time: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Booking failed', error);
      setErrorMessage(error.response?.data?.message || 'Failed to submit request. Please try again.');
      setStatus('error');
    }
  };

  // Get available dates (next 7 days)
  const today = new Date();
  const next7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' })
    };
  });

  // Find slots for selected date
  const selectedDayName = formData.date ? new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const availableSlotsObj = provider.availability.find(a => a.day === selectedDayName);
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
  const discountedPrice = Math.round(basePrice * 0.9);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Direct Service Booking</span>
            <h2 className="text-2xl font-black text-white mt-0.5 font-display">Book {provider.name}</h2>
            <span className="text-xs text-slate-300 font-semibold">{provider.serviceType}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {status === 'success' ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white font-display">Booking Requested!</h3>
              <p className="text-slate-300 text-sm max-w-xs mx-auto">
                An automated confirmation email has been dispatched to <strong>{formData.userEmail}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Your Full Name</label>
                  <input required type="text" name="userName" value={formData.userName} onChange={handleChange} placeholder="Sadia Binte Kamal" className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Gmail / Yahoo Email</label>
                  <input required type="email" name="userEmail" value={formData.userEmail} onChange={handleChange} placeholder="user@gmail.com" className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  {formData.userEmail && !isValidEmail(formData.userEmail) && (
                    <p className="text-rose-400 text-[11px] mt-1">Must end with @gmail.com or @yahoo.com</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Service Location Address</label>
                <input required type="text" name="userAddress" value={formData.userAddress} onChange={handleChange} placeholder="E.g. Dhanmondi 27, House 45, Dhaka" className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Describe Service Requirements</label>
                <textarea required name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Describe the job in detail..."></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-400"/> Date</label>
                  <select required name="date" value={formData.date} onChange={handleChange} className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Select a date</option>
                    {next7Days.map(d => (
                      <option key={d.date} value={d.date}>{d.date} ({d.dayName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400"/> Time Slot</label>
                  <select required name="time" value={formData.time} onChange={handleChange} disabled={!formData.date || availableSlots.length === 0} className="w-full rounded-xl border-slate-700 bg-slate-950 border p-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-950/40 disabled:text-slate-600">
                    <option value="">{availableSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OFF-PEAK DISCOUNT BANNER */}
              {formData.time && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  offPeakInfo.isOffPeak 
                    ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {offPeakInfo.isOffPeak ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-emerald-400" /> Off-Peak Special Active!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Tag className="w-4 h-4" /> Hourly Service Rate
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {offPeakInfo.isOffPeak ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">৳{basePrice}/hr</span>
                          <span className="text-lg font-black text-emerald-400">৳{discountedPrice}/hr</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-[10px] rounded uppercase">10% OFF</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-white">৳{basePrice}/hr</span>
                      )}
                    </div>
                  </div>
                  {offPeakInfo.isOffPeak && (
                    <p className="text-[11px] text-emerald-300/80 mt-1.5 leading-relaxed">
                      You selected an off-peak time slot! Enjoy 10% discount on hourly rates automatically.
                    </p>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{errorMessage}</div>
              )}

              <button 
                type="submit" 
                disabled={!isFormValid || status === 'submitting'}
                className={`w-full mt-6 font-black py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-lg ${
                  isFormValid && status !== 'submitting'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                }`}
              >
                {status === 'submitting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
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
