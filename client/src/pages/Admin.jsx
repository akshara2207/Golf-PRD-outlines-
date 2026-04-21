import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  Shield, Users, Trophy, Trash2, CheckCircle, XCircle, Edit3,
  Play, BarChart3, Activity, Eye, Loader2, AlertTriangle, Heart,
  Plus, DollarSign, TrendingUp, Award, FileText, X,
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);
  const [draws, setDraws] = useState([]);
  const [logs, setLogs] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winners, setWinners] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawForm, setDrawForm] = useState({ drawDate: '', totalPool: '', drawLogic: 'RANDOM' });
  const [simForm, setSimForm] = useState({ drawDate: '', totalPool: 1000, simulations: 100, drawLogic: 'RANDOM' });
  const [simResults, setSimResults] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'scores', label: 'Score Management', icon: Trophy },
    { id: 'draws', label: 'Draw Management', icon: Play },
    { id: 'charities', label: 'Charity Management', icon: Heart },
    { id: 'winners', label: 'Winners', icon: Award },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
  ];

  const loadData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (tab === 'scores') {
        const res = await api.get('/admin/scores');
        setScores(res.data);
      } else if (tab === 'draws') {
        const res = await api.get('/admin/draws');
        setDraws(res.data);
      } else if (tab === 'charities') {
        const res = await api.get('/charities');
        setCharities(res.data);
      } else if (tab === 'winners') {
        const res = await api.get('/admin/winners');
        setWinners(res.data);
      } else if (tab === 'reports') {
        const res = await api.get('/admin/reports');
        setReports(res.data);
      } else if (tab === 'logs') {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    setActionLoading({ createDraw: true });
    try {
      await api.post('/draws', drawForm);
      setDrawForm({ drawDate: '', totalPool: '', drawLogic: 'RANDOM' });
      loadData('draws');
      setActiveTab('draws');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create draw');
    } finally {
      setActionLoading({});
    }
  };

  const handleRunDraw = async (id) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    setActionLoading({ [`run_${id}`]: true });
    try {
      await api.post(`/draws/${id}/run`);
      loadData('draws');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run draw');
    } finally {
      setActionLoading({});
    }
  };

  const handlePublish = async (id) => {
    if (!confirm('Publish draw results publicly?')) return;
    setActionLoading({ [`pub_${id}`]: true });
    try {
      await api.patch(`/admin/draws/${id}`, { status: 'PUBLISHED' });
      loadData('draws');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish');
    } finally {
      setActionLoading({});
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setActionLoading({ simulate: true });
    try {
      const res = await api.post('/draws/simulate', simForm);
      setSimResults(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Simulation failed');
    } finally {
      setActionLoading({});
    }
  };

  const handleVerify = async (resultId, drawId, status) => {
    setActionLoading({ [`verify_${resultId}`]: true });
    try {
      await api.post(`/admin/draws/${drawId}/verify`, { resultId, status });
      loadData('draws');
      loadData('winners');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify');
    } finally {
      setActionLoading({});
    }
  };

  const handleDeleteScore = async (id) => {
    if (!confirm('Delete this score permanently?')) return;
    setActionLoading({ [`del_score_${id}`]: true });
    try {
      await api.delete(`/admin/scores/${id}`);
      loadData('scores');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading({});
    }
  };

  const openEditModal = (type, data) => {
    setModal(type);
    setEditForm({ ...data });
  };

  const closeModal = () => {
    setModal(null);
    setEditForm({});
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading({ updateUser: true });
    try {
      await api.patch(`/admin/users/${editForm.id}`, editForm);
      closeModal();
      loadData('users');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading({});
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    setActionLoading({ updateScore: true });
    try {
      await api.patch(`/admin/scores/${editForm.id}`, editForm);
      closeModal();
      loadData('scores');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update score');
    } finally {
      setActionLoading({});
    }
  };

  const handleUpdateSub = async (e) => {
    e.preventDefault();
    setActionLoading({ updateSub: true });
    try {
      await api.patch(`/admin/subscriptions/${editForm.subscriptionId}`, editForm);
      closeModal();
      loadData('users');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setActionLoading({});
    }
  };

  const handleCreateCharity = async (e) => {
    e.preventDefault();
    setActionLoading({ createCharity: true });
    try {
      await api.post('/admin/charities', editForm);
      closeModal();
      loadData('charities');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create charity');
    } finally {
      setActionLoading({});
    }
  };

  const handleUpdateCharity = async (e) => {
    e.preventDefault();
    setActionLoading({ updateCharity: true });
    try {
      await api.patch(`/admin/charities/${editForm.id}`, editForm);
      closeModal();
      loadData('charities');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update charity');
    } finally {
      setActionLoading({});
    }
  };

  const handleDeleteCharity = async (id) => {
    if (!confirm('Delete this charity permanently?')) return;
    setActionLoading({ [`del_charity_${id}`]: true });
    try {
      await api.delete(`/admin/charities/${id}`);
      loadData('charities');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading({});
    }
  };

  const handlePayout = async (id) => {
    setActionLoading({ [`payout_${id}`]: true });
    try {
      await api.patch(`/admin/winners/${id}/payout`);
      loadData('winners');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payout');
    } finally {
      setActionLoading({});
    }
  };

  const renderModal = () => {
    if (!modal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
                            {modal === 'user' && 'Edit User'}
              {modal === 'score' && 'Edit Score'}
              {modal === 'subscription' && 'Manage Subscription'}
              {modal === 'charity' && (editForm.id ? 'Edit Charity' : 'Add Charity')}
            </h3>
            <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>

          {modal === 'user' && (
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div><label className="label">Full Name</label><input className="input" value={editForm.fullName || ''} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
              <div><label className="label">Handicap</label><input className="input" type="number" step="0.1" value={editForm.handicap || 0} onChange={(e) => setEditForm({ ...editForm, handicap: parseFloat(e.target.value) })} /></div>
              <div><label className="label">Role</label>
                <select className="input" value={editForm.role || 'USER'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={actionLoading.updateUser} className="btn-primary w-full">{actionLoading.updateUser ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {modal === 'score' && (
            <form onSubmit={handleUpdateScore} className="space-y-3">
              <div><label className="label">Course Name</label><input className="input" value={editForm.courseName || ''} onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })} required /></div>
              <div><label className="label">Stableford Points</label><input className="input" type="number" min="1" max="45" value={editForm.stablefordPoints || ''} onChange={(e) => setEditForm({ ...editForm, stablefordPoints: parseInt(e.target.value) })} required /></div>
              <div><label className="label">Played Date</label><input className="input" type="date" value={editForm.playedDate ? new Date(editForm.playedDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm({ ...editForm, playedDate: e.target.value })} required /></div>
              <button type="submit" disabled={actionLoading.updateScore} className="btn-primary w-full">{actionLoading.updateScore ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {modal === 'subscription' && (
            <form onSubmit={handleUpdateSub} className="space-y-3">
              <div><label className="label">Status</label>
                <select className="input" value={editForm.status || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div><label className="label">Plan Type</label>
                <select className="input" value={editForm.planType || 'MONTHLY'} onChange={(e) => setEditForm({ ...editForm, planType: e.target.value })}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div><label className="label">Period End</label><input className="input" type="date" value={editForm.currentPeriodEnd ? new Date(editForm.currentPeriodEnd).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm({ ...editForm, currentPeriodEnd: e.target.value })} /></div>
              <button type="submit" disabled={actionLoading.updateSub} className="btn-primary w-full">{actionLoading.updateSub ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {modal === 'charity' && (
            <form onSubmit={editForm.id ? handleUpdateCharity : handleCreateCharity} className="space-y-3">
              <div><label className="label">Name</label><input className="input" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
              <div><label className="label">Registration Number</label><input className="input" value={editForm.registrationNumber || ''} onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })} required /></div>
              <div><label className="label">Description</label><textarea className="input" rows="3" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div><label className="label">Logo URL</label><input className="input" value={editForm.logoUrl || ''} onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })} /></div>
              {editForm.id && (
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.isActive || false} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.isVerified || false} onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })} />
                    Verified
                  </label>
                </div>
              )}
              <button type="submit" disabled={actionLoading.createCharity || actionLoading.updateCharity} className="btn-primary w-full">
                {actionLoading.createCharity || actionLoading.updateCharity ? 'Saving...' : (editForm.id ? 'Save Changes' : 'Create Charity')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {renderModal()}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-sm text-gray-500">Manage users, scores, draws, charities, and platform settings.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === t.id ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-700 mx-auto" />
        </div>
      ) : (
        <div>
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Users', value: stats.stats.totalUsers, icon: Users },
                  { label: 'Active Subs', value: stats.stats.activeSubs, icon: Shield },
                  { label: 'Total Scores', value: stats.stats.totalScores, icon: Trophy },
                  { label: 'Charities', value: stats.stats.totalCharities, icon: Heart },
                  { label: 'Pending Verifications', value: stats.stats.pendingVerifications, icon: AlertTriangle, alert: stats.stats.pendingVerifications > 0 },
                  { label: 'Total Pool', value: `£${stats.stats.totalPoolAllTime.toFixed(0)}`, icon: BarChart3 },
                ].map((s) => (
                  <div key={s.label} className={`card p-4 ${s.alert ? 'border-amber-300 bg-amber-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className={`w-5 h-5 ${s.alert ? 'text-amber-600' : 'text-gray-400'}`} />
                    </div>
                    <div className={`text-2xl font-bold ${s.alert ? 'text-amber-800' : 'text-gray-900'}`}>{s.value}</div>
                    <div className={`text-xs ${s.alert ? 'text-amber-600' : 'text-gray-500'}`}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Recent Scores</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Points</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentScores.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 px-3">{s.user?.fullName}</td>
                          <td className="py-2 px-3 text-gray-600">{s.courseName}</td>
                          <td className="py-2 px-3 text-right font-bold text-primary-700">{s.stablefordPoints}</td>
                          <td className="py-2 px-3 text-right text-gray-500">{new Date(s.enteredAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Subscription</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Charity</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{u.fullName}</td>
                        <td className="py-3 px-4 text-gray-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          {u.subscription ? (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.subscription.planType} / {u.subscription.status}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.charityPref?.charity?.name || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal('user', u)} className="p-1 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded"><Edit3 className="w-4 h-4" /></button>
                            {u.subscription && (
                              <button onClick={() => openEditModal('subscription', { ...u.subscription, subscriptionId: u.subscription.id })} className="p-1 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded"><DollarSign className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scores' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Course</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Points</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{s.user?.fullName}</td>
                        <td className="py-3 px-4 text-gray-600">{s.courseName}</td>
                        <td className="py-3 px-4 text-right font-bold text-primary-700">{s.stablefordPoints}</td>
                        <td className="py-3 px-4 text-right text-gray-500">{new Date(s.playedDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal('score', s)} className="p-1 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteScore(s.id)} disabled={actionLoading[`del_score_${s.id}`]} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'draws' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Create New Draw</h3>
                  <form onSubmit={handleCreateDraw} className="space-y-3">
                    <div>
                      <label className="label">Draw Date</label>
                      <input type="date" className="input" value={drawForm.drawDate} onChange={(e) => setDrawForm({ ...drawForm, drawDate: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Total Pool (£)</label>
                      <input type="number" className="input" value={drawForm.totalPool} onChange={(e) => setDrawForm({ ...drawForm, totalPool: e.target.value })} required min="0" step="0.01" />
                    </div>
                    <div>
                      <label className="label">Draw Logic</label>
                      <select className="input" value={drawForm.drawLogic} onChange={(e) => setDrawForm({ ...drawForm, drawLogic: e.target.value })}>
                        <option value="RANDOM">Random (Equal chance)</option>
                        <option value="ALGORITHMIC">Algorithmic (Weighted by avg score)</option>
                      </select>
                    </div>
                    <button type="submit" disabled={actionLoading.createDraw} className="btn-primary w-full">
                      {actionLoading.createDraw ? 'Creating...' : 'Create Draw'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Simulate Draw</h3>
                  <form onSubmit={handleSimulate} className="space-y-3">
                    <div>
                      <label className="label">Reference Date</label>
                      <input type="date" className="input" value={simForm.drawDate} onChange={(e) => setSimForm({ ...simForm, drawDate: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Simulations</label>
                      <input type="number" className="input" value={simForm.simulations} onChange={(e) => setSimForm({ ...simForm, simulations: parseInt(e.target.value) })} required min="10" max="10000" />
                    </div>
                    <div>
                      <label className="label">Draw Logic</label>
                      <select className="input" value={simForm.drawLogic} onChange={(e) => setSimForm({ ...simForm, drawLogic: e.target.value })}>
                        <option value="RANDOM">Random</option>
                        <option value="ALGORITHMIC">Algorithmic</option>
                      </select>
                    </div>
                    <button type="submit" disabled={actionLoading.simulate} className="btn-secondary w-full">
                      {actionLoading.simulate ? 'Running...' : 'Run Simulation'}
                    </button>
                  </form>
                  {simResults && simResults.stats && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
                      <p className="font-medium mb-1">Top winners across {simResults.simulations} runs:</p>
                      {simResults.stats.slice(0, 5).map((s) => (
                        <div key={s.userId} className="flex justify-between py-0.5">
                          <span>User {s.userId}</span>
                          <span className="font-medium">{s.winRate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {draws.map((draw) => (
                  <div key={draw.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="font-bold text-lg">Draw: {new Date(draw.drawDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                        <p className="text-sm text-gray-500">
                          Pool: £{draw.totalPool.toFixed(2)} |
                          Logic: <span className="font-medium text-primary-700">{draw.drawLogic}</span> |
                          Status: <span className={`font-medium ${draw.status === 'COMPLETED' ? 'text-green-600' : draw.status === 'PUBLISHED' ? 'text-blue-600' : 'text-amber-600'}`}>{draw.status}</span>
                          {draw.rolledOverJackpot > 0 && <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">+&pound;{draw.rolledOverJackpot.toFixed(0)} rollover</span>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {draw.status === 'PENDING' && (
                          <button onClick={() => handleRunDraw(draw.id)} disabled={actionLoading[`run_${draw.id}`]} className="btn-gold flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            {actionLoading[`run_${draw.id}`] ? 'Running...' : 'Run Draw'}
                          </button>
                        )}
                        {draw.status === 'COMPLETED' && (
                          <button onClick={() => handlePublish(draw.id)} disabled={actionLoading[`pub_${draw.id}`]} className="btn-primary flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {actionLoading[`pub_${draw.id}`] ? 'Publishing...' : 'Publish Results'}
                          </button>
                        )}
                      </div>
                    </div>

                    {draw.results.length > 0 && (
                      <div className="space-y-2">
                        {draw.results.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.tier === 'TIER_1' ? 'bg-gold-100 text-gold-700' : r.tier === 'TIER_2' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                                {r.tier === 'TIER_1' ? '5-Number' : r.tier === 'TIER_2' ? '4-Number' : '3-Number'} Match
                              </span>
                              <span className="font-medium text-sm">{r.user?.fullName || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gold-600">£{r.prizeAmount.toFixed(2)}</span>
                              {r.tier === 'TIER_1' && r.verificationStatus === 'PENDING' && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleVerify(r.id, draw.id, 'APPROVED')} disabled={actionLoading[`verify_${r.id}`]} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                                  <button onClick={() => handleVerify(r.id, draw.id, 'REJECTED')} disabled={actionLoading[`verify_${r.id}`]} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>
                                </div>
                              )}
                              {r.verificationStatus !== 'PENDING' && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {r.verificationStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'charities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Charities</h3>
                <button onClick={() => openEditModal('charity', {})} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Charity
                </button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Reg #</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Donations</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charities.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{c.name}</td>
                          <td className="py-3 px-4 text-gray-600">{c.registrationNumber}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">£{c.totalDonations.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal('charity', c)} className="p-1 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteCharity(c.id)} disabled={actionLoading[`del_charity_${c.id}`]} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'winners' && (
            <div className="card overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-4 px-4 pt-4">All Winners</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Winner</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Draw Date</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Prize</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Verification</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Proof</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payout</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((w) => (
                      <tr key={w.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{w.user?.fullName}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${w.tier === 'TIER_1' ? 'bg-gold-100 text-gold-700' : w.tier === 'TIER_2' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                            {w.tier === 'TIER_1' ? '5-Number' : w.tier === 'TIER_2' ? '4-Number' : '3-Number'} Match
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{new Date(w.draw?.drawDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-gold-600">£{w.prizeAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${w.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : w.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {w.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {w.proofUrl ? (
                            <a href={w.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-700 underline">View Proof</a>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${w.payoutStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {w.payoutStatus === 'COMPLETED' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {w.verificationStatus === 'PENDING' && w.tier === 'TIER_1' && (
                              <>
                                <button onClick={() => handleVerify(w.id, w.drawId, 'APPROVED')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => handleVerify(w.id, w.drawId, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                            {w.payoutStatus !== 'COMPLETED' && w.verificationStatus === 'APPROVED' && (
                              <button onClick={() => handlePayout(w.id)} disabled={actionLoading[`payout_${w.id}`]} className="btn-gold text-xs px-2 py-1">
                                {actionLoading[`payout_${w.id}`] ? '...' : 'Mark Paid'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && reports && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-gray-900">{reports.users.total}</div>
                  <div className="text-xs text-green-600 mt-1">+{reports.users.newThisMonth} this month</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm text-gray-500 mb-1">Active Subscriptions</div>
                  <div className="text-3xl font-bold text-gray-900">{reports.users.activeSubs}</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Prize Pool</div>
                  <div className="text-3xl font-bold text-gold-600">£{reports.financial.totalPool.toFixed(0)}</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm text-gray-500 mb-1">Prizes Paid Out</div>
                  <div className="text-3xl font-bold text-primary-700">£{reports.financial.totalPrizesPaid.toFixed(0)}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Charity Contributions</h3>
                  <div className="space-y-3">
                    {reports.charities.map((c) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <span className="text-sm">{c.name}</span>
                        <span className="font-medium text-sm">£{c.totalDonations.toFixed(2)}</span>
                      </div>
                    ))}
                    {reports.charities.length === 0 && <p className="text-sm text-gray-500">No donations yet.</p>}
                  </div>
                </div>
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Draw Statistics</h3>
                  <div className="space-y-3">
                    {Object.entries(reports.draws).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm">{status}</span>
                        <span className="font-medium text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 font-medium">{l.admin?.fullName}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">{l.action}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{l.entityType} {l.entityId && `#${l.entityId}`}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
