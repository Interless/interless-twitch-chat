import { MessageBubble } from './MessageBubble';
import type { ActiveMessage, Dimensions, WidgetConfig } from '../domain/types';
import styles from './MessageLayer.module.css';

export interface MessageLayerProps {
  messages: ActiveMessage[];
  config: WidgetConfig;
  onMeasure: (messageId: string, dimensions: Dimensions) => void;
}

export function MessageLayer({ messages, config, onMeasure }: MessageLayerProps) {
  return (
    <div className={styles.layer} aria-live="polite" aria-relevant="additions removals">
      {messages.map((active) => (
        <MessageBubble
          key={active.message.id}
          active={active}
          config={config}
          onMeasure={onMeasure}
        />
      ))}
    </div>
  );
}
