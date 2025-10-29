# 🚀 Quick Start Guide

Get your portfolio up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, TypeScript, Tailwind CSS, and animation libraries.

## Step 2: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your portfolio!

## Step 3: Customize Your Information

Before deploying, update these files with your information:

### Essential Updates:

1. **Contact Information** (Update in these files):
   - `components/Hero.tsx` - Line 21: Update social media links
   - `components/Contact.tsx` - Update email, LinkedIn, GitHub links
   - `components/Footer.tsx` - Update social links

2. **Projects**:
   - `components/Projects.tsx` - Replace example projects with your actual projects

3. **Resume**:
   - Add your resume PDF to `public/resume.pdf`
   - The "Resume" button in Hero section will link to it

4. **About Section**:
   - `components/About.tsx` - Customize your bio and details

5. **SEO Metadata**:
   - `app/layout.tsx` - Update title and description

### Quick Find & Replace:

Search for these placeholders and replace:
- `your.email@example.com` → Your email
- `https://github.com` → Your GitHub profile
- `https://linkedin.com` → Your LinkedIn profile

## Step 4: Build for Production

```bash
npm run build
```

Test the production build locally:
```bash
npm start
```

## Step 5: Deploy (Free Forever!)

See `DEPLOYMENT.md` for detailed deployment instructions to Vercel.

**TL;DR:**
1. Push to GitHub
2. Connect to Vercel
3. Deploy (free!)

## 🎨 Customization Tips

- **Colors**: Edit `tailwind.config.ts` to change the primary color scheme
- **Content**: All text content is in component files, easy to edit
- **Projects**: Add/remove projects in `components/Projects.tsx`
- **Skills**: Update skills in `components/Skills.tsx`

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Customize your information
3. ✅ Test locally: `npm run dev`
4. ✅ Deploy to Vercel (free!)

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Dependencies not installing?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
```bash
# Check for TypeScript errors
npm run build
```

---

**Ready to deploy?** Check out `DEPLOYMENT.md`! 🚀

