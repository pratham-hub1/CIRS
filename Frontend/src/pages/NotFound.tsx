import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Home } from 'lucide-react';
import { Button } from '../components/common/Button';
import { FadeIn } from '../components/common/AnimatedTransitions';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 text-center selection:bg-brand-500 selection:text-white">
      <FadeIn className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-subtle border border-brand-100">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs font-mono font-extrabold tracking-widest text-brand-700 uppercase bg-brand-50 px-3 py-1 rounded-full mb-3 inline-block border border-brand-200/60">
          Error 404 • Lost on Campus
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          This page seems to be lost.
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
          We checked every campus building, lost &amp; found locker, and security log, but couldn't locate this URL.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/feed" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Explore Campus Feed
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-[11px] text-slate-400 font-medium">
          GSFC University • Campus Item Recovery System (CIRS)
        </div>
      </FadeIn>
    </div>
  );
};
