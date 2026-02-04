/**
 * Alert Rule Model
 * Defines automated alerts triggered by project metrics
 */

import { ObjectId } from 'mongodb';

export type AlertMetric =
  | 'budget_overrun'
  | 'progress_delay'
  | 'safety_score'
  | 'worker_shortage'
  | 'compliance_violation'
  | 'delays_increase';

export type AlertCondition = '>' | '<' | '>=' | '<=' | '==' | 'changed';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email';

export interface AlertRuleDocument {
  _id?: ObjectId;
  project_id: ObjectId;
  user_id: ObjectId;
  name: string; // User-friendly name (e.g., "Budget Overrun Warning")
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  enabled: boolean;
  notification_channels: NotificationChannel[];
  recipients: string[]; // Phone numbers or emails
  last_triggered?: Date;
  trigger_count: number;
  created_at: Date;
  updated_at: Date;
}

export const ALERT_RULES_COLLECTION = 'alert_rules';

// Pre-built alert templates
export const ALERT_TEMPLATES: Omit<AlertRuleDocument, '_id' | 'project_id' | 'user_id' | 'recipients' | 'last_triggered' | 'trigger_count' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Budget Overrun Warning',
    metric: 'budget_overrun',
    condition: '>',
    threshold: 80,
    enabled: true,
    notification_channels: ['email'],
  },
  {
    name: 'Schedule Delay Alert',
    metric: 'progress_delay',
    condition: '<',
    threshold: -10, // 10% behind expected
    enabled: true,
    notification_channels: ['email', 'sms'],
  },
  {
    name: 'Safety Risk Alert',
    metric: 'safety_score',
    condition: '<',
    threshold: 75,
    enabled: true,
    notification_channels: ['email', 'sms'],
  },
  {
    name: 'Worker Shortage Alert',
    metric: 'worker_shortage',
    condition: '<',
    threshold: -30, // 30% reduction
    enabled: false,
    notification_channels: ['email'],
  },
  {
    name: 'Compliance Violation',
    metric: 'compliance_violation',
    condition: '>',
    threshold: 0,
    enabled: true,
    notification_channels: ['email', 'sms'],
  },
];
