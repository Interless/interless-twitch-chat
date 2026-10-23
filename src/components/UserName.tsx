import { RoleBadge } from './RoleBadge';
import type { ChatUser } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface UserNameProps {
  user: ChatUser;
  showBadges: boolean;
}

export function UserName({ user, showBadges }: UserNameProps) {
  return (
    <span className={styles.userLine}>
      {showBadges ? <RoleBadge role={user.role} /> : null}
      {showBadges
        ? user.badges.map((badge) =>
            badge.url === null ||
            ['broadcaster', 'lead_moderator', 'moderator', 'vip'].includes(
              badge.type.toLowerCase(),
            ) ? null : (
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
