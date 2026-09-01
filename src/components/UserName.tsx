import type { ChatUser } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface UserNameProps {
  user: ChatUser;
  showBadges: boolean;
}

export function UserName({ user, showBadges }: UserNameProps) {
  return (
    <span className={styles.userLine}>
      {showBadges
        ? user.badges.map((badge) =>
            badge.url === null ? null : (
              <img
                className={styles.badge}
                key={`${badge.type}-${badge.version}`}
                src={badge.url}
                alt={badge.description}
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ),
          )
        : null}
      <strong className={styles.userName}>{user.displayName}</strong>
    </span>
  );
}
