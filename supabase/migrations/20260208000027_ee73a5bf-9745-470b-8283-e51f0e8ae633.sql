
-- Add missing DELETE and UPDATE RLS policies for routes table
CREATE POLICY "Users can delete own routes"
ON public.routes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own routes"
ON public.routes
FOR UPDATE
USING (auth.uid() = user_id);
