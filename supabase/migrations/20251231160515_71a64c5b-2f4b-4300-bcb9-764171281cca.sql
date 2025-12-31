-- Add admin policies to view and manage all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

-- Add admin policies for order_items
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'support'::app_role));

-- Create indexes for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);