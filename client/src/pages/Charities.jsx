import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Heart, ShieldCheck, ArrowRight, CheckCircle, X, Gift } from 'lucide-react';

export default function Charities() {
  const { user } = useAuth();
  const [charities, setCharities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [myPref, setMyPref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [contribution, setContribution] = useState(10);
  const [donationModal, setDonationModal] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cRes, mRes] = await Promise.all([
        api.get('/charities'),
        user ? api.get('/charities/my-charity').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setCharities(cRes.data);
      setFiltered(cRes.data);
      setMyPref(mRes.data);
      setSelected(mRes.data?.charityId || null);
      setContribution(mRes.data?.contributionPercentage || 10);
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(charities.filter((c) =>
      c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term))
    ));
  }, [search, charities]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.post('/charities/select', { charityId: selected, contributionPercentage: contribution });
      setMyPref(res.data);
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Charity Partners</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Every subscription supports incredible causes. Choose the charity that resonates with you.
        </p>
      </div>

      {myPref && (
        <div className="mb-8 p-4 bg-primary-50 border border-primary-100 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-primary-800">You are supporting {myPref.charity.name}</p>
            <p className="text-xs text-primary-600">{myPref.contributionPercentage}% of your subscription goes to this cause.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search charities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full max-w-md"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => user && setSelected(c.id)}
            className={`card cursor-pointer transition-all ${selected === c.id ? 'ring-2 ring-primary-500 bg-primary-50/50' : 'hover:shadow-md'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              {c.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg mb-2">{c.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{c.description}</p>
            {selected === c.id && (
              <div className="text-sm font-medium text-primary-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {user && selected && (
        <div className="mt-8 max-w-md mx-auto space-y-4">
          <label className="label text-center block">Charity Contribution: {contribution}%</label>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={contribution}
            onChange={(e) => setContribution(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center">
            <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2">
              {saving ? 'Saving...' : <><ArrowRight className="w-4 h-4" /> Save Preference</>}
            </button>
            {saved && <p className="text-sm text-green-600 mt-2">Charity preference updated!</p>}
          </div>
          <div className="pt-4 border-t border-gray-100 text-center">
            <button onClick={() => setDonationModal(selected)} className="text-sm text-primary-700 font-medium inline-flex items-center gap-1 hover:underline">
              <Gift className="w-4 h-4" /> Make an independent donation
            </button>
          </div>
        </div>
      )}

      {donationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Independent Donation</h3>
              <button onClick={() => setDonationModal(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Make a one-time donation to {charities.find((c) => c.id === donationModal)?.name}.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Amount (£)</label>
                <input type="number" min="1" className="input" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} placeholder="e.g. 25" />
              </div>
              <button
                onClick={async () => {
                  if (!donationAmount) return;
                  setSaving(true);
                  try {
                    await api.post('/charities/donate', { charityId: donationModal, amount: parseFloat(donationAmount) });
                    setDonationModal(null);
                    setDonationAmount('');
                    alert('Thank you for your donation!');
                  } catch (err) {
                    alert(err.response?.data?.message || 'Donation failed');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !donationAmount}
                className="btn-primary w-full"
              >
                {saving ? 'Processing...' : 'Donate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <a href="/register" className="text-primary-700 font-medium hover:underline">Create an account</a> to select your charity and start donating.
        </div>
      )}
    </div>
  );
}
