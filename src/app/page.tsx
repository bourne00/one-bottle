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
      toast.error('请先选择文件');
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
        toast.success('🍾 你的瓶子已投入大海！');
        setHasBottle(true);
        setFile(null);
        setShowUploadConfirm(false);
        clearCooldown();
      } else {
        toast.error(data.error || '上传失败');
      }
    } catch (e) {
      toast.error('上传失败，请重试');
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
      toast.error('今日浏览次数已用完');
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
        toast('暂时没有新的瓶子了', { icon: '🌊' });
      }
    } catch (e) {
      toast.error('获取失败');
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
        <div className="text-orange-500 text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* 标题 */}
        <header className="text-center mb-10 pt-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              One Bottle
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-orange-700">
            One person. One bottle. One story.
          </p>
          <p className="mt-3 text-gray-600 max-w-lg mx-auto">
            每人仅有一次机会，将你的故事投入数字海洋
          </p>
        </header>

        {/* 倒计时 */}
        <div className="card max-w-xl mx-auto mb-8 text-center">
          <p className="text-orange-600 font-medium mb-3">距离封存还有</p>
          <div className="flex justify-center gap-3">
            <div className="bg-orange-50 rounded-xl px-5 py-3">
              <div className="text-3xl font-bold text-orange-600">{countdown.days}</div>
              <div className="text-xs text-orange-500">天</div>
            </div>
            <div className="bg-orange-50 rounded-xl px-5 py-3">
              <div className="text-3xl font-bold text-orange-600">{countdown.hours}</div>
              <div className="text-xs text-orange-500">时</div>
            </div>
            <div className="bg-orange-50 rounded-xl px-5 py-3">
              <div className="text-3xl font-bold text-orange-600">{countdown.minutes}</div>
              <div className="text-xs text-orange-500">分</div>
            </div>
          </div>
        </div>

        {/* 上传区域 */}
        {!hasBottle && !showUploadConfirm && (
          <div className="card max-w-xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🍾 投放你的瓶子</h3>
            
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />
            
            <label
              htmlFor="file-input"
              className="block border-2 border-dashed border-orange-300 rounded-2xl p-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all text-center"
            >
              {file ? (
                <div>
                  <div className="text-4xl mb-2">📎</div>
                  <p className="text-gray-800 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📤</div>
                  <p className="text-gray-600">点击选择图片或视频</p>
                  <p className="text-sm text-gray-400 mt-1">最大 50MB</p>
                </div>
              )}
            </label>

            {file && (
              <button
                onClick={handleStartUpload}
                className="mt-6 w-full btn-primary"
              >
                投放瓶子
              </button>
            )}

            <p className="mt-4 text-sm text-center text-red-500 font-medium">
              ⚠️ 每人仅有一次机会，上传后无法撤回或修改
            </p>
          </div>
        )}

        {/* 冷静期确认 */}
        {!hasBottle && showUploadConfirm && (
          <div className="card max-w-xl mx-auto mb-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">确认投放</h3>
            <p className="text-gray-600 mb-4">
              这是你唯一的机会，一旦投放将无法撤回
            </p>
            
            {file && (
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">已选择: {file.name}</p>
              </div>
            )}

            {cooldown > 0 ? (
              <div className="mb-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">{cooldown}s</div>
                <p className="text-sm text-gray-500">冷静期倒计时</p>
              </div>
            ) : (
              <p className="text-green-600 font-medium mb-4">✓ 冷静期已结束，可以投放了</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelUpload}
                disabled={uploading}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={cooldown > 0 || uploading}
                className="flex-1 btn-primary"
              >
                {uploading ? '投放中...' : '确认投放'}
              </button>
            </div>
          </div>
        )}

        {/* 已封印状态 */}
        {hasBottle && (
          <div className="card max-w-xl mx-auto mb-8 text-center py-8">
            <div className="text-5xl mb-4">🍾</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">你的瓶子已投入大海</h3>
            <p className="text-gray-600">愿它漂向远方，被有缘人发现</p>
          </div>
        )}

        {/* 浏览瓶子 */}
        <div className="card max-w-xl mx-auto mb-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🌊 发现瓶子</h3>
          <p className="text-gray-600 mb-4">
            今日剩余 <span className="font-bold text-orange-600">{remainingViews}</span> 次机会
          </p>
          <button
            onClick={handleOpenBottle}
            disabled={fetchingBottle || remainingViews <= 0}
            className="btn-primary"
          >
            {fetchingBottle ? '寻找中...' : '打开一个瓶子'}
          </button>
        </div>

        {/* 显示瓶子内容 */}
        {viewingBottle && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <span className="text-gray-600">来自某人的 2025</span>
                <button
                  onClick={() => setViewingBottle(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                {viewingBottle.content_type === 'video' ? (
                  <video
                    src={viewingBottle.content_url}
                    controls
                    autoPlay
                    className="w-full rounded-xl"
                  />
                ) : (
                  <img
                    src={viewingBottle.content_url}
                    alt="Bottle content"
                    className="w-full rounded-xl"
                  />
                )}
              </div>
              <div className="p-4 border-t flex justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/bottle/${viewingBottle.id}`);
                    toast.success('链接已复制');
                  }}
                  className="text-orange-600 hover:text-orange-700"
                >
                  🔗 复制链接
                </button>
                <button
                  onClick={() => {
                    setViewingBottle(null);
                    handleOpenBottle();
                  }}
                  disabled={remainingViews <= 0}
                  className="text-orange-600 hover:text-orange-700 disabled:text-gray-400"
                >
                  下一个 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          <div className="card text-center p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-bold text-gray-800 mb-1">一次机会</h4>
            <p className="text-sm text-gray-600">每人仅能上传一次</p>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-bold text-gray-800 mb-1">随机发现</h4>
            <p className="text-sm text-gray-600">每天最多看 10 个瓶子</p>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-bold text-gray-800 mb-1">永久封存</h4>
            <p className="text-sm text-gray-600">2026年元旦后不再接受新内容</p>
          </div>
        </div>

        {/* 页脚 */}
        <footer className="text-center text-gray-500 text-sm py-4">
          <p>© 2025 One Bottle</p>
        </footer>
      </div>
    </div>
  );
}

