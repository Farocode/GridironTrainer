import { useRef } from "react";

/**
 * Returns a `pick(key, arr)` function that returns a random element
 * of `arr`, remembering the last index returned for each `key` so
 * the same session doesn't show the same phrasing twice in a row.
 */
export function useVariantPicker() {
  const lastRef = useRef({});
  return (key, arr) => {
    if (arr.length === 1) return arr[0];
    let idx = Math.floor(Math.random() * arr.length);
    if (idx === lastRef.current[key]) idx = (idx + 1) % arr.length;
    lastRef.current[key] = idx;
    return arr[idx];
  };
}
