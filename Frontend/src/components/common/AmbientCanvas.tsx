import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  depth: number;
}

interface AmbientCanvasProps {
  particleCount?: number;
  interactive?: boolean;
  className?: string;
}

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({
  particleCount = 75,
  interactive = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse Interaction
    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Scroll & Wheel Dynamic Hyperspace Physics
    let scrollVelocity = 0;
    let targetScrollVelocity = 0;
    let lastScrollY = window.scrollY || 0;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.max(-16, Math.min(16, e.deltaY * 0.08));
      targetScrollVelocity += delta;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY || 0;
      const diff = currentScrollY - lastScrollY;
      targetScrollVelocity += Math.max(-16, Math.min(16, diff * 0.15));
      lastScrollY = currentScrollY;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const particles: Particle[] = [];
    const count = particleCount;

    for (let i = 0; i < count; i++) {
      const depth = Math.random() * 0.9 + 0.5; // 0.5 to 1.4 depth layer
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: (Math.random() * 1.15 + 0.78) * depth,
        alpha: Math.random() * 0.38 + 0.20, // +30% presence: 0.20 - 0.58
        depth,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth scroll velocity interpolation & decay
      scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.11;
      targetScrollVelocity *= 0.86;

      // Only fast scrolling triggers subtle micro-streak; normal scrolling remains calm circular nodes
      const isFast = Math.abs(scrollVelocity) > 2.6;

      // Draw subtle mesh connections when calm
      if (Math.abs(scrollVelocity) < 4.5) {
        const connDamping = Math.max(0.12, 1 - Math.abs(scrollVelocity) / 4.5);
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 115) {
              const lineAlpha = (1 - dist / 115) * 0.09 * connDamping;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.65;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Gentle vertical parallax displacement from scroll (+30% responsive)
        p.y -= scrollVelocity * p.depth * 0.85;

        // Seamless screen wrap-around
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height + (p.y % height);
        else if (p.y > height) p.y = p.y % height;

        // Subtle mouse repulsion
        if (interactive) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 120 && mdist > 0) {
            const force = (1 - mdist / 120) * 0.6;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
          }
        }

        // Render calm node or subtle capped micro-streak (+30% visibility without rain congestion)
        if (isFast) {
          const rawStreak = -scrollVelocity * p.depth * 0.78;
          const streak = Math.max(-18, Math.min(18, rawStreak));
          ctx.beginPath();
          ctx.lineWidth = Math.min(1.5, p.radius * 1.1);
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.45})`;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + streak);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, interactive]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* Soft atmospheric gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_65%)] pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
    </div>
  );
};
