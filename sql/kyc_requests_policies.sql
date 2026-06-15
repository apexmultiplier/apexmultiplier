-- RLS policies for kyc_requests
-- Keep RLS enabled; provide policies to allow owners to insert/select and admins to manage

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE IF EXISTS public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- Revoke broad public access (defensive)
REVOKE ALL ON TABLE public.kyc_requests FROM PUBLIC;

-- Allow authenticated users to SELECT their own KYC requests or allow admins to select all
-- Admin detection: either `is_admin = true` boolean on users table or `role = 'admin'` string
CREATE POLICY IF NOT EXISTS kyc_select_own_or_admin ON public.kyc_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.role = 'admin')
    )
  );

-- Allow authenticated users to INSERT rows where the `user_id` matches their auth.uid()
CREATE POLICY IF NOT EXISTS kyc_insert_owner ON public.kyc_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins (users.is_admin = true OR users.role = 'admin') to UPDATE any KYC request (approve/reject)
CREATE POLICY IF NOT EXISTS kyc_update_admin ON public.kyc_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.role = 'admin')
    )
  );

-- Optionally, allow owners to DELETE their own requests before approval (not strictly required)
CREATE POLICY IF NOT EXISTS kyc_delete_owner ON public.kyc_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- End of migration
