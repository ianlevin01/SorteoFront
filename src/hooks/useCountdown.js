import { useEffect, useState } from 'react';

function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    ms,
    finished: ms === 0,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Cuenta regresiva a una fecha ISO. Devuelve null si no hay fecha. */
export function useCountdown(targetIso) {
  const [state, setState] = useState(() => (targetIso ? diff(targetIso) : null));

  useEffect(() => {
    if (!targetIso) {
      setState(null);
      return undefined;
    }
    setState(diff(targetIso));
    const id = setInterval(() => setState(diff(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return state;
}
