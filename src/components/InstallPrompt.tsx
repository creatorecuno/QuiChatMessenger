import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, MessageSquare } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('quichat-install-dismissed');
    if (stored === 'true') {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } catch {
      // ignore
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('quichat-install-dismissed', 'true');
  }, []);

  const visible = deferredPrompt && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.95 }}
          transition={spring}
          className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-4 pt-3 pointer-events-none"
        >
          <div className="glass-strong rounded-2xl shadow-2xl border border-violet-500/20 pointer-events-auto w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Mini logo */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...spring, delay: 0.15 }}
                className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center glow-accent shrink-0"
              >
                <MessageSquare size={20} className="text-white" />
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Install QuiChat</p>
                <p className="text-xs text-zinc-500 truncate">Quick access from your home screen</p>
              </div>

              {/* Install button */}
              <motion.button
                whileHover={{ scale: installing ? 1 : 1.05 }}
                whileTap={{ scale: installing ? 1 : 0.95 }}
                transition={spring}
                onClick={handleInstall}
                disabled={installing}
                className="px-3.5 py-2 rounded-xl gradient-accent text-white text-xs font-semibold glow-accent flex items-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                <Download size={14} />
                {installing ? 'Installing...' : 'Install'}
              </motion.button>

              {/* Dismiss */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors shrink-0"
              >
                <X size={15} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
