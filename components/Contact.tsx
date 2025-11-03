'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FiMail, FiLinkedin, FiGithub, FiMapPin, FiDownload, FiX } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { CONTACT_INFO } from '@/lib/constants'

export default function Contact() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  
  // Initialize EmailJS (you'll need to replace these with your actual values)
  useEffect(() => {
    // Replace 'YOUR_PUBLIC_KEY' with your EmailJS public key
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY')
  }, [])

  useEffect(() => {
    if (isResumeModalOpen) {
      dialogRef.current?.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      dialogRef.current?.close()
      document.body.style.overflow = 'unset'
    }
  }, [isResumeModalOpen])

  const handleBackdropClick = () => {
    setIsResumeModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Get EmailJS credentials from environment variables
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

    try {
      // Check if environment variables are set
      if (!serviceId || !templateId || !publicKey || 
          serviceId === 'YOUR_SERVICE_ID' || 
          templateId === 'YOUR_TEMPLATE_ID' || 
          publicKey === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS is not configured. Please set up your environment variables.')
      }

      // Send email using EmailJS
      // Note: Recipient email should be set in EmailJS template configuration, not here
      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          reply_to: formData.email, // This allows you to reply directly to the sender
        },
        publicKey
      )

      if (result.text === 'OK') {
        setSubmitted(true)
        setFormData({ name: '', email: '', message: '' })
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitted(false)
        }, 5000)
      } else {
        throw new Error('EmailJS returned an error')
      }
    } catch (err: unknown) {
      // Enhanced error logging for debugging
      console.error('EmailJS Error Details:', {
        error: err,
        serviceId: serviceId ? `${serviceId.substring(0, 4)}...` : 'not set',
        templateId: templateId ? `${templateId.substring(0, 4)}...` : 'not set',
        hasPublicKey: !!publicKey,
      })
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to send message. Please try again or contact me directly via email.'
      
      if (err instanceof Error) {
        if (err.message.includes('EmailJS is not configured')) {
          errorMessage = 'Contact form is not configured yet. Please contact me directly via email.'
        } else if (err.message.includes('Invalid') || err.message.includes('not found')) {
          errorMessage = 'EmailJS configuration error. Please check your service and template IDs in .env.local'
        } else {
          errorMessage = `Error: ${err.message}. Please contact me directly via email.`
        }
      } else if (err && typeof err === 'object' && 'status' in err) {
        const statusErr = err as { status: number; text?: string }
        if (statusErr.status === 400) {
          errorMessage = 'Invalid request. Please check your EmailJS template configuration.'
        } else if (statusErr.status === 401) {
          errorMessage = 'Authentication failed. Please check your EmailJS public key.'
        } else if (statusErr.status === 404) {
          errorMessage = 'Service or template not found. Please verify your EmailJS IDs.'
        } else {
          errorMessage = `EmailJS error (${statusErr.status}): ${statusErr.text || 'Unknown error'}. Please contact me directly via email.`
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-mono">
            {"// Contact"}
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            I&apos;m currently seeking coop opportunities and would love to hear
            from you. Whether you have a question or just want to connect, feel
            free to reach out!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                />
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Your message..."
                ></textarea>
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
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
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

      {/* Resume Modal */}
      {isResumeModalOpen && (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm"
          onCancel={(e) => {
            e.preventDefault()
            setIsResumeModalOpen(false)
          }}
        >
          <div className="fixed inset-0 -z-10" aria-hidden="true" onClick={handleBackdropClick} />
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Download Resume
            </h3>
              <button
                onClick={() => setIsResumeModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-6">
              {/* QR Code */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
                <Image
                  src="/resume/my_resume_qr.png"
                  alt="Scan to view resume"
                  width={200}
                  height={200}
                  className="w-50 h-50"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Scan QR code to view resume online
              </p>

              {/* Divider */}
              <div className="w-full flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Download Button */}
              <a
                href="/resume/Darshan_Ravindra_Konnur_Google_SWE_MS.pdf"
                download="Darshan_Ravindra_Konnur_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                onClick={() => setIsResumeModalOpen(false)}
              >
                <FiDownload className="w-5 h-5" />
                Download PDF
              </a>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}

