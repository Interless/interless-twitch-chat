import { useEffect, useReducer, useState } from 'react';

import { StreamElementsAdapter } from '../adapters/streamelements/StreamElementsAdapter';
import { MessageLayer } from '../components/MessageLayer';
import { MessageLifecycleService } from '../lifecycle/MessageLifecycleService';
import { INITIAL_OVERLAY_STATE, overlayReducer } from '../state/overlayReducer';
import styles from './OverlayRoot.module.css';
import {
  loadCharacterPreferences,
  saveCharacterPreferences,
} from '../persistence/characterPreferences';

export function OverlayRoot() {
  const [state, dispatch] = useReducer(overlayReducer, INITIAL_OVERLAY_STATE, (initial) => ({
    ...initial,
    userCharacters: loadCharacterPreferences(),
  }));
  const [adapter] = useState(() => new StreamElementsAdapter());
  const [lifecycleService] = useState(
    () =>
      new MessageLifecycleService((messageId, lifecycle) => {
        dispatch({ type: 'set-lifecycle', messageId, lifecycle });
      }),
  );

  useEffect(() => adapter.subscribe(dispatch), [adapter]);

  useEffect(() => saveCharacterPreferences(state.userCharacters), [state.userCharacters]);

  useEffect(() => {
    lifecycleService.sync(state.messages, state.config);
  }, [lifecycleService, state.config, state.messages]);

  useEffect(
    () => () => {
      lifecycleService.dispose();
    },
    [lifecycleService],
  );

  return (
    <main className={styles.overlay} aria-label="Twitch chat overlay">
      <MessageLayer messages={state.messages} config={state.config} />
    </main>
  );
}
