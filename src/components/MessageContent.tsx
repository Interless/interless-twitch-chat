import { TwitchEmote } from './TwitchEmote';
import { MessageDecorations } from './MessageDecorations';
import type { DecorationConfig, MessageFragment } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface MessageContentProps {
  fragments: MessageFragment[];
  messageId: string;
  decorations: DecorationConfig;
}

export function MessageContent({ fragments, messageId, decorations }: MessageContentProps) {
  return (
    <span className={styles.content} dir="auto">
      <MessageDecorations messageId={messageId} config={decorations} />
      <span className={styles.contentText}>
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
    </span>
  );
}
