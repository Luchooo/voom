"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Hook para captura de micrófono (getUserMedia audio).
 */
export function useMicrophone() {
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(async (deviceId?: string): Promise<MediaStream | null> => {
    setError(null);
    try {
      const audio = deviceId
        ? { deviceId: { exact: deviceId } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      streamRef.current = stream;
      setIsActive(true);
      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al acceder al micrófono";
      setError(message);
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setError(null);
  }, []);

  return { start, stop, isActive, error, streamRef };
}
