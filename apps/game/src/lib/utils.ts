// Utility helpers shared across the game application.

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, boolean>
  | ClassValue[];

/**
 * Conditionally joins class names together (shadcn `cn` convention).
 * Supports strings, arrays, and object maps ({ 'class': condition }).
 */
export function cn(...inputs: ClassValue[]): string {
  const result: string[] = [];
  for (const input of inputs) {
    if (!input && input !== 0) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      result.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) result.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) result.push(key);
      }
    }
  }
  return result.join(' ');
}
