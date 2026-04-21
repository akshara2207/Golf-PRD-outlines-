import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Heart, TrendingUp, ShieldCheck, Users, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Home() {
  const { user } = useAuth();
  const [featuredCharity, setFeaturedCharity] = useState(null);

  useEffect(() => {
    api.get('/charities').then((res) => {
      const active = res.data.filter((c) => c.isActive);
      if (active.length > 0) {
        setFeaturedCharity(active[0]);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-800 to-primary-900 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Trophy className="w-4 h-4 text-gold-400" />
            The Modern Golf Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Play. Compete. <span className="text-gold-400">Give Back.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-10">
            Track your Stableford scores, enter monthly prize draws, and support charities you believe in — all in one beautifully designed platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-gold flex items-center gap-2 text-lg">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-gold flex items-center gap-2 text-lg">
                  Join the Club <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/leaderboard" className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                  View Leaderboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Golfers Love Us</h2>
            <p className="text-gray-600 max-w-xl mx-auto">A platform designed to feel rewarding, transparent, and genuinely fun to use.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Track Your Game</h3>
              <p className="text-gray-600 text-sm">Enter Stableford scores quickly and see how you rank against the community on our live leaderboard.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Monthly Draws</h3>
              <p className="text-gray-600 text-sm">Fair, algorithm-powered prize pools with three tiers. The more you play, the better your chances.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Give Back</h3>
              <p className="text-gray-600 text-sm">Choose a verified charity and automatically donate a portion of your subscription every month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charity */}
      {featuredCharity && (
        <section className="py-16 px-4 bg-red-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Star className="w-5 h-5 text-gold-500" />
              <span className="text-sm font-bold text-gold-600 uppercase tracking-wider">Featured Charity</span>
            </div>
            <div className="card flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{featuredCharity.name}</h3>
                <p className="text-gray-600 mb-4">{featuredCharity.description}</p>
                <Link to="/charities" className="inline-flex items-center gap-1 text-primary-700 font-medium hover:underline">
                  Explore Charities <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">Active Community</div>
              <p className="text-gray-600 mt-1">Join golfers competing every month</p>
            </div>
            <div>
              <ShieldCheck className="w-8 h-8 text-gold-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">Verified Draws</div>
              <p className="text-gray-600 mt-1">Cryptographically fair random selection</p>
            </div>
            <div>
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">Charity First</div>
              <p className="text-gray-600 mt-1">Minimum 10% to causes you care about</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
