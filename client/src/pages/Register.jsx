import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Trophy, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    handicap: '',
    charityId: '',
    planType: 'MONTHLY',
    contributionPercentage: 10,
  });
  const [charities, setCharities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/charities').then((res) => setCharities(res.data)).catch(() => {});
  }, []);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        handicap: parseFloat(form.handicap),
        charityId: parseInt(form.charityId),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const canProceed =
    step === 1
      ? form.fullName && form.email && form.password.length >= 6
      : form.handicap !== '' && form.charityId;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
            <Trophy className="w-6 h-6 text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Digital Heroes Golf</h1>
          <p className="text-gray-600 mt-1">Create your account in under 60 seconds</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required placeholder="John Smith" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input pr-10" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="button" disabled={!canProceed} onClick={() => setStep(2)} className="btn-primary w-full">
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="label">Handicap Index</label>
                  <input type="number" step="0.1" className="input" value={form.handicap} onChange={(e) => update('handicap', e.target.value)} required min="-10" max="54" placeholder="12.4" />
                </div>
                <div>
                  <label className="label">Choose Your Charity</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {charities.map((c) => (
                      <label key={c.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.charityId === String(c.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="charity" value={c.id} checked={form.charityId === String(c.id)} onChange={(e) => update('charityId', e.target.value)} className="mt-1" />
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Charity Contribution: {form.contributionPercentage}%</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={form.contributionPercentage}
                    onChange={(e) => update('contributionPercentage', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 10%. You can increase your contribution up to 50%.</p>
                </div>
                <div>
                  <label className="label">Subscription Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${form.planType === 'MONTHLY' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                      <input type="radio" name="plan" value="MONTHLY" checked={form.planType === 'MONTHLY'} onChange={(e) => update('planType', e.target.value)} className="sr-only" />
                      <div className="font-bold text-lg">Monthly</div>
                      <div className="text-sm text-gray-600">&pound;9.99/mo</div>
                    </label>
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${form.planType === 'YEARLY' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                      <input type="radio" name="plan" value="YEARLY" checked={form.planType === 'YEARLY'} onChange={(e) => update('planType', e.target.value)} className="sr-only" />
                      <div className="font-bold text-lg">Yearly</div>
                      <div className="text-sm text-gray-600">&pound;99/yr <span className="text-primary-600 font-medium">Save 17%</span></div>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={!canProceed || loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? 'Creating Account...' : <><CheckCircle className="w-4 h-4" /> Create Account</>}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
