import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Image as ImageIcon, Sparkles, Check, Eye } from 'lucide-react';
import type { Appearance, AccentTheme, Wallpaper } from '../hooks/useAppearance';
import type { LastSeenVisibility } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  appearance: Appearance;
  onUpdate: (patch: Partial<Appearance>) => void;
  lastSeenVisibility: LastSeenVisibility;
  onUpdateLastSeen: (value: LastSeenVisibility) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

const accents: { key: AccentTheme; label: string; colors: string }[] = [
  { key: 'violet', label: 'Фиолетовый', colors: 'from-violet-500 to-indigo-600' },
  { key: 'blue', label: 'Океан', colors: 'from-blue-500 to-cyan-500' },
  { key: 'emerald', label: 'Изумруд', colors: 'from-emerald-500 to-teal-600' },
  { key: 'rose', label: 'Закат', colors: 'from-rose-500 to-pink-500' },
  { key: 'amber', label: 'Янтарь', colors: 'from-amber-500 to-orange-600' },
];

const wallpapers: { key: Wallpaper; label: string }[] = [
  { key: 'none', label: 'Нет' },
  { key: 'dots', label: 'Точки' },
  { key: 'grid', label: 'Сетка' },
  { key: 'aurora', label: 'Сияние' },
];

const lastSeenOptions: { key: LastSeenVisibility; label: string; hint: string }[] = [
  { key: 'everyone', label: 'Все', hint: 'Статус «в сети» виден любому, кто откроет чат' },
  { key: 'contacts', label: 'Только контакты', hint: 'Видят люди, с которыми вы в контактах' },
  { key: 'nobody', label: 'Никто', hint: 'Онлайн скрыт. Показываем «был(а) недавно»' },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative">
      <motion.div
        animate={{ backgroundColor: enabled ? 'rgba(139,92,246,0.35)' : 'rgba(63,63,70,0.5)' }}
        className="w-11 h-6 rounded-full"
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={spring}
          className={`w-5 h-5 rounded-full mt-0.5 shadow-md ${enabled ? 'gradient-accent' : 'bg-zinc-400'}`}
        />
      </motion.div>
    </button>
  );
}

function WallpaperPreview({ variant }: { variant: Wallpaper }) {
  if (variant === 'none') {
    return <div className="w-full h-12 rounded-lg bg-[#0a0a0f]" />;
  }
  if (variant === 'dots') {
    return (
      <div
        className="w-full h-12 rounded-lg bg-[#0a0a0f]"
        style={{
          backgroundImage: 'radial-gradient(rgba(var(--accent-rgb),0.35) 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      />
    );
  }
  if (variant === 'grid') {
    return (
      <div
        className="w-full h-12 rounded-lg bg-[#0a0a0f]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />
    );
  }
  return (
    <div
      className="w-full h-12 rounded-lg bg-[#0a0a0f]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 60% at 15% 10%, rgba(var(--accent-rgb),0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 85% 85%, rgba(var(--accent-rgb),0.28) 0%, transparent 60%)',
      }}
    />
  );
}

export default function SettingsModal({
  open,
  onClose,
  appearance,
  onUpdate,
  lastSeenVisibility,
  onUpdateLastSeen,
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={spring}
              className="w-[440px] max-w-full max-h-[88dvh] glass-strong rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-violet-400" />
                  <h2 className="text-lg font-bold text-white">Настройки</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette size={16} className="text-zinc-400" />
                    <label className="text-sm font-medium text-white">Акцентный цвет</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {accents.map((a) => (
                      <motion.button
                        key={a.key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        onClick={() => onUpdate({ accent: a.key })}
                        className={`relative p-3 rounded-xl text-left transition-all ${
                          appearance.accent === a.key
                            ? 'glass-strong border border-violet-500/40'
                            : 'glass border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${a.colors} mb-2`} />
                        <span className="text-xs font-medium text-white">{a.label}</span>
                        {appearance.accent === a.key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={spring}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-accent flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon size={16} className="text-zinc-400" />
                    <label className="text-sm font-medium text-white">Фон переписки</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {wallpapers.map((w) => (
                      <motion.button
                        key={w.key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        onClick={() => onUpdate({ wallpaper: w.key })}
                        className={`relative p-2 rounded-xl text-left transition-all ${
                          appearance.wallpaper === w.key
                            ? 'glass-strong border border-violet-500/40'
                            : 'glass border border-transparent hover:border-white/10'
                        }`}
                      >
                        <WallpaperPreview variant={w.key} />
                        <span className="text-xs font-medium text-white mt-2 block px-0.5">{w.label}</span>
                        {appearance.wallpaper === w.key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={spring}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full gradient-accent flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-white">Меньше анимаций</p>
                    <p className="text-xs text-zinc-500">Ускоряет интерфейс на слабых устройствах</p>
                  </div>
                  <ToggleSwitch
                    enabled={appearance.reduceMotion}
                    onChange={() => onUpdate({ reduceMotion: !appearance.reduceMotion })}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={16} className="text-zinc-400" />
                    <label className="text-sm font-medium text-white">Кто видит, что вы в сети</label>
                  </div>
                  <div className="space-y-2">
                    {lastSeenOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => onUpdateLastSeen(option.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                          lastSeenVisibility === option.key
                            ? 'glass-strong border border-violet-500/40'
                            : 'glass border border-transparent hover:border-white/10'
                        }`}
                      >
                        <p className="text-sm text-white">{option.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-white/5 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl gradient-accent text-sm text-white font-medium glow-accent"
                >
                  Готово
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
