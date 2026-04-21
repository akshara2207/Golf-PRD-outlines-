import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Trophy, Medal, Award, Calendar } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/scores/leaderboard').then((res) => {
      setLeaderboard(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const rankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-gold-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400 w-5 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Leaderboard</h1>
        <p className="text-gray-600 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" /> {monthName}
        </p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No scores yet this month</p>
            <p className="text-sm mt-1">Be the first to enter a score and claim the top spot!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Golfer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Handicap</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={`${entry.userId}-${entry.rank}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {rankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{entry.fullName}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{entry.courseName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{entry.handicap}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full text-sm">
                        {entry.stablefordPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
