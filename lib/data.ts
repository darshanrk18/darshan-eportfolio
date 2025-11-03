import type { SkillCategory, Project, Experience } from './types'

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    title: 'Languages',
    skills: [
      { name: 'Python', icon: 'python' },
      { name: 'Java', icon: 'java' },
      { name: 'C/C++', icon: 'cpp' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'SQL', icon: 'mysql' },
    ],
  },
  {
    title: 'Frontend & Frameworks',
    skills: [
      { name: 'React', icon: 'react' },
      { name: 'Redux', icon: 'redux' },
      { name: 'Next.js', icon: 'nextjs' },
      { name: 'Node.js', icon: 'nodejs' },
      { name: 'Express', icon: 'expressjs' },
      { name: 'Flask', icon: 'flask' },
      { name: 'Django', icon: 'django' },
    ],
  },
  {
    title: 'Cloud & DevOps',
    skills: [
      { name: 'AWS', icon: 'aws' },
      { name: 'Docker', icon: 'docker' },
      { name: 'Kubernetes', icon: 'kubernetes' },
      { name: 'Terraform', icon: 'terraform' },
      { name: 'Jenkins', icon: 'jenkins' },
      { name: 'GitHub Actions', icon: 'githubactions' },
      { name: 'Prometheus', icon: 'prometheus' },
      { name: 'Grafana', icon: 'grafana' },
    ],
  },
  {
    title: 'Databases',
    skills: [
      { name: 'MySQL', icon: 'mysql' },
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Redis', icon: 'redis' },
      { name: 'Kafka', icon: 'kafka' },
    ],
  },
  {
    title: 'Tools',
    skills: [
      { name: 'Git', icon: 'git' },
      { name: 'Linux', icon: 'linux' },
      { name: 'Jira', icon: 'jira' },
      { name: 'Confluence', icon: 'confluence' },
    ],
  },
] as const

export const PROJECTS_DATA: readonly Project[] = [
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
] as const

export const EXPERIENCES_DATA: readonly Experience[] = [
  {
    type: 'ta',
    title: 'Graduate Teaching Assistant – CS5010: Programming Design Paradigm',
    organization: 'Khoury College of Computer Sciences, Northeastern University',
    location: 'Boston, MA',
    period: 'Sep 2025 -- Present',
    description: [
      'Led weekly labs and office hours for 300+ MSCS students, mentoring in Java OOP, UML, testing (JUnit, JaCoCo), and design patterns (Visitor, Strategy, Adapter).',
      'Conducted code reviews and rubric-based grading, reinforcing best practices in debugging, scalability, and maintainability.',
    ],
    icon: '🎓',
  },
  {
    type: 'engineer',
    title: 'Digital Workplace Engineer',
    organization: 'Schneider Electric',
    location: 'Bengaluru, India',
    period: 'Feb 2021 -- Nov 2023',
    description: [
      'Developed and deployed internal full-stack apps using React, Node.js, Flask, and MySQL, serving 10k+ enterprise users.',
      'Containerized applications with Docker & Kubernetes (Rancher), integrated CI/CD pipelines for automated builds and deployments.',
      'Automated O365 group migrations with Python + Microsoft Graph API, cutting manual workload by 60%.',
      'Architected backend APIs with RESTful design and OAuth2; optimized SQL queries and schemas for 30% lower latency.',
      'Hosted technical workshops on Python automation and Azure scripting; onboarded and mentored new engineers.',
    ],
    icon: '💼',
  },
  {
    type: 'engineer',
    title: 'Graduate Engineering Trainee',
    organization: 'Schneider Electric',
    location: 'Bengaluru, India',
    period: 'Aug 2021 -- Aug 2022',
    description: [
      'Designed and implemented automation scripts using Python and PowerShell, integrating with Microsoft Graph API to streamline O365 license provisioning and user access management.',
      'Built API integrations and automated workflows for enterprise collaboration platforms, reducing manual operational tasks by 50% and improving system reliability.',
      'Developed cloud automation solutions on Azure platform, managing service tickets and implementing automated provisioning pipelines for enterprise-scale deployments.',
      'Created reusable automation frameworks and documented best practices, enabling team scalability and reducing onboarding time for new team members.',
    ],
    icon: '💼',
  },
  {
    type: 'intern',
    title: 'Intern - Global Messaging',
    organization: 'Schneider Electric',
    location: 'Bengaluru, India',
    period: 'Feb 2021 -- Jul 2021',
    description: [
      'Developed automation scripts for Exchange Online and Outlook 365 management, enabling automated user provisioning and reducing manual configuration overhead.',
      'Implemented cloud service integrations and scripting solutions, contributing to operational efficiency improvements in enterprise messaging infrastructure.',
    ],
    icon: '💼',
  },
] as const

