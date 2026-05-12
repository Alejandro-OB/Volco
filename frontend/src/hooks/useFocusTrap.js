import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active) {
  const ref = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!active) return;

    previousFocus.current = document.activeElement;

    const container = ref.current;
    if (!container) return;

    const focusableEls = container.querySelectorAll(FOCUSABLE);
    const firstFocusable = focusableEls[0];

    if (firstFocusable) firstFocusable.focus();

    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const els = container.querySelectorAll(FOCUSABLE);
      const firstEl = els[0];
      const lastEl = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [active]);

  return ref;
}
