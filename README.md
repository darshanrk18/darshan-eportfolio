# Portfolio Website

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS. Designed to showcase skills, projects, and experience as a software developer and graduate student at Northeastern University.

## Features

- **Modern Design**: Clean, professional, and visually appealing interface
- **Fully Responsive**: Optimized for all devices (mobile, tablet, desktop)
- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Engaging transitions and scroll animations using Framer Motion
- **Performance Optimized**: Built with Next.js for optimal performance and SEO
- **Type Safe**: Written in TypeScript for better code quality
- **Industry Best Practices**: Follows modern software engineering principles

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Deployment**: Vercel (Free forever)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

The contact form uses EmailJS to send emails. You need to set up the following environment variables:

**Required variables:**
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID` - Your EmailJS service ID
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` - Your EmailJS template ID
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` - Your EmailJS public key

**For local development:**
1. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

**For production (Vercel):**
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Make sure to select **Production**, **Preview**, and **Development** environments
5. Redeploy your application after adding variables

**Note:** The contact form will display an error message if these variables are not configured. The form will still render, but email sending will be disabled until the variables are set.

### Personal Information

Update the following files with your personal information:

1. **Components** - Update contact information, social links, and content in:
   - `components/features/Hero.tsx` - Main hero section
   - `components/features/About.tsx` - About section
   - `components/features/Contact.tsx` - Contact form and information
   - `components/features/Projects.tsx` - Your projects
   - `components/features/Experience.tsx` - Your experience and education

2. **Metadata** - Update SEO metadata in:
   - `app/layout.tsx` - Site metadata

### Social Links

Update social media links in:
- `components/features/Hero.tsx`
- `components/features/Contact.tsx`
- `components/features/Footer.tsx`

### Projects

Update your projects in `components/features/Projects.tsx` with:
- Project titles and descriptions
- Technologies used
- GitHub repository links
- Live demo links (if available)

## Deployment

This portfolio is configured for free deployment on Vercel:

### Deploy to Vercel (Recommended - Free Forever)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial portfolio setup"
git push origin main
```

2. Go to [vercel.com](https://vercel.com) and sign up/login

3. Click "New Project" and import your GitHub repository

4. Vercel will automatically detect Next.js and configure the project

5. **Important:** Before deploying, add your EmailJS environment variables:
   - Go to **Settings** → **Environment Variables** in your Vercel project
   - Add `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, and `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
   - Select all environments (Production, Preview, Development)
   - Click **Save**

6. Click "Deploy" - Your site will be live in minutes!

Your site will be automatically deployed on every push to the main branch.

**Note:** If you see an error about missing EmailJS environment variables after deployment, make sure you've added them in Vercel's dashboard and redeployed.

### Alternative: Deploy to Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js with minimal configuration
- **GitHub Pages**: Requires static export (modify `next.config.js`)
- **Cloudflare Pages**: Free and fast CDN

## Customization

### Colors

Primary colors can be customized in `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    // Your color palette
  }
}
```

### Fonts

Change fonts in `app/layout.tsx`:
```typescript
import { YourFont } from 'next/font/google'
```

### Components

All components are modular and can be easily customized or extended.

## Project Structure

```
portfolio/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── error.tsx             # Error boundary
│   └── globals.css           # Global styles
├── components/
│   ├── features/             # Feature-specific components
│   │   ├── Hero.tsx          # Hero section
│   │   ├── About.tsx         # About section
│   │   ├── Skills.tsx        # Skills section
│   │   ├── Projects.tsx      # Projects section
│   │   ├── Experience.tsx    # Experience section
│   │   ├── Contact.tsx       # Contact section
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── Footer.tsx        # Footer
│   │   └── Terminal.tsx      # Terminal component
│   ├── providers/            # Context providers
│   │   ├── ThemeProvider.tsx # Dark mode provider
│   │   └── ErrorBoundary.tsx # Error boundary
│   └── ui/                   # Reusable UI components
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
│       ├── ThemeToggle.tsx
│       └── README.md         # UI component documentation
├── hooks/                    # Custom React hooks
│   ├── useEmailJS.ts         # EmailJS integration
│   └── useModal.ts           # Modal state management
├── lib/                      # Library code
│   ├── config/               # Configuration
│   │   ├── env.ts            # Environment variables
│   │   └── theme.ts          # Theme config
│   ├── styles/               # Style constants
│   │   └── animations.ts     # Animations
│   ├── utils/                # Utility functions
│   │   ├── formStyles.ts     # Form styling utilities
│   │   └── index.ts          # Re-exports
│   ├── constants.ts          # Application constants
│   ├── data.ts               # Static data
│   ├── types.ts              # TypeScript types
│   ├── validation.ts         # Validation functions
│   └── resume.ts             # Resume constants
├── public/                   # Static assets
├── package.json              # Dependencies
└── tailwind.config.ts        # Tailwind configuration
```

## Best Practices Implemented

- Component-based architecture
- TypeScript for type safety
- Responsive design (mobile-first)
- SEO optimization
- Accessibility considerations
- Performance optimization
- Clean code structure
- Reusable components
- Modern CSS with Tailwind
- Smooth animations

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to fork this project and customize it for your own portfolio!

## Contact

For questions or suggestions, feel free to reach out!

---

Built with Next.js, TypeScript, and Tailwind CSS

