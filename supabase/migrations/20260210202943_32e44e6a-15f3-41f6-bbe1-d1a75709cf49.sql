
-- Rate limiting table
CREATE TABLE public.rate_limit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_log (identifier, attempt_type, attempted_at DESC);

-- Auto-cleanup: delete entries older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.rate_limit_log WHERE attempted_at < now() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cleanup_rate_limit
AFTER INSERT ON public.rate_limit_log
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_rate_limit_log();

-- Function to check and record rate limit
-- Returns true if the request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_max_attempts INT DEFAULT 10,
  p_window_minutes INT DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INT;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.rate_limit_log
  WHERE identifier = p_identifier
    AND attempt_type = p_attempt_type
    AND attempted_at > now() - (p_window_minutes || ' minutes')::INTERVAL;

  IF attempt_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limit_log (identifier, attempt_type)
  VALUES (p_identifier, p_attempt_type);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow anon and authenticated to call check_rate_limit
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon, authenticated;

-- RLS on rate_limit_log - no direct access, only through function
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
