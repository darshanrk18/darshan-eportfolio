'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { FiDownload, FiX } from 'react-icons/fi'
import Terminal from './Terminal'
import { FULL_NAME, SOCIAL_LINKS } from '@/lib/constants'

export default function Hero() {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

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

  return (
    <section
      id="home"
      className="relative h-screen flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 lg:pt-40 pb-8 w-full overflow-hidden"
    >
      {/* Animated Background Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-left w-full z-10 h-full flex flex-col">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center flex-1">
          {/* Left Column - Text Content */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-6 w-full min-w-0">
            {/* Greeting */}
            <div className="space-y-2">
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-500 dark:text-gray-400 mb-2 animate-fade-in">
                Hey, I am
              </p>
              
              {/* Name with Gradient */}
              <div className="relative w-full overflow-hidden">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold font-mono name-gradient name-breathe leading-tight whitespace-nowrap">
                  {FULL_NAME}
                </h1>
                {/* Decorative underline */}
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500 rounded-full opacity-50 blur-sm"></div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 dark:text-gray-200 leading-tight">
                <span className="inline-block">Software Developer</span>
                <br />
                <span className="text-primary-600 dark:text-primary-400">& Graduate Student</span>
              </h2>
              
              {/* Status Badge */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full border border-primary-200 dark:border-primary-800 max-w-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-400 whitespace-normal">
                  Actively Seeking Co-op Opportunities
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
              Master&apos;s student at{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded break-words">
                Northeastern University, Boston
              </span>{" "}
              seeking exciting opportunities to apply my skills and continue
              growing as a software engineer.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
              <a
                href="#contact"
                className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-2xl hover:shadow-primary-500/50 transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden text-sm sm:text-base"
              >
                <span className="relative z-10">Get In Touch</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transform group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <button
                onClick={() => setIsResumeModalOpen(true)}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 rounded-xl font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 overflow-hidden text-sm sm:text-base"
              >
                <FiDownload className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce flex-shrink-0" />
                <span>Resume</span>
                <div className="absolute inset-0 bg-primary-600 dark:bg-primary-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Connect:</span>
              <div className="flex gap-2 sm:gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-2.5 sm:p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all transform hover:-translate-y-1 hover:scale-110 shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-primary-600 flex-shrink-0"
                    aria-label={link.label}
                  >
                    <link.icon className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Terminal */}
          <div className="lg:col-span-5 mt-8 lg:mt-0 w-full min-w-0 lg:flex lg:items-center lg:justify-center">
            <div className="relative w-full max-w-md">
              {/* Glow effect behind terminal */}
              <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative w-full">
                <Terminal
                  commands={[
                    'git commit -m "Building the future, one line at a time"',
                    'echo "Looking for my next opportunity..."',
                    "python -c \"print('Hello, Co-op Opportunities!')\"",
                    "cat skills.txt | grep 'passionate'",
                    "curl -X POST /dream-job --data 'excited=true'",
                    "ls ~/projects | wc -l # too many to count!",
                    "git status # always something in progress",
                    "npm install --save-dev creativity",
                    'echo "Ready to code!" | figlet',
                  ]}
                  delay={80}
                />
              </div>
            </div>
          </div>
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

