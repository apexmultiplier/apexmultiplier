-- SQL migration to create investment_plans table if it does not exist
-- Only apply if your project does not already have an 'investment_plans' table.

CREATE TABLE IF NOT EXISTS public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  daily_profit numeric(6,4) DEFAULT 0,
  monthly_profit numeric(6,4) DEFAULT 0,
  roi_percentage numeric(6,4) DEFAULT 0,
  duration_days integer DEFAULT 30,
  description text,
  features text,
  status text DEFAULT 'active',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for display ordering
CREATE INDEX IF NOT EXISTS idx_investment_plans_display_order ON public.investment_plans(display_order);
