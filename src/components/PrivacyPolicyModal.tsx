import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

const SECTIONS = [
  {
    title: 'Какие данные мы храним',
    text: 'Email, имя пользователя, фото профиля (если вы его загрузили), сообщения, файлы и голосовые, которые вы отправляете через QuiChat.',
  },
  {
    title: 'Зачем',
    text: 'Только для работы самого мессенджера: авторизация, доставка сообщений, отображение статусов "в сети" и "прочитано".',
  },
  {
    title: 'Где хранится',
    text: 'Данные хранятся в инфраструктуре Supabase (PostgreSQL + Storage) с шифрованием соединения (HTTPS) и правилами доступа на уровне базы данных (Row Level Security) — каждый пользователь видит только свои переписки. Это не сквозное шифрование: сервер хранит содержимое сообщений, чтобы доставлять их на ваши устройства.',
  },
  {
    title: 'Кто имеет доступ',
    text: 'Доступ к переписке имеют только её участники. Писать можно после принятой заявки. Администраторы сервиса не читают сообщения в обычном режиме работы.',
  },
  {
    title: 'Удаление данных',
    text: 'Вы можете удалить любое своё сообщение в любой момент. По запросу на удаление аккаунта — все связанные данные удаляются из базы.',
  },
];

export default function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={spring}
              className="w-[480px] max-w-full max-h-[80vh] glass-strong rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-violet-400" />
                  <h2 className="text-lg font-bold text-white">Политика конфиденциальности</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto scrollbar-thin">
                {SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-white mb-1">{section.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{section.text}</p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-white/5 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl gradient-accent text-sm text-white font-medium glow-accent"
                >
                  Понятно
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
