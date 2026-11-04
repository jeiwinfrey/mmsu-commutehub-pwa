"use client";
import { useState, useEffect } from "react";
export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);
  return now;
}
