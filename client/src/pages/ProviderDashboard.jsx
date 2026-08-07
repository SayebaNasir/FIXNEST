import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProviderDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: 'Plumbing', // default
    pricePerHour: '',
    address: '',
    lat: '',
    lng: '',
    bio: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/providers/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          const profile = res.data;
          setFormData({
            name: profile.name || '',
            serviceType: profile.serviceType || 'Plumbing',
            pricePerHour: profile.pricePerHour || '',
            address: profile.address || '',
            lat: profile.location?.coordinates[1] || '',
            lng: profile.location?.coordinates[0] || '',
            bio: profile.bio || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/providers/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Profile saved successfully! You are now visible to customers.');
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-primary-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">Provider Dashboard</h1>
            <p className="mt-2 text-primary-100">Manage your service listing and profile details.</p>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Business / Provider Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. Acme Plumbing Solutions" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Service Type</label>
                  <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm">
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hourly Rate (৳)</label>
                  <input required type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. 500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Physical Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. Mirpur-10, Dhaka" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Latitude (Map)</label>
                  <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. 23.8103" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Longitude (Map)</label>
                  <input type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. 90.4125" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bio / Description</label>
                  <textarea required name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="Tell customers about your experience and services..."></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  {saving ? 'Saving Profile...' : 'Save Profile & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
