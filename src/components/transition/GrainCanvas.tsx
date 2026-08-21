"use client";

import { useEffect, useRef } from "react";

/**
 * Static film grain, painted once per size into a canvas.
 *
 * The canvas is always rendered inside `.grain-frame`, which sets
 * `overflow:hidden` and `contain:paint`. That is not decoration: a canvas
 * whose backing store is larger than its CSS box, or which is transformed by a
 * parent, paints outside its own bounds and ends up as a full-page grey sheet
 * covering the site once the loader is supposed to be gone. Clipping the frame
 * makes the leak impossible regardless of what scales around it.
 */
export function GrainCanvas({ opacity = 0.055 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const frame = canvas.parentElement;
    if (!frame) return;

    let raf = 0;

    const paint = () => {
      const { width, height } = frame.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      // Grain does not need device-pixel fidelity, and a full-DPR buffer on a
      // large desktop screen is a multi-megabyte allocation for noise.
      const scale = 0.5;
      const w = Math.max(1, Math.floor(width * scale));
      const h = Math.max(1, Math.floor(height * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      const image = ctx.createImageData(w, h);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ opacity }} />;
}
