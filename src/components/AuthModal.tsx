import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, MessageSquare, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Этот email уже зарегистрирован. Попробуйте войти вместо регистрации.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Неверный email или пароль.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email ещё не подтверждён. Проверьте почту (или попросите админа отключить подтверждение email в Supabase → Authentication → Settings).';
  }
  if (lower.includes('password') && lower.includes('6')) {
    return 'Пароль должен быть не короче 6 символов.';
  }
  if (lower.includes('rate limit')) {
    return 'Слишком много попыток. Подождите немного и попробуйте снова.';
  }
  return message;
}

function generateTestCredentials() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    email: `test-${suffix}@quichat.dev`,
    password: `Test-${suffix}!`,
    username: `Тест ${suffix}`,
  };
}

export default function AuthModal({ open, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await onSignIn(email, password);
      } else {
        if (username.trim().length < 2) {
          throw new Error('Имя пользователя должно быть не короче 2 символов');
        }
        await onSignUp(email, password, username.trim());
      }
      setEmail('');
      setPassword('');
      setUsername('');
      setJustGenerated(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Что-то пошло не так';
      setError(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setJustGenerated(false);
  };

  const handleGenerateTest = () => {
    const creds = generateTestCredentials();
    setMode('register');
    setEmail(creds.email);
    setPassword(creds.password);
    setUsername(creds.username);
    setError(null);
    setJustGenerated(true);
  };

  const handleCopyCreds = () => {
    navigator.clipboard.writeText(`Email: ${email}\nПароль: ${password}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={spring}
              className="w-[420px] max-w-full glass-strong rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center pt-8 pb-6 px-8 relative">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </motion.button>

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center glow-accent-strong mb-4"
                >
                  <MessageSquare size={30} className="text-white" />
                </motion.div>

                <h1 className="text-2xl font-bold text-white tracking-tight">QuiChat</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {mode === 'login' ? 'С возвращением' : 'Создание аккаунта'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-3">
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Имя пользователя"
                        className="w-full glass-input rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}

                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setJustGenerated(false);
                    }}
                    placeholder="Email"
                    required
                    className="w-full glass-input rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setJustGenerated(false);
                    }}
                    placeholder="Пароль"
                    required
                    minLength={6}
                    className="w-full glass-input rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
                  />
                  {justGenerated && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopyCreds}
                      title="Скопировать email и пароль"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-violet-400 transition-colors"
                    >
                      <Copy size={15} />
                    </motion.button>
                  )}
                </div>

                {justGenerated && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20"
                  >
                    <Check size={14} className="text-violet-400 shrink-0" />
                    <p className="text-xs text-violet-300">
                      Данные сгенерированы и подставлены выше — просто нажми «Создать аккаунт»
                    </p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20"
                  >
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-300">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  transition={spring}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-semibold glow-accent flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Подождите...
                    </>
                  ) : mode === 'login' ? (
                    'Войти'
                  ) : (
                    'Создать аккаунт'
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={handleGenerateTest}
                  className="w-full py-2.5 rounded-xl glass text-zinc-300 text-xs font-medium flex items-center justify-center gap-2 hover:text-violet-400 transition-colors"
                >
                  <Sparkles size={14} />
                  Сгенерировать тестовый аккаунт
                </motion.button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                  >
                    {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                    <span className="text-violet-400 font-medium">
                      {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
