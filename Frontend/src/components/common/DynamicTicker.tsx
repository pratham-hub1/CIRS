import React, { useState } from 'react';
import { ShieldCheck, Activity, Cpu, Sparkles, Clock, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TickerItem {
  id: string;
  label: string;
  value?: string;
  icon?: React.ReactNode;
}

const DEFAULT_ITEMS: TickerItem[] = [
  {
    id: '1',
    label: 'GSFC RECOVERY NETWORK',
    value: 'OPERATIONAL',
    icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    id: '2',
    label: 'CASE RESOLUTION RATE',
    value: '98.4%',
    icon: <Sparkles className="w-3.5 h-3.5 text-white" />,
  },
  {
    id: '3',
    label: 'AVG DISPATCH TIME',
    value: '< 24 HOURS',
    icon: <Clock className="w-3.5 h-3.5 text-neutral-300" />,
  },
  {
    id: '4',
    label: 'PHYSICAL CUSTODY DESK',
    value: '24/7 ACTIVE',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-white" />,
  },
  {
    id: '5',
    label: 'AI SIMILARITY RADAR',
    value: 'ONLINE',
    icon: <Cpu className="w-3.5 h-3.5 text-neutral-300" />,
  },
  {
    id: '6',
    label: 'CHAIN-OF-CUSTODY AUDIT',
    value: '100% TRACEABLE',
    icon: <Lock className="w-3.5 h-3.5 text-white" />,
  },
];

interface DynamicTickerProps {
  items?: TickerItem[];
  className?: string;
}

export const DynamicTicker: React.FC<DynamicTickerProps> = ({
  items = DEFAULT_ITEMS,
  className,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate items array to create seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'relative overflow-hidden w-full py-2.5 bg-[#090B10]/80 backdrop-blur-md border-y border-white/[0.06] select-none group cursor-default',
        className
      )}
    >
      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-[#090B10] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-[#090B10] to-transparent z-10" />

      {/* Marquee track */}
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{
          animation: 'tickerSlide 32s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center space-x-2 mx-6 text-xs font-mono tracking-wider text-neutral-400"
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="text-neutral-400 uppercase text-[11px] font-medium">{item.label}</span>
            {item.value && (
              <span className="text-white font-semibold text-[11px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                {item.value}
              </span>
            )}
            <span className="text-neutral-600 text-xs ml-4 select-none">•</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tickerSlide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
