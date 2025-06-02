import React, { useEffect, useState, useRef } from "react";

interface StableTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

/**
 * A component that provides stable DOM transitions to prevent React DOM manipulation errors
 */
const StableTransition: React.FC<StableTransitionProps> = ({
  children,
  transitionKey,
  onTransitionStart,
  onTransitionEnd,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentKey, setCurrentKey] = useState(transitionKey);
  const [pendingChildren, setPendingChildren] = useState<React.ReactNode>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setIsTransitioning(true);
      setPendingChildren(children);
      onTransitionStart?.();

      // Use requestAnimationFrame to ensure DOM is stable
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCurrentKey(transitionKey);
          setIsTransitioning(false);
          setPendingChildren(null);
          onTransitionEnd?.();
        });
      });
    }
  }, [transitionKey, currentKey, children, onTransitionStart, onTransitionEnd]);

  return (
    <div
      ref={containerRef}
      key={currentKey}
      className={`transition-opacity duration-200 ${
        isTransitioning ? "opacity-50" : "opacity-100"
      }`}
    >
      {isTransitioning ? pendingChildren : children}
    </div>
  );
};

export default StableTransition;
