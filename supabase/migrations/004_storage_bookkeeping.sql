-- Storage bookkeeping: pledges columns and file_migrations audit table

-- Add columns to pledges if not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pledges' AND column_name='storage_location'
  ) THEN
    ALTER TABLE public.pledges
      ADD COLUMN storage_location TEXT NOT NULL DEFAULT 'supabase'
        CHECK (storage_location IN ('supabase','drive'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pledges' AND column_name='certificate_stable_url'
  ) THEN
    ALTER TABLE public.pledges
      ADD COLUMN certificate_stable_url TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pledges' AND column_name='selfie_stable_url'
  ) THEN
    ALTER TABLE public.pledges
      ADD COLUMN selfie_stable_url TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Helpful index for trimming newest N
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_pledges_created_at_desc'
  ) THEN
    CREATE INDEX idx_pledges_created_at_desc ON public.pledges (created_at DESC);
  END IF;
END $$;

-- Audit table for file migrations
CREATE TABLE IF NOT EXISTS public.file_migrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pledge_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('certificate','selfie')),
  from_url TEXT,
  to_url TEXT,
  from_bucket TEXT,
  to_provider TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','migrated','verified','failed')) DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  error TEXT,
  checksum TEXT,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_migrations_pledge ON public.file_migrations (pledge_id);
CREATE INDEX IF NOT EXISTS idx_file_migrations_status ON public.file_migrations (status);
CREATE INDEX IF NOT EXISTS idx_file_migrations_migrated_at ON public.file_migrations (migrated_at DESC);


