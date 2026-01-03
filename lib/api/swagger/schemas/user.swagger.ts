export const UserSchemas = {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  UserProfile: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      fullName: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      phone: {
        type: 'string',
        example: '+1 (555) 123-4567',
        nullable: true,
      },
      location: {
        type: 'string',
        example: 'San Francisco, CA',
        nullable: true,
      },
      linkedinUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://linkedin.com/in/johndoe',
        nullable: true,
      },
      githubUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://github.com/johndoe',
        nullable: true,
      },
      portfolioUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://johndoe.com',
        nullable: true,
      },
      summary: {
        type: 'string',
        example: 'Experienced software engineer with 5+ years...',
        nullable: true,
      },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'exp-1',
            },
            company: {
              type: 'string',
              example: 'Tech Corp',
            },
            title: {
              type: 'string',
              example: 'Senior Software Engineer',
            },
            startDate: {
              type: 'string',
              example: '2020-01',
            },
            endDate: {
              type: 'string',
              example: '2023-12',
              nullable: true,
            },
            current: {
              type: 'boolean',
              example: false,
            },
            description: {
              type: 'string',
              example: '• Led development of microservices architecture\n• Improved performance by 40%',
            },
          },
        },
      },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'edu-1',
            },
            school: {
              type: 'string',
              example: 'University of California',
            },
            degree: {
              type: 'string',
              example: 'Bachelor of Science in Computer Science',
            },
            field: {
              type: 'string',
              example: 'Computer Science',
            },
            startDate: {
              type: 'string',
              example: '2015-09',
            },
            endDate: {
              type: 'string',
              example: '2019-05',
            },
            gpa: {
              type: 'string',
              example: '3.8',
              nullable: true,
            },
          },
        },
      },
      skills: {
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      },
      certifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cert-1',
            },
            name: {
              type: 'string',
              example: 'AWS Certified Solutions Architect',
            },
            issuer: {
              type: 'string',
              example: 'Amazon Web Services',
            },
            date: {
              type: 'string',
              example: '2023-06',
            },
            credentialUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://aws.amazon.com/certification/verify/...',
              nullable: true,
            },
          },
        },
      },
      languages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'lang-1',
            },
            language: {
              type: 'string',
              example: 'English',
            },
            proficiency: {
              type: 'string',
              enum: ['NATIVE', 'FLUENT', 'PROFESSIONAL', 'INTERMEDIATE', 'BASIC'],
              example: 'NATIVE',
            },
          },
        },
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
};
