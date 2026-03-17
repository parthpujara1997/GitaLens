import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export function EyeIcon({ open, size = 20 }: { open: boolean; size?: number }) {
  return (
    <div className="relative flex items-center justify-center size-full">
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Eye size={size} strokeWidth={2.5} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ opacity: !open ? 1 : 0, scale: !open ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <EyeOff size={size} strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
