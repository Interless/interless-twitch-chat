import { TwitchEmote } from './TwitchEmote';
import type { MessageFragment } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface MessageContentProps {
  fragments: MessageFragment[];
}

export function MessageContent({ fragments }: MessageContentProps) {
  return (
    <span className={styles.content} dir="auto">
      {fragments.map((fragment, index) =>
        fragment.type === 'text' ? (
          <span key={`text-${String(index)}`}>{fragment.text}</span>
        ) : (
          <TwitchEmote
            key={`emote-${fragment.id}-${String(index)}`}
            name={fragment.name}
            url={fragment.url}
          />
        ),
      )}
    </span>
  );
}
