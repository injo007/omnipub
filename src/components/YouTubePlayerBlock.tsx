import React, { useState } from 'react';
import { Play, Youtube, ExternalLink } from 'lucide-react';

interface YouTubePlayerBlockProps {
  url: string;
  title?: string;
}

export function YouTubePlayerBlock({ url, title }: YouTubePlayerBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube ID from various formats
  const getYouTubeId = (videoUrl: string): string | null => {
    if (!videoUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) {
    // Fallback to regular link if invalid URL
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1.5 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded px-1 py-0.5"
      >
        {title || url} <ExternalLink className="w-3.5 h-3.5" />
      </a>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlaying(true);
  };

  return (
    <div id={`yt-block-${videoId}`} className="w-full my-8 flex flex-col items-center">
      <div className="w-full max-w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-xl relative group transition-transform duration-300">
        {!isPlaying ? (
          <div className="w-full h-full relative cursor-pointer select-none" onClick={handlePlayClick}>
            {/* Custom high-res thumbnail with fallback support */}
            <img 
              src={thumbnailUrl} 
              alt={title || "YouTube video content"} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== fallbackThumbnailUrl) {
                  img.src = fallbackThumbnailUrl;
                }
              }}
            />
            
            {/* Soft high-integrity dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 group-hover:via-black/50" />
            
            {/* Dynamic visual playback indicators */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg text-white">
              <Youtube className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
                Featured Video
              </span>
            </div>

            {/* Premium play widget resembling dynamic music/video magazines */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePlayClick}
                className="w-16 h-16 rounded-full bg-red-650 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 active:scale-95 border-2 border-white/20 select-none relative"
                aria-label="Play Video"
              >
                {/* Embedded ripple effect loop */}
                <span className="absolute -inset-2 bg-red-650/40 rounded-full animate-ping opacity-75 group-hover:opacity-100 duration-1000" />
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </button>
            </div>

            {/* Captivating bottom title bar */}
            <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 text-left">
              <span className="text-[9px] font-extrabold text-[#E28743] uppercase tracking-wider block mb-1">
                Press Play to Stream
              </span>
              <h4 className="text-white text-base md:text-lg font-bold tracking-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                {title || "Watch live related media breakdown and highlights"}
              </h4>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0`}
            title={title || "YouTube video player"}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Decorative caption bar linking out cleanly */}
      <div className="mt-3 px-4 py-1.5 border-l-2 border-red-500 bg-red-50/30 dark:bg-red-950/20 text-xs rounded-r-lg w-full text-left font-medium tracking-wide flex justify-between items-center gap-2 select-none">
        <span className="text-slate-600 dark:text-slate-300 font-sans truncate">
          🎬 video: <b>{title || "Media integration breakdown"}</b>
        </span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[10px] uppercase font-bold text-red-650 dark:text-red-400 shrink-0 hover:underline flex items-center gap-1"
        >
          View on YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
