/**
 * ClassName Utilities
 * 
 * Utility functions for managing CSS class names dynamically.
 * Helps reduce complex ternary operators in JSX.
 * 
 * @module lib/utils/className
 */

/**
 * Conditionally joins class names
 * 
 * @param classes - Array of class names or conditional class objects
 * @returns Joined class name string
 * 
 * @example
 * ```ts
 * cn('base-class', { 'conditional-class': condition }, 'another-class')
 * ```
 */
export function cn(...classes: (string | Record<string, boolean> | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'string') return cls
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, condition]) => condition)
          .map(([className]) => className)
          .join(' ')
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Gets alignment classes based on alignment value
 * 
 * @param align - Alignment value (left, center, right)
 * @returns Tailwind alignment classes
 */
export function getAlignClasses(align: 'left' | 'center' | 'right'): string {
  const alignMap = {
    left: '',
    center: 'mx-auto',
    right: 'ml-auto',
  }
  return alignMap[align]
}

