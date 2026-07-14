import {
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  WheelEvent,
  useRef,
} from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageZoomModalProps {
  src?: string;
  srcs?: string[];
  currentIndex?: number | null;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange?: (index: number) => void;
}

const ImageZoomModal = ({
  src,
  srcs,
  currentIndex = 0,
  alt,
  open,
  onOpenChange,
  onIndexChange,
}: ImageZoomModalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sources = srcs?.filter(Boolean) ?? (src ? [src] : []);
  const [activeIndex, setActiveIndex] = useState<number>(
    Math.max(0, Number(currentIndex ?? 0)),
  );
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<{
    xPct: number;
    yPct: number;
  } | null>(null);
  const [hoverActive, setHoverActive] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setHoverActive(false);
      setHoverPoint(null);
      setPreviewPos({ x: 0, y: 0 });
    }
  }, [open]);

  useEffect(() => {
    if (open && typeof currentIndex === "number" && currentIndex >= 0) {
      setActiveIndex(Math.max(0, Math.min(currentIndex, sources.length - 1)));
    }
  }, [currentIndex, open, sources.length]);

  useEffect(() => {
    if (activeIndex >= sources.length) {
      setActiveIndex(Math.max(0, sources.length - 1));
    }
  }, [activeIndex, sources.length]);

  const currentSrc = sources.length ? sources[activeIndex] : src || "";
  const hasGallery = sources.length > 1;
  const prevIndex = hasGallery
    ? (activeIndex - 1 + sources.length) % sources.length
    : 0;
  const nextIndex = hasGallery ? (activeIndex + 1) % sources.length : 0;

  const handlePrev = useCallback(() => {
    if (!sources.length) return;
    const next = (activeIndex - 1 + sources.length) % sources.length;
    setActiveIndex(next);
    onIndexChange?.(next);
  }, [activeIndex, onIndexChange, sources.length]);

  const handleNext = useCallback(() => {
    if (!sources.length) return;
    const next = (activeIndex + 1) % sources.length;
    setActiveIndex(next);
    onIndexChange?.(next);
  }, [activeIndex, onIndexChange, sources.length]);

  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(1.5);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const nextScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 3);
      setScale(nextScale);
      if (nextScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    },
    [scale],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [scale, position],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleMouseEnter = useCallback(() => setHoverActive(true), []);

  const handleMouseLeave = useCallback(() => {
    setHoverActive(false);
    setHoverPoint(null);
    handleMouseUp();
  }, [handleMouseUp]);

  const handleMouseMovePreview = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = Math.min(
        100,
        Math.max(0, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const yPct = Math.min(
        100,
        Math.max(0, ((e.clientY - rect.top) / rect.height) * 100),
      );

      setHoverActive(true);
      setHoverPoint({ xPct, yPct });
      setPreviewPos({
        x: Math.min(rect.width - 240, Math.max(16, e.clientX - rect.left + 24)),
        y: Math.min(rect.height - 176, Math.max(16, e.clientY - rect.top + 24)),
      });
    },
    [],
  );

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={handleClose} />
      <div
        className="relative w-full max-w-[96vw] max-h-[96vh] overflow-hidden rounded-3xl bg-transparent pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-30 rounded-full bg-slate-900/80 p-2 text-white transition hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>

        {hasGallery && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-white shadow shadow-black/30 transition hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-white shadow shadow-black/30 transition hover:bg-slate-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div
          ref={containerRef}
          className="relative flex items-center justify-center w-full h-[88vh] overflow-hidden cursor-grab active:cursor-grabbing"
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleMouseMovePreview(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          <img
            src={currentSrc}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            draggable={false}
          />

          {hoverActive && hoverPoint && (
            <div
              className="pointer-events-none absolute z-20 h-44 w-56 overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl"
              style={{
                left: `${previewPos.x}px`,
                top: `${previewPos.y}px`,
              }}
            >
              <div
                className="h-full w-full bg-no-repeat bg-cover"
                style={{
                  backgroundImage: `url(${currentSrc})`,
                  backgroundSize: "200%",
                  backgroundPosition: `${hoverPoint.xPct}% ${hoverPoint.yPct}%`,
                }}
              />
            </div>
          )}
        </div>

        {hasGallery && (
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-1 text-xs text-white">
            {`${activeIndex + 1} of ${sources.length}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageZoomModal;
