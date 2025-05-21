import React from "react";
import { motion } from "framer-motion";

interface BubbleProps {
  size?: number;
  color?: string;
  delay?: number;
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
}

export const FloatingBubble: React.FC<BubbleProps> = ({
  size = 10,
  color = "#8B5CF6",
  delay = 0,
  left,
  top,
  right,
  bottom,
}) => {
  const bubbleVariants = {
    initial: {
      y: 0,
      opacity: 0.7,
    },
    animate: {
      y: [-15, 0, -15],
      opacity: [0.7, 1, 0.7],
      transition: {
        y: {
          repeat: Infinity,
          duration: 3 + Math.random() * 2,
          delay: delay,
        },
        opacity: {
          repeat: Infinity,
          duration: 3 + Math.random() * 2,
          delay: delay,
        },
      },
    },
  };

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left,
        top,
        right,
        bottom,
        filter: "blur(1px)",
      }}
    />
  );
};

interface SparkleProps {
  size?: number;
  color?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
}

export const Sparkle: React.FC<SparkleProps> = ({
  size = 8,
  color = "#FBBF24",
  top,
  left,
  right,
  bottom,
  delay = 0,
}) => {
  const sparkleVariants = {
    initial: { scale: 0, rotate: 0, opacity: 0 },
    animate: {
      scale: [0, 1, 0],
      rotate: [0, 180],
      opacity: [0, 1, 0],
      transition: {
        repeat: Infinity,
        duration: 2,
        delay: delay,
        repeatDelay: Math.random() * 4 + 1,
      },
    },
  };

  return (
    <motion.div
      variants={sparkleVariants}
      initial="initial"
      animate="animate"
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        zIndex: 5,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
          fill={color}
        />
      </svg>
    </motion.div>
  );
};

export const WishBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingBubble size={20} color="#c084fc99" top="10%" left="5%" />
      <FloatingBubble
        size={15}
        color="#8b5cf699"
        top="20%"
        right="10%"
        delay={0.5}
      />
      <FloatingBubble
        size={30}
        color="#a855f799"
        bottom="15%"
        left="15%"
        delay={1.2}
      />
      <FloatingBubble
        size={12}
        color="#d946ef99"
        top="40%"
        right="15%"
        delay={0.7}
      />
      <FloatingBubble
        size={25}
        color="#8b5cf699"
        bottom="10%"
        right="10%"
        delay={0.3}
      />

      <Sparkle top="15%" left="20%" color="#FBBF24" size={10} delay={1} />
      <Sparkle top="70%" left="15%" color="#EC4899" size={8} delay={2.5} />
      <Sparkle top="30%" right="20%" color="#F59E0B" size={12} delay={0.5} />
      <Sparkle bottom="20%" right="25%" color="#FBBF24" size={9} delay={1.7} />
    </div>
  );
};

export const WishEffect: React.FC = () => {
  return (
    <div className="absolute -inset-px rounded-xl overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-500 to-pink-500 opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent opacity-50" />
    </div>
  );
};
