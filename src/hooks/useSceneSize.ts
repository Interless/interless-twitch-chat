import { useLayoutEffect, useState, type RefObject } from 'react';

import type { Dimensions } from '../domain/types';

const EMPTY_SIZE: Dimensions = { width: 0, height: 0 };

export function useSceneSize(elementRef: RefObject<HTMLElement | null>): Dimensions {
  const [size, setSize] = useState<Dimensions>(EMPTY_SIZE);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element === null) return undefined;

    const update = () => {
      const rect = element.getBoundingClientRect();
      const next = {
        width: rect.width || window.innerWidth,
        height: rect.height || window.innerHeight,
      };
      setSize((current) =>
        current.width === next.width && current.height === next.height ? current : next,
      );
    };
    update();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [elementRef]);

  return size;
}
