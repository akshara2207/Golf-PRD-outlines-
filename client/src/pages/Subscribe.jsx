import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap, AlertCircle } from 'lucide-react';

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/payments/create-checkout-session', { planType: plan });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError('Stripe checkout is not configured yet. Please contact support.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Please Log In</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to subscribe.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Log In</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Subscribe to enter scores, join draws, and support your chosen charity.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => setPlan('MONTHLY')}
          className={`card cursor-pointer transition-all ${plan === 'MONTHLY' ? 'ring-2 ring-primary-500 bg-primary-50/50' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Monthly</h3>
              <p className="text-sm text-gray-500">Flexible, cancel anytime</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">£9.99<span className="text-base font-normal text-gray-500">/month</span></div>
          <ul className="space-y-2 mt-4">
            {['Unlimited score entries', 'Monthly draw eligibility', 'Charity contribution', 'Leaderboard ranking'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-primary-600" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div
          onClick={() => setPlan('YEARLY')}
          className={`card cursor-pointer transition-all ${plan === 'YEARLY' ? 'ring-2 ring-gold-500 bg-gold-50/50' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Yearly</h3>
              <p className="text-sm text-gray-500">Best value, save 17%</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">£99<span className="text-base font-normal text-gray-500">/year</span></div>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 bg-gold-50 px-2 py-1 rounded-full mt-2">
            <Crown className="w-3 h-3" /> Pro Member Badge
          </div>
          <ul className="space-y-2 mt-4">
            {['Everything in Monthly', 'Pro Member badge on leaderboard', 'Priority draw entry', 'Annual impact report'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-gold-600" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center">
        <button onClick={handleSubscribe} disabled={loading} className="btn-primary text-lg px-10 py-3">
          {loading ? 'Processing...' : `Subscribe ${plan === 'MONTHLY' ? 'Monthly' : 'Yearly'}`}
        </button>
        <p className="text-xs text-gray-500 mt-3">Secure payment powered by Stripe. Cancel anytime.</p>
      </div>
    </div>
  );
}
