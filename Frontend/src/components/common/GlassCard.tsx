import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  enableSheen?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  enableTilt = true,
  enableSheen = true,
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; px: number; py: number }>({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enableTilt) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 2; // -1 to +1
    const py = (y / rect.height - 0.5) * 2; // -1 to +1

    setCoords({ x, y, px, py });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0, px: 0, py: 0 });
  };

  // 3D rotation angles capped gently for refined aerospace feel (not cartoonish)
  const rotateX = enableTilt && isHovered ? -coords.py * 4.5 : 0;
  const rotateY = enableTilt && isHovered ? coords.px * 4.5 : 0;
  const translateY = isHovered ? -4 : 0;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        rotateX,
        rotateY,
        y: translateY,
        transformPerspective: 1000,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.5,
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-[#12151D]/90 backdrop-blur-xl border border-white/[0.08] transition-colors duration-300',
        'hover:border-white/[0.18] hover:shadow-[0_16px_36px_rgba(0,0,0,0.55)]',
        onClick && 'cursor-pointer',
        className
      )}
      {...(props as any)}
    >
      {/* Dynamic Specular Spotlight Sheen */}
      {enableSheen && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.08), transparent 70%)`,
          }}
        />
      )}

      {/* Subtle hairline specular edge highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content Layer (elevated in 3D space) */}
      <div
        className="relative z-10 w-full h-full"
        style={{
          transform: isHovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transition: 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
