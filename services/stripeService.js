/**
 * Stripe Service
 * Handles all Stripe payment operations
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Create a Stripe customer
 * @param {Object} customerData - Customer information
 * @param {String} customerData.email - Customer email
 * @param {String} customerData.name - Customer name
 * @param {String} customerData.metadata.userId - User ID for reference
 * @returns {Object} Stripe customer object
 */
export const createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: {
        userId: customerData.metadata?.userId || '',
        userRole: customerData.metadata?.userRole || 'coach',
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Create a Stripe Checkout Session for team subscription
 * @param {Object} sessionData - Session configuration
 * @param {String} sessionData.customerId - Stripe customer ID
 * @param {Number} sessionData.amount - Amount in cents (e.g., 299 for $2.99)
 * @param {String} sessionData.teamId - Team ID
 * @param {String} sessionData.organizationId - Organization ID
 * @param {String} sessionData.coachId - Coach user ID
 * @param {String} sessionData.successUrl - Success redirect URL
 * @param {String} sessionData.cancelUrl - Cancel redirect URL
 * @param {String} sessionData.pricingType - 'individual' or 'organization'
 * @returns {Object} Stripe Checkout Session
 */
export const createCheckoutSession = async (sessionData) => {
  try {
    const { customerId, amount, teamId, organizationId, coachId, successUrl, cancelUrl, pricingType } = sessionData;

    // Calculate price per team
    const priceInCents = Math.round(amount * 100); // Convert base units to cents (e.g., 299 -> 29900)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Baseball Team Subscription - ${pricingType === 'organization' ? 'Organization' : 'Individual'}`,
              description: `3-month team subscription (20 seats) - $${amount} per team`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: 'month',
              interval_count: 3, // 3 months
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/coach-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/coach-signup?canceled=true`,
      metadata: {
        teamId: teamId || '',
        organizationId: organizationId || '',
        coachId: coachId || '',
        pricingType: pricingType || 'individual',
      },
      subscription_data: {
        metadata: {
          teamId: teamId || '',
          organizationId: organizationId || '',
          coachId: coachId || '',
          pricingType: pricingType || 'individual',
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe Checkout Session
 * @param {String} sessionId - Checkout session ID
 * @returns {Object} Stripe Checkout Session
 */
export const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe Subscription
 * @param {String} subscriptionId - Subscription ID
 * @returns {Object} Stripe Subscription
 */
export const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice'],
    });

    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
};

/**
 * Cancel a Stripe Subscription
 * @param {String} subscriptionId - Subscription ID
 * @param {Boolean} immediately - Cancel immediately or at period end
 * @returns {Object} Cancelled subscription
 */
export const cancelSubscription = async (subscriptionId, immediately = false) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId, {
      ...(immediately ? { prorate: true } : {}),
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Update a Stripe Subscription
 * @param {String} subscriptionId - Subscription ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated subscription
 */
export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, updateData);

    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * List all subscriptions for a customer
 * @param {String} customerId - Stripe customer ID
 * @returns {Array} Array of subscriptions
 */
export const listCustomerSubscriptions = async (customerId) => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
    });

    return subscriptions.data;
  } catch (error) {
    console.error('Error listing customer subscriptions:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 * @param {String} payload - Raw request body
 * @param {String} signature - Stripe signature header
 * @returns {Object} Event object
 */
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
};

/**
 * Get Stripe publishable key
 * @returns {String} Publishable key
 */
export const getPublishableKey = () => {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
};

// Export all functions as default object
const stripeService = {
  createCustomer,
  createCheckoutSession,
  getCheckoutSession,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  listCustomerSubscriptions,
  verifyWebhookSignature,
  getPublishableKey,
  stripe, // Export stripe instance for direct use if needed
};

export default stripeService;
export { stripe }; // Also export stripe instance separately

