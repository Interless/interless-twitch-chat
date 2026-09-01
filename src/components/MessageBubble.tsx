import { useLayoutEffect, useRef, type CSSProperties } from 'react';

import { MessageContent } from './MessageContent';
import { RoleCharacter } from './RoleCharacter';
import { UserName } from './UserName';
import type { ActiveMessage, Dimensions, WidgetConfig } from '../domain/types';
import styles from './MessageBubble.module.css';

type BubbleStyle = CSSProperties & Record<`--${string}`, string | number>;

function pixels(value: number): string {
  return `${String(value)}px`;
}

export interface MessageBubbleProps {
  active: ActiveMessage;
  config: WidgetConfig;
  onMeasure: (messageId: string, dimensions: Dimensions) => void;
}

export function MessageBubble({ active, config, onMeasure }: MessageBubbleProps) {
  const elementRef = useRef<HTMLElement>(null);
  const { message, placement } = active;
  const requestedTheme = config.roleThemes[message.user.role];
  const theme = requestedTheme.enabled ? requestedTheme : config.roleThemes.viewer;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element === null || placement !== null) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      onMeasure(message.id, { width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
    }
  }, [message.id, onMeasure, placement]);

  const style: BubbleStyle = {
    left: placement?.x ?? 0,
    top: placement?.y ?? 0,
    visibility: placement === null ? 'hidden' : 'visible',
    transform: `rotate(${String(placement?.rotation ?? 0)}deg)`,
    '--bubble-color': theme.bubbleColor,
    '--text-color': theme.textColor,
    '--name-color': theme.nameColor,
    '--border-color': theme.borderColor,
    '--bubble-shadow': theme.shadow,
    '--min-width': pixels(config.general.minWidth),
    '--max-width': pixels(config.general.maxWidth),
    '--font-family': config.general.fontFamily,
    '--font-size': pixels(config.general.fontSize),
    '--line-height': config.general.lineHeight,
    '--padding': pixels(config.general.padding),
    '--border-radius': pixels(config.general.borderRadius),
    '--border-width': pixels(config.general.borderWidth),
    '--enter-duration': `${String(config.animation.enterDurationMs)}ms`,
    '--exit-duration': `${String(config.animation.exitDurationMs)}ms`,
    '--idle-distance': pixels(config.animation.idleIntensity * 3),
  };

  return (
    <article
      ref={elementRef}
      className={styles.message}
      style={style}
      data-lifecycle={active.lifecycle}
      data-enter={config.animation.enter}
      data-exit={config.animation.exit}
      data-effects={theme.effectEnabled ? 'enabled' : 'disabled'}
      data-message-id={message.id}
      data-user-id={message.user.id}
    >
      <div className={styles.motion}>
        <div className={styles.idle}>
          <RoleCharacter role={message.user.role} assets={theme.assets} />
          <div className={styles.bubble}>
            <span className={styles.tail} aria-hidden="true" />
            {config.general.showUserName ? (
              <UserName user={message.user} showBadges={config.general.showBadges} />
            ) : null}
            <MessageContent fragments={message.fragments} />
          </div>
        </div>
      </div>
    </article>
  );
}
