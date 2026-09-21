import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={spring}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center glow-accent-strong mb-6"
      >
        <MessageSquare size={36} className="text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">Добро пожаловать в QuiChat</h2>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
        Выберите диалог слева или найдите человека по имени и отправьте заявку. Переписка видна только участникам чата.
      </p>

      <div className="flex items-center gap-3 mt-8">
        {['По заявке', 'В реальном времени', 'Только свои чаты'].map((feature, i) => (
          <motion.span
            key={feature}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, ...spring }}
            className="px-3 py-1.5 rounded-lg glass text-xs text-zinc-400 font-medium"
          >
            {feature}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
