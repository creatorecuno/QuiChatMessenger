import { motion } from 'framer-motion';

interface DateSeparatorProps {
  label: string;
}

export default function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center justify-center my-4"
    >
      <div className="px-3 py-1 rounded-full glass text-[11px] text-zinc-500 font-medium tracking-wide">
        {label}
      </div>
    </motion.div>
  );
}
