import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface Props {
  value: string;
  revealed?: boolean;
  unit?: string;
  className?: string;
}

export function EncryptedValue({ value, revealed = false, unit, className }: Props) {
  const [chars, setChars] = useState<{ char: string; visible: boolean }[]>(() =>
    value.split('').map(() => ({ char: '●', visible: false }))
  );
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    if (!revealed) {
      setChars(value.split('').map(() => ({ char: '●', visible: false })));
      setIsGlowing(false);
      return;
    }

    const targetChars = value.split('');
    const revealOrder = [...targetChars.keys()].reverse();

    revealOrder.forEach((idx, i) => {
      setTimeout(() => {
        setChars(prev =>
          prev.map((c, j) => (j === idx ? { char: targetChars[idx], visible: true } : c))
        );
      }, 200 + i * 50);
    });

    setTimeout(() => {
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 800);
    }, 200 + targetChars.length * 50);
  }, [revealed, value]);

  return (
    <div className={cn("inline-flex items-center font-mono transition-all duration-300", className)}>
      <span 
        className={cn(
          "transition-all duration-500",
          isGlowing ? "text-teal-500 drop-shadow-[0_0_8px_rgba(31,214,200,0.8)]" : "text-text-1"
        )}
      >
        {chars.map((c, i) => (
          <span
            key={i}
            className={cn(
              "inline-block transition-opacity duration-100",
              !c.visible && "text-enc-color"
            )}
          >
            {c.char}
          </span>
        ))}
      </span>
      {unit && <span className="ml-1 text-text-3 text-xs uppercase tracking-wider">{unit}</span>}
    </div>
  );
}
