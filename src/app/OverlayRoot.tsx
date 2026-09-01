import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { StreamElementsAdapter } from '../adapters/streamelements/StreamElementsAdapter';
import { MessageLayer } from '../components/MessageLayer';
import type { Dimensions } from '../domain/types';
import { useSceneSize } from '../hooks/useSceneSize';
import { MessageLifecycleService } from '../lifecycle/MessageLifecycleService';
import { PlacementEngine } from '../placement/PlacementEngine';
import { INITIAL_OVERLAY_STATE, overlayReducer } from '../state/overlayReducer';
import styles from './OverlayRoot.module.css';

export function OverlayRoot() {
  const [state, dispatch] = useReducer(overlayReducer, INITIAL_OVERLAY_STATE);
  const rootRef = useRef<HTMLElement>(null);
  const sceneSize = useSceneSize(rootRef);
  const previousSceneSizeRef = useRef(sceneSize);
  const [placementEngine] = useState(() => new PlacementEngine());
  const [adapter] = useState(() => new StreamElementsAdapter());
  const [lifecycleService] = useState(
    () =>
      new MessageLifecycleService((messageId, lifecycle) => {
        dispatch({ type: 'set-lifecycle', messageId, lifecycle });
      }),
  );

  useEffect(() => adapter.subscribe(dispatch), [adapter]);

  useEffect(() => {
    lifecycleService.sync(state.messages, state.config);
  }, [lifecycleService, state.config, state.messages]);

  useEffect(
    () => () => {
      lifecycleService.dispose();
    },
    [lifecycleService],
  );

  useEffect(() => {
    const previous = previousSceneSizeRef.current;
    previousSceneSizeRef.current = sceneSize;
    if (
      previous.width > 0 &&
      previous.height > 0 &&
      (previous.width !== sceneSize.width || previous.height !== sceneSize.height)
    ) {
      dispatch({ type: 'reset-placements' });
    }
  }, [sceneSize]);

  const handleMeasure = useCallback(
    (messageId: string, dimensions: Dimensions) => {
      const active = state.messages.find((item) => item.message.id === messageId);
      if (active === undefined) return;
      if (active.placement !== null || sceneSize.width <= 0 || sceneSize.height <= 0) return;

      const config = state.config;
      const requestedTheme = config.roleThemes[active.message.user.role];
      const roleTheme = requestedTheme.enabled ? requestedTheme : config.roleThemes.viewer;
      const placement = placementEngine.place({
        scene: sceneSize,
        bubble: dimensions,
        existing: state.messages.flatMap((item) =>
          item.message.id === messageId || item.placement === null
            ? []
            : [item.placement.collisionRect],
        ),
        safeZones: config.placement.safeZones,
        edgePadding: config.placement.edgePadding,
        messageGap: config.placement.messageGap,
        maxAttempts: config.placement.maxAttempts,
        rotationMin: config.placement.rotationMin,
        rotationMax: config.placement.rotationMax,
        rotationOffset: roleTheme.rotationOffset,
      });
      dispatch({ type: 'message-placed', messageId, placement });
    },
    [placementEngine, sceneSize, state],
  );

  return (
    <main ref={rootRef} className={styles.overlay} aria-label="Twitch chat overlay">
      <MessageLayer messages={state.messages} config={state.config} onMeasure={handleMeasure} />
    </main>
  );
}
