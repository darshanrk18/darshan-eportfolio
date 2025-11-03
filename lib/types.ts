export interface SocialLink {
  readonly icon: React.ComponentType<{ className?: string }>
  readonly href: string
  readonly label: string
}

export interface ContactInfo {
  readonly email: string
  readonly linkedin: string
  readonly github: string
  readonly location: string
  readonly phone?: string
}

export interface Education {
  readonly degree: string
  readonly institution: string
  readonly location: string
  readonly period: string
  readonly periodLabel?: string
  readonly gpa: string
  readonly status: 'current' | 'completed'
}

export interface LocationInfo {
  readonly city: string
  readonly state: string
  readonly country: string
  readonly availability: {
    readonly status: string
    readonly description: string
  }
}

export interface FormData {
  readonly name: string
  readonly email: string
  readonly message: string
}

export interface EmailJSError {
  readonly status?: number
  readonly text?: string
}

export interface Skill {
  readonly name: string
  readonly icon: string
}

export interface SkillCategory {
  readonly title: string
  readonly skills: readonly Skill[]
}

export interface Project {
  readonly title: string
  readonly year: string
  readonly description: string
  readonly technologies: readonly string[]
  readonly github: string
  readonly demo: string | null
  readonly isPaper?: boolean
}

export interface Experience {
  readonly type: string
  readonly title: string
  readonly organization: string
  readonly location: string
  readonly period: string
  readonly description: readonly string[]
  readonly icon: string
}

export interface NavigationItem {
  readonly href: string
  readonly label: string
}

