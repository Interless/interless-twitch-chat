import styles from './MessageBubble.module.css';

export interface TwitchEmoteProps {
  name: string;
  url: string;
}

export function TwitchEmote({ name, url }: TwitchEmoteProps) {
  return (
    <img
      className={styles.emote}
      src={url}
      alt={name}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
}
