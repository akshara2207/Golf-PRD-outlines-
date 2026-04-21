import { Trophy, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-primary-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold-400" />
            <span className="font-bold text-white">Digital Heroes Golf</span>
          </div>
          <p className="text-sm text-primary-200 text-center">
            Built with <Heart className="w-3 h-3 inline text-red-400" /> for golfers who care.
          </p>
          <p className="text-xs text-primary-300">
            &copy; {new Date().getFullYear()} Digital Heroes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
