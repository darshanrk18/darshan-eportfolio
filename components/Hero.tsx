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
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 w-full"
    >
      <div className="max-w-4xl mx-auto text-left w-full">
        <div>
          <div className="mb-6">
            <div className="flex flex-col items-start">
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-4">
                Hey, I&apos;m
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-mono whitespace-nowrap name-gradient name-breathe">
                {FULL_NAME}
              </h1>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Software Developer & Graduate Student
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
            Master&apos;s student at{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              Northeastern University, Boston
            </span>{" "}
            seeking exciting coop opportunities to apply my skills and continue
            growing as a software engineer.
          </p>

          {/* Terminal */}
          <div className="mb-12">
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

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#contact"
              className="px-4 sm:px-6 md:px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Get In Touch
            </a>
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-4 sm:px-6 md:px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FiDownload className="w-5 h-5" />
              Resume
            </button>
          </div>

          <div className="flex justify-center space-x-6">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-all transform hover:-translate-y-1 hover:scale-110"
                aria-label={link.label}
              >
                <link.icon className="w-6 h-6" />
              </a>
            ))}
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

