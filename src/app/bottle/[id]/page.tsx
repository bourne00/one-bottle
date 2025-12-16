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
          setError('This bottle did not make it.');
        }
      } catch (e) {
        setError('Failed to load');
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
        <div className="text-amber-600 text-lg loading-pulse font-light tracking-wide">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-md animate-fade-in">
          <div className="text-4xl mb-4 opacity-60">~</div>
          <h1 className="font-serif text-2xl text-amber-800 mb-3">{error}</h1>
          <p className="text-warm mb-8">Some things are meant to stay unshared.</p>
          <Link href="/" className="btn-primary inline-block">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <Link href="/" className="text-amber-700 hover:text-amber-800 flex items-center gap-2 transition-colors">
              <span className="text-lg">←</span>
              <span className="font-serif text-xl">One Bottle</span>
            </Link>
          </div>

          {/* Content */}
          <div className="card animate-fade-in delay-100" style={{ opacity: 0 }}>
            <p className="text-warm-light text-sm italic mb-6">A moment from someone's 2025</p>
            
            {bottle.content_type === 'video' ? (
              <video
                src={bottle.content_url}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <img
                src={bottle.content_url}
                alt="A bottle's content"
                className="w-full rounded-lg"
              />
            )}

            {/* Share buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied');
                }}
                className="flex-1 btn-secondary text-sm py-3"
              >
                Copy link
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I found a bottle from 2025')}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 btn-secondary text-sm py-3 text-center"
              >
                Share on 𝕏
              </a>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center animate-fade-in delay-200" style={{ opacity: 0 }}>
            <p className="text-warm mb-4">Want to discover more?</p>
            <Link href="/" className="btn-primary inline-block">
              Explore One Bottle
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 text-center">
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
