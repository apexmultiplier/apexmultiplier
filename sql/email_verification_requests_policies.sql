-- RLS policies for email_verification_requests
ALTER TABLE IF EXISTS public.email_verification_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_verification_requests FROM PUBLIC;

CREATE POLICY IF NOT EXISTS ev_select_own_or_admin ON public.email_verification_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.role = 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS ev_insert_owner ON public.email_verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS ev_update_admin ON public.email_verification_requests
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

CREATE POLICY IF NOT EXISTS ev_delete_owner ON public.email_verification_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
