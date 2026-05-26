import crypto from 'crypto';
import Razorpay from 'razorpay';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const razorpay = env.hasRazorpay
  ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret })
  : null;

if (!razorpay) {
  logger.warn('Razorpay keys not set — payments run in mock mode');
}

/**
 * Razorpay payment flow.
 *  1. `createOrder` — server creates an order, returns its id to the client.
 *  2. The client opens Razorpay Checkout with that order id and pays.
 *  3. `verifyPayment` — server validates the HMAC signature Razorpay returns.
 *
 * With no keys configured everything runs in mock mode so the full booking
 * flow stays testable end-to-end without credentials.
 */
export const paymentService = {
  isLive: Boolean(razorpay),
  keyId: env.razorpay.keyId || null,

  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // amount is in paise
        currency,
        receipt,
        notes,
      });
      return { provider: 'razorpay', orderId: order.id, amount, currency };
    }
    /* Mock order — Checkout is skipped and verification always passes. */
    return {
      provider: 'mock',
      orderId: `order_mock_${Date.now().toString(36)}`,
      amount,
      currency,
    };
  },

  /**
   * Confirms a payment by recomputing the signature Razorpay sends back.
   * signature === HMAC_SHA256(orderId + "|" + paymentId, keySecret)
   */
  verifyPayment({ orderId, paymentId, signature }) {
    if (!razorpay) {
      /* Mock mode — simulates an approved payment. */
      return { valid: true };
    }
    if (!orderId || !paymentId || !signature) return { valid: false };

    const expected = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    /* Constant-time comparison to avoid timing attacks. */
    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    return { valid };
  },
};
