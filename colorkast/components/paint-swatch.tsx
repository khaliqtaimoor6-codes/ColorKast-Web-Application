interface PaintSwatchProps {
  r: number;
  g: number;
  b: number;
  size?: number;
  showValues?: boolean;
  className?: string;
}

export function PaintSwatch({ r, g, b, size = 48, showValues, className }: PaintSwatchProps) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? "#1a1a1a" : "#ffffff";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div
        className="shrink-0 rounded-lg border shadow-sm"
        style={{ width: size, height: size, backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        aria-label={`Color swatch RGB ${r}, ${g}, ${b}`}
      />
      {showValues && (
        <div
          className="rounded-md px-2 py-1 font-mono text-xs"
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})`, color: textColor }}
        >
          {r},{g},{b}
        </div>
      )}
    </div>
  );
}