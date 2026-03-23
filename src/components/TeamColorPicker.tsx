import React from 'react';
import { HexColorPicker } from 'react-colorful';
import 'react-colorful/dist/index.css';

interface TeamColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const formatColor = (color: string) => {
  if (!color) return '#0054FF';
  return color.startsWith('#') ? color : `#${color}`;
};

export const TeamColorPicker = ({ value, onChange, disabled }: TeamColorPickerProps) => {
  const normalizedColor = formatColor(value);

  const handleHexInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (/^#?[0-9A-Fa-f]{0,6}$/.test(next)) {
      const formatted = next.startsWith('#') ? next : `#${next}`;
      onChange(formatted);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <HexColorPicker color={normalizedColor} onChange={onChange} className="w-full h-full" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
            Hex Value
          </label>
          <input
            type="text"
            value={normalizedColor.toUpperCase()}
            onChange={handleHexInput}
            disabled={disabled}
            maxLength={7}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 mt-1 uppercase tracking-[0.3em] text-sm focus:outline-none focus:border-neon-green/50"
          />
        </div>
        <div
          className="w-14 h-14 rounded-2xl border-2 border-white/10"
          style={{ backgroundColor: normalizedColor }}
          aria-label="Selected team color preview"
        />
      </div>
      <p className="text-[11px] text-white/40">
        Pick any shade to represent your franchise. Duplicate colors are blocked automatically.
      </p>
    </div>
  );
};
