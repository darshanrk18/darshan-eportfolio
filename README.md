# Portfolio Website

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS. Designed to showcase skills, projects, and experience as a software developer and graduate student at Northeastern University.

## 🚀 Features

- **Modern Design**: Clean, professional, and visually appealing interface
- **Fully Responsive**: Optimized for all devices (mobile, tablet, desktop)
- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Engaging transitions and scroll animations using Framer Motion
- **Performance Optimized**: Built with Next.js for optimal performance and SEO
- **Type Safe**: Written in TypeScript for better code quality
- **Industry Best Practices**: Follows modern software engineering principles

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Deployment**: Vercel (Free forever)

## 📦 Installation

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

## 🔧 Configuration

### Personal Information

Update the following files with your personal information:

1. **Components** - Update contact information, social links, and content in:
   - `components/Hero.tsx` - Main hero section
   - `components/About.tsx` - About section
   - `components/Contact.tsx` - Contact form and information
   - `components/Projects.tsx` - Your projects
   - `components/Experience.tsx` - Your experience and education

2. **Metadata** - Update SEO metadata in:
   - `app/layout.tsx` - Site metadata

### Social Links

Update social media links in:
- `components/Hero.tsx`
- `components/Contact.tsx`
- `components/Footer.tsx`

### Projects

Update your projects in `components/Projects.tsx` with:
- Project titles and descriptions
- Technologies used
- GitHub repository links
- Live demo links (if available)

## 🚀 Deployment

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

5. Click "Deploy" - Your site will be live in minutes!

Your site will be automatically deployed on every push to the main branch.

### Alternative: Deploy to Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js with minimal configuration
- **GitHub Pages**: Requires static export (modify `next.config.js`)
- **Cloudflare Pages**: Free and fast CDN

## 📝 Customization

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

## 📁 Project Structure

```
portfolio/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── Hero.tsx            # Hero section
│   ├── About.tsx           # About section
│   ├── Skills.tsx          # Skills section
│   ├── Projects.tsx        # Projects section
│   ├── Experience.tsx      # Experience section
│   ├── Contact.tsx         # Contact section
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Footer
│   └── ThemeProvider.tsx   # Dark mode provider
├── public/                 # Static assets
├── package.json            # Dependencies
└── tailwind.config.ts      # Tailwind configuration
```

## 🎨 Best Practices Implemented

- ✅ Component-based architecture
- ✅ TypeScript for type safety
- ✅ Responsive design (mobile-first)
- ✅ SEO optimization
- ✅ Accessibility considerations
- ✅ Performance optimization
- ✅ Clean code structure
- ✅ Reusable components
- ✅ Modern CSS with Tailwind
- ✅ Smooth animations

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and customize it for your own portfolio!

## 📧 Contact

For questions or suggestions, feel free to reach out!

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

