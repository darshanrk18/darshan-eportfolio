'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useActiveSection } from '@/hooks/useActiveSection'
import { NAV_ITEMS } from '@/lib/constants'
import { ANIMATION_DURATIONS, ANIMATION_DELAYS, ANIMATION_EASING, SPACING } from '@/lib/config'

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * ANIMATION_DELAYS.navItem,
      duration: ANIMATION_DURATIONS.medium,
      ease: ANIMATION_EASING.smooth,
    },
  }),
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
}

const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal,
      ease: ANIMATION_EASING.default,
    },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: ANIMATION_DURATIONS.normal,
      ease: ANIMATION_EASING.default,
      staggerChildren: ANIMATION_DELAYS.stagger / 2,
      delayChildren: ANIMATION_DELAYS.navItem,
    },
  },
}

const mobileMenuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal,
      ease: ANIMATION_EASING.smooth,
    },
  },
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Extract section IDs from NAV_ITEMS (remove # prefix)
  const sectionIds = NAV_ITEMS.map((item) => item.href.replace('#', ''))
  const { activeSection, setActiveSection } = useActiveSection(sectionIds)

  useEffect(() => {
    if (globalThis.window === undefined) return
    
    const handleScroll = () => {
      setIsScrolled(globalThis.window.scrollY > SPACING.scrollThreshold)
    }
    globalThis.window.addEventListener('scroll', handleScroll)
    return () => globalThis.window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      const sectionId = href.replace('#', '')
      
      // Immediately set active section when clicking for instant feedback
      setActiveSection(sectionId)
      setIsMobileMenuOpen(false)
      
      // Update URL hash
      globalThis.window.history.pushState(null, '', href)
      
      // Scroll to section with offset for fixed navbar
      const elementPosition = element.getBoundingClientRect().top + globalThis.window.scrollY
      const offsetPosition = elementPosition - SPACING.navbarHeight
      
      globalThis.window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        isScrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-xl shadow-gray-900/10 dark:shadow-gray-900/50'
          : 'bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <motion.a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="relative text-2xl md:text-3xl font-bold cursor-pointer group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ANIMATION_DELAYS.initial, duration: ANIMATION_DURATIONS.medium }}
            whileHover={{ 
              scale: 1.1,
              rotate: [0, -5, 5, -5, 0],
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="dk-logo-text relative z-10 inline-block">
              DK
            </span>
          </motion.a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item, index) => {
              const sectionId = item.href.replace('#', '')
              const isActive = activeSection === sectionId
              
              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  custom={index}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className={`text-sm font-mono font-medium transition-all duration-300 relative py-2 px-1 group ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="relative z-10">{item.label}</span>
                  
                  {/* Active indicator with gradient */}
                  {isActive && (
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-600 to-transparent dark:via-primary-400"
                      layoutId="navbar-indicator"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    >
                      <motion.span
                        className="absolute inset-0 bg-primary-600 dark:bg-primary-400 blur-sm opacity-50"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: ANIMATION_DURATIONS.slow * 3,
                          repeat: Infinity,
                          ease: ANIMATION_EASING.default,
                        }}
                      />
                    </motion.span>
                  )}
                </motion.a>
              )
            })}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: ANIMATION_DURATIONS.medium, duration: ANIMATION_DURATIONS.normal }}
            >
              <ThemeToggle />
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: ANIMATION_DURATIONS.normal, duration: ANIMATION_DURATIONS.normal }}
            >
              <ThemeToggle />
            </motion.div>
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: ANIMATION_DURATIONS.medium * 0.8, duration: ANIMATION_DURATIONS.normal }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: ANIMATION_DURATIONS.fast }}
                  >
                    <FiX className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: ANIMATION_DURATIONS.fast }}
                  >
                    <FiMenu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {NAV_ITEMS.map((item, index) => {
                  const sectionId = item.href.replace('#', '')
                  const isActive = activeSection === sectionId
                  
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      variants={mobileMenuItemVariants}
                      className={`block text-base font-mono font-medium transition-all pl-4 py-2 rounded-lg border-l-4 relative overflow-hidden ${
                        isActive
                          ? 'text-primary-600 dark:text-primary-400 font-semibold border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-500/20 to-transparent dark:from-primary-400/10 dark:via-primary-400/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: 0 }}
                          transition={{ duration: ANIMATION_DURATIONS.medium }}
                        />
                      )}
                    </motion.a>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

