/**
 * Type Definitions
 * 
 * Centralized TypeScript type and interface definitions for the portfolio.
 * All types are readonly to ensure immutability.
 * 
 * @module lib/types
 */

/**
 * Social media link configuration
 */
export interface SocialLink {
  /** React icon component */
  readonly icon: React.ComponentType<{ className?: string }>
  /** URL to the social media profile */
  readonly href: string
  /** Accessible label for the link */
  readonly label: string
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  readonly email: string
  readonly linkedin: string
  readonly github: string
  readonly location: string
  readonly phone?: string
}

/**
 * Education entry structure
 */
export interface Education {
  /** Degree name */
  readonly degree: string
  /** Institution name */
  readonly institution: string
  /** Location of institution */
  readonly location: string
  /** Time period */
  readonly period: string
  /** Optional period label */
  readonly periodLabel?: string
  /** GPA score */
  readonly gpa: string
  /** Current enrollment status */
  readonly status: 'current' | 'completed'
}

/**
 * Location and availability information
 */
export interface LocationInfo {
  readonly city: string
  readonly state: string
  readonly country: string
  /** Availability status and description */
  readonly availability: {
    readonly status: string
    readonly description: string
  }
}

/**
 * Contact form data structure
 */
export interface FormData {
  readonly name: string
  readonly email: string
  readonly message: string
}

/**
 * EmailJS error response structure
 */
export interface EmailJSError {
  readonly status?: number
  readonly text?: string
}

/**
 * Individual skill structure
 */
export interface Skill {
  /** Skill name */
  readonly name: string
  /** Path to skill icon */
  readonly icon: string
}

/**
 * Skill category with grouped skills
 */
export interface SkillCategory {
  /** Category title (e.g., "Frontend", "Backend") */
  readonly title: string
  /** Array of skills in this category */
  readonly skills: readonly Skill[]
}

/**
 * Project structure
 */
export interface Project {
  /** Project title */
  readonly title: string
  /** Year completed */
  readonly year: string
  /** Project description */
  readonly description: string
  /** Technologies used */
  readonly technologies: readonly string[]
  /** GitHub repository URL */
  readonly github: string
  /** Live demo URL or null if not available */
  readonly demo: string | null
  /** Whether this is a research paper */
  readonly isPaper?: boolean
}

/**
 * Work or teaching experience entry
 */
export interface Experience {
  /** Type of experience (e.g., "Work", "Teaching") */
  readonly type: string
  /** Job or role title */
  readonly title: string
  /** Organization name */
  readonly organization: string
  /** Location */
  readonly location: string
  /** Time period */
  readonly period: string
  /** Array of description bullet points */
  readonly description: readonly string[]
  /** Emoji or icon representation */
  readonly icon: string
}

/**
 * Navigation menu item
 */
export interface NavigationItem {
  /** URL hash or path */
  readonly href: string
  /** Display label */
  readonly label: string
}

