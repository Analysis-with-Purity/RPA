export const FREE_SHIPPING_THRESHOLD = 150_000;
export const STANDARD_SHIPPING_FEE = 3_500;
export const EXPRESS_SHIPPING_SURCHARGE = 2_500;

export interface PromoInfo {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
}

export function calculateTotals(
  subtotal: number,
  promo: PromoInfo | null,
  deliveryOption: "Standard" | "Express" = "Standard"
) {
  const discount = !promo
    ? 0
    : promo.discountType === "PERCENT"
    ? subtotal * (promo.discountValue / 100)
    : Math.min(promo.discountValue, subtotal);

  const afterDiscount = subtotal - discount;
  const baseShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const shippingFee = deliveryOption === "Express" ? baseShipping + EXPRESS_SHIPPING_SURCHARGE : baseShipping;
  const total = afterDiscount + shippingFee;

  return { discount, shippingFee, total };
}
