import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  addressLine: z.string().min(4, "Delivery address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  deliveryOption: z.enum(["Standard", "Express"]),
  paymentMethod: z.enum(["PAYSTACK", "FLUTTERWAVE", "CARD", "BANK_TRANSFER"]),
  saveAddress: z.boolean().optional(),
  addressId: z.string().optional(),
  promoCode: z.string().optional(),
  items: z
    .array(
      z.object({
        kind: z.enum(["product", "bundle"]),
        refId: z.string(),
        sizeId: z.string().optional(),
        name: z.string(),
        brand: z.string().optional(),
        sizeLabel: z.string(),
        image: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
