import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, ArrowLeft, CheckCircle2 } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import { AuthContext } from '../context/AuthContext';

const ProviderProfile = () => {
  const { id } = useParams();
  const { user, setIsLoginModalOpen } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedSlot, setPreselectedSlot] = useState({ day: null, time: null });

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/providers/${id}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching provider:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data || !data.provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900">Provider not found</h2>
        <Link to="/" className="mt-4 text-primary-600 hover:underline">Back to Search</Link>
      </div>
    );
  }

  const { provider, reviews } = data;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-8 md:flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{provider.name}</h1>
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              </div>
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
                {provider.serviceType}
              </span>
              <p className="text-slate-600 max-w-2xl">{provider.bio}</p>
              
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{provider.rating}</span>
                  <span className="text-slate-500">({provider.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-5 h-5" />
                  <span>{provider.address}</span>
                </div>
                <div className="font-bold text-primary-600 text-lg">
                  ৳{provider.pricePerHour} <span className="text-sm font-normal text-slate-500">/ hour</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0">
              <button 
                onClick={() => {
                  if (!user) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  setPreselectedSlot({ day: null, time: null }); 
                  setIsModalOpen(true); 
                }}
                className="w-full md:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2 space-y-8">
            {/* Portfolio */}
            {provider.portfolio && provider.portfolio.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 gap-4">
                  {provider.portfolio.map((img, i) => (
                    <img key={i} src={img} alt="Portfolio item" className="rounded-lg w-full h-48 object-cover" />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Reviews ({reviews.length})</h2>
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review._id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-slate-900">{review.userName}</div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                    <div className="text-sm text-slate-400 mt-2">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Availability</h2>
              <div className="space-y-4">
                {provider.availability.map((a, i) => (
                  <div key={i}>
                    <div className="font-medium text-slate-700 mb-2">{a.day}</div>
                    <div className="flex flex-wrap gap-2">
                      {a.slots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => {
                            if (!user) {
                              setIsLoginModalOpen(true);
                              return;
                            }
                            setPreselectedSlot({ day: a.day, time: slot }); 
                            setIsModalOpen(true); 
                          }}
                          className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 cursor-pointer rounded-lg text-sm font-medium transition-colors border border-primary-200"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        provider={provider} 
        initialSlot={preselectedSlot}
      />
    </div>
  );
};

export default ProviderProfile;
