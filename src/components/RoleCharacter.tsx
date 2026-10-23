import { characterFrame, CHARACTER_CATALOG } from '../domain/characterRegistry';
import { isVideoUrl } from '../domain/media';
import { resolveRoleAssets } from '../domain/assetResolver';
import type { ChatRole, RoleAssets } from '../domain/types';
import styles from './MessageBubble.module.css';

export interface RoleCharacterProps {
  role: ChatRole;
  assets: RoleAssets;
  characterId?: string | null;
}

export function RoleCharacter({ role, assets, characterId }: RoleCharacterProps) {
  const resolved = resolveRoleAssets(role, assets, characterId);
  if (resolved.characterUrl === null && resolved.decorationUrl === null) return null;
  const isVideo = isVideoUrl(
    resolved.characterUrl,
    resolved.builtinId ? CHARACTER_CATALOG[resolved.builtinId]?.mediaType : undefined,
  );
  return (
    <span
      className={styles.character}
      data-packed={resolved.builtin}
      data-packed-id={resolved.builtinId ?? undefined}
      style={resolved.builtinId === null ? undefined : characterFrame(resolved.builtinId)}
      aria-hidden="true"
    >
      {resolved.characterUrl === null ? null : isVideo ? (
        <video
          className={styles.characterImage}
          src={resolved.characterUrl}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
        />
      ) : (
        <img
          className={styles.characterImage}
          src={resolved.characterUrl}
          alt=""
          draggable={false}
        />
      )}
      {resolved.decorationUrl === null ? null : (
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
