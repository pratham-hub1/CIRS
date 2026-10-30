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
      const delta = Math.max(-28, Math.min(28, e.deltaY * 0.15));
      targetScrollVelocity += delta;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY || 0;
      const diff = currentScrollY - lastScrollY;
      targetScrollVelocity += diff * 0.3;
      lastScrollY = currentScrollY;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const particles: Particle[] = [];
    const count = particleCount;

    for (let i = 0; i < count; i++) {
      const depth = Math.random() * 1.2 + 0.6; // 0.6 to 1.8 depth layer
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: (Math.random() * 1.4 + 0.8) * depth,
        alpha: Math.min(0.85, Math.random() * 0.45 + 0.35),
        depth,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth scroll velocity interpolation & decay
      scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.12;
      targetScrollVelocity *= 0.88;

      const isFast = Math.abs(scrollVelocity) > 0.4;

      // Draw connections when not warping rapidly
      if (Math.abs(scrollVelocity) < 6) {
        const connDamping = Math.max(0.2, 1 - Math.abs(scrollVelocity) / 6);
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 130) {
              const lineAlpha = (1 - dist / 130) * 0.12 * connDamping;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.7;
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

        // Dynamic vertical parallax displacement from scroll
        p.y -= scrollVelocity * p.depth * 1.6;

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
          if (mdist < 140 && mdist > 0) {
            const force = (1 - mdist / 140) * 0.8;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
          }
        }

        // Draw particle node or elongated speed streak
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        if (isFast) {
          const streak = -scrollVelocity * p.depth * 3.2;
          ctx.beginPath();
          ctx.lineWidth = p.radius * 2;
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + streak);
          ctx.stroke();
        } else {
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
