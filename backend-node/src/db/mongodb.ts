/**
 * MongoDB service - Primary database for VitruviAI.
 * Port of Python mongodb_service.py
 *
 * Optimized for serverless (Vercel) with connection caching
 */

import { MongoClient, Db, ObjectId, WithId, Document } from 'mongodb';
import { config } from '../config/index.js';

// Global connection cache for serverless environments
// These persist between invocations in the same container
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// For backwards compatibility
let client: MongoClient | null = null;
let db: Db | null = null;

// ==================== CONNECTION ====================

export async function connectMongoDB(): Promise<void> {
  if (!config.MONGODB_URI) {
    console.error('[MongoDB] MONGODB_URI not configured!');
    return;
  }

  // Return cached connection if available and connected
  if (cachedClient && cachedDb) {
    try {
      // Verify connection is still alive
      await cachedDb.command({ ping: 1 });
      client = cachedClient;
      db = cachedDb;
      console.log(`[MongoDB] Using cached connection to: ${config.MONGODB_DB}`);
      return;
    } catch {
      // Connection stale, reconnect
      console.log('[MongoDB] Cached connection stale, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    // Create new client with serverless-optimized settings
    const newClient = new MongoClient(config.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await newClient.connect();
    const newDb = newClient.db(config.MONGODB_DB);
    await newDb.command({ ping: 1 });

    // Cache the connection
    cachedClient = newClient;
    cachedDb = newDb;
    client = newClient;
    db = newDb;

    console.log(`[MongoDB] Connected to: ${config.MONGODB_DB}`);
  } catch (error) {
    console.error('[MongoDB] Failed to connect:', error);
    cachedClient = null;
    cachedDb = null;
    client = null;
    db = null;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Disconnected');
  }
}

export function getDb(): Db | null {
  return db;
}

export function isMongoConnected(): boolean {
  return db !== null;
}

// ==================== USER TYPES ====================

export interface UserSubscription {
  plan: string;
  status: string;
  scans_used: number;
  scans_limit: number;
  has_report_access: boolean;
  has_api_access: boolean;
  max_projects: number;
  started_at: Date;
}

export interface UserDocument {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  isActive?: boolean; // Support camelCase from marketplace
  is_verified: boolean;
  avatar_url?: string | null;
  avatar?: string | null; // Support marketplace field
  created_at: Date;
  updated_at: Date;
  last_login?: Date | null;
  apps: string[];
  subscription: UserSubscription;
}

// ==================== USER OPERATIONS ====================

export async function getUserByEmail(email: string): Promise<WithId<UserDocument> | null> {
  if (!db) return null;
  try {
    const user = await db.collection<UserDocument>('users').findOne({
      email: email.toLowerCase()
    });
    return user;
  } catch (error) {
    console.error('[MongoDB] Error fetching user by email:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<WithId<UserDocument> | null> {
  if (!db) return null;
  try {
    const user = await db.collection<UserDocument>('users').findOne({
      _id: new ObjectId(userId)
    });
    return user;
  } catch (error) {
    console.error('[MongoDB] Error fetching user by ID:', error);
    return null;
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<string | null> {
  if (!db) return null;
  try {
    const userDoc: Omit<UserDocument, '_id'> = {
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name,
      phone: data.phone || null,
      role: 'client',
      is_active: true,
      is_verified: false,
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null,
      apps: ['vitruviai'],
      subscription: {
        plan: 'free',
        status: 'active',
        scans_used: 0,
        scans_limit: 3,
        has_report_access: false,
        has_api_access: false,
        max_projects: 1,
        started_at: new Date(),
      },
    };

    const result = await db.collection<UserDocument>('users').insertOne(userDoc as UserDocument);
    console.log(`[MongoDB] Created user: ${data.email}`);
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating user:', error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<UserDocument>): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<UserDocument>('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updates, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error updating user:', error);
    return false;
  }
}

export async function updateLastLogin(userId: string): Promise<boolean> {
  return updateUser(userId, { last_login: new Date() } as Partial<UserDocument>);
}

// ==================== SUBSCRIPTION OPERATIONS ====================

export async function getUserSubscription(email: string): Promise<UserSubscription | null> {
  if (!db) return null;
  try {
    const user = await db.collection<UserDocument>('users').findOne(
      { email: email.toLowerCase() },
      { projection: { subscription: 1 } }
    );
    return user?.subscription || null;
  } catch (error) {
    console.error('[MongoDB] Error fetching subscription:', error);
    return null;
  }
}

export async function incrementScanUsage(userId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<UserDocument>('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { 'subscription.scans_used': 1 },
        $set: { updated_at: new Date() }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error incrementing scan usage:', error);
    return false;
  }
}

export async function updateSubscription(
  userId: string,
  plan: string,
  scansLimit: number
): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<UserDocument>('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'subscription.plan': plan,
          'subscription.scans_limit': scansLimit,
          'subscription.has_report_access': plan !== 'free',
          'subscription.has_api_access': plan === 'enterprise',
          'subscription.max_projects': plan === 'free' ? 1 : (plan === 'pro' ? 10 : 100),
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error updating subscription:', error);
    return false;
  }
}

// ==================== PROJECT TYPES ====================

export interface ProjectDocument {
  _id: ObjectId;
  user_id: ObjectId;
  name: string;
  description: string;
  location: string;
  mode: 'under-construction' | 'completed';
  status: string;
  created_at: Date;
  updated_at: Date;
  analyses: AnalysisData[];
  project_data: ProjectData | null;
}

export interface AnalysisData {
  created_at: Date;
  stage: string;
  progressPercentage: number;
  confidence_score: number;
  insights: string[];
  project_data?: ProjectData;
  [key: string]: unknown;
}

export interface ProjectData {
  id: string;
  name: string;
  location: string;
  lastUpdated: string;
  stage: string;
  progressPercentage: number;
  timeRemaining: string;
  criticalPath: string;
  delaysFlagged: number;
  burnRate: number;
  manpower: Record<string, unknown>;
  machinery: Record<string, unknown>;
  materials: Record<string, unknown>[];
  financials: Record<string, unknown>;
  valuation: Record<string, unknown>;
  compliance: Record<string, unknown>;
  geo: Record<string, unknown>;
  charts: Record<string, unknown>;
  insights: string[];
}

// ==================== PROJECT OPERATIONS ====================

export async function createProject(
  userId: string,
  name: string,
  description: string = '',
  location: string = '',
  mode: 'under-construction' | 'completed' = 'under-construction'
): Promise<string | null> {
  if (!db) return null;
  try {
    const projectDoc: Omit<ProjectDocument, '_id'> = {
      user_id: new ObjectId(userId),
      name,
      description,
      location,
      mode,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      analyses: [],
      project_data: null,
    };

    const result = await db.collection<ProjectDocument>('projects').insertOne(projectDoc as ProjectDocument);
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating project:', error);
    return null;
  }
}

export async function getProject(projectId: string): Promise<WithId<ProjectDocument> | null> {
  if (!db) return null;
  try {
    const project = await db.collection<ProjectDocument>('projects').findOne({
      _id: new ObjectId(projectId)
    });
    return project;
  } catch (error) {
    console.error('[MongoDB] Error fetching project:', error);
    return null;
  }
}

export async function getUserProjects(
  userId: string,
  skip: number = 0,
  limit: number = 10
): Promise<WithId<ProjectDocument>[]> {
  if (!db) return [];
  try {
    const cursor = db.collection<ProjectDocument>('projects')
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    return await cursor.toArray();
  } catch (error) {
    console.error('[MongoDB] Error fetching projects:', error);
    return [];
  }
}

export async function countUserProjects(userId: string): Promise<number> {
  if (!db) return 0;
  try {
    return await db.collection<ProjectDocument>('projects').countDocuments({
      user_id: new ObjectId(userId)
    });
  } catch (error) {
    console.error('[MongoDB] Error counting projects:', error);
    return 0;
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<ProjectDocument>
): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<ProjectDocument>('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { ...updates, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error updating project:', error);
    return false;
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<ProjectDocument>('projects').deleteOne({
      _id: new ObjectId(projectId)
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error deleting project:', error);
    return false;
  }
}

export async function addAnalysis(
  projectId: string,
  analysisData: AnalysisData
): Promise<boolean> {
  if (!db) return false;
  try {
    analysisData.created_at = new Date();
    const result = await db.collection<ProjectDocument>('projects').updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: { analyses: analysisData },
        $set: {
          project_data: analysisData.project_data || null,
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error adding analysis:', error);
    return false;
  }
}

// ==================== NOTIFICATION OPERATIONS ====================

export interface NotificationDocument {
  _id: ObjectId;
  user_id: ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
): Promise<string | null> {
  if (!db) return null;
  try {
    const notifDoc: Omit<NotificationDocument, '_id'> = {
      user_id: new ObjectId(userId),
      type,
      title,
      message,
      read: false,
      created_at: new Date(),
    };

    const result = await db.collection<NotificationDocument>('notifications').insertOne(
      notifDoc as NotificationDocument
    );
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating notification:', error);
    return null;
  }
}

export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<WithId<NotificationDocument>[]> {
  if (!db) return [];
  try {
    const query: Record<string, unknown> = { user_id: new ObjectId(userId) };
    if (unreadOnly) {
      query.read = false;
    }

    const cursor = db.collection<NotificationDocument>('notifications')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit);

    return await cursor.toArray();
  } catch (error) {
    console.error('[MongoDB] Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationsRead(notificationIds: string[]): Promise<number> {
  if (!db) return 0;
  try {
    const objectIds = notificationIds.map(id => new ObjectId(id));
    const result = await db.collection<NotificationDocument>('notifications').updateMany(
      { _id: { $in: objectIds } },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('[MongoDB] Error marking notifications read:', error);
    return 0;
  }
}

// ==================== REPORT OPERATIONS ====================

export interface ReportDocument {
  _id: ObjectId;
  project_id: ObjectId;
  user_id: ObjectId;
  report_type: string;
  report_format: string;
  file_url: string;
  created_at: Date;
}

export async function createReport(
  projectId: string,
  userId: string,
  reportType: string,
  reportFormat: string,
  fileUrl: string
): Promise<string | null> {
  if (!db) return null;
  try {
    const reportDoc: Omit<ReportDocument, '_id'> = {
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      report_type: reportType,
      report_format: reportFormat,
      file_url: fileUrl,
      created_at: new Date(),
    };

    const result = await db.collection<ReportDocument>('reports').insertOne(
      reportDoc as ReportDocument
    );
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating report:', error);
    return null;
  }
}

export async function getProjectReports(projectId: string): Promise<WithId<ReportDocument>[]> {
  if (!db) return [];
  try {
    const cursor = db.collection<ReportDocument>('reports')
      .find({ project_id: new ObjectId(projectId) })
      .sort({ created_at: -1 });

    return await cursor.toArray();
  } catch (error) {
    console.error('[MongoDB] Error fetching reports:', error);
    return [];
  }
}

// ==================== ANALYSIS HISTORY OPERATIONS ====================

import type { AnalysisHistoryDocument, AnalysisSnapshot, AnalysisDelta } from './models/analysis-history.model.js';
import { ANALYSIS_HISTORY_COLLECTION } from './models/analysis-history.model.js';

export async function createAnalysisHistory(
  projectId: string,
  userId: string,
  snapshot: AnalysisSnapshot,
  deltas?: AnalysisDelta
): Promise<string | null> {
  if (!db) return null;
  try {
    const historyDoc: Omit<AnalysisHistoryDocument, '_id'> = {
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      analysis_date: new Date(),
      snapshot,
      deltas,
      created_at: new Date(),
    };

    const result = await db.collection<AnalysisHistoryDocument>(ANALYSIS_HISTORY_COLLECTION).insertOne(
      historyDoc as AnalysisHistoryDocument
    );
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating analysis history:', error);
    return null;
  }
}

export async function getAnalysisHistory(
  projectId: string,
  limit: number = 30
): Promise<WithId<AnalysisHistoryDocument>[]> {
  if (!db) return [];
  try {
    const cursor = db.collection<AnalysisHistoryDocument>(ANALYSIS_HISTORY_COLLECTION)
      .find({ project_id: new ObjectId(projectId) })
      .sort({ analysis_date: -1 })
      .limit(limit);

    return await cursor.toArray();
  } catch (error) {
    console.error('[MongoDB] Error fetching analysis history:', error);
    return [];
  }
}

export async function getLatestAnalysis(
  projectId: string
): Promise<WithId<AnalysisHistoryDocument> | null> {
  if (!db) return null;
  try {
    const doc = await db.collection<AnalysisHistoryDocument>(ANALYSIS_HISTORY_COLLECTION)
      .findOne(
        { project_id: new ObjectId(projectId) },
        { sort: { analysis_date: -1 } }
      );

    return doc;
  } catch (error) {
    console.error('[MongoDB] Error fetching latest analysis:', error);
    return null;
  }
}

export async function getPreviousAnalysis(
  projectId: string,
  beforeDate: Date
): Promise<WithId<AnalysisHistoryDocument> | null> {
  if (!db) return null;
  try {
    const doc = await db.collection<AnalysisHistoryDocument>(ANALYSIS_HISTORY_COLLECTION)
      .findOne(
        {
          project_id: new ObjectId(projectId),
          analysis_date: { $lt: beforeDate }
        },
        { sort: { analysis_date: -1 } }
      );

    return doc;
  } catch (error) {
    console.error('[MongoDB] Error fetching previous analysis:', error);
    return null;
  }
}

export async function getAnalysisCount(projectId: string): Promise<number> {
  if (!db) return 0;
  try {
    return await db.collection<AnalysisHistoryDocument>(ANALYSIS_HISTORY_COLLECTION)
      .countDocuments({ project_id: new ObjectId(projectId) });
  } catch (error) {
    console.error('[MongoDB] Error counting analyses:', error);
    return 0;
  }
}

// ==================== ALERT RULE OPERATIONS ====================

import type { AlertRuleDocument } from './models/alert-rule.model.js';
import { ALERT_RULES_COLLECTION } from './models/alert-rule.model.js';

export async function createAlertRule(
  projectId: string,
  userId: string,
  ruleData: Omit<AlertRuleDocument, '_id' | 'project_id' | 'user_id' | 'trigger_count' | 'created_at' | 'updated_at'>
): Promise<string | null> {
  if (!db) return null;
  try {
    const ruleDoc: Omit<AlertRuleDocument, '_id'> = {
      ...ruleData,
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      trigger_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION).insertOne(
      ruleDoc as AlertRuleDocument
    );
    return result.insertedId.toString();
  } catch (error) {
    console.error('[MongoDB] Error creating alert rule:', error);
    return null;
  }
}

export async function getAlertRules(
  projectId: string,
  enabledOnly: boolean = false
): Promise<WithId<AlertRuleDocument>[]> {
  if (!db) return [];
  try {
    const filter: any = { project_id: new ObjectId(projectId) };
    if (enabledOnly) {
      filter.enabled = true;
    }

    const cursor = db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION)
      .find(filter)
      .sort({ created_at: -1 });

    return await cursor.toArray();
  } catch (error) {
    console.error('[MongoDB] Error fetching alert rules:', error);
    return [];
  }
}

export async function getAlertRule(ruleId: string): Promise<WithId<AlertRuleDocument> | null> {
  if (!db) return null;
  try {
    return await db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION)
      .findOne({ _id: new ObjectId(ruleId) });
  } catch (error) {
    console.error('[MongoDB] Error fetching alert rule:', error);
    return null;
  }
}

export async function updateAlertRule(
  ruleId: string,
  updates: Partial<Omit<AlertRuleDocument, '_id' | 'project_id' | 'user_id' | 'created_at'>>
): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION).updateOne(
      { _id: new ObjectId(ruleId) },
      { $set: { ...updates, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error updating alert rule:', error);
    return false;
  }
}

export async function deleteAlertRule(ruleId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION).deleteOne({
      _id: new ObjectId(ruleId),
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error deleting alert rule:', error);
    return false;
  }
}

export async function incrementAlertTriggerCount(ruleId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const result = await db.collection<AlertRuleDocument>(ALERT_RULES_COLLECTION).updateOne(
      { _id: new ObjectId(ruleId) },
      {
        $inc: { trigger_count: 1 },
        $set: { last_triggered: new Date() }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[MongoDB] Error incrementing alert trigger count:', error);
    return false;
  }
}