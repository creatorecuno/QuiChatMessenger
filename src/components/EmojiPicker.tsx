import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { emojiCategories } from '../data';

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 26 };

export default function EmojiPicker({ onPick, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.95 }}
        transition={spring}
        className="absolute bottom-full left-0 mb-2 glass-strong rounded-2xl p-3 shadow-2xl w-[320px] z-30 origin-bottom-left"
      >
        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-white/5">
          {emojiCategories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className="relative px-2.5 py-1 text-[10px] font-medium transition-colors"
            >
              <span className={activeCategory === i ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}>
                {cat.name}
              </span>
              {activeCategory === i && (
                <motion.div
                  layoutId="emoji-cat-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-md bg-violet-500/15 -z-10"
                />
              )}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto scrollbar-thin">
          {emojiCategories[activeCategory].emojis.map((emoji, i) => (
            <motion.button
              key={`${emoji}-${i}`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              onClick={() => onPick(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-white/5 transition-colors"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
