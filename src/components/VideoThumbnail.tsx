import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize2, X, Volume2, VolumeX } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  title: string;
  aspectRatio?: 'video' | 'vertical';
  className?: string;
  isShowreel?: boolean;
  thumbnailIndex?: number;
}

export function VideoThumbnail({
  src,
  title,
  aspectRatio = 'video',
  className = '',
  isShowreel = false,
  thumbnailIndex
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const aspectClass = aspectRatio === 'vertical' ? 'aspect-[9/16]' : 'aspect-video';

  const playPauseButtonSize = aspectRatio === 'vertical'
    ? isFullscreen ? 'w-20 h-20' : 'w-12 h-12'
    : isFullscreen ? 'w-24 h-24' : 'w-16 h-16';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();

          if (!isShowreel) {
            setTimeout(() => {
              if (videoRef.current) {
                setIsBuffering(true);
                videoRef.current.src = src;
                videoRef.current.muted = true;
                videoRef.current.load();
                videoRef.current.play().catch(error => {
                  console.error('Error auto-playing video:', error);
                  setIsBuffering(false);
                });
              }
            }, 100);
          }
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isShowreel, src]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!isVideoLoaded) {
        setIsBuffering(true);
        videoRef.current.src = src;
        videoRef.current.load();
      }

      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
        setIsBuffering(false);
      }
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const isMobile = () => window.innerWidth < 768;

  return (
    <div
      ref={containerRef}
      className={`relative group cursor-pointer ${aspectClass} rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] !rounded-none !aspect-auto w-screen h-screen bg-black'
          : isMobile() ? '' : 'hover:shadow-xl hover:scale-105'
      } ${className}`}
      onClick={togglePlayPause}
    >
      {hasIntersected && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover'}`}
          loop
          playsInline
          preload="auto"
          muted={isMuted}
          onLoadedData={() => {
            setIsVideoLoaded(true);
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            if (videoRef.current && !isScrubbing) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onError={() => {
            setIsBuffering(false);
            setIsPlaying(false);
            console.error('Video failed to load:', src);
          }}
        />
      )}

      {isBuffering && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bosenAlt">LOADING</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className={`bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${playPauseButtonSize} ${
            isMobile() ? '' : 'group-hover:bg-white/30'
          } ${isPlaying && !isBuffering || isBuffering ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        >
          {isPlaying ? (
            <Pause className={`text-white ${aspectRatio === 'vertical' ? (isFullscreen ? 'w-8 h-8' : 'w-5 h-5') : (isFullscreen ? 'w-10 h-10' : 'w-6 h-6')}`} />
          ) : (
            <Play className={`text-white ml-1 ${aspectRatio === 'vertical' ? (isFullscreen ? 'w-8 h-8' : 'w-5 h-5') : (isFullscreen ? 'w-10 h-10' : 'w-6 h-6')}`} />
          )}
        </div>
      </div>

      {!isFullscreen && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      )}

      <button
        onClick={toggleFullscreen}
        className={`absolute bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
          isFullscreen
            ? 'top-8 right-8 w-12 h-12 opacity-100'
            : 'top-4 right-4 w-10 h-10 opacity-0 group-hover:opacity-100'
        }`}
      >
        {isFullscreen ? (
          <X size={20} className="text-white" />
        ) : (
          <Maximize2 size={16} className="text-white" />
        )}
      </button>

      {isVideoLoaded && (
        <div
          ref={progressBarRef}
          className={`absolute left-0 right-0 h-1 bg-white/20 cursor-pointer transition-all duration-300 z-20 group/progress ${
            isFullscreen ? 'bottom-20' : 'bottom-0 opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!videoRef.current || !progressBarRef.current) return;

            const rect = progressBarRef.current.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = percent * videoRef.current.duration;
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsScrubbing(true);
          }}
          onMouseMove={(e) => {
            if (!isScrubbing || !videoRef.current || !progressBarRef.current) return;
            e.stopPropagation();

            const rect = progressBarRef.current.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            videoRef.current.currentTime = percent * videoRef.current.duration;
            setCurrentTime(videoRef.current.currentTime);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            setIsScrubbing(false);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            setIsScrubbing(false);
          }}
        >
          <div
            className="h-full bg-white group-hover/progress:bg-blue-500 transition-colors"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      )}

      {!isShowreel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
            if (videoRef.current) {
              videoRef.current.muted = !isMuted;
            }
          }}
          className={`absolute bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${
            isFullscreen
              ? 'top-8 right-24 w-12 h-12 opacity-100'
              : 'top-4 right-16 w-10 h-10 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isMuted ? (
            <VolumeX size={isFullscreen ? 20 : 16} className="text-white" />
          ) : (
            <Volume2 size={isFullscreen ? 20 : 16} className="text-white" />
          )}
        </button>
      )}

      <div
        className={`absolute transition-all duration-300 z-20 ${
          isFullscreen
            ? 'bottom-8 left-8 opacity-100'
            : 'bottom-4 left-4 opacity-0 group-hover:opacity-100'
        }`}
      >
        <span className={`text-white font-bosenAlt bg-black/50 px-3 py-1 rounded-full ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
          {title}
        </span>
      </div>
    </div>
  );
}
