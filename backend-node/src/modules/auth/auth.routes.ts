/**
 * Auth routes - Port of Python routers/auth.py
 */

import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as mongodb from '../../db/mongodb.js';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
} from '../../utils/security.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  TokenResponse,
  UserResponse,
} from './auth.schemas.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import type { UserDocument } from '../../db/mongodb.js';
import { WithId } from 'mongodb';

// Convert MongoDB user document to response format
function userToResponse(user: WithId<UserDocument>): UserResponse {
  // Support both camelCase (prod_vitruviai) and snake_case field names
  const isActive = user.isActive ?? user.is_active ?? true;
  const avatar = user.avatar ?? user.avatar_url ?? null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || 'User',
    role: user.role || 'user',
    is_active: isActive,
    avatar_url: avatar,
  };
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /api/auth/register
  app.post(
    '/register',
    {
      schema: {
        body: registerSchema,
      },
    },
    async (request, reply) => {
      const { email, password, name, phone } = request.body;

      // Check if user exists
      const existingUser = await mongodb.getUserByEmail(email);
      if (existingUser) {
        console.log(`⚠️  [Auth] Registration failed - email already exists: ${email}`);
        return reply.status(400).send({
          detail: 'Email already registered',
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const userId = await mongodb.createUser({
        email,
        password: passwordHash,
        name,
        phone,
      });

      if (!userId) {
        console.log(`❌ [Auth] Failed to create user: ${email}`);
        return reply.status(500).send({
          detail: 'Failed to create user',
        });
      }

      // Get created user
      const user = await mongodb.getUserById(userId);
      if (!user) {
        return reply.status(500).send({
          detail: 'Failed to retrieve created user',
        });
      }

      console.log(`✅ [Auth] New user registered: ${email} (${name})`);
      return reply.status(201).send(userToResponse(user));
    }
  );

  // POST /api/auth/login/json
  app.post(
    '/login/json',
    {
      schema: {
        body: loginSchema,
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await mongodb.getUserByEmail(email);

      if (!user) {
        console.log(`⚠️  [Auth] Login failed - user not found: ${email}`);
        return reply.status(401).send({
          detail: 'Incorrect email or password',
        });
      }

      const passwordValid = await verifyPassword(password, user.password || '');
      if (!passwordValid) {
        console.log(`⚠️  [Auth] Login failed - incorrect password: ${email}`);
        return reply.status(401).send({
          detail: 'Incorrect email or password',
        });
      }

      // Support both camelCase and snake_case field names
      const isActive = user.isActive ?? user.is_active ?? true;
      if (!isActive) {
        console.log(`⚠️  [Auth] Login failed - account disabled: ${email}`);
        return reply.status(403).send({
          detail: 'User account is disabled',
        });
      }

      // Update last login
      const userId = user._id.toString();
      await mongodb.updateLastLogin(userId);

      // Create tokens
      const accessToken = await createAccessToken(userId);
      const refreshToken = await createRefreshToken(userId);

      console.log(`✅ [Auth] Login successful: ${email}`);

      const response: TokenResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
      };

      return response;
    }
  );

  // POST /api/auth/login (alias for login/json)
  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await mongodb.getUserByEmail(email);

      if (!user) {
        return reply.status(401).send({
          detail: 'Incorrect email or password',
        });
      }

      const passwordValid = await verifyPassword(password, user.password || '');
      if (!passwordValid) {
        return reply.status(401).send({
          detail: 'Incorrect email or password',
        });
      }

      const isActive = user.isActive ?? user.is_active ?? true;
      if (!isActive) {
        return reply.status(403).send({
          detail: 'User account is disabled',
        });
      }

      const userId = user._id.toString();
      await mongodb.updateLastLogin(userId);

      const accessToken = await createAccessToken(userId);
      const refreshTokenStr = await createRefreshToken(userId);

      const response: TokenResponse = {
        access_token: accessToken,
        refresh_token: refreshTokenStr,
        token_type: 'bearer',
      };

      return response;
    }
  );

  // POST /api/auth/refresh
  app.post(
    '/refresh',
    {
      schema: {
        body: refreshTokenSchema,
      },
    },
    async (request, reply) => {
      const { refresh_token } = request.body;

      const payload = await decodeToken(refresh_token);

      if (!payload || payload.type !== 'refresh') {
        return reply.status(401).send({
          detail: 'Invalid refresh token',
        });
      }

      const userId = payload.sub;
      if (!userId) {
        return reply.status(401).send({
          detail: 'Invalid refresh token',
        });
      }

      const user = await mongodb.getUserById(userId);
      const isActive = user ? (user.isActive ?? user.is_active ?? true) : false;

      if (!user || !isActive) {
        return reply.status(401).send({
          detail: 'User not found or inactive',
        });
      }

      const accessToken = await createAccessToken(userId);
      const newRefreshToken = await createRefreshToken(userId);

      const response: TokenResponse = {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: 'bearer',
      };

      return response;
    }
  );

  // GET /api/auth/me
  app.get(
    '/me',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({
          detail: 'User not found',
        });
      }

      return userToResponse(request.user);
    }
  );

  // POST /api/auth/logout
  app.post('/logout', async () => {
    return { message: 'Successfully logged out' };
  });
};

export default authRoutes;
