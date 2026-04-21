import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, TrendingUp, Heart, Calendar, ArrowRight, AlertCircle, CheckCircle, Edit3, X, Upload, Award } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editScore, setEditScore] = useState(null);
  const [proofModal, setProofModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = () => {
    api.get('/users/me').then((res) => {
      setProfile(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.get('/users/me'),
      api.get('/draws'),
    ]).then(([pRes, dRes]) => {
      setProfile(pRes.data);
      setDraws(dRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  const isSubActive = profile?.subscription?.status === 'ACTIVE' || profile?.role === 'ADMIN';
  const upcomingDraws = draws.filter((d) => d.status === 'PENDING');
  const publishedDraws = draws.filter((d) => d.status === 'PUBLISHED' || d.status === 'COMPLETED');

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editScore) return;
    setActionLoading(true);
    try {
      await api.patch(`/scores/${editScore.id}`, editScore);
      setEditScore(null);
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update score');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!proofModal) return;
    setActionLoading(true);
    try {
      await api.patch(`/draws/results/${proofModal.id}/proof`, {
        proofUrl: proofModal.proofUrl,
        proofDescription: proofModal.proofDescription,
      });
      setProofModal(null);
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setActionLoading(false);
    }
  };

  const tierLabel = (tier) => {
    if (tier === 'TIER_1') return '5-Number Match';
    if (tier === 'TIER_2') return '4-Number Match';
    if (tier === 'TIER_3') return '3-Number Match';
    return tier;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {editScore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Score</h3>
              <button onClick={() => setEditScore(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateScore} className="space-y-3">
              <div><label className="label">Course Name</label><input className="input" value={editScore.courseName} onChange={(e) => setEditScore({ ...editScore, courseName: e.target.value })} required /></div>
              <div><label className="label">Stableford Points</label><input className="input" type="number" min="1" max="45" value={editScore.stablefordPoints} onChange={(e) => setEditScore({ ...editScore, stablefordPoints: parseInt(e.target.value) })} required /></div>
              <div><label className="label">Played Date</label><input className="input" type="date" value={editScore.playedDate ? new Date(editScore.playedDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditScore({ ...editScore, playedDate: e.target.value })} required /></div>
              <button type="submit" disabled={actionLoading} className="btn-primary w-full">{actionLoading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {proofModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Upload Winner Proof</h3>
              <button onClick={() => setProofModal(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleProofUpload} className="space-y-3">
              <div><label className="label">Proof URL (image link)</label><input className="input" value={proofModal.proofUrl || ''} onChange={(e) => setProofModal({ ...proofModal, proofUrl: e.target.value })} placeholder="https://..." /></div>
              <div><label className="label">Description</label><textarea className="input" rows="3" value={proofModal.proofDescription || ''} onChange={(e) => setProofModal({ ...proofModal, proofDescription: e.target.value })} placeholder="Describe your winning round..." /></div>
              <button type="submit" disabled={actionLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> {actionLoading ? 'Uploading...' : 'Submit Proof'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.fullName?.split(' ')[0]}</h1>
        <p className="text-gray-600 mt-1">Here is everything happening with your account.</p>
      </div>

      {!isSubActive && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Your subscription is not active</p>
            <p className="text-xs text-amber-700">Subscribe to enter scores and participate in draws.</p>
          </div>
          <Link to="/subscribe" className="text-sm font-medium text-amber-800 underline">Subscribe</Link>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-700" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scores</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{profile?.scores?.length || 0}</div>
          <p className="text-sm text-gray-600 mt-1">Latest rounds entered</p>
          <Link to="/score-entry" className="inline-flex items-center gap-1 text-primary-700 text-sm font-medium mt-3 hover:underline">
            Enter Score <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gold-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {profile?.subscription?.planType === 'YEARLY' ? 'Yearly' : 'Monthly'}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Status: <span className={isSubActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{profile?.subscription?.status}</span>
          </p>
          {profile?.subscription?.currentPeriodEnd && (
            <p className="text-xs text-gray-500 mt-1">Renews: {new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Charity</span>
          </div>
          <div className="text-lg font-bold text-gray-900 truncate">{profile?.charityPref?.charity?.name || 'None selected'}</div>
          <p className="text-sm text-gray-600 mt-1">
            {profile?.charityPref?.contributionPercentage || 10}% of subscription
          </p>
          <Link to="/charities" className="inline-flex items-center gap-1 text-primary-700 text-sm font-medium mt-3 hover:underline">
            Change Charity <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" /> Recent Scores
          </h3>
          {profile?.scores?.length > 0 ? (
            <div className="space-y-3">
              {profile.scores.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{s.courseName}</div>
                    <div className="text-xs text-gray-500">{new Date(s.playedDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-primary-700">{s.stablefordPoints} pts</div>
                    <button onClick={() => setEditScore({ ...s })} className="p-1 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No scores entered yet. <Link to="/score-entry" className="text-primary-700 font-medium">Enter your first score</Link></p>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold-500" /> Draw Participation & Winnings
          </h3>
          {profile?.drawResults?.length > 0 ? (
            <div className="space-y-3">
              {profile.drawResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{tierLabel(r.tier)}</div>
                    <div className="text-xs text-gray-500">{new Date(r.draw.drawDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gold-600">&pound;{r.prizeAmount}</span>
                    {r.verificationStatus === 'APPROVED' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : r.verificationStatus === 'PENDING' && r.tier === 'TIER_1' ? (
                      <button onClick={() => setProofModal({ id: r.id, proofUrl: r.proofUrl || '', proofDescription: r.proofDescription || '' })} className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100">
                        Upload Proof
                      </button>
                    ) : r.verificationStatus === 'PENDING' ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending</span>
                    ) : (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">Rejected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No draw results yet. Check the <Link to="/draws" className="text-primary-700 font-medium">draws page</Link> for upcoming events.</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary-600" /> Upcoming Draws
          </h3>
          {upcomingDraws.length > 0 ? (
            <div className="space-y-3">
              {upcomingDraws.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{new Date(d.drawDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <div className="text-xs text-gray-500">Logic: {d.drawLogic}</div>
                  </div>
                  <div className="text-sm font-bold text-gold-600">
                    &pound;{d.totalPool.toFixed(0)}
                    {d.rolledOverJackpot > 0 && <span className="text-xs text-green-600 ml-1">(+&pound;{d.rolledOverJackpot.toFixed(0)} rollover)</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming draws scheduled.</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Participation Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Draws Entered</span>
              <span className="font-medium">{publishedDraws.filter((d) => d.results.some((r) => r.userId === profile?.id)).length}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Total Winnings</span>
              <span className="font-bold text-gold-600">&pound;{profile?.drawResults?.reduce((sum, r) => sum + r.prizeAmount, 0).toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Charity Contributed</span>
              <span className="font-bold text-red-500">&pound;{(profile?.charityPref?.contributionPercentage || 10) * 0.1 * (profile?.subscription ? 1 : 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
