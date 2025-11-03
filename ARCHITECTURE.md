# Portfolio Architecture & Structure

This document outlines the architecture and best practices followed in this portfolio codebase.

## Project Structure

```
portfolio/
├── app/                      # Next.js App Router (pages & layouts)
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Home page
│   ├── error.tsx             # Error boundary for App Router
│   └── globals.css           # Global styles & animations
│
├── components/                # React components
│   ├── features/             # Feature-specific components (page sections)
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Skills.tsx
│   │   ├── Projects.tsx
│   │   ├── Experience.tsx
│   │   ├── Contact.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── Terminal.tsx
│   │
│   ├── providers/            # Context providers
│   │   ├── ThemeProvider.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   └── ui/                   # Reusable UI primitives (Design System)
│       ├── BaseCard.tsx
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── SectionHeader.tsx
│       ├── SkillCard.tsx
│       ├── ProjectCard.tsx
│       ├── ExperienceCard.tsx
│       ├── EducationCard.tsx
│       ├── LocationCard.tsx
│       ├── ResumeModal.tsx
│       └── README.md         # UI component documentation
│
├── hooks/                    # Custom React hooks
│   ├── useModal.ts
│   └── useEmailJS.ts
│
├── lib/                      # Library code & business logic
│   ├── config/               # Configuration & environment setup
│   │   ├── env.ts            # Environment variable validation
│   │   └── theme.ts          # Theme configuration constants
│   │
│   ├── utils/                # Utility functions
│   │   ├── format.ts         # Formatting utilities
│   │   ├── date.ts           # Date utilities
│   │   └── index.ts          # Re-exports
│   │
│   ├── styles/               # Style constants & design tokens
│   │   ├── animations.ts     # Animation configurations
│   │   └── design-tokens.ts  # Colors, spacing, typography
│   │
│   ├── constants.ts          # Application constants
│   ├── data.ts               # Static data (skills, projects, experience)
│   ├── types.ts              # TypeScript type definitions
│   └── validation.ts         # Validation schemas & functions
│
├── public/                   # Static assets
│   ├── resume/
│   ├── professional-photo/
│   └── skill-icons/
│
└── config files              # Configuration files
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── next.config.js
```

## Design Principles

### 1. **Separation of Concerns**
- **Features**: Page sections and feature-specific components
- **UI Components**: Reusable, generic UI primitives
- **Providers**: Context providers and error boundaries
- **Business Logic**: Hooks, utilities, validation in `lib/`

### 2. **Single Responsibility Principle (SRP)**
- Each component has one clear purpose
- UI components are agnostic to business logic
- Data is separated from presentation

### 3. **Don't Repeat Yourself (DRY)**
- Reusable UI components in `components/ui/`
- Centralized constants in `lib/constants.ts`
- Shared data in `lib/data.ts`
- Common utilities in `lib/utils/`

### 4. **Type Safety**
- All types defined in `lib/types.ts`
- Strict TypeScript configuration
- Read-only props where appropriate

### 5. **Scalability**
- Feature-based organization for easy extension
- Modular architecture supports team collaboration
- Clear boundaries between layers

## Component Hierarchy

### Feature Components (`components/features/`)
- Page sections that compose UI components
- Contain business logic specific to that feature
- Import from `components/ui/` for reusable elements

### UI Components (`components/ui/`)
- Pure, reusable UI primitives
- Agnostic to business logic
- Highly configurable via props
- Documented with variants and examples

### Providers (`components/providers/`)
- Context providers (Theme, etc.)
- Error boundaries
- Global state management

## Data Flow

```
lib/data.ts / lib/constants.ts
    ↓
components/features/[Feature].tsx
    ↓
components/ui/[Card].tsx
    ↓
DOM
```

## Best Practices

### File Naming
- **Components**: PascalCase (`Hero.tsx`)
- **Hooks**: camelCase with `use` prefix (`useModal.ts`)
- **Utils**: camelCase (`format.ts`)
- **Types**: camelCase (`types.ts`)
- **Constants**: camelCase (`constants.ts`)

### Import Order
1. React & Next.js imports
2. Third-party libraries
3. Internal components (`@/components/...`)
4. Hooks (`@/hooks/...`)
5. Utilities (`@/lib/...`)
6. Types (`@/lib/types`)

### Component Organization
- One component per file
- Related types exported from same file or `lib/types.ts`
- Default export for main component
- Named exports for sub-components/types

## Extensibility

### Adding a New Feature Section
1. Create component in `components/features/`
2. Add data to `lib/data.ts` if needed
3. Import in `app/page.tsx`
4. Use UI components from `components/ui/`

### Adding a New UI Component
1. Create in `components/ui/`
2. Document variants in component JSDoc
3. Add types to `lib/types.ts` if needed
4. Update `components/ui/README.md`

### Adding a New Utility
1. Create in `lib/utils/`
2. Export from `lib/utils/index.ts`
3. Add JSDoc documentation
4. Write tests if applicable

## Current Status

**Well Structured:**
- Clear separation of UI primitives (`components/ui/`)
- Centralized data (`lib/data.ts`, `lib/constants.ts`)
- Custom hooks organized (`hooks/`)
- Type definitions centralized (`lib/types.ts`)

**Completed:**
- Feature components organized in `components/features/`
- Providers organized in `components/providers/`
- Environment configuration in `lib/config/`
- Utility functions structure in `lib/utils/`
- Style constants in `lib/styles/`

---

This architecture ensures maintainability, scalability, and follows industry best practices for React/Next.js applications.

