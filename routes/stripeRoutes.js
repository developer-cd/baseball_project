/**
 * Stripe Routes
 * Handles Stripe webhooks and payment operations
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { coachOnly } from '../middleware/coachMiddleware.js';
import stripeService from '../services/stripeService.js';
import Subscription from '../models/Subscription.js';
import Team from '../models/Team.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';

const router = express.Router();

// Stripe webhook endpoint (must be before body parser middleware)
// This endpoint receives events from Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, sig);

    console.log('Stripe webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  try {
    const { organizationId, coachId, pricingType } = session.metadata || {};

    if (!organizationId || !coachId) {
      console.error('Missing organizationId/coachId in checkout session:', session.id);
      return;
    }

    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session:', session.id);
      return;
    }

    const subscription = await stripeService.getSubscription(subscriptionId);

    // Deactivate previous active subscriptions for this coach+organization
    await Subscription.updateMany(
      { coachId, organizationId, isActive: true },
      { $set: { isActive: false, status: 'canceled' } }
    );

    // Create or update plan-level subscription
    let subRecord = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });
    if (!subRecord) {
      subRecord = new Subscription({
        teamId: null,
        organizationId,
        coachId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscriptionId,
        amount: subscription.items.data[0].price.unit_amount / 100,
        pricingType: pricingType || 'individual',
        status: subscription.status,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        isActive: subscription.status === 'active',
      });
    } else {
      subRecord.status = subscription.status;
      subRecord.endDate = new Date(subscription.current_period_end * 1000);
      subRecord.amount = subscription.items.data[0].price.unit_amount / 100;
      subRecord.pricingType = pricingType || subRecord.pricingType;
      subRecord.isActive = subscription.status === 'active';
    }
    await subRecord.save();

    // Update organization plan flags
    const org = await Organization.findById(organizationId);
    if (org) {
      org.planType = pricingType || org.planType || 'individual';
      org.hasActiveSubscription = subscription.status === 'active';
      await org.save();
    }

    // Sync all teams under this organization for this coach
    const teamFilter = { organizationId, coachId };
    const update =
      subscription.status === 'active'
        ? {
            subscriptionStatus: 'active',
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          }
        : subscription.status === 'canceled' || subscription.status === 'unpaid'
        ? {
            subscriptionStatus: subscription.status === 'canceled' ? 'cancelled' : 'expired',
          }
        : null;

    if (update) {
      await Team.updateMany(teamFilter, { $set: update });
    }

    console.log('Checkout completed for organization plan:', organizationId);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const { organizationId, coachId, pricingType } = subscription.metadata || {};

    if (!organizationId || !coachId) {
      console.error('Missing organizationId/coachId in subscription metadata');
      return;
    }

    const org = await Organization.findById(organizationId);
    if (org) {
      org.planType = pricingType || org.planType || 'individual';
      org.hasActiveSubscription = true;
      await org.save();
    }

    await Team.updateMany(
      { organizationId, coachId },
      {
        $set: {
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        },
      }
    );

    console.log('Subscription created for organization:', organizationId);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const subscriptionRecord = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (subscriptionRecord) {
      subscriptionRecord.status = subscription.status;
      subscriptionRecord.endDate = new Date(subscription.current_period_end * 1000);
      subscriptionRecord.isActive = subscription.status === 'active';
      await subscriptionRecord.save();

      const { organizationId, coachId } = subscriptionRecord;
      const org = await Organization.findById(organizationId);
      if (org) {
        org.hasActiveSubscription = subscription.status === 'active';
        await org.save();
      }

      const teamFilter = { organizationId, coachId };
      if (subscription.status === 'active') {
        await Team.updateMany(teamFilter, {
          $set: {
            subscriptionStatus: 'active',
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          },
        });
      } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        await Team.updateMany(teamFilter, {
          $set: {
            subscriptionStatus: subscription.status === 'canceled' ? 'cancelled' : 'expired',
          },
        });
      }
    }

    console.log('Subscription updated (plan-level):', subscription.id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const subscriptionRecord = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (subscriptionRecord) {
      subscriptionRecord.status = 'canceled';
      subscriptionRecord.isActive = false;
      await subscriptionRecord.save();

      const { organizationId, coachId } = subscriptionRecord;
      const org = await Organization.findById(organizationId);
      if (org) {
        org.hasActiveSubscription = false;
        await org.save();
      }

      await Team.updateMany(
        { organizationId, coachId },
        {
          $set: {
            subscriptionStatus: 'cancelled',
          },
        }
      );
    }

    console.log('Subscription deleted (plan-level):', subscription.id);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscriptionRecord = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (subscriptionRecord) {
      const subscription = await stripeService.getSubscription(subscriptionId);
      subscriptionRecord.endDate = new Date(subscription.current_period_end * 1000);
      subscriptionRecord.status = 'active';
      subscriptionRecord.isActive = true;
      await subscriptionRecord.save();

      const { organizationId, coachId } = subscriptionRecord;
      const org = await Organization.findById(organizationId);
      if (org) {
        org.hasActiveSubscription = true;
        await org.save();
      }

      await Team.updateMany(
        { organizationId, coachId },
        {
          $set: {
            subscriptionStatus: 'active',
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          },
        }
      );
    }

    console.log('Payment succeeded for subscription (plan-level):', subscriptionId);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscriptionRecord = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (subscriptionRecord) {
      subscriptionRecord.status = 'past_due';
      subscriptionRecord.isActive = false;
      await subscriptionRecord.save();

      const { organizationId, coachId } = subscriptionRecord;
      await Team.updateMany(
        { organizationId, coachId },
        {
          $set: {
            subscriptionStatus: 'expired',
          },
        }
      );
    }

    console.log('Payment failed for subscription (plan-level):', subscriptionId);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Get Stripe publishable key (public endpoint)
router.get('/publishable-key', (req, res) => {
  try {
    const publishableKey = stripeService.getPublishableKey();
    res.json({
      success: true,
      publishableKey: publishableKey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving publishable key',
      error: error.message,
    });
  }
});

export default router;

