const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BillXpress API',
    version: '1.0.0',
    description: 'API for BillXpress fintech application - authentication, transactions, and utility bill payments.',
    contact: {
      name: 'BillXpress Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
    {
      url: 'https://billxpress1.vercel.app',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns the health status of the API.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/csrf-token': {
      get: {
        tags: ['Auth'],
        summary: 'Get CSRF token',
        description: 'Returns a CSRF token for use in subsequent POST/PUT/DELETE requests.',
        operationId: 'getCsrfToken',
        responses: {
          '200': {
            description: 'CSRF token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    csrfToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/password-policy': {
      get: {
        tags: ['Auth'],
        summary: 'Get password policy',
        description: 'Returns the password requirements for the application.',
        operationId: 'getPasswordPolicy',
        responses: {
          '200': {
            description: 'Password policy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    minLength: { type: 'integer', example: 8 },
                    maxLength: { type: 'integer', example: 128 },
                    requireUppercase: { type: 'boolean' },
                    requireLowercase: { type: 'boolean' },
                    requireNumber: { type: 'boolean' },
                    requireSpecial: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with email and password.',
        operationId: 'register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticates a user and returns tokens.',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Logs out the current user and invalidates the session.',
        operationId: 'logout',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Uses a refresh token to obtain a new access token.',
        operationId: 'refreshToken',
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Returns the authenticated user\'s profile.',
        operationId: 'getMe',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password',
        description: 'Sends a password reset email to the specified address.',
        operationId: 'forgotPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'If the email exists, a reset link has been sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        description: 'Resets the user\'s password using a valid reset token.',
        operationId: 'resetPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', format: 'password', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password reset successful' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/auth/send-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Send email verification',
        description: 'Sends a verification email to the authenticated user.',
        operationId: 'sendVerification',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Verification email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email',
        description: 'Verifies the user\'s email address using a verification token.',
        operationId: 'verifyEmail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email verified',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Email verified successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update profile',
        description: 'Updates the authenticated user\'s profile information.',
        operationId: 'updateProfile',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProfileUpdate',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/sessions': {
      get: {
        tags: ['Auth'],
        summary: 'List sessions',
        description: 'Returns all active sessions for the authenticated user.',
        operationId: 'getSessions',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Session' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/sessions/{sessionId}': {
      delete: {
        tags: ['Auth'],
        summary: 'Delete a session',
        description: 'Revokes a specific session by ID.',
        operationId: 'deleteSession',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The session ID to delete',
          },
        ],
        responses: {
          '200': {
            description: 'Session deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Session deleted' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'Logout all sessions',
        description: 'Terminates all active sessions for the authenticated user.',
        operationId: 'logoutAll',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'All sessions terminated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'All sessions terminated' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT access token stored in an HTTP-only cookie',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr_abc123' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          emailVerified: { type: 'boolean', example: true },
          phone: { type: 'string', example: '+2348012345678' },
          avatar: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'TXN001' },
          type: {
            type: 'string',
            enum: ['airtime', 'data', 'tv', 'electricity', 'education', 'betting', 'airtime_to_cash', 'wallet_funding'],
          },
          description: { type: 'string', example: 'MTN Airtime Purchase - \u20A6500' },
          amount: { type: 'number', example: -500 },
          status: { type: 'string', enum: ['completed', 'pending', 'failed'] },
          date: { type: 'string', format: 'date-time' },
          recipient: { type: 'string', example: '08035792046' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userAgent: { type: 'string' },
          ip: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          lastActive: { type: 'string', format: 'date-time' },
          isCurrent: { type: 'boolean' },
        },
      },
      ProfileUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'An error occurred' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Conflict: {
        description: 'Conflict - resource already exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
};

export default openapiSpec;
