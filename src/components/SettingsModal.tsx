import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Bell, Volume2, CheckCheck, Type, Palette, Check } from 'lucide-react';
import { useState } from 'react';
import type { UserProfile, AppSettings } from '../types';
import Avatar from './Avatar';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

const themes: { key: AppSettings['theme']; label: string; colors: string }[] = [
  { key: 'midnight', label: 'Midnight', colors: 'from-violet-600 to-indigo-700' },
  { key: 'aurora', label: 'Aurora', colors: 'from-emerald-500 to-teal-600' },
  { key: 'ocean', label: 'Ocean', colors: 'from-blue-500 to-cyan-600' },
  { key: 'sunset', label: 'Sunset', colors: 'from-rose-500 to-orange-600' },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative">
      <motion.div
        animate={{ backgroundColor: enabled ? 'rgba(139,92,246,0.3)' : 'rgba(63,63,70,0.5)' }}
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

export default function SettingsModal({
  open,
  onClose,
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
}: SettingsModalProps) {
  const [tab, setTab] = useState<'profile' | 'preferences'>('profile');
  const [localProfile, setLocalProfile] = useState(profile);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdateProfile(localProfile);
    onUpdateSettings(localSettings);
    onClose();
  };

  const toggleSettings: { key: 'notifications' | 'messageSound' | 'readReceipts' | 'typingIndicators'; icon: typeof Bell; label: string; desc: string }[] = [
    { key: 'notifications', icon: Bell, label: 'Push Notifications', desc: 'Receive alerts for new messages' },
    { key: 'messageSound', icon: Volume2, label: 'Message Sounds', desc: 'Play a sound on new messages' },
    { key: 'readReceipts', icon: CheckCheck, label: 'Read Receipts', desc: 'Let others know you read their messages' },
    { key: 'typingIndicators', icon: Type, label: 'Typing Indicators', desc: 'Show others when you are typing' },
  ];

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
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={spring}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-w-[92vw] max-h-[88vh] glass-strong rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Settings</h2>
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

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
              {(['profile', 'preferences'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative px-3.5 py-1.5 text-xs font-medium capitalize transition-colors"
                >
                  <span className={tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}>{t}</span>
                  {tab === t && (
                    <motion.div
                      layoutId="settings-tab"
                      transition={spring}
                      className="absolute inset-0 rounded-lg bg-violet-500/15 border border-violet-500/30 -z-10"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              {tab === 'profile' ? (
                <div className="space-y-5">
                  {/* Avatar editor */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar initials={localProfile.avatar} status={localProfile.status} showStatus size="lg" />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-white glow-accent"
                      >
                        <Camera size={14} />
                      </motion.button>
                    </div>
                    <p className="text-xs text-zinc-500">Click to change avatar</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Display Name</label>
                    <input
                      value={localProfile.name}
                      onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>

                  {/* Status message */}
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Status Message</label>
                    <input
                      value={localProfile.statusMessage}
                      onChange={(e) => setLocalProfile({ ...localProfile, statusMessage: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>

                  {/* Status selector */}
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Availability</label>
                    <div className="flex items-center gap-2">
                      {(['online', 'away', 'offline'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setLocalProfile({ ...localProfile, status: s })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                            localProfile.status === s
                              ? 'glass-strong border border-violet-500/30 text-white'
                              : 'glass text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            s === 'online' ? 'bg-green-500' : s === 'away' ? 'bg-amber-400' : 'bg-zinc-600'
                          }`} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Notification toggles */}
                  <div className="space-y-1">
                    {toggleSettings.map(({ key, icon: Icon, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-400">
                            <Icon size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-xs text-zinc-500">{desc}</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={localSettings[key]}
                          onChange={() => setLocalSettings({ ...localSettings, [key]: !localSettings[key] })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Theme selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette size={16} className="text-zinc-400" />
                      <label className="text-sm font-medium text-white">Theme</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {themes.map((t) => (
                        <motion.button
                          key={t.key}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={spring}
                          onClick={() => setLocalSettings({ ...localSettings, theme: t.key })}
                          className={`relative p-3 rounded-xl text-left transition-all ${
                            localSettings.theme === t.key
                              ? 'glass-strong border border-violet-500/40'
                              : 'glass border border-transparent hover:border-white/10'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${t.colors} mb-2`} />
                          <span className="text-xs font-medium text-white">{t.label}</span>
                          {localSettings.theme === t.key && (
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
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/5">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={onClose}
                className="px-4 py-2 rounded-xl glass text-sm text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl gradient-accent text-sm text-white font-medium glow-accent"
              >
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
