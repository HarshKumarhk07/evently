import { useRef } from 'react';

/* Six separate boxes that behave as one numeric OTP field. */
export default function OTPInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const digits = value.padEnd(length).split('').slice(0, length);

  const setDigit = (i, digit) => {
    const next = digits.map((d, idx) => (idx === i ? digit : d)).join('').trim();
    onChange(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={digits[i].trim()}
          onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-13 w-full max-w-[3.25rem] rounded-xl border border-ink-600 bg-ink-900 text-center font-display text-xl font-bold text-white transition-colors focus:border-brand-500"
        />
      ))}
    </div>
  );
}
