/**
 * Contact Section Component
 * 
 * Displays a contact form with EmailJS integration and contact information.
 * Features include:
 * - Client-side form validation
 * - EmailJS integration for sending emails
 * - Error handling and loading states
 * - Contact information display
 * - Resume modal trigger
 * 
 * @component
 */

'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiMail, FiLinkedin, FiGithub, FiMapPin, FiDownload } from 'react-icons/fi'
import { useState, useCallback } from 'react'
import { useEmailJS } from '@/hooks/useEmailJS'
import { inViewConfig, slideInLeft, slideInRight } from '@/lib/styles/animations'
import { validateFormData } from '@/lib/validation'
import { getInputClassName, getTextareaClassName } from '@/lib/utils/formStyles'
import { trackContactFormSubmission } from '@/lib/utils/analytics'
import SectionHeader from '@/components/ui/SectionHeader'
import ResumeModal from '@/components/ui/ResumeModal'
import { CONTACT_INFO } from '@/lib/constants'
import type { FormData } from '@/lib/types'

/**
 * Contact component - Contact form and information section
 * Handles form submission via EmailJS with validation
 * 
 * @returns Contact section with form and information display
 */
export default function Contact() {
  const [ref, inView] = useInView(inViewConfig)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const { sendEmail, isLoading, error, submitted } = useEmailJS({
    onSuccess: () => {
      setFormData({ name: '', email: '', message: '' })
      setFieldErrors({})
      trackContactFormSubmission(true)
    },
    onError: () => {
      trackContactFormSubmission(false)
    },
  })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    const validation = validateFormData(formData)
    const errors: Partial<Record<keyof FormData, string>> = {}
    
    if (!validation.name.isValid) errors.name = validation.name.error
    if (!validation.email.isValid) errors.email = validation.email.error
    if (!validation.message.isValid) errors.message = validation.message.error

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    await sendEmail(formData)
  }, [formData, sendEmail])

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => {
        const updated = { ...prev }
        delete updated[name as keyof FormData]
        return updated
      })
    }
  }, [fieldErrors])

  const contactInfo = [
    {
      icon: FiMail,
      label: 'Email',
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
    },
    {
      icon: FiLinkedin,
      label: 'LinkedIn',
      value: CONTACT_INFO.linkedin,
      href: `https://${CONTACT_INFO.linkedin}`,
    },
    {
      icon: FiGithub,
      label: 'GitHub',
      value: CONTACT_INFO.github,
      href: `https://${CONTACT_INFO.github}`,
    },
    {
      icon: FiMapPin,
      label: 'Location',
      value: CONTACT_INFO.location,
      href: '#',
    },
  ]

  return (
    <section
      id="contact"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50 overflow-x-hidden w-full"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="// Contact"
          description="I'm currently seeking coop opportunities and would love to hear from you. Whether you have a question or just want to connect, feel free to reach out!"
        />

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div
            {...slideInLeft}
            animate={inView ? slideInLeft.animate : slideInLeft.initial}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Send a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={getInputClassName(!!fieldErrors.name)}
                  placeholder="Your name"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={getInputClassName(!!fieldErrors.email)}
                  placeholder="your.email@example.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  autoComplete="off"
                  className={getTextareaClassName(!!fieldErrors.message)}
                  placeholder="Your message..."
                  aria-invalid={!!fieldErrors.message}
                  aria-describedby={fieldErrors.message ? 'message-error' : undefined}
                ></textarea>
                {fieldErrors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.message}
                  </p>
                )}
              </div>
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading || submitted}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 disabled:hover:translate-y-0"
              >
                {isLoading && (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                )}
                {!isLoading && submitted && "Message Sent! ✓"}
                {!isLoading && !submitted && "Send Message"}
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            {...slideInRight}
            animate={inView ? slideInRight.animate : slideInRight.initial}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Contact Information
              </h3>
              <div className="space-y-4">
                {contactInfo.map((info) => (
                  <a
                    key={info.label}
                    href={info.href}
                    target={info.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      info.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <info.icon className="w-6 h-6 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {info.label}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {info.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-4">
                Looking for Coop Opportunities
              </h3>
              <p className="opacity-90 leading-relaxed mb-6">
                I&apos;m actively seeking coop opportunities where I can
                contribute my skills and learn from experienced teams. If
                you&apos;re looking for a motivated software developer ready to
                make an impact, let&apos;s connect!
              </p>
              <button
                onClick={() => setIsResumeModalOpen(true)}
                className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border-2 border-white/30"
              >
                <FiDownload className="w-5 h-5" />
                View Resume
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <ResumeModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} source="contact" />
    </section>
  );
}
