import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Trophy, Menu, X, User, LogOut, LayoutDashboard, Shield, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/users/notifications').then((res) => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-primary-800 font-bold text-xl">
              <Trophy className="w-6 h-6 text-gold-500" />
              <span>Digital Heroes Golf</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/leaderboard" className="text-gray-600 hover:text-primary-700 font-medium">Leaderboard</Link>
            <Link to="/charities" className="text-gray-600 hover:text-primary-700 font-medium">Charities</Link>
            <Link to="/draws" className="text-gray-600 hover:text-primary-700 font-medium">Draws</Link>
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center gap-1 text-primary-700 hover:text-primary-800 font-medium">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <div className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100 font-medium text-sm">Notifications</div>
                      {notifications.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>}
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-primary-50/50' : ''}`} onClick={() => markRead(n.id)}>
                          <div className="text-xs font-medium text-gray-900">{n.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.fullName}</span>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Join Now</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className="block text-gray-600 font-medium">Leaderboard</Link>
          <Link to="/charities" onClick={() => setMobileOpen(false)} className="block text-gray-600 font-medium">Charities</Link>
          <Link to="/draws" onClick={() => setMobileOpen(false)} className="block text-gray-600 font-medium">Draws</Link>
          {user ? (
            <>
              {user.role === 'ADMIN' && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-gold-600 font-medium">Admin Panel</Link>}
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-primary-700 font-medium">Dashboard</Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block text-red-600 font-medium">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-gray-600 font-medium">Log In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-primary-700 font-medium">Join Now</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
