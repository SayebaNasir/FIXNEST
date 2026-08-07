import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

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
    }
  }, [isOpen, initialSlot]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        ...formData,
        providerId: provider._id
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

  const buttonClass = isFormValid && status !== 'submitting'
    ? 'w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors'
    : 'w-full mt-6 bg-slate-300 text-slate-500 cursor-not-allowed font-medium py-3 rounded-lg transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Book {provider.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Booking Requested!</h3>
              <p className="text-slate-600 mt-2">The provider will review your request soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                  <input required type="text" name="userName" value={formData.userName} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" name="userEmail" value={formData.userEmail} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  {formData.userEmail && !isValidEmail(formData.userEmail) && (
                    <p className="text-red-500 text-xs mt-1">Must end with @gmail.com or @yahoo.com</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Address</label>
                <input required type="text" name="userAddress" value={formData.userAddress} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Describe the Work</label>
                <textarea required name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="E.g. Leaking pipe under the kitchen sink..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> Date</label>
                  <select required name="date" value={formData.date} onChange={handleChange} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select a date</option>
                    {next7Days.map(d => (
                      <option key={d.date} value={d.date}>{d.date} ({d.dayName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> Time Slot</label>
                  <select required name="time" value={formData.time} onChange={handleChange} disabled={!formData.date || availableSlots.length === 0} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:text-slate-400">
                    <option value="">{availableSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {status === 'error' && (
                <div className="text-red-500 text-sm">Failed to submit request. Please try again.</div>
              )}

              <button 
                type="submit" 
                disabled={!isFormValid || status === 'submitting'}
                className={buttonClass}
              >
                {status === 'submitting' ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
