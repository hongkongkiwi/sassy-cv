import { CVData } from '@/types/cv';

export const cvData: CVData = {
  contact: {
    name: "Your Name",
    title: "Principal Software Engineer",
    email: "your.email@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/yourname",
    github: "https://github.com/yourname",
    website: "https://yourwebsite.com"
  },
  summary: "Principal Software Engineer with 14 years of experience designing and building scalable web applications, leading technical teams, and driving architectural decisions. Expert in modern JavaScript/TypeScript ecosystems, cloud infrastructure, and agile development practices.",
  experience: [
    {
      id: "1",
      company: "Tech Company",
      position: "Principal Software Engineer",
      startDate: "2020-01",
      endDate: null,
      location: "San Francisco, CA",
      description: [
        "Lead architecture and development of core platform serving 10M+ users",
        "Mentor and guide team of 8 engineers across frontend and backend development",
        "Drive technical decision-making for microservices architecture migration",
        "Implement CI/CD pipelines and DevOps practices reducing deployment time by 80%"
      ],
      technologies: ["React", "TypeScript", "Node.js", "AWS", "Docker", "Kubernetes"]
    },
    {
      id: "2",
      company: "Previous Company",
      position: "Senior Software Engineer",
      startDate: "2017-06",
      endDate: "2019-12",
      location: "Remote",
      description: [
        "Built and maintained high-performance web applications using React and Node.js",
        "Collaborated with product and design teams to deliver user-centric features",
        "Optimized application performance resulting in 40% faster load times",
        "Led code reviews and established best practices for team of 5 developers"
      ],
      technologies: ["React", "JavaScript", "Node.js", "PostgreSQL", "Redis"]
    },
    {
      id: "3",
      company: "Earlier Company",
      position: "Full Stack Developer",
      startDate: "2014-03",
      endDate: "2017-05",
      location: "New York, NY",
      description: [
        "Developed full-stack web applications using various technologies",
        "Worked closely with clients to gather requirements and deliver solutions",
        "Maintained and improved legacy systems",
        "Participated in agile development processes"
      ],
      technologies: ["JavaScript", "PHP", "MySQL", "jQuery", "Bootstrap"]
    },
    {
      id: "4",
      company: "First Company",
      position: "Software Developer",
      startDate: "2010-08",
      endDate: "2014-02",
      location: "Boston, MA",
      description: [
        "Started career developing web applications and learning industry best practices",
        "Contributed to various client projects across different industries",
        "Gained experience in database design and server administration"
      ],
      technologies: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"]
    }
  ],
  education: [
    {
      id: "1",
      institution: "University Name",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2006-09",
      endDate: "2010-05",
      location: "Boston, MA",
      description: "Relevant coursework: Data Structures, Algorithms, Software Engineering, Database Systems"
    }
  ],
  projects: [
    {
      id: "1",
      name: "Open Source Project",
      description: "Created and maintain a popular open source library with 5k+ GitHub stars",
      technologies: ["TypeScript", "React", "Node.js"],
      github: "https://github.com/yourname/project",
      url: "https://project-demo.com"
    },
    {
      id: "2",
      name: "Personal Portfolio",
      description: "Built responsive portfolio website showcasing projects and experience",
      technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
      url: "https://yourportfolio.com"
    }
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Go", "SQL"]
    },
    {
      category: "Frontend",
      items: ["React", "Next.js", "Vue.js", "HTML5", "CSS3", "Tailwind CSS"]
    },
    {
      category: "Backend",
      items: ["Node.js", "Express", "FastAPI", "PostgreSQL", "MongoDB", "Redis"]
    },
    {
      category: "Cloud & DevOps",
      items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Git"]
    },
    {
      category: "Tools",
      items: ["VS Code", "Figma", "Jira", "Slack", "Notion"]
    }
  ]
};