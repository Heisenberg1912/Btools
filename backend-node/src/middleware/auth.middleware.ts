/**
 * Auth middleware - JWT verification and user injection.
 * Port of Python utils/deps.py
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeToken, TokenPayload } from '../utils/security.js';
import * as mongodb from '../db/mongodb.js';
import type { UserDocument, UserSubscription } from '../db/mongodb.js';
import { WithId } from 'mongodb';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    user?: WithId<UserDocument>;
    subscription?: UserSubscription;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({
      detail: 'Missing authorization header',
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = await decodeToken(token);

  if (!payload) {
    reply.status(401).send({
      detail: 'Invalid or expired token',
    });
    return;
  }

  if (payload.type !== 'access') {
    reply.status(401).send({
      detail: 'Invalid token type',
    });
    return;
  }

  const userId = payload.sub;
  if (!userId) {
    reply.status(401).send({
      detail: 'Invalid token payload',
    });
    return;
  }

  const user = await mongodb.getUserById(userId);

  if (!user) {
    reply.status(401).send({
      detail: 'User not found',
    });
    return;
  }

  // Support both camelCase and snake_case
  const isActive = user.isActive ?? user.is_active ?? true;
  if (!isActive) {
    reply.status(403).send({
      detail: 'User account is disabled',
    });
    return;
  }

  request.userId = userId;
  request.user = user;
  request.subscription = user.subscription || getDefaultSubscription();
}

export async function requireAuthOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return; // No auth, but optional
  }

  try {
    const token = authHeader.slice(7);
    const payload = await decodeToken(token);

    if (!payload || payload.type !== 'access') {
      return;
    }

    const userId = payload.sub;
    if (!userId) {
      return;
    }

    const user = await mongodb.getUserById(userId);
    if (!user) {
      return;
    }

    const isActive = user.isActive ?? user.is_active ?? true;
    if (!isActive) {
      return;
    }

    request.userId = userId;
    request.user = user;
    request.subscription = user.subscription || getDefaultSubscription();
  } catch {
    // Optional auth, ignore errors
  }
}

export async function checkScanLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First run requireAuth
  await requireAuth(request, reply);

  // If reply was already sent, stop
  if (reply.sent) return;

  const subscription = request.subscription || getDefaultSubscription();
  const scansUsed = subscription.scans_used || 0;
  const scansLimit = subscription.scans_limit || 3;
  const plan = subscription.plan || 'free';

  if (plan === 'free' && scansUsed >= scansLimit) {
    reply.status(403).send({
      detail: 'Scan limit reached. Please upgrade your plan.',
    });
    return;
  }
}

export async function requirePremium(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First run requireAuth
  await requireAuth(request, reply);

  // If reply was already sent, stop
  if (reply.sent) return;

  const subscription = request.subscription || getDefaultSubscription();
  if (subscription.plan === 'free') {
    reply.status(403).send({
      detail: 'Premium subscription required',
    });
    return;
  }
}

function getDefaultSubscription(): UserSubscription {
  return {
    plan: 'free',
    status: 'active',
    scans_used: 0,
    scans_limit: 3,
    has_report_access: false,
    has_api_access: false,
    max_projects: 1,
    started_at: new Date(),
  };
}
