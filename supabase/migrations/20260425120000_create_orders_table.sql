-- Create orders table for storing customer order details
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_processed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create an order (for active visible products)
CREATE POLICY "Anyone can create orders for active products"
ON public.orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = orders.product_id
      AND p.status = 'active'
      AND p.is_visible = true
  )
);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update orders (mark as processed)
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;