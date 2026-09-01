import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OverlayRoot } from './app/OverlayRoot';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

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
