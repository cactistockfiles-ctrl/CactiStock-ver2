import { useState, useCallback, MouseEvent, WheelEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

interface ImageZoomModalProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageZoomModal = ({
  src,
  alt,
  open,
  onOpenChange,
}: ImageZoomModalProps) => {
  const { t } = useLocale();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
      const newScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 3);
      setScale(newScale);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-foreground/95 border-none">
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 transition-colors hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className="flex items-center justify-center w-full h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing"
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            draggable={false}
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1 text-xs text-foreground">
          {Math.round(scale * 100)}% — {t("zoom.doubleClick")}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageZoomModal;
