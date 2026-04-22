'use client';
import { useEffect, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';

type EventHandler = (data: any) => void;

export function useWebSocket(handlers: Record<string, EventHandler> = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const token = Cookies.get('access_token');
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        handlersRef.current[event]?.(data);
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: string, data: any) => {
    wsRef.current?.send(JSON.stringify({ event, data }));
  }, []);

  return { send };
}
