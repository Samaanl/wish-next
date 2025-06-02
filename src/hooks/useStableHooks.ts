import { useCallback, useRef } from "react";

/**
 * Hook that debounces a function call to prevent rapid successive executions
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    }) as T,
    [func, delay]
  );
}

/**
 * Hook that throttles a function call to prevent rapid successive executions
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          func(...args);
        }, delay - (now - lastCallRef.current));
      }
    }) as T,
    [func, delay]
  );
}

/**
 * Hook for stable DOM operations that prevents React DOM manipulation errors
 */
export function useStableOperation() {
  const operationRef = useRef<boolean>(false);

  const executeStable = useCallback(<T>(operation: () => T): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (operationRef.current) {
        reject(new Error("Operation already in progress"));
        return;
      }

      operationRef.current = true;

      // Use multiple animation frames to ensure DOM stability
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const result = operation();
            operationRef.current = false;
            resolve(result);
          } catch (error) {
            operationRef.current = false;
            reject(error);
          }
        });
      });
    });
  }, []);

  return { executeStable, isOperating: operationRef.current };
}
