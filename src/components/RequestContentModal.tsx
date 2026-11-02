import React, { useState } from 'react';
import { X, Plus, Film, Tv, Check, Send } from 'lucide-react';

interface RequestContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestContentModal: React.FC<RequestContentModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'series' | 'movie'>('series');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTitle('');
      setNotes('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop">
      <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-6 animate-modal-content select-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Request Content</h3>
            <p className="text-xs text-zinc-400">Can't find your favorite drama or movie? Let us know!</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Request Received!</h4>
            <p className="text-xs text-zinc-400">We've added your request to our library curation queue.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">
                Title of Movie or Series *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kurulus Osman, Sahmaran, Winter Sun..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111216] border border-white/15 rounded-lg px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('series')}
                  className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    type === 'series'
                      ? 'border-red-500 bg-red-500/10 text-white font-bold'
                      : 'border-white/10 bg-[#111216] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-red-500" />
                  <span>TV Series</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('movie')}
                  className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    type === 'movie'
                      ? 'border-red-500 bg-red-500/10 text-white font-bold'
                      : 'border-white/10 bg-[#111216] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-red-500" />
                  <span>Movie</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">
                Additional Notes or Cast
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Starring Burak Özçivit, Turkish audio with English subtitles..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#111216] border border-white/15 rounded-lg px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Content Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
