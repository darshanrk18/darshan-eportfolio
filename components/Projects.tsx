'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiGithub, FiExternalLink } from 'react-icons/fi'

export default function Projects() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const projects = [
    {
      title: 'TRIPLAY_AI',
      year: '2025',
      description: 'Developed AI game suite featuring Connect Four (Minimax + Alpha-Beta), Snake (A* pathfinding), and gesture-based Rock-Paper-Scissors using OpenCV + Mediapipe. Implemented explainable AI visualizations and achieved 88% food efficiency, 91% optimal moves in Snake AI across 100+ simulations.',
      technologies: ['Python', 'OpenCV', 'Mediapipe', 'Pygame', 'NumPy', 'Pandas'],
      github: 'https://github.com/darshanrk18',
      demo: null,
    },
    {
      title: 'Box Archive',
      year: '2023',
      description: 'Led full lifecycle of Schneider\'s document management platform, containerized with Docker and deployed on Kubernetes. Integrated OAuth (PingID) authentication; optimized MySQL queries and procedures, improving response times by 30%.',
      technologies: ['Python', 'Flask', 'MySQL', 'Docker', 'Kubernetes', 'Rancher', 'OAuth'],
      github: 'https://github.com/darshanrk18',
      demo: null,
    },
    {
      title: 'ExpenseShare',
      year: '2025',
      description: 'Built full-stack SPA for expense tracking; designed MySQL schema with stored procedures and triggers for ACID compliance. Implemented real-time updates and state management with React + Redux, ensuring smooth multi-user experience.',
      technologies: ['JavaScript', 'React', 'Node.js', 'MySQL', 'Redux'],
      github: 'https://github.com/darshanrk18',
      demo: null,
    },
    {
      title: 'Calendar Application',
      year: '2025',
      description: 'Created desktop calendar with support for recurring events, multiple calendars, and time zone handling. Applied SOLID principles and patterns (Command, Adapter, Strategy, Visitor) to ensure extensibility and maintainability.',
      technologies: ['Java', 'Swing', 'MVC', 'Design Patterns', 'OOPs', 'SOLID'],
      github: 'https://github.com/darshanrk18',
      demo: null,
    },
    {
      title: 'Allocation Optimization of Medical Samples',
      year: '2021',
      description: 'Developed optimization model using Mixed Integer Programming to minimize distribution costs for medical testing. Published IEEE paper: "Allocation Optimization of Medical Samples For Distributed Testing".',
      technologies: ['Python', 'MIP', 'React.js'],
      github: 'https://github.com/darshanrk18',
      demo: 'https://ieeexplore.ieee.org/document/9707992',
      isPaper: true,
    },
  ]

  return (
    <section id="projects" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-mono">
            {'// Projects'}
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A selection of projects that showcase my skills and experience in software development
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-4xl font-bold opacity-50">
                    {project.title.charAt(0)}
                  </div>
                </div>
                {project.year && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {project.year}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {project.title}
                  {project.isPaper && (
                    <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                      Published Paper
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <FiGithub className="w-5 h-5" />
                    <span>Code</span>
                  </a>
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <FiExternalLink className="w-5 h-5" />
                      <span>{project.isPaper ? 'View Paper' : 'Live Demo'}</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
