import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OverlayRoot } from './app/OverlayRoot';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

import { encodePreset, decodePreset } from './config/preset';
import {
  CHARACTER_URLS,
  CHARACTER_CATALOG,
  characterFrame,
  installCharacterPack,
  getCharacterPack,
  updateCharacterCommand,
} from './domain/characterRegistry';
import { characterIdForCommand, dinosaurHelp, isHelpCommand } from './domain/chatCommands';
import { isVideoUrl } from './domain/media';
import { importCharacterFolder } from './preview/folderImport';
import { createStreamElementsCode } from './preview/exportPack';
import { encodeProject, decodeProject } from './preview/project';
Object.assign(window, {
  InterlessChat: Object.freeze({
    encodePreset,
    decodePreset,
    catalog: CHARACTER_CATALOG,
    characterFrame,
    characterUrl: (id: string) => CHARACTER_URLS[id],
    dinosaurHelp,
    isHelpCommand,
    characterIdForCommand,
    isVideoUrl,
    installCharacterPack,
    getCharacterPack,
    updateCharacterCommand,
    importCharacterFolder,
    createStreamElementsCode,
    encodeProject,
    decodeProject,
  }),
});

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Overlay root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <OverlayRoot />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.DEV) {
  void import('./dev/installDevFixture').then(({ installDevFixture }) => {
    const cleanup = installDevFixture();
    import.meta.hot?.dispose(cleanup);
  });
}
