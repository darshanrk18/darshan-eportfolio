import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import type { SocialLink, ContactInfo, Education, LocationInfo } from './types'

export const FULL_NAME = 'Darshan Ravindra Konnur'

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { icon: FiGithub, href: 'https://github.com/darshanrk18', label: 'GitHub' },
  { icon: FiLinkedin, href: 'https://linkedin.com/in/darshankonnur', label: 'LinkedIn' },
  { icon: FiMail, href: 'mailto:konnur.d@northeastern.edu', label: 'Email' },
] as const

export const CONTACT_INFO: ContactInfo = {
  email: 'konnur.d@northeastern.edu',
  linkedin: 'linkedin.com/in/darshankonnur',
  github: 'github.com/darshanrk18',
  location: 'Boston, Massachusetts, USA',
  phone: '+1 857-339-8772',
} as const

export const EDUCATION_DATA: readonly Education[] = [
  {
    degree: 'MS in Computer Science',
    institution: 'Northeastern University',
    location: 'Boston, Massachusetts',
    period: 'Jan 2025 - Present',
    periodLabel: 'Currently Enrolled',
    gpa: '3.78/4.0',
    status: 'current',
  },
  {
    degree: 'BE in Computer Science',
    institution: 'MS Ramaiah Institute of Technology',
    location: 'Bengaluru, India',
    period: 'Aug 2017 - Jul 2021',
    periodLabel: '4 Years',
    gpa: '8.78/10.0',
    status: 'completed',
  },
] as const

export const LOCATION_DATA: LocationInfo = {
  city: 'Boston',
  state: 'Massachusetts, USA',
  country: 'United States of America',
  availability: {
    status: 'Available Now',
    description: 'Open to on-site & remote opportunities',
  },
} as const

export const NAV_ITEMS = [
  { href: '#home', label: '</Home>' },
  { href: '#about', label: '</AboutMe>' },
  { href: '#skills', label: '</Skills>' },
  { href: '#projects', label: '</Projects>' },
  { href: '#experience', label: '</Experience>' },
  { href: '#contact', label: '</Contact>' },
] as const

export const FOOTER_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
] as const

