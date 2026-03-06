import { z } from 'zod';

export const orderSchema = z.object({
    id: z.string(),
    order_number: z.string().optional(),
    customer_name: z.string().optional(),
    customer_email: z.string().optional(),
    customer_phone: z.string().optional(),
    total_amount: z.number().or(z.string()),
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('PENDING'),
    payment_method: z.string().optional(),
    payment_status: z.string().optional(),
    shipping_address: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    items: z.array(z.object({
        id: z.string(),
        order_id: z.string().optional(),
        product_id: z.string().optional(),
        product_name: z.string().optional(),
        product: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
        quantity: z.number(),
        price: z.number().or(z.string()),
        total: z.number().or(z.string()).optional(),
    })).optional(),
    store_id: z.string().optional(),
    store: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = Order['items'] extends Array<infer T> | undefined ? T : never;
