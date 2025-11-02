'use client'

import { FiDownload } from 'react-icons/fi'
import Terminal from './Terminal'
import { FULL_NAME, SOCIAL_LINKS } from '@/lib/constants'

export default function Hero() {

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
                Hi, I&apos;m
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-mono whitespace-nowrap text-primary-600 dark:text-primary-400">
                {FULL_NAME}
              </h1>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
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
                "npm run build",
                'echo "Looking for my next opportunity..."',
                "python -c \"print('Hello, Coop Opportunities!')\"",
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
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 md:px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FiDownload className="w-5 h-5" />
              Resume
            </a>
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
    </section>
  );
}

