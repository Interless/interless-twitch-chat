import type { CSSProperties } from 'react';

import { DARK_PALETTE, LIGHT_PALETTE } from '../config/palettes';
import { colorWithOpacity } from '../domain/colors';
import { resolveRoleAssets } from '../domain/assetResolver';
import { idleMotionFor } from '../domain/idleMotion';
import { paletteAssets } from '../domain/paletteAssets';
import { MessageContent } from './MessageContent';
import { RoleCharacter } from './RoleCharacter';
import { UserName } from './UserName';
import type { ActiveMessage, WidgetConfig } from '../domain/types';
import styles from './MessageBubble.module.css';

type BubbleStyle = CSSProperties & Record<`--${string}`, string | number>;

function opaqueColor(color: string): boolean {
  return color.length === 7 || color.slice(7).toLowerCase() === 'ff';
}

function pixels(value: number): string {
  return `${String(value)}px`;
}

export interface MessageBubbleProps {
  active: ActiveMessage;
  config: WidgetConfig;
  characterSide?: 'left' | 'right';
}

export function MessageBubble({ active, config, characterSide = 'right' }: MessageBubbleProps) {
  const { message } = active;
  const motion = idleMotionFor(message.id, config.animation);
  const requestedTheme = config.roleThemes[message.user.role];
  const roleTheme = requestedTheme.enabled ? requestedTheme : config.roleThemes.viewer;
  const palette =
    config.appearance.colorScheme === 'light'
      ? LIGHT_PALETTE
      : config.appearance.colorScheme === 'dark'
        ? DARK_PALETTE
        : {};
  const colors = config.appearance.customColors ?? {};
  const theme = { ...roleTheme, ...palette, ...colors };

  const dinosaur = active.characterId === null ? undefined : config.dinosaurs[active.characterId];
  const assets =
    dinosaur === undefined
      ? theme.assets
      : { ...theme.assets, characterUrl: dinosaur.characterUrl };
  const resolved = resolveRoleAssets(message.user.role, assets, active.characterId);

  const style: BubbleStyle = {
    ...paletteAssets(colors),
    ...(colors.badgeColor ? { '--badge-color': colors.badgeColor } : {}),
    ...(colors.badgeBackground ? { '--badge-background': colors.badgeBackground } : {}),
    ...(colors.badgeBorder ? { '--badge-border': colors.badgeBorder } : {}),
    ...(colors.dividerColor ? { '--divider-color': colors.dividerColor } : {}),
    '--decoration-color': colors.decorationColor ?? colors.accentShadeColor ?? '#b68cdb',
    '--bubble-fill': colorWithOpacity(theme.bubbleColor, config.appearance.bubbleOpacity),
    '--header-fill': colorWithOpacity(theme.headerColor, config.appearance.headerOpacity),
    '--text-color': theme.textColor,
    '--name-color': theme.nameColor,
    '--border-color': theme.borderColor,
    // A box shadow would otherwise paint an opaque rectangle behind transparent fills.
    '--bubble-shadow':
      config.appearance.bubbleOpacity === 1 &&
      config.appearance.headerOpacity === 1 &&
      opaqueColor(theme.bubbleColor) &&
      opaqueColor(theme.headerColor)
        ? colors.shadowColor
          ? `0 2px 0 ${colors.shadowColor}`
          : theme.shadow
        : 'none',
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
    '--idle-distance': pixels(motion.distance),
    '--idle-small': pixels(motion.small),
    '--idle-half': pixels(motion.half),
    '--idle-lateral': pixels(motion.lateral),
    '--idle-duration': `${String(motion.durationMs)}ms`,
    '--idle-delay': `${String(motion.delayMs)}ms`,
    '--idle-direction': motion.direction,
    '--character-size': pixels(config.layout.characterSize),
  };

  return (
    <article
      className={styles.message}
      style={style}
      data-color-scheme={config.appearance.colorScheme}
      data-lifecycle={active.lifecycle}
      data-enter={config.animation.enter}
      data-idle={motion.mode}
      data-exit={config.animation.exit}
      data-effects={theme.effectEnabled ? 'enabled' : 'disabled'}
      data-message-id={message.id}
      data-user-id={message.user.id}
      data-character-side={characterSide}
      data-message-side={active.side}
      data-character-id={active.characterId ?? undefined}
      data-has-character={resolved.characterUrl !== null || resolved.decorationUrl !== null}
    >
      <div className={styles.motion}>
        <div className={styles.idle}>
          <RoleCharacter
            role={message.user.role}
            assets={assets}
            characterId={active.characterId}
          />
          <div className={styles.bubble}>
            <span className={styles.frame} aria-hidden="true" />
            {config.general.showUserName ? (
              <UserName user={message.user} showBadges={config.general.showBadges} />
            ) : null}
            <MessageContent
              fragments={message.fragments}
              messageId={message.id}
              decorations={config.decorations}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
