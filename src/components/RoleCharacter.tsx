import { resolveRoleAssets } from '../domain/assetResolver';
import type { ChatRole, RoleAssets } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface RoleCharacterProps {
  role: ChatRole;
  assets: RoleAssets;
}

export function RoleCharacter({ role, assets }: RoleCharacterProps) {
  const resolved = resolveRoleAssets(role, assets);
  return (
    <span className={styles.character} aria-hidden="true">
      {resolved.characterUrl === null ? (
        <span className={styles.placeholderCharacter}>{resolved.placeholder}</span>
      ) : (
        <img
          className={styles.characterImage}
          src={resolved.characterUrl}
          alt=""
          draggable={false}
        />
      )}
      {resolved.decorationUrl === null ? (
        <span className={styles.placeholderDecoration}>🦴</span>
      ) : (
        <img
          className={styles.decorationImage}
          src={resolved.decorationUrl}
          alt=""
          draggable={false}
        />
      )}
    </span>
  );
}
