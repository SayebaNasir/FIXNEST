import React, { useState, useEffect } from 'react';
import axios from 'axios';

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200'
};

const RequestsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userAddress: '',
    description: '',
    date: '',
    time: ''
  });

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/requests');
      setRequests(res.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/requests', formData);
      setMessage('Request created successfully!');
      setFormData({
        userName: '',
        userEmail: '',
        userAddress: '',
        description: '',
        date: '',
        time: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      setMessage('Failed to create request. Please try again.');
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
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Create Request Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-primary-900 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">New Service Request</h1>
            <p className="mt-2 text-primary-100">Tell us what you need and we'll match you with a provider.</p>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                  <input required type="text" name="userName" value={formData.userName} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. Rahim Uddin" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input required type="email" name="userEmail" value={formData.userEmail} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. rahim@example.com" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Service Address</label>
                  <input required type="text" name="userAddress" value={formData.userAddress} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="e.g. Mirpur-10, Dhaka" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Date</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Time</label>
                  <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary-500 focus:border-primary-500 shadow-sm" placeholder="Describe what you need done..."></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  {saving ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">All Requests</h2>
            <p className="mt-1 text-slate-500">{requests.length} request{requests.length !== 1 ? 's' : ''} on file.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.length === 0 && (
              <div className="p-8 text-center text-slate-500">No requests yet. Submit one above to get started.</div>
            )}

            {requests.map((r) => (
              <div key={r._id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">{r.userName}</p>
                  <p className="text-sm text-slate-500">{r.userEmail}</p>
                  <p className="text-sm text-slate-600 mt-1">{r.userAddress}</p>
                  <p className="text-sm text-slate-700 mt-2">{r.description}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {r.date ? new Date(r.date).toLocaleDateString() : ''} {r.time && `• ${r.time}`}
                  </p>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestsDashboard;