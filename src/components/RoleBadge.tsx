import type { ChatRole } from '../domain/types';
import styles from './MessageBubble.module.css';

const BADGES: Record<ChatRole, { icon: string; label: string; path: string }> = {
  broadcaster: {
    icon: 'crown',
    label: 'Стример',
    path: 'M7 11h3v3h3V8h6v6h3v-3h3v12H7zm3 14h12v2H10z',
  },
  lead_moderator: {
    icon: 'hammer',
    label: 'Главный модератор',
    path: 'M7 7h13v3h3v8h-3v-3h-5v11h-5V15H7zm3 3v2h7v-2z',
  },
  moderator: {
    icon: 'sword',
    label: 'Модератор',
    path: 'M21 6h5v5L16 21l3 3-3 3-4-4-4 4-3-3 4-4-4-4 3-3 3 3zm0 4-9 9 2 2 9-9v-2z',
  },
  vip: {
    icon: 'diamond',
    label: 'VIP',
    path: 'M10 7h12l5 7-11 13L5 14zm2 3-3 4h6v-4zm5 0v4h6l-3-4zm-7 6 5 6v-6zm7 0v6l5-6z',
  },
  subscriber: {
    icon: 'cockroach',
    label: 'Подписчик',
    path: 'M10 4h2v3h3V5h2v2h3V4h2v5h-3v2h3v3h4v2h-4v3h4v2h-4v3h3v3h-3v-2h-3v3h-6v-3h-3v2H7v-3h3v-3H6v-2h4v-3H6v-2h4v-3h3V9h-3zm5 10v10h2V14z',
  },
  viewer: {
    icon: 'cockroach',
    label: 'Зритель',
    path: 'M10 4h2v3h3V5h2v2h3V4h2v5h-3v2h3v3h4v2h-4v3h4v2h-4v3h3v3h-3v-2h-3v3h-6v-3h-3v2H7v-3h3v-3H6v-2h4v-3H6v-2h4v-3h3V9h-3zm5 10v10h2V14z',
  },
};

export function RoleBadge({ role }: { role: ChatRole }) {
  const badge = BADGES[role];
  return (
    <svg
      className={styles.roleBadge}
      viewBox="0 0 32 32"
      role="img"
      aria-label={badge.label}
      data-badge={badge.icon}
      shapeRendering="crispEdges"
    >
      <path
        d="M6 2h20v2h3v3h2v18h-2v3h-3v2H6v-2H3v-3H1V7h2V4h3z"
        fill="var(--badge-background, #59218a)"
        stroke="var(--badge-border, #ead8fb)"
        strokeWidth="2"
      />
      <path d={badge.path} fill="var(--badge-color, #f4e7ff)" fillRule="evenodd" />
    </svg>
  );
}
