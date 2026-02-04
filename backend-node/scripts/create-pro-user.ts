/**
 * Create Pro User Script
 * Creates or upgrades a user to Pro tier with all features enabled
 */

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Titiksha-builtattic:Titiksha%401111@marketplace-builtattic.y8ruzz2.mongodb.net/Titiksha-builtattic?retryWrites=true&w=majority&appName=marketplace-builtattic';
const DATABASE_NAME = process.env.MONGODB_DB || 'Titiksha-builtattic';

// User details - modify these
const USER_EMAIL = 'admin@vitruvi.ai';
const USER_PASSWORD = 'ProUser2024!';
const USER_NAME = 'Pro Admin';

async function createOrUpgradeProUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Check if user exists
    let user = await usersCollection.findOne({ email: USER_EMAIL });

    if (user) {
      console.log(`📝 User found: ${USER_EMAIL} - Upgrading to Pro...`);

      // Upgrade existing user to Pro
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            subscription: {
              plan: 'pro',
              scans_limit: -1, // unlimited
              projects_limit: 10,
              scans_used: 0,
              features: {
                predictive_analytics: true,
                smart_alerts: true,
                portfolio_view: true,
                advanced_financials: true,
                quality_control: true,
                custom_reports: true,
              },
              current_period_start: new Date(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            updated_at: new Date(),
          },
        }
      );

      console.log('✅ User upgraded to Pro tier!');
    } else {
      console.log(`📝 Creating new Pro user: ${USER_EMAIL}`);

      // Hash password
      const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);

      // Create new Pro user
      const result = await usersCollection.insertOne({
        email: USER_EMAIL,
        password: passwordHash,
        name: USER_NAME,
        role: 'user',
        is_active: true,
        subscription: {
          plan: 'pro',
          scans_limit: -1, // unlimited
          projects_limit: 10,
          scans_used: 0,
          features: {
            predictive_analytics: true,
            smart_alerts: true,
            portfolio_view: true,
            advanced_financials: true,
            quality_control: true,
            custom_reports: true,
          },
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log('✅ Pro user created successfully!');
      console.log(`User ID: ${result.insertedId}`);
    }

    console.log('\n🎉 Pro Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${USER_EMAIL}`);
    console.log(`Password: ${USER_PASSWORD}`);
    console.log('Plan: Pro');
    console.log('Scans: Unlimited');
    console.log('Projects: 10');
    console.log('\n✅ Features Enabled:');
    console.log('  ✓ Predictive Analytics');
    console.log('  ✓ Smart Alerts');
    console.log('  ✓ Portfolio Dashboard');
    console.log('  ✓ Advanced Financials');
    console.log('  ✓ Quality Control');
    console.log('  ✓ Custom Reports');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify the subscription
    const updatedUser = await usersCollection.findOne({ email: USER_EMAIL });
    console.log('✅ Verification:', updatedUser?.subscription);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

createOrUpgradeProUser();
