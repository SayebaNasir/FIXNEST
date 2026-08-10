import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import ReviewModal from '../components/ReviewModal';
const API_URL = 'http://localhost:5001';

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlotOptions = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00'
];

const emptyAvailability = dayOrder.map((day) => ({ day, slots: [] }));

const normalizeAvailabilityData = (availability) => {
  const source = Array.isArray(availability) ? availability : [];

  return dayOrder.map((day) => {
    const existingEntry = source.find((entry) => entry.day === day);

    return {
      day,
      slots: Array.isArray(existingEntry?.slots)
        ? existingEntry.slots.filter(Boolean)
        : []
    };
  });
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    const result = reader.result;
    resolve(typeof result === 'string' ? result.split(',')[1] || '' : '');
  };

  reader.onerror = () => reject(new Error('Unable to read file'));
  reader.readAsDataURL(file);
});

const ProviderDashboard = () => {
  const {
  user,
  token,
  loading: authLoading
} = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [activeTab, setActiveTab] = useState('profile');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [providerBookings, setProviderBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});

  // Fetch pending count for notification badge
  useEffect(() => {
    if (token && user?.role === 'provider') {
      const fetchPendingCount = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/bookings/pending-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPendingCount(res.data.pendingCount || 0);
        } catch (error) {
          console.error('Error fetching pending count:', error);
        }
      };
      fetchPendingCount();
    }
  }, [token, user]);

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
          const res = await axios.get(`${API_URL}/api/providers/analytics/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAnalyticsData(res.data);
        } catch (error) {
          console.error('Error fetching analytics:', error);
          setMessage('Unable to load analytics.');
          setMessageType('error');
        } finally {
          setLoadingAnalytics(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab, analyticsData, token]);

  useEffect(() => {
    if (activeTab === 'requests') {
      const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
          const res = await axios.get(`${API_URL}/api/bookings/provider`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProviderBookings(res.data);

          // Check which completed bookings already have a provider review
          const completed = res.data.filter(b => b.status === 'completed');
          const reviewChecks = await Promise.all(
            completed.map(async (b) => {
              try {
                const rRes = await axios.get(`${API_URL}/api/bookings/${b._id}/reviews`);
                const hasProviderReview = rRes.data.some(r => r.reviewerType === 'provider');
                return { id: b._id, reviewed: hasProviderReview };
              } catch {
                return { id: b._id, reviewed: false };
              }
            })
          );
          const reviewMap = {};
          reviewChecks.forEach(r => { reviewMap[r.id] = r.reviewed; });
          setReviewedBookings(prev => ({ ...prev, ...reviewMap }));
        } catch (error) {
          console.error('Error fetching requests:', error);
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [activeTab, token]);

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    try {
      await axios.patch(`${API_URL}/api/bookings/${bookingId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviderBookings(prev =>
        prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b)
      );
      // Update pending count when accepting or rejecting
      if (newStatus === 'accepted' || newStatus === 'rejected') {
        setPendingCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setUpdatingBookingId(null);
    }
  };


  const [formData, setFormData] = useState({
    name: '',
    serviceType: 'Plumbing',
    pricePerHour: '',
    address: '',
    lat: '',
    lng: '',
    bio: '',
    qualifications: [],
    certifications: [],
    experience: '',
    serviceAreas: [],
    availability: emptyAvailability,
    portfolio: [],
    verificationStatus: 'pending',
    rejectionReason: ''
  });

  const [qualificationDraft, setQualificationDraft] = useState({
    qualification: '',
    institution: '',
    year: ''
  });
  const [certificationDraft, setCertificationDraft] = useState({
    name: '',
    link: '',
    file: null
  });
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');

 useEffect(() => {
  // Wait until AuthContext finishes restoring
  // the user from localStorage.
  if (authLoading) {
    return;
  }

  // After authentication state is loaded,
  // check whether the user is a provider.
  if (!user || user.role !== 'provider') {
    navigate('/');
    return;
  }

  const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/providers/profile/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.data) {
          const profile = res.data;

          setFormData({
            name: profile.name || '',
            serviceType: profile.serviceType || 'Plumbing',
            pricePerHour: profile.pricePerHour || '',
            address: profile.address || '',
            lat: profile.location?.coordinates?.[1] || '',
            lng: profile.location?.coordinates?.[0] || '',
            bio: profile.bio || '',
            qualifications: profile.qualifications || [],
            certifications: profile.certifications || [],
            experience: profile.experience || '',
            serviceAreas: profile.serviceAreas || [],
            availability:
              profile.availability?.length > 0
                ? normalizeAvailabilityData(profile.availability)
                : emptyAvailability,
            portfolio: profile.portfolio || [],
            verificationStatus: profile.verificationStatus || 'pending',
            rejectionReason: profile.rejectionReason || ''
          });
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setMessage('No provider profile found. Create your profile below.');
          setMessageType('info');
        } else {
          console.error('Error fetching profile:', error);
          setMessage('Unable to load your profile.');
          setMessageType('error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, token, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // -----------------------------
  // Qualifications
  // -----------------------------

  const addQualification = () => {
    const qualification = qualificationDraft.qualification.trim();
    const institution = qualificationDraft.institution.trim();
    const year = qualificationDraft.year.trim();

    if (!qualification) return;

    setFormData((previous) => ({
      ...previous,
      qualifications: [
        ...previous.qualifications,
        {
          qualification,
          institution,
          year
        }
      ]
    }));

    setQualificationDraft({
      qualification: '',
      institution: '',
      year: ''
    });
  };

  const removeQualification = (index) => {
    setFormData((previous) => ({
      ...previous,
      qualifications: previous.qualifications.filter(
        (_, itemIndex) => itemIndex !== index
      )
    }));
  };

  // -----------------------------
  // Certifications
  // -----------------------------

  const addCertification = () => {
    const name = certificationDraft.name.trim();
    const link = certificationDraft.link.trim();

    if (!name || (!link && !certificationDraft.file)) return;

    setFormData((previous) => ({
      ...previous,
      certifications: [
        ...previous.certifications,
        {
          name,
          link,
          file: certificationDraft.file,
          fileName: certificationDraft.file?.name || '',
          filePath: ''
        }
      ]
    }));

    setCertificationDraft({
      name: '',
      link: '',
      file: null
    });
  };

  const removeCertification = (index) => {
    setFormData((previous) => ({
      ...previous,
      certifications: previous.certifications.filter(
        (_, itemIndex) => itemIndex !== index
      )
    }));
  };

  // -----------------------------
  // Portfolio
  // -----------------------------

  const addPortfolioUrl = () => {
    const value = newPortfolioUrl.trim();

    if (!value) return;

    setFormData((previous) => ({
      ...previous,
      portfolio: [
        ...previous.portfolio,
        value
      ]
    }));

    setNewPortfolioUrl('');
  };

  const removePortfolioUrl = (index) => {
    setFormData((previous) => ({
      ...previous,
      portfolio: previous.portfolio.filter(
        (_, itemIndex) => itemIndex !== index
      )
    }));
  };

  // -----------------------------
  // Availability
  // -----------------------------

  const toggleTimeSlot = (dayIndex, slot) => {
    setFormData((previous) => {
      const updatedAvailability = [...previous.availability];
      const currentSlots = updatedAvailability[dayIndex]?.slots || [];
      const nextSlots = currentSlots.includes(slot)
        ? currentSlots.filter((existingSlot) => existingSlot !== slot)
        : [...currentSlots, slot];

      updatedAvailability[dayIndex] = {
        ...updatedAvailability[dayIndex],
        slots: nextSlots
      };

      return {
        ...previous,
        availability: updatedAvailability
      };
    });
  };

  // -----------------------------
  // Save Profile
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      const certificationsPayload = await Promise.all(
        formData.certifications.map(async (certification) => {
          if (!certification.file) {
            return {
              name: certification.name,
              link: certification.link,
              fileName: certification.fileName || '',
              filePath: certification.filePath || ''
            };
          }

          return {
            name: certification.name,
            link: certification.link,
            fileName: certification.fileName || certification.file.name,
            fileData: await fileToBase64(certification.file)
          };
        })
      );

      const payload = {
        name: formData.name,
        serviceType: formData.serviceType,
        address: formData.address,
        pricePerHour: formData.pricePerHour,
        bio: formData.bio || '',
        lat: formData.lat || '',
        lng: formData.lng || '',
        qualifications: formData.qualifications,
        certifications: certificationsPayload,
        experience: formData.experience || '',
        serviceAreas: formData.serviceAreas,
        availability: formData.availability,
        portfolio: formData.portfolio
      };

      const response = await axios.post(
        `${API_URL}/api/providers/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setFormData((previous) => ({
        ...previous,
        verificationStatus: 'pending',
        rejectionReason: ''
      }));

      setMessage(
        response.data.message ||
          'Profile saved successfully! Your submission is now pending admin review.'
      );

      setMessageType('success');

    } catch (error) {
      console.error('Error saving profile:', error);

      setMessage(
        error.response?.data?.message ||
          'Failed to save profile. Please try again.'
      );

      setMessageType('error');

    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Delete Profile
  // -----------------------------

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your provider profile?'
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await axios.delete(
        `${API_URL}/api/providers/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(
        response.data.message ||
          'Provider profile deleted successfully.'
      );

      setMessageType('success');

      setFormData({
        name: '',
        serviceType: 'Plumbing',
        pricePerHour: '',
        address: '',
        lat: '',
        lng: '',
        bio: '',
        qualifications: [],
        certifications: [],
        experience: '',
        serviceAreas: [],
        availability: emptyAvailability,
        portfolio: [],
        verificationStatus: 'pending',
        rejectionReason: ''
      });

    } catch (error) {
      console.error('Error deleting profile:', error);

      setMessage(
        error.response?.data?.message ||
          'Failed to delete profile.'
      );

      setMessageType('error');

    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Provider Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your professional profile, services,
            service areas and availability.
          </p>

          <div className={`mt-4 rounded-2xl border p-4 ${formData.verificationStatus === 'verified' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : formData.verificationStatus === 'rejected' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            <div className="font-semibold">Verification status: {formData.verificationStatus === 'verified' ? 'Verified' : formData.verificationStatus === 'rejected' ? 'Rejected' : 'Pending review'}</div>
            {formData.rejectionReason ? <div className="mt-1 text-sm">Reason: {formData.rejectionReason}</div> : null}
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 font-semibold text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary-600 text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-3 font-semibold text-sm transition-colors relative flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'border-b-2 border-primary-600 text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Service Requests
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 font-semibold text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-primary-600 text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Analytics & Insights
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : messageType === 'info'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Information */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Basic Information
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Provide the basic information customers need to identify your service.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Business / Provider Name <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 p-3"
                  placeholder="e.g. Acme Plumbing Solutions"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>

                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Hourly Rate (৳) <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  min="0"
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 p-3"
                  placeholder="e.g. 500"
                />
              </div>

      <div className="md:col-span-2">
  <LocationPicker
    address={formData.address}
    lat={formData.lat}
    lng={formData.lng}
    onChange={(location) => {
      setFormData((prev) => ({
        ...prev,
        address: location.address,
        lat: location.lat,
        lng: location.lng
      }));
    }}
  />
</div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Bio / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-xl border border-slate-300 p-3"
                  placeholder="Describe your professional services..."
                />
              </div>

            </div>
          </section>


          {/* Professional Information */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Professional Information
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Add your qualifications, certifications and professional experience.
            </p>

            {/* Qualifications */}
            <div className="mb-8">

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Qualifications
              </label>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={qualificationDraft.qualification}
                    onChange={(e) => setQualificationDraft((prev) => ({ ...prev, qualification: e.target.value }))}
                    className="rounded-xl border border-slate-300 p-3"
                    placeholder="Qualification / Degree"
                  />
                  <input
                    type="text"
                    value={qualificationDraft.institution}
                    onChange={(e) => setQualificationDraft((prev) => ({ ...prev, institution: e.target.value }))}
                    className="rounded-xl border border-slate-300 p-3"
                    placeholder="Institution"
                  />
                  <input
                    type="text"
                    value={qualificationDraft.year}
                    onChange={(e) => setQualificationDraft((prev) => ({ ...prev, year: e.target.value }))}
                    className="rounded-xl border border-slate-300 p-3"
                    placeholder="Year"
                  />
                </div>

                <button
                  type="button"
                  onClick={addQualification}
                  className="px-5 rounded-xl bg-primary-600 text-white font-bold"
                >
                  + Add Qualification
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {formData.qualifications.map((item, index) => (
                  <div
                    key={`${item.qualification}-${index}`}
                    className="flex justify-between items-start bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{item.qualification}</div>
                      <div className="text-sm text-slate-500">{item.institution}{item.institution && item.year ? ' • ' : ''}{item.year}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

            </div>


            {/* Certifications */}
            <div className="mb-8">

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Certifications
              </label>

              <div className="space-y-3">
                <input
                  type="text"
                  value={certificationDraft.name}
                  onChange={(e) => setCertificationDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-3"
                  placeholder="Certification name / title"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={certificationDraft.link}
                    onChange={(e) => setCertificationDraft((prev) => ({ ...prev, link: e.target.value }))}
                    className="rounded-xl border border-slate-300 p-3"
                    placeholder="Certification URL (optional)"
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCertificationDraft((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="rounded-xl border border-slate-300 p-3"
                  />
                </div>

                <div className="text-sm text-slate-500">
                  Upload a PDF or provide a link. You can add multiple certifications.
                </div>

                <button
                  type="button"
                  onClick={addCertification}
                  className="px-5 rounded-xl bg-primary-600 text-white font-bold"
                >
                  + Add Certification
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {formData.certifications.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex justify-between items-start bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-sm text-slate-500">
                        {item.link ? `Link: ${item.link}` : ''}
                        {item.fileName ? `File: ${item.fileName}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

            </div>


            {/* Experience */}
            <div>

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Professional Experience <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-3"
                placeholder="e.g. 5 years of residential plumbing experience"
              />

            </div>

          </section>


          {/* Availability */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Availability <span className="text-red-500">*</span>
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Select at least one time slot for the days you are available. This is required.
            </p>

            <div className="space-y-4">

              {formData.availability.map((availability, dayIndex) => (
                <div
                  key={availability.day}
                  className="border border-slate-200 rounded-xl p-4"
                >

                  <div className="flex justify-between items-center">

                    <h3 className="font-bold text-slate-800">
                      {availability.day}
                    </h3>

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    {timeSlotOptions.map((slot) => {
                      const isSelected = availability.slots.includes(slot);

                      return (
                        <button
                          key={`${availability.day}-${slot}`}
                          type="button"
                          onClick={() => toggleTimeSlot(dayIndex, slot)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-primary-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                </div>
              ))}

            </div>

          </section>


          {/* Portfolio */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Portfolio <span className="text-slate-400 font-normal">(Optional)</span>
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Add URLs for portfolio images showing your previous work. This is optional.
            </p>

            <div className="flex gap-2">

              <input
                type="url"
                value={newPortfolioUrl}
                onChange={(e) => setNewPortfolioUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 p-3"
                placeholder="https://example.com/image.jpg"
              />

              <button
                type="button"
                onClick={addPortfolioUrl}
                className="px-5 rounded-xl bg-primary-600 text-white font-bold"
              >
                Add
              </button>

            </div>

            <div className="mt-4 space-y-2">

              {formData.portfolio.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-3"
                >

                  <span className="text-sm truncate mr-4">
                    {url}
                  </span>

                  <button
                    type="button"
                    onClick={() => removePortfolioUrl(index)}
                    className="text-red-600 font-medium"
                  >
                    Remove
                  </button>

                </div>
              ))}

            </div>

          </section>


          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all"
            >
              {saving
                ? 'Saving Profile...'
                : 'Save Profile & Publish'}
            </button>

            <button
              type="button"
              onClick={handleDeleteProfile}
              disabled={deleting}
              className="w-full mt-3 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-bold py-3 rounded-xl"
            >
              {deleting
                ? 'Deleting Profile...'
                : 'Delete Provider Profile'}
            </button>

          </div>

        </form>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 mt-8">
            {loadingAnalytics ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : analyticsData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</h3>
                    <p className="text-3xl font-extrabold text-emerald-600">৳{analyticsData.totalRevenue}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Completed Jobs</h3>
                    <p className="text-3xl font-extrabold text-blue-600">{analyticsData.totalCompletedJobs}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center">
                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Average Rating</h3>
                    <p className="text-3xl font-extrabold text-amber-500">{analyticsData.averageRating} / 5.0</p>
                    <p className="text-xs text-slate-400 mt-1">From {analyticsData.totalReviews} review(s)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Peak Demand Analysis (Monthly)</h3>
                    <p className="text-sm text-slate-500 mb-6">Your busiest booking months based on all incoming requests.</p>
                    {analyticsData.peakDemand.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.peakDemand.map((pd, index) => (
                          <div key={pd.month} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold text-slate-700">{index + 1}. {pd.month}</span>
                            <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">{pd.bookings} Booking(s)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">Not enough booking data to analyze monthly demand.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Peak Demand Analysis (By Day)</h3>
                    <p className="text-sm text-slate-500 mb-6">Your busiest booking days of the week.</p>
                    {analyticsData.peakDemandDays?.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.peakDemandDays.map((pd, index) => (
                          <div key={pd.day} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold text-slate-700">{index + 1}. {pd.day}</span>
                            <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">{pd.bookings} Booking(s)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">Not enough booking data to analyze daily demand.</p>
                    )}
                  </div>
                </div>

                {analyticsData.ratingTrends.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Rating Trends (By Month)</h3>
                    <div className="flex space-x-6 overflow-x-auto pb-2">
                      {analyticsData.ratingTrends.map((rt) => (
                        <div key={rt.month} className="flex flex-col items-center bg-slate-50 p-4 rounded-xl min-w-[100px] border border-slate-200">
                          <span className="text-2xl font-bold text-amber-500 mb-1">{rt.average}</span>
                          <span className="text-sm font-medium text-slate-600">{rt.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analyticsData.providerGivenReviews?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Homeowners You Have Rated</h3>
                    <p className="text-sm text-slate-500 mb-6">A log of feedback you have provided to homeowners after completing their jobs.</p>
                    <div className="space-y-6">
                      {analyticsData.providerGivenReviews.map((review) => (
                        <div key={review._id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-900">{review.homeownerName}</div>
                              <div className="text-sm text-slate-500">{review.targetEmail}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                              <span className="text-amber-500">⭐</span>
                              <span className="font-bold text-amber-700">{review.rating}</span>
                            </div>
                          </div>
                          {(review.behavior || review.paymentPromptness) && (
                            <div className="flex gap-4 text-xs text-slate-500 mb-2">
                              {review.behavior && <span>Behavior: {review.behavior}/5</span>}
                              {review.paymentPromptness && <span>Payment Promptness: {review.paymentPromptness}/5</span>}
                            </div>
                          )}
                          {review.comment && (
                            <p className="text-slate-600 text-sm mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 italic">"{review.comment}"</p>
                          )}
                          <div className="text-xs text-slate-400 mt-2">
                            Submitted on {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Failed to load analytics data.
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-bold text-slate-900">Incoming Service Requests</h2>
            <p className="text-sm text-slate-500 mb-4">Review and respond to homeowner booking requests.</p>
            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : providerBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-semibold text-lg">No requests yet</p>
                <p className="text-sm mt-1">When homeowners book your service, requests will appear here.</p>
              </div>
            ) : (
              providerBookings.map((booking) => {
                const STATUS_CFG = {
                  pending:      { label: 'Pending',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
                  accepted:     { label: 'Accepted',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700 border-red-200' },
                  'in-progress':{ label: 'In Progress',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
                  completed:    { label: 'Completed',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                };
                const cfg = STATUS_CFG[booking.status] || { label: booking.status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                const isUpdating = updatingBookingId === booking._id;

                return (
                  <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-900">{booking.userName}</p>
                        <p className="text-sm text-slate-500">{booking.userEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Date</p>
                        <p className="text-slate-700 font-medium mt-0.5">{booking.date}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Time</p>
                        <p className="text-slate-700 font-medium mt-0.5">{booking.time}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Address</p>
                        <p className="text-slate-700 font-medium mt-0.5">{booking.userAddress}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Problem Description</p>
                        <p className="text-slate-700 mt-0.5">{booking.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleBookingStatusUpdate(booking._id, 'accepted')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                          >
                            {isUpdating ? 'Updating...' : '✓ Accept'}
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleBookingStatusUpdate(booking._id, 'rejected')}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors"
                          >
                            {isUpdating ? 'Updating...' : '✕ Reject'}
                          </button>
                        </>
                      )}
                      {booking.status === 'accepted' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleBookingStatusUpdate(booking._id, 'in-progress')}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          {isUpdating ? 'Updating...' : '▶ Mark In Progress'}
                        </button>
                      )}
                      {booking.status === 'in-progress' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          {isUpdating ? 'Updating...' : '✔ Mark Completed'}
                        </button>
                      )}
                      {booking.status === 'rejected' && (
                        <span className="text-xs text-slate-400 italic self-center">No further actions available</span>
                      )}
                      {booking.status === 'completed' && (
                        reviewedBookings[booking._id] ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-xl">
                            ✓ Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => { setReviewBookingId(booking._id); setReviewModalOpen(true); }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors"
                          >
                            ⭐ Rate Homeowner
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => { setReviewModalOpen(false); setReviewBookingId(null); }}
          bookingId={reviewBookingId}
          reviewerType="provider"
          reviewerName={formData.name || user?.name || 'Provider'}
          onReviewSubmitted={() => {
            setReviewedBookings(prev => ({ ...prev, [reviewBookingId]: true }));
          }}
        />

      </div>
    </div>
  );
};

export default ProviderDashboard;