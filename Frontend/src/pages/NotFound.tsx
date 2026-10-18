import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-16 text-center">
      <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>

      <span className="text-xs font-mono font-bold tracking-widest text-primary-700 uppercase bg-primary-50 px-2.5 py-1 rounded-full mb-3 inline-block">
        Error 404 • Lost in Campus
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight max-w-md">
        This page seems to be lost.
      </h1>

      <p className="mt-3 text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
        We searched all campus buildings and recovery lockers, but couldn't find the page you're looking for.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Link
          to="/feed"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
        >
          <Search className="w-4 h-4" />
          Browse Public Feed
        </Link>
      </div>

      <div className="mt-12 text-xs text-gray-400">
        GSFC University • Campus Item Recovery System (CIRS)
      </div>
    </div>
  );
};
