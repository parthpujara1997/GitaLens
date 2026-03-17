import { motion, AnimatePresence } from "framer-motion";

interface TextRollProps {
  className?: string;
  initialText: string;
  rollingText: string;
  isRolling: boolean;
  scrollLeft: number;
}

export function TextRoll({
  className,
  initialText,
  rollingText,
  isRolling,
  scrollLeft,
}: TextRollProps) {
  return (
    <div
      className={className}
      style={{ transform: `translateX(-${scrollLeft}px)` }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {initialText.split("").map((char, i) => {
          const displayChar = isRolling ? rollingText[i] || "•" : char;
          const isBullet = isRolling;
          return (
            <motion.span
              key={isBullet ? "bullet-" + i : "char-" + i}
              initial={{ y: isBullet ? -15 : 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isBullet ? 15 : -15, opacity: 0 }}
              transition={{
                duration: 0.15,
                delay: i * 0.015,
              }}
              className="inline-block text-center whitespace-pre"
              style={{ minWidth: isBullet ? '0.6em' : 'auto' }}
            >
              {displayChar}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
