import React, { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

// 4-digit OTP input shared by email verification and forgot-password flows in both portals.
export function OtpInput({ value, onChange, length = 4 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, char: string) {
    if (!/^\d*$/.test(char)) return;
    const chars = value.split('');
    chars[index] = char.slice(-1);
    const next = chars.join('').slice(0, length);
    onChange(next);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-12 rounded-lg border-2 border-gray-300 text-center text-xl font-semibold focus:border-primary focus:outline-none"
        />
      ))}
    </div>
  );
}
