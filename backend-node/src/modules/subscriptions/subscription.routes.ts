/**
 * Subscriptions routes - Port of Python routers/subscriptions.py
 */

import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../../middleware/auth.middleware.js';

const PLAN_DETAILS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '3 project scans',
      'Basic analytics',
      '1 project',
    ],
    scans_limit: 3,
    max_projects: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    features: [
      'Unlimited scans',
      'Advanced analytics',
      '10 projects',
      'Report generation',
      'Email support',
    ],
    scans_limit: -1,
    max_projects: 10,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: [
      'Unlimited everything',
      'API access',
      '100 projects',
      'White-label option',
      'Priority support',
    ],
    scans_limit: -1,
    max_projects: 100,
  },
];

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/subscriptions/plans
  fastify.get('/plans', async () => {
    return { plans: PLAN_DETAILS };
  });

  // GET /api/subscriptions/current
  fastify.get(
    '/current',
    {
      preHandler: [requireAuth],
    },
    async (request) => {
      const subscription = request.user?.subscription || {};
      return {
        plan: subscription.plan || 'free',
        status: subscription.status || 'active',
        scans_used: subscription.scans_used || 0,
        scans_limit: subscription.scans_limit || 3,
        has_report_access: subscription.has_report_access || false,
        has_api_access: subscription.has_api_access || false,
        max_projects: subscription.max_projects || 1,
      };
    }
  );

  // GET /api/subscriptions/usage
  fastify.get(
    '/usage',
    {
      preHandler: [requireAuth],
    },
    async (request) => {
      const subscription = request.user?.subscription || {};
      const scansUsed = subscription.scans_used || 0;
      const scansLimit = subscription.scans_limit || 3;
      const plan = subscription.plan || 'free';

      return {
        scans_used: scansUsed,
        scans_limit: scansLimit,
        scans_remaining: scansLimit > 0 ? Math.max(0, scansLimit - scansUsed) : -1,
        plan,
        is_paywall_active: plan === 'free' && scansUsed >= scansLimit,
      };
    }
  );
};

export default subscriptionRoutes;
