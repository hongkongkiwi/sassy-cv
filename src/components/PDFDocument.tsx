import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CVData } from '@/types/cv';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    color: '#2563eb',
    marginBottom: 15,
    fontWeight: 'normal',
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  contactItem: {
    fontSize: 10,
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    padding: '4 8',
    borderRadius: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  experienceItem: {
    marginBottom: 16,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  company: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateLocation: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    backgroundColor: '#ffffff',
    padding: '3 6',
    borderRadius: 3,
  },
  description: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
    paddingLeft: 12,
    lineHeight: 1.4,
  },
  technologies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tech: {
    fontSize: 8,
    backgroundColor: '#ffffff',
    color: '#2563eb',
    padding: '3 6',
    borderRadius: 4,
    border: '1 solid #e5e7eb',
    fontWeight: 'bold',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  skillCategory: {
    width: '30%',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skillCategoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillItems: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  summary: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.6,
    textAlign: 'justify',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  projectItem: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
  },
  educationItem: {
    marginBottom: 8,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  degree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  institution: {
    fontSize: 10,
    color: '#2563eb',
  },
});

interface PDFDocumentProps {
  data: CVData;
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ data }) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Present';
    const [year, rawMonth = '01'] = date.split('-');
    const monthNum = parseInt(rawMonth, 10);
    const monthIndex = isNaN(monthNum) ? 0 : Math.min(Math.max(monthNum - 1, 0), 11);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthIndex]} ${year}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.contact.name}</Text>
          <Text style={styles.title}>{data.contact.title}</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactItem}>{data.contact.email}</Text>
            {data.contact.phone && (
              <Text style={styles.contactItem}>{data.contact.phone}</Text>
            )}
            <Text style={styles.contactItem}>{data.contact.location}</Text>
            {data.contact.linkedin && (
              <Text style={styles.contactItem}>LinkedIn</Text>
            )}
            {data.contact.github && (
              <Text style={styles.contactItem}>GitHub</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPERIENCE</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.experienceItem}>
              <View style={styles.experienceHeader}>
                <View>
                  <Text style={styles.jobTitle}>{exp.position}</Text>
                  <Text style={styles.company}>{exp.company}</Text>
                </View>
                <View>
                  <Text style={styles.dateLocation}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </Text>
                  <Text style={styles.dateLocation}>{exp.location}</Text>
                </View>
              </View>
              {exp.description.map((desc, index) => (
                <Text key={index} style={styles.description}>
                  • {desc}
                </Text>
              ))}
              {exp.technologies && (
                <View style={styles.technologies}>
                  {exp.technologies.map((tech) => (
                    <Text key={tech} style={styles.tech}>
                      {tech}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SKILLS</Text>
          <View style={styles.skillsGrid}>
            {data.skills.map((skill) => (
              <View key={skill.category} style={styles.skillCategory}>
                <Text style={styles.skillCategoryTitle}>{skill.category}</Text>
                <Text style={styles.skillItems}>{skill.items.join(', ')}</Text>
              </View>
            ))}
          </View>
        </View>

        {data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {data.projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectDescription}>{project.description}</Text>
                <View style={styles.technologies}>
                  {project.technologies.map((tech) => (
                    <Text key={tech} style={styles.tech}>
                      {tech}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDUCATION</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.educationItem}>
              <View style={styles.educationHeader}>
                <View>
                  <Text style={styles.degree}>
                    {edu.degree}{edu.field && ` in ${edu.field}`}
                  </Text>
                  <Text style={styles.institution}>{edu.institution}</Text>
                </View>
                <View>
                  <Text style={styles.dateLocation}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                  <Text style={styles.dateLocation}>{edu.location}</Text>
                </View>
              </View>
              {edu.description && (
                <Text style={styles.description}>{edu.description}</Text>
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};