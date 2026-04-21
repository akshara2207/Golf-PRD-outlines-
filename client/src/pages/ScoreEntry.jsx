import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Target, AlertCircle, CheckCircle } from 'lucide-react';

export default function ScoreEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ courseName: '', stablefordPoints: '', playedDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSubActive = user?.subscription?.status === 'ACTIVE' || user?.role === 'ADMIN';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/scores', {
        courseName: form.courseName,
        stablefordPoints: parseInt(form.stablefordPoints),
        playedDate: form.playedDate,
      });
      setSuccess(true);
      setForm({ courseName: '', stablefordPoints: '', playedDate: '' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setLoading(false);
    }
  };

  if (!isSubActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600 mb-6">You need an active subscription to enter scores and participate in draws.</p>
          <button onClick={() => navigate('/subscribe')} className="btn-primary">Subscribe Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary-600" /> Enter Your Score
        </h1>
        <p className="text-gray-600 mt-1">Record your latest Stableford round to appear on the leaderboard.</p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Score submitted successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Course Name</label>
            <input
              className="input"
              value={form.courseName}
              onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              required
              placeholder="e.g. St Andrews Old Course"
            />
          </div>

          <div>
            <label className="label">Stableford Points</label>
            <input
              type="number"
              min="1"
              max="45"
              className="input"
              value={form.stablefordPoints}
              onChange={(e) => setForm({ ...form, stablefordPoints: e.target.value })}
              required
              placeholder="e.g. 36"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your total Stableford points for the round (1-45). Only your latest 5 scores are kept.</p>
          </div>

          <div>
            <label className="label">Date Played</label>
            <input
              type="date"
              className="input"
              value={form.playedDate}
              onChange={(e) => setForm({ ...form, playedDate: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : 'Submit Score'}
          </button>
        </form>
      </div>
    </div>
  );
}
