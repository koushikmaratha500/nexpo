/** Shared OpenAPI component schemas for Nexpo API documentation. */

export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Customer or admin JWT from login. Session must remain active in the database.',
    },
    internalSecret: {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'x-dispatch-secret',
      description: 'Shared secret for internal dispatch routes (see env REMINDER_DISPATCH_SECRET and variants).',
    },
  },
  schemas: {
    ApiError: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string', description: 'Human-readable error message' },
      },
    },
    PaginatedTransactions: {
      type: 'object',
      required: ['items', 'total'],
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
        total: { type: 'integer', minimum: 0 },
      },
    },
    Transaction: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
        title: { type: 'string' },
        amount: { type: 'number' },
        transactionDate: { type: 'string', format: 'date-time' },
        status: { type: 'string' },
        merchant: { type: 'string', nullable: true },
        notes: { type: 'string', nullable: true },
        category: { $ref: '#/components/schemas/CategoryRef' },
        currency: { $ref: '#/components/schemas/CurrencyRef' },
        paymentType: { $ref: '#/components/schemas/PaymentTypeRef' },
      },
    },
    CategoryRef: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        code: { type: 'string' },
      },
    },
    CurrencyRef: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        name: { type: 'string' },
        symbol: { type: 'string' },
      },
    },
    PaymentTypeRef: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        code: { type: 'string' },
      },
    },
    CustomerDashboard: {
      type: 'object',
      required: ['month', 'totalSpend', 'todaySpend', 'totalDeposits', 'chart', 'categoryBreakdown', 'recentTransactions'],
      properties: {
        month: { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2026-10' },
        totalSpend: { type: 'number' },
        todaySpend: { type: 'number' },
        totalDeposits: { type: 'number' },
        chart: {
          type: 'object',
          properties: {
            labels: { type: 'array', items: { type: 'string' } },
            income: { type: 'array', items: { type: 'number' } },
            expenses: { type: 'array', items: { type: 'number' } },
          },
        },
        categoryBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              percentage: { type: 'integer' },
              color: { type: 'string' },
            },
          },
        },
        recentTransactions: { type: 'array', items: { $ref: '#/components/schemas/ClientTransaction' } },
      },
    },
    ClientTransaction: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
        title: { type: 'string' },
        category: { type: 'string' },
        date: { type: 'string', description: 'DD-MM-YYYY display format' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        status: { type: 'string', enum: ['VERIFIED', 'PENDING', 'DECLINED'] },
      },
    },
    LoginRequest: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
    LoginResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        token: { type: 'string' },
        user: { $ref: '#/components/schemas/UserProfile' },
      },
    },
    UserProfile: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
      },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Missing or invalid bearer token',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    Forbidden: {
      description: 'Insufficient role or plan',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    BadRequest: {
      description: 'Validation failed (Zod)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    NotFound: {
      description: 'Resource not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    ServerError: {
      description: 'Unexpected server error',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
  },
};

export const jsonErrorResponses = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  500: { $ref: '#/components/responses/ServerError' },
};
