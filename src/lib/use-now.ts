"use client";
import { useState, useEffect } from "react";
export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);
  return now;
}
