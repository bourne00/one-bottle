'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BottlePage() {
  const params = useParams();
  const [bottle, setBottle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBottle = async () => {
      try {
        const res = await fetch(`/api/bottle/${params.id}`);
        const data = await res.json();
        
        if (data.bottle) {
          setBottle(data.bottle);
        } else {
          setError('瓶子不存在或已被删除');
        }
      } catch (e) {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBottle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-500 text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <div className="text-5xl mb-4">🌊</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">这个瓶子可能已经漂走了</p>
          <Link href="/" className="btn-primary inline-block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-orange-600 hover:text-orange-700 flex items-center gap-2">
            <span>←</span>
            <span className="font-bold text-xl">One Bottle</span>
          </Link>
        </div>

        {/* 内容 */}
        <div className="card">
          <p className="text-gray-500 text-sm mb-4">来自某人的 2025</p>
          
          {bottle.content_type === 'video' ? (
            <video
              src={bottle.content_url}
              controls
              className="w-full rounded-xl"
            />
          ) : (
            <img
              src={bottle.content_url}
              alt="Bottle content"
              className="w-full rounded-xl"
            />
          )}

          {/* 分享 */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('链接已复制');
              }}
              className="flex-1 btn-secondary text-sm py-3"
            >
              🔗 复制链接
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('我在 One Bottle 发现了一个瓶子 🍾')}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-secondary text-sm py-3 text-center"
            >
              𝕏 分享
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">想发现更多瓶子？</p>
          <Link href="/" className="btn-primary inline-block">
            探索 One Bottle
          </Link>
        </div>
      </div>
    </div>
  );
}

