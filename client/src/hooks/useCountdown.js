import { useState, useEffect } from 'react';

function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

/* Live countdown to a target date, ticking every second. */
export function useCountdown(target) {
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return time;
}
