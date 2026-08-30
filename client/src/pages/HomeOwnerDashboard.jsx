import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProviderCard from '../components/ProviderCard';
import BookingModal from '../components/BookingModal';
import { Heart, Compass, Sparkles } from 'lucide-react';
import { API_URL } from '../config/api';

const HomeOwnerDashboard = () => {
  const { user, token, refreshProfile, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    if (refreshProfile) refreshProfile();

    const fetchFavorites = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(res.data || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [authLoading, navigate, token, user]);

  const handleBookNow = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleToggleFavorite = async (provider) => {
    try {
      await axios.delete(`${API_URL}/api/auth/favorites/${provider._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites((prev) => prev.filter((item) => item._id !== provider._id));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-xs font-black uppercase tracking-wider mb-3">
            <Heart className="w-4 h-4 text-pink-500" /> Saved Favorites
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">My Favorite Providers</h1>
              <p className="mt-2 text-slate-600 text-sm">Save providers you trust and rebook them quickly whenever you need them.</p>
            </div>
            
            {/* Reward Points Badge */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[200px]">
              <div className="p-3 bg-white rounded-xl shadow-sm text-pink-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reward Points</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">{user?.rewardPoints || 0}</p>
                <p className="text-[11px] text-pink-600 font-bold mt-0.5">Worth ৳{(user?.rewardPoints || 0) * 3}</p>
              </div>
            </div>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border border-pink-100 bg-white/90 p-12 text-center shadow-sm space-y-4">
            <Heart className="w-12 h-12 text-pink-300 mx-auto" />
            <h2 className="text-xl font-black text-slate-900 font-display">No favorite providers saved yet.</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Browse verified providers on the home page and click "Save" to keep them here.</p>
            <Link to="/" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 font-black text-white text-xs shadow-md shadow-pink-200">
              <Compass className="w-4 h-4" /> Browse Providers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favorites.map((provider) => (
              <ProviderCard
                key={provider._id}
                provider={provider}
                onBookNow={handleBookNow}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={true}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProvider && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
        />
      )}
    </div>
  );
};

export default HomeOwnerDashboard;
