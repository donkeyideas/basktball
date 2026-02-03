import { clsx, type ClassValue } from "clsx";

/**
 * Utility function to merge Tailwind CSS classes
 * Uses clsx for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
