import type { CSSProperties } from 'react';

import { idleMotionFor } from '../domain/idleMotion';
import { MessageBubble } from './MessageBubble';
import type { ActiveMessage, ChatAlignment, WidgetConfig } from '../domain/types';
import styles from './MessageLayer.module.css';

type LayerStyle = CSSProperties & Record<`--${string}`, string>;

const ALIGN_ITEMS: Record<ChatAlignment, CSSProperties['alignItems']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

function pixels(value: number): string {
  return `${String(value)}px`;
}

export interface MessageLayerProps {
  messages: ActiveMessage[];
  config: WidgetConfig;
}

export function MessageLayer({ messages, config }: MessageLayerProps) {
  const motion = idleMotionFor('layout', config.animation);
  const style: LayerStyle = {
    '--chat-scale': String(config.layout.scale),
    '--motion-clearance': pixels(motion.mode === 'off' ? 0 : motion.distance * 2),
    alignItems: ALIGN_ITEMS[config.layout.alignment],
    '--horizontal-offset': pixels(config.layout.horizontalOffset),
    '--bottom-offset': pixels(config.layout.bottomOffset),
    '--message-gap': pixels(config.layout.messageGap),
  };

  return (
    <div
      className={styles.layer}
      style={style}
      data-alignment={config.layout.alignment}
      data-chat-scale={config.layout.scale}
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {messages.map((active) => (
        <MessageBubble
          key={active.message.id}
          active={active}
          config={config}
          characterSide={
            config.layout.characterSide === 'alternating'
              ? active.side === 'left'
                ? 'right'
                : 'left'
              : config.layout.characterSide
          }
        />
      ))}
    </div>
  );
}
