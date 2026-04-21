import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Trophy, Calendar, Users, Crown, Award, Medal, AlertCircle } from 'lucide-react';

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/draws').then((res) => {
      setDraws(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tierBadge = (tier) => {
    if (tier === 'TIER_1') return <span className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 bg-gold-50 px-2 py-1 rounded-full"><Crown className="w-3 h-3" /> 5-Number Match</span>;
    if (tier === 'TIER_2') return <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-full"><Award className="w-3 h-3" /> 4-Number Match</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-full"><Medal className="w-3 h-3" /> 3-Number Match</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Prize Draws</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Fair, transparent draws every month. A portion of every subscription feeds the prize pool.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="card text-center bg-gradient-to-br from-gold-50 to-white">
          <Crown className="w-8 h-8 text-gold-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">40%</div>
          <div className="text-sm text-gray-600">5-Number Match</div>
          <div className="text-xs text-gray-500 mt-1">Jackpot rollover eligible</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-primary-50 to-white">
          <Award className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">35%</div>
          <div className="text-sm text-gray-600">4-Number Match</div>
          <div className="text-xs text-gray-500 mt-1">Automatic payout</div>
        </div>
        <div className="card text-center bg-gradient-to-br from-gray-50 to-white">
          <Medal className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">25%</div>
          <div className="text-sm text-gray-600">3-Number Match</div>
          <div className="text-xs text-gray-500 mt-1">Automatic payout</div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
        </div>
      ) : draws.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No draws scheduled yet</p>
          <p className="text-sm text-gray-500 mt-1">Check back soon for the next monthly draw.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {draws.map((draw) => (
            <div key={draw.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-5 h-5 text-gold-500" />
                    <h3 className="font-bold text-lg">Draw for {new Date(draw.drawDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(draw.drawDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {draw.results.length} winners</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Pool</div>
                  <div className="text-2xl font-bold text-primary-700">&pound;{draw.totalPool.toFixed(2)}</div>
                  {draw.rolledOverJackpot > 0 && <div className="text-xs text-green-600">+&pound;{draw.rolledOverJackpot.toFixed(0)} rollover</div>}
                </div>
              </div>

              {draw.status === 'COMPLETED' ? (
                <div className="space-y-2">
                  {draw.results.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {tierBadge(r.tier)}
                        <span className="font-medium text-sm">{r.user?.fullName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gold-600">&pound;{r.prizeAmount.toFixed(2)}</span>
                        {r.verificationStatus === 'PENDING' && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending Verification</span>
                        )}
                        {r.verificationStatus === 'APPROVED' && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Approved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">This draw has not been run yet.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
