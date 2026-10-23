import { jsonErrorResponses } from './components';

const bearer = [{ bearerAuth: [] }];

function get(path: string, summary: string, okSchema: object, extra: Record<string, unknown> = {}) {
  return {
    [path]: {
      get: {
        summary,
        security: bearer,
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: okSchema } },
          },
          ...jsonErrorResponses,
        },
        ...extra,
      },
    },
  };
}

function post(path: string, summary: string, bodySchema: object, okSchema: object, extra: Record<string, unknown> = {}) {
  return {
    [path]: {
      post: {
        summary,
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: bodySchema } },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: okSchema } } },
          201: { description: 'Created', content: { 'application/json': { schema: okSchema } } },
          ...jsonErrorResponses,
        },
        ...extra,
      },
    },
  };
}

/** OpenAPI path definitions for Nexpo HTTP API (app/api). */
export const openApiPaths: Record<string, unknown> = {
  ...get('/api/health', 'Health check', { type: 'object', properties: { ok: { type: 'boolean' } } }, { security: [] }),

  '/api/user/auth/login': {
    post: {
      summary: 'Customer login (OTP or password flow entry)',
      security: [],
      requestBody: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
      },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
        ...jsonErrorResponses,
      },
    },
  },
  '/api/user/auth/register': {
    post: {
      summary: 'Register customer',
      security: [],
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },
  '/api/user/auth/verify': {
    post: {
      summary: 'Verify email OTP',
      security: [],
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },
  '/api/user/auth/profile': {
    get: {
      summary: 'Get customer profile',
      security: bearer,
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
        ...jsonErrorResponses,
      },
    },
    patch: {
      summary: 'Update customer profile',
      security: bearer,
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },
  '/api/user/logout': {
    post: {
      summary: 'Logout customer',
      security: bearer,
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },

  ...get('/api/user/dashboard', 'Customer dashboard (current month metrics)', { $ref: '#/components/schemas/CustomerDashboard' }, {
    parameters: [
      {
        name: 'month',
        in: 'query',
        required: false,
        schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
        description: 'Calendar month (defaults to current month)',
      },
    ],
  }),

  '/api/user/transactions': {
    get: {
      summary: 'List personal transactions (paginated)',
      security: bearer,
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['DEBIT', 'CREDIT'] } },
        { name: 'categoryId', in: 'query', schema: { type: 'string' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        200: {
          description: 'OK',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedTransactions' } } },
        },
        ...jsonErrorResponses,
      },
    },
  },

  '/api/user/transaction': {
    post: {
      summary: 'Create personal transaction (multipart for receipt upload)',
      security: bearer,
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['type', 'amount'],
              properties: {
                type: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
                amount: { type: 'string' },
                title: { type: 'string' },
                transactionDate: { type: 'string' },
                file: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Created' }, ...jsonErrorResponses },
    },
  },

  '/api/user/transaction/{id}': {
    get: {
      summary: 'Get transaction by id',
      security: bearer,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
    patch: {
      summary: 'Update transaction',
      security: bearer,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'multipart/form-data': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
    delete: {
      summary: 'Soft-delete transaction',
      security: bearer,
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },

  '/api/user/transactions/recurring': {
    get: {
      summary: 'Pending recurring occurrences',
      security: bearer,
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
        ...jsonErrorResponses,
      },
    },
    post: {
      summary: 'Approve recurring occurrences',
      security: bearer,
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
        ...jsonErrorResponses,
      },
    },
  },

  ...get('/api/user/reports', 'Customer reports', { type: 'object' }),
  ...get('/api/user/reminders', 'List payment reminders', { type: 'object' }),
  ...get('/api/user/reminders/upcoming', 'Reminders due in next 7 days', { type: 'object' }),

  '/api/user/groups': {
    get: {
      summary: 'List groups',
      security: bearer,
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
        ...jsonErrorResponses,
      },
    },
    post: {
      summary: 'Create group',
      security: bearer,
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
        ...jsonErrorResponses,
      },
    },
  },
  ...get('/api/user/groups/{id}', 'Group detail', { type: 'object' }),
  ...get('/api/user/groups/{id}/balances', 'Group balances', { type: 'object' }),
  ...get('/api/user/groups/{id}/transactions', 'Group transactions', { type: 'object' }),

  ...get('/api/user/notifications', 'In-app notifications', { type: 'object' }),
  ...get('/api/user/notification-preferences', 'Notification preferences', { type: 'object' }),
  ...get('/api/user/plan', 'Current subscription plan', { type: 'object' }),
  ...get('/api/user/billing/subscription', 'Billing subscription', { type: 'object' }),
  ...post('/api/user/billing/checkout', 'Start checkout', { type: 'object' }, { type: 'object' }),

  ...get('/api/ai/health', 'AI configuration health', { type: 'object' }, { security: [] }),
  ...get('/api/ai/insights', 'Proactive AI insights (rate limited)', { type: 'object' }),
  ...post('/api/ai/chat', 'AI chat', { type: 'object' }, { type: 'object' }),
  ...post('/api/ai/ocr', 'Receipt OCR', { type: 'object' }, { type: 'object' }),

  ...get('/api/admin/dashboard', 'Admin dashboard metrics', { type: 'object' }),
  ...get('/api/admin/users', 'List users', { type: 'object' }),
  ...get('/api/admin/reports', 'Admin reports', { type: 'object' }),
  ...get('/api/admin/categories', 'List categories', { type: 'object' }),
  ...get('/api/admin/settings', 'System settings', { type: 'object' }),

  '/api/admin/auth/login': {
    post: {
      summary: 'Admin login',
      security: [],
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },

  '/api/internal/reminders/dispatch': {
    post: {
      summary: 'Dispatch due reminders (internal)',
      security: [{ internalSecret: [] }],
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },
  '/api/internal/billing/dispatch': {
    post: {
      summary: 'Billing lifecycle dispatch (internal)',
      security: [{ internalSecret: [] }],
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },
  '/api/internal/monthly-digest': {
    post: {
      summary: 'Monthly digest dispatch (internal)',
      security: [{ internalSecret: [] }],
      responses: { 200: { description: 'OK' }, ...jsonErrorResponses },
    },
  },

  ...get('/api/public/config', 'Public client config', { type: 'object' }, { security: [] }),
  ...get('/api/support', 'Support ticket (public)', { type: 'object' }, { security: [] }),
};
