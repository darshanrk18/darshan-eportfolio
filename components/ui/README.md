# UI Components Library

This directory contains all reusable UI components following best practices for modularity, extensibility, and maintainability.

## Component Architecture

### Base Components (Foundation Layer)
- **BaseCard**: Foundation card component with variants and glow effects
- **Modal**: Generic modal/dialog component
- **Button**: Reusable button component with variants

### Specialized Components (Feature Layer)
- **SectionHeader**: Section titles with customizable styling
- **SkillCard**: Individual skill display
- **ProjectCard**: Project showcase cards
- **ExperienceCard**: Timeline-based experience display
- **EducationCard**: Education information cards (extends BaseCard)
- **LocationCard**: Location information cards (extends BaseCard)
- **ResumeModal**: Resume download modal (extends Modal)
- **ThemeToggle**: Reusable theme switcher button component

## Design Principles

### 1. **Extensibility**
All components accept:
- `className` prop for custom styling
- Variant props for different visual styles
- Optional configuration props

### 2. **Modularity**
- Components are independent and reusable
- Base components can be extended
- No hardcoded dependencies

### 3. **Performance**
- Components use `React.memo()` where appropriate
- Optimized re-renders
- Efficient animations

### 4. **Type Safety**
- Full TypeScript support
- Readonly props to prevent mutations
- Export types for variant configurations

## Component Usage Examples

### BaseCard with Variants
```tsx
<BaseCard variant="primary" glowEffect={true} hoverEffect={true}>
  {/* Your content */}
</BaseCard>
```

### Modal with Custom Size
```tsx
<Modal 
  isOpen={isOpen} 
  onClose={handleClose}
  title="Custom Title"
  size="lg"
>
  {/* Modal content */}
</Modal>
```

### SectionHeader with Custom Styling
```tsx
<SectionHeader
  title="// My Section"
  description="Custom description"
  size="xl"
  underlineColor="bg-blue-600"
  align="left"
/>
```

### Button with Variants
```tsx
<Button 
  variant="primary" 
  size="lg"
  isLoading={loading}
  leftIcon={<FiDownload />}
  fullWidth
>
  Download
</Button>
```

### ThemeToggle Component
```tsx
<ThemeToggle />
<ThemeToggle showLabel className="custom-class" />
```

## Variant System

### Card Variants
- `default`: Gray borders, neutral colors
- `primary`: Primary color scheme
- `secondary`: Secondary gray scheme
- `success`: Green color scheme
- `info`: Blue color scheme

### Button Variants
- `primary`: Primary action (blue)
- `secondary`: Secondary action (gray)
- `outline`: Outlined button
- `ghost`: Minimal button
- `danger`: Destructive action (red)

### Size Variants
- `sm`: Small
- `md`: Medium (default)
- `lg`: Large
- `xl`: Extra large (for headers)

## Future Extensibility

All components are designed to be easily extended:

1. **Add New Variants**: Extend variant type and add styles
2. **Custom Styling**: Use `className` prop for overrides
3. **New Components**: Extend BaseCard or Modal
4. **Theme Support**: Variants can be theme-aware
5. **Animation Options**: Configurable animation props

## Best Practices

1. Always use TypeScript types
2. Provide JSDoc comments
3. Use `React.memo()` for expensive components
4. Support dark mode
5. Include accessibility attributes
6. Make props optional with sensible defaults

