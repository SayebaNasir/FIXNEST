import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import ProviderProfile from './pages/ProviderProfile';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HomeOwnerDashboard from './pages/HomeOwnerDashboard';
import MyRequests from './pages/MyRequests';
import OffPeakHeatmap from './pages/OffPeakHeatmap';
import LoginModal from './components/LoginModal';
import MyBookings from './pages/MyBookings';
import ChatPage from './pages/Chatpage';
import { Heart, ClipboardList, LayoutDashboard, ShieldAlert, LogOut, User as UserIcon, Compass, MessageCircle } from 'lucide-react';

const NavBar = () => {
  const { user, logout, setIsLoginModalOpen } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100/80 shadow-sm text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/logo.jpg" alt="FixNest Logo" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-pink-200 group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-pink-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors font-display">
                Fix<span className="text-pink-500">Nest</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 -mt-1">Home Services</span>
            </div>
          </Link>

          {/* Navigation Links & User Controls */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200' 
                  : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
              }`}
            >
              <Compass className="w-4 h-4" /> Explore
            </Link>

            {user ? (
              <div className="flex items-center gap-3 border-l border-pink-100 pl-3 sm:pl-4">
                
                {/* User Role & Name Tag */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-extrabold text-slate-900">{user.name}</span>
                  <span className="text-[10px] font-bold text-purple-600 capitalize bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>

                {user.role === 'provider' && (
                  <Link 
                    to="/dashboard" 
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/dashboard') 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200' 
                        : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Provider Hub
                  </Link>
                )}

                <Link
                  to="/my-requests"
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive('/my-requests')
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200'
                      : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> My Bookings
                </Link>

                {user.role !== 'admin' && (
                  <Link
                    to="/messages"
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/messages')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" /> Messages
                  </Link>
                )}

                <Link 
                  to="/favorites" 
                  className={`p-2 rounded-2xl text-xs font-bold transition-all ${
                    isActive('/favorites') ? 'bg-pink-100/80 text-pink-600 border border-pink-200' : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                  title="Favorites"
                >
                  <Heart className="w-4 h-4" />
                </Link>

                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/admin') 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
                        : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/60'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" /> Admin Portal
                  </Link>
                )}

                <button 
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-2xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-pink-200 text-xs flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans antialiased text-slate-800 min-h-screen">
          <NavBar />
          <main className="pb-16">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/provider/:id" element={<ProviderProfile />} />
              <Route path="/dashboard" element={<ProviderDashboard />} />
              <Route path="/favorites" element={<HomeOwnerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/offpeak-heatmap" element={<OffPeakHeatmap />} />
              <Route path="/messages" element={<ChatPage />} />
            </Routes>
          </main>
          <LoginModal />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;