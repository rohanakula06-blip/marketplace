'use client';

import { cn } from '@/lib/utils';

interface SceneBackgroundProps {
  sceneOpacity?: number;
  fadeBottom?: boolean;
  /** Minimal left gradient — keeps the map fully visible */
  clear?: boolean;
  className?: string;
}

export function SceneBackground({
  sceneOpacity = 1,
  fadeBottom = false,
  clear = true,
  className,
}: SceneBackgroundProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0 hero-bg-scene"
        style={{
          backgroundImage: "url('/hero-background.png')",
          opacity: sceneOpacity,
        }}
      />
      <div
        className={cn(
          'absolute inset-0',
          clear ? 'hero-overlay-clear' : 'hero-overlay-night'
        )}
      />
      {!clear && <div className="absolute inset-0 hero-pin-glow" />}
      {!clear && <div className="absolute inset-0 hero-scene-vignette" />}
      {fadeBottom && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060912]/50" />
      )}
    </div>
  );
}
