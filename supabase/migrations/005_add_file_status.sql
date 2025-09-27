-- Add file status tracking columns to pledges table
-- This tracks whether files have been downloaded and deleted from Supabase storage

-- Add certificate status column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pledges' AND column_name='certificate_status'
  ) THEN
    ALTER TABLE public.pledges
      ADD COLUMN certificate_status TEXT NOT NULL DEFAULT 'available'
        CHECK (certificate_status IN ('available', 'downloaded', 'deleted', 'not_available'));
  END IF;
END $$;

-- Add selfie status column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pledges' AND column_name='selfie_status'
  ) THEN
    ALTER TABLE public.pledges
      ADD COLUMN selfie_status TEXT NOT NULL DEFAULT 'available'
        CHECK (selfie_status IN ('available', 'downloaded', 'deleted', 'not_available'));
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pledges_certificate_status ON public.pledges (certificate_status);
CREATE INDEX IF NOT EXISTS idx_pledges_selfie_status ON public.pledges (selfie_status);

-- Update existing records to mark files as available (since they exist in storage)
UPDATE public.pledges 
SET 
  certificate_status = CASE 
    WHEN certificate_pdf_url IS NOT NULL AND certificate_pdf_url != '' THEN 'available'
    ELSE 'not_available'
  END,
  selfie_status = CASE 
    WHEN selfie_url IS NOT NULL AND selfie_url != '' THEN 'available'
    ELSE 'not_available'
  END;
