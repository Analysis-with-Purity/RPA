import { nanoid } from "nanoid";

export type PaymentMethodType = "PAYSTACK" | "FLUTTERWAVE" | "CARD" | "BANK_TRANSFER";

/**
 * Payment gateway abstraction.
 *
 * This project ships without live Paystack/Flutterwave secret keys, so each
 * gateway path below simulates a redirect + successful charge locally
 * (see /checkout/pay/[id]) instead of calling the real provider. Swap the
 * simulated branch for a real "initialize transaction" API call once
 * PAYSTACK_SECRET_KEY / FLUTTERWAVE_SECRET_KEY are set in .env — the
 * function signature and return shape are designed to drop straight in.
 */
export async function initializePayment({
  method,
  orderId,
  amount,
  email,
}: {
  method: PaymentMethodType;
  orderId: string;
  amount: number;
  email: string;
}): Promise<{ redirectUrl: string; reference: string }> {
  const reference = `PUR-${nanoid(10).toUpperCase()}`;

  if (method === "PAYSTACK" && process.env.PAYSTACK_SECRET_KEY) {
    // TODO: call https://api.paystack.co/transaction/initialize with
    // PAYSTACK_SECRET_KEY, amount * 100 (kobo), email, reference, callback_url.
    // return { redirectUrl: response.data.authorization_url, reference };
  }

  if (method === "FLUTTERWAVE" && process.env.FLUTTERWAVE_SECRET_KEY) {
    // TODO: call Flutterwave's /v3/payments endpoint with FLUTTERWAVE_SECRET_KEY,
    // amount, currency NGN, redirect_url, tx_ref: reference.
    // return { redirectUrl: response.data.link, reference };
  }

  // Simulated gateway redirect for local/demo use.
  void amount;
  void email;
  return { redirectUrl: `/checkout/pay/${orderId}?method=${method}&ref=${reference}`, reference };
}
