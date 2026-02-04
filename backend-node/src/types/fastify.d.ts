/**
 * Fastify type extensions for custom properties
 */

import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    userId?: string;
    subscription?: {
      plan: string;
      max_scans: number;
      max_projects: number;
      scans_used: number;
    };
  }
}
