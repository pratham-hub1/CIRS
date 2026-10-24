import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Home } from 'lucide-react';
import { Button } from '../components/common/Button';
import { FadeIn } from '../components/common/AnimatedTransitions';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col justify-center items-center px-4 py-16 text-center text-white selection:bg-white selection:text-black relative">
      <FadeIn className="max-w-md mx-auto relative z-10 space-y-6">
        <div className="w-14 h-14 bg-[#12151D] text-neutral-300 rounded-2xl flex items-center justify-center mx-auto border border-white/[0.08]">
          <Compass className="w-7 h-7 text-neutral-400" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase bg-white/[0.04] px-2.5 py-1 rounded-md inline-block border border-white/[0.06]">
            Error 404 • Not Found
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
            Page Not Found
          </h1>

          <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
            The page or record you requested does not exist or has been relocated within the registry.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/feed" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Community Feed
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-xs text-neutral-500 font-mono">
          GSFC University • Campus Item Recovery System (CIRS)
        </div>
      </FadeIn>
    </div>
  );
};
