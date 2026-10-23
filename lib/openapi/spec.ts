import { openApiComponents } from './components';
import { openApiPaths } from './paths';

export function buildOpenApiSpec(serverUrl: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Nexpo API',
      version: '0.1.0',
      description:
        'HTTP API for the Nexpo personal finance platform. Authenticated routes require `Authorization: Bearer <JWT>`. ' +
        'Most customer JSON errors use `{ "error": "message" }`. Admin routes require role ADMIN.',
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Customer' },
      { name: 'Transactions' },
      { name: 'Groups' },
      { name: 'Billing' },
      { name: 'AI' },
      { name: 'Admin' },
      { name: 'Internal' },
    ],
    paths: openApiPaths,
    components: openApiComponents,
  };
}
