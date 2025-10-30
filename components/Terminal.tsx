'use client'

import { useState, useEffect } from 'react'

interface TerminalProps {
  readonly commands: readonly string[]
  readonly delay?: number
}

export default function Terminal({ commands, delay = 100 }: TerminalProps) {
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const command = commands[currentCommandIndex]
    if (!command) return

    let charIndex = 0
    setDisplayText('')

    const handleNextCommand = () => {
      if (currentCommandIndex < commands.length - 1) {
        setCurrentCommandIndex((prev) => prev + 1)
      } else {
        setTimeout(() => setCurrentCommandIndex(0), 2000)
      }
    }

    const typingInterval = setInterval(() => {
      if (charIndex < command.length) {
        setDisplayText(command.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typingInterval)
        setTimeout(handleNextCommand, 2000)
      }
    }, delay)

    return () => clearInterval(typingInterval)
  }, [currentCommandIndex, commands, delay])

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 dark:bg-black rounded-lg shadow-2xl overflow-hidden font-mono border border-gray-700">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-sm ml-4">terminal</span>
      </div>

      {/* Terminal Body */}
      <div className="p-4 md:p-6 text-green-400 text-sm md:text-base">
        <div className="flex items-start">
          <span className="text-blue-400 mr-2">$</span>
          <div className="flex-1 overflow-x-auto">
            <span className="whitespace-pre-wrap break-words">{displayText}</span>
            {showCursor && <span className="inline-block w-2 h-5 bg-green-400 ml-1 animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

