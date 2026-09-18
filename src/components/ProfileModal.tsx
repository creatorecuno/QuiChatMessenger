import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase';
import type { OnlineStatus, Profile } from '../types';

interface ProfileModalProps {
  open: boolean;
  profile: Profile;
  onClose: () => void;
  onSave: (updates: { username: string; avatar_url: string | null; status: OnlineStatus }) => Promise<void>;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

export default function ProfileModal({ open, profile, onClose, onSave }: ProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [status, setStatus] = useState<OnlineStatus>(profile.status);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения');
      return;
    }
    setError(null);
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить фото');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (username.trim().length < 2) {
      setError('Имя должно быть не короче 2 символов');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ username: username.trim(), avatar_url: avatarUrl.trim() || null, status });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

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
            className="w-[400px] max-w-full max-h-[90dvh] glass-strong rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Профиль</h2>
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

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div className="flex flex-col items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: uploadingPhoto ? 1 : 1.05 }}
                  whileTap={{ scale: uploadingPhoto ? 1 : 0.95 }}
                  onClick={handlePickPhoto}
                  disabled={uploadingPhoto}
                  className="relative"
                >
                  <Avatar name={username || profile.email} avatarUrl={avatarUrl || null} status={status} showStatus size="lg" />
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {uploadingPhoto ? (
                      <Loader2 size={18} className="text-white animate-spin" />
                    ) : (
                      <Camera size={18} className="text-white" />
                    )}
                  </div>
                </motion.button>
                <button
                  onClick={handlePickPhoto}
                  disabled={uploadingPhoto}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {uploadingPhoto ? 'Загружаем...' : 'Изменить фото'}
                </button>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Имя пользователя</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Статус</label>
                <div className="flex items-center gap-2">
                  {(['online', 'away', 'offline'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                        status === s
                          ? 'glass-strong border border-violet-500/30 text-white'
                          : 'glass text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s === 'online' ? 'bg-green-500' : s === 'away' ? 'bg-amber-400' : 'bg-zinc-600'
                        }`}
                      />
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/5">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={onClose}
                className="px-4 py-2 rounded-xl glass text-sm text-zinc-300 hover:text-white transition-colors"
              >
                Отмена
              </motion.button>
              <motion.button
                whileHover={{ scale: saving ? 1 : 1.04 }}
                whileTap={{ scale: saving ? 1 : 0.96 }}
                transition={spring}
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl gradient-accent text-sm text-white font-medium glow-accent flex items-center gap-2 disabled:opacity-60"
              >
                <Check size={14} />
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
