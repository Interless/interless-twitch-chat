import { useEffect, useRef, useState, type CSSProperties } from 'react';
import decorationIcons from '../config/decorationIcons.json';
import { DECORATION_SIZE, decorationPeriod, decorationsFor } from '../domain/decorations';
import type { DecorationConfig } from '../domain/types';
import styles from './MessageBubble.module.css';

export function MessageDecorations({
  messageId,
  config,
}: {
  messageId: string;
  config: DecorationConfig;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [generation, setGeneration] = useState(0);
  const period =
    config.enabled && config.density > 0 && config.chance > 0 && config.icons.length > 0
      ? decorationPeriod(config.frequency)
      : null;

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = Math.floor(node.clientWidth);
      const height = Math.floor(node.clientHeight);
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener('resize', measure);
    // Also support older embedded browsers without ResizeObserver.
    queueMicrotask(measure);
    const fonts = (document as Partial<Document>).fonts;
    void fonts?.ready.then(measure);
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (period === null) return;
    const timer = window.setInterval(() => setGeneration((previous) => previous + 1), period);
    return () => window.clearInterval(timer);
  }, [period]);

  const placements = decorationsFor(messageId, size.width, size.height, config, generation);
  return (
    <span
      ref={ref}
      className={styles.decorations}
      aria-hidden="true"
      data-decorations="true"
      data-decoration-generation={generation}
      style={{ opacity: config.opacity }}
    >
      <span
        key={generation}
        className={styles.decorationLayer}
        data-decoration-refresh={period === null ? 'paused' : 'running'}
        style={{ '--decoration-hold': `${String((period ?? 900) - 900)}ms` } as CSSProperties}
      >
        {placements.map((placement) => (
          <svg
            key={`${String(generation)}-${String(placement.id)}`}
            className={styles.backgroundIcon}
            data-decoration={placement.kind}
            viewBox="0 0 24 24"
            width={DECORATION_SIZE}
            height={DECORATION_SIZE}
            shapeRendering="crispEdges"
            style={{
              left: placement.x,
              top: placement.y,
              transform: `rotate(${String(placement.rotation)}deg)`,
            }}
          >
            <path d={decorationIcons[placement.kind].path} fill="currentColor" fillRule="evenodd" />
          </svg>
        ))}
      </span>
    </span>
  );
}
