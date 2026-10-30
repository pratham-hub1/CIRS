import React, { useState, useEffect } from 'react';

export interface TypewriterTextProps {
  /** The full text string to type out */
  text: string;
  /** Milliseconds delay before typing commences */
  delay?: number;
  /** Milliseconds per character keystroke (lower = faster) */
  speed?: number;
  /** Whether to render a sleek blinking typing cursor */
  cursor?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Optional callback fired when typing completes */
  onComplete?: () => void;
}

/**
 * TypewriterText
 * Renders text letter-by-letter with an authentic, responsive keystroke cadence
 * and an organic terminal cursor, triggered whenever the component mounts/renders.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 0,
  speed = 28,
  cursor = true,
  className = '',
  onComplete,
}) => {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Reset on mount or whenever text changes
    setDisplayedCount(0);
    setIsTyping(false);
    setIsFinished(false);

    let intervalId: any = null;

    const timeoutId = setTimeout(() => {
      setIsTyping(true);

      intervalId = setInterval(() => {
        setDisplayedCount((prev) => {
          if (prev < text.length) {
            const next = prev + 1;
            if (next === text.length) {
              clearInterval(intervalId);
              setIsTyping(false);
              setIsFinished(true);
              onComplete?.();
            }
            return next;
          } else {
            clearInterval(intervalId);
            setIsTyping(false);
            setIsFinished(true);
            return prev;
          }
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, speed]);

  const visibleText = text.slice(0, displayedCount);

  return (
    <span className={`inline ${className}`}>
      {visibleText}
      {cursor && !isFinished && (
        <span
          className="inline-block w-[2px] h-[0.9em] bg-white ml-0.5 align-baseline animate-[pulse_0.75s_infinite]"
          aria-hidden="true"
        />
      )}
    </span>
  );
};
