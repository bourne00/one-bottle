'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getOneBottleId, 
  startCooldown, 
  getCooldownRemaining, 
  clearCooldown,
  getRemainingViews,
  incrementViewCount,
  canViewMore
} from '@/lib/identity';
import toast from 'react-hot-toast';

export default function Home() {
  const [ownerId, setOwnerId] = useState('');
  const [hasBottle, setHasBottle] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 上传相关
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  
  // 浏览相关
  const [viewingBottle, setViewingBottle] = useState<any>(null);
  const [remainingViews, setRemainingViews] = useState(10);
  const [fetchingBottle, setFetchingBottle] = useState(false);

  // 初始化
  useEffect(() => {
    const id = getOneBottleId();
    setOwnerId(id);
    setRemainingViews(getRemainingViews());
    checkBottle(id);
    
    // 检查冷静期
    const remaining = getCooldownRemaining();
    if (remaining > 0) {
      setCooldown(remaining);
      setShowUploadConfirm(true);
    }
  }, []);

  // 冷静期倒计时
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const timer = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldown]);

  // 检查是否已上传
  const checkBottle = async (id: string) => {
    try {
      const res = await fetch('/api/check-bottle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: id }),
      });
      const data = await res.json();
      setHasBottle(data.hasBottle);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 开始上传流程（进入冷静期）
  const handleStartUpload = () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    startCooldown();
    setCooldown(60);
    setShowUploadConfirm(true);
  };

  // 确认上传
  const handleConfirmUpload = async () => {
    if (!file || !ownerId || cooldown > 0) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner_id', ownerId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Your bottle is now drifting in the sea');
        setHasBottle(true);
        setFile(null);
        setShowUploadConfirm(false);
        clearCooldown();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (e) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // 取消上传
  const handleCancelUpload = () => {
    setShowUploadConfirm(false);
    setFile(null);
    clearCooldown();
    setCooldown(0);
  };

  // 打开随机瓶子
  const handleOpenBottle = async () => {
    if (!canViewMore()) {
      toast.error("That's all for today");
      return;
    }

    setFetchingBottle(true);
    
    try {
      const res = await fetch('/api/random-bottle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer_id: ownerId }),
      });

      const data = await res.json();

      if (data.bottle) {
        setViewingBottle(data.bottle);
        incrementViewCount();
        setRemainingViews(getRemainingViews());
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast('No new bottles right now', { icon: '🌊' });
      }
    } catch (e) {
      toast.error('Failed to fetch');
    } finally {
      setFetchingBottle(false);
    }
  };

  // 倒计时显示
  const getCountdown = () => {
    const deadline = new Date('2026-01-01T08:00:00.000Z');
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    };
  };

  const countdown = getCountdown();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-600 text-lg loading-pulse font-light tracking-wide">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-16 pt-8 animate-fade-in">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal mb-6 text-amber-800 tracking-tight">
              One Bottle
            </h1>
            <p className="text-lg md:text-xl text-warm font-light italic">
              One person. One bottle. One story.
            </p>
          </header>

          {/* Countdown */}
          <div className="card-subtle max-w-md mx-auto mb-12 text-center animate-fade-in delay-100" style={{ opacity: 0 }}>
            <p className="text-warm-light text-sm uppercase tracking-widest mb-4">Time remaining</p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="font-serif text-3xl md:text-4xl text-amber-700">{countdown.days}</div>
                <div className="text-xs text-warm-light uppercase tracking-wider mt-1">days</div>
              </div>
              <div className="text-warm-light text-2xl font-light">:</div>
              <div className="text-center">
                <div className="font-serif text-3xl md:text-4xl text-amber-700">{countdown.hours}</div>
                <div className="text-xs text-warm-light uppercase tracking-wider mt-1">hours</div>
              </div>
              <div className="text-warm-light text-2xl font-light">:</div>
              <div className="text-center">
                <div className="font-serif text-3xl md:text-4xl text-amber-700">{countdown.minutes}</div>
                <div className="text-xs text-warm-light uppercase tracking-wider mt-1">min</div>
              </div>
            </div>
          </div>

          {/* Upload Area - Initial State */}
          {!hasBottle && !showUploadConfirm && (
            <div className="card max-w-md mx-auto mb-12 animate-fade-in delay-200" style={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <div className="text-4xl mb-4 animate-float">🍾</div>
                <h2 className="font-serif text-2xl text-amber-800 mb-2">Leave your bottle</h2>
                <p className="text-warm text-sm">You can only do this once.</p>
              </div>
              
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              
              <label
                htmlFor="file-input"
                className="block border border-dashed border-amber-300 rounded-xl p-8 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all duration-300 text-center group"
              >
                {file ? (
                  <div>
                    <div className="text-3xl mb-3 opacity-70">📎</div>
                    <p className="text-amber-800 font-medium">{file.name}</p>
                    <p className="text-sm text-warm-light mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-3 opacity-50 group-hover:opacity-70 transition-opacity">+</div>
                    <p className="text-warm">Select an image or video</p>
                    <p className="text-sm text-warm-light mt-1">Max 50MB</p>
                  </div>
                )}
              </label>

              {file && (
                <button
                  onClick={handleStartUpload}
                  className="mt-6 w-full btn-primary"
                >
                  Leave your bottle
                </button>
              )}
            </div>
          )}

          {/* Cooldown Confirmation */}
          {!hasBottle && showUploadConfirm && (
            <div className="card max-w-md mx-auto mb-12 text-center animate-fade-in">
              <h2 className="font-serif text-2xl text-amber-800 mb-4">Take a moment.</h2>
              <p className="text-warm leading-relaxed mb-6">
                You are about to leave the only bottle<br />
                that represents your 2025.<br /><br />
                <span className="text-warm-light italic">There will be no edits. No retries.</span>
              </p>
              
              {file && (
                <div className="card-subtle mb-6">
                  <p className="text-sm text-warm">Selected: {file.name}</p>
                </div>
              )}

              {cooldown > 0 ? (
                <div className="mb-8">
                  <div className="font-serif text-5xl text-amber-600 mb-2">{cooldown}</div>
                  <p className="text-sm text-warm-light">seconds to reflect</p>
                </div>
              ) : (
                <p className="text-amber-600 mb-6">Ready when you are.</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="flex-1 btn-secondary"
                >
                  Go back
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={cooldown > 0 || uploading}
                  className="flex-1 btn-primary"
                >
                  {uploading ? 'Sending your bottle into the sea…' : 'Let it go'}
                </button>
              </div>
            </div>
          )}

          {/* Sealed State - Already uploaded */}
          {hasBottle && (
            <div className="card max-w-md mx-auto mb-12 text-center animate-fade-in">
              <div className="text-4xl mb-4 animate-float">🌊</div>
              <h2 className="font-serif text-2xl text-amber-800 mb-3">Your bottle is already drifting.</h2>
              <p className="text-warm leading-relaxed">
                You've said everything you're allowed to say here.<br />
                Now you can only listen.
              </p>
            </div>
          )}

          {/* Browse Section */}
          <div className="card max-w-md mx-auto mb-12 text-center animate-fade-in delay-300" style={{ opacity: 0 }}>
            {remainingViews > 0 ? (
              <>
                <h3 className="font-serif text-xl text-amber-800 mb-2">Discover a bottle</h3>
                <p className="text-warm text-sm mb-6">
                  {remainingViews} {remainingViews === 1 ? 'chance' : 'chances'} left today
                </p>
                <button
                  onClick={handleOpenBottle}
                  disabled={fetchingBottle}
                  className="btn-secondary"
                >
                  {fetchingBottle ? 'Searching…' : 'Open a bottle'}
                </button>
              </>
            ) : (
              <>
                <h3 className="font-serif text-xl text-amber-800 mb-2">That's all for today.</h3>
                <p className="text-warm text-sm">Let the rest drift.</p>
              </>
            )}
          </div>

          {/* How it works */}
          <div className="max-w-lg mx-auto mb-12 animate-fade-in delay-400" style={{ opacity: 0 }}>
            <div className="divider mb-8"></div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2 opacity-60">○</div>
                <p className="text-sm text-warm-light">One upload<br />per person</p>
              </div>
              <div>
                <div className="text-2xl mb-2 opacity-60">◇</div>
                <p className="text-sm text-warm-light">Random<br />discovery</p>
              </div>
              <div>
                <div className="text-2xl mb-2 opacity-60">□</div>
                <p className="text-sm text-warm-light">Sealed after<br />2026</p>
              </div>
            </div>
          </div>

          {/* Bottle Viewer Modal */}
          {viewingBottle && (
            <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in-slow">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-amber-100 flex justify-between items-center">
                  <span className="text-warm text-sm italic">A moment from someone's 2025</span>
                  <button
                    onClick={() => setViewingBottle(null)}
                    className="text-warm-light hover:text-warm text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-50"
                  >
                    ×
                  </button>
                </div>
                <div className="p-5">
                  {viewingBottle.content_type === 'video' ? (
                    <video
                      src={viewingBottle.content_url}
                      controls
                      autoPlay
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <img
                      src={viewingBottle.content_url}
                      alt="A bottle's content"
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
                <div className="p-5 border-t border-amber-100 flex justify-between items-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/bottle/${viewingBottle.id}`);
                      toast.success('Link copied');
                    }}
                    className="text-warm hover:text-amber-600 text-sm transition-colors"
                  >
                    Copy link
                  </button>
                  <button
                    onClick={() => {
                      setViewingBottle(null);
                      handleOpenBottle();
                    }}
                    disabled={remainingViews <= 0}
                    className="text-amber-600 hover:text-amber-700 text-sm disabled:text-warm-light transition-colors"
                  >
                    Next bottle →
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 text-center animate-fade-in delay-500" style={{ opacity: 0 }}>
        <div className="max-w-md mx-auto">
          <p className="text-warm text-sm leading-relaxed mb-4">
            We welcome you to share your 2025 with the world,<br />
            and we hope 2026 will be even better!
          </p>
          <p className="text-warm-light text-xs opacity-60">
            Built quietly by{' '}
            <a 
              href="https://x.com/linghuchong" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-amber-600 transition-colors"
            >
              @linghuchong
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
