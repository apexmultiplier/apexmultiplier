-- Create kyc_requests table
CREATE TABLE IF NOT EXISTS public.kyc_requests (
  id serial PRIMARY KEY,
  user_id uuid,
  email text,
  full_name text,
  govt_id_name text,
  govt_id_number text,
  country text,
  document_url text,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_id ON public.kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON public.kyc_requests(status);
