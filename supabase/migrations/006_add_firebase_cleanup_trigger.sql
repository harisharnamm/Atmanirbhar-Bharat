-- Create a function to call the Firebase cleanup Edge Function
CREATE OR REPLACE FUNCTION cleanup_firebase_files_on_pledge_delete()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  edge_function_url TEXT;
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Only proceed if pledge_id is not null
  IF OLD.pledge_id IS NOT NULL THEN
    -- Get Supabase configuration from settings or environment
    supabase_url := COALESCE(current_setting('app.supabase_url', true), 'https://your-project.supabase.co');
    service_role_key := current_setting('app.service_role_key', true);

    -- Build the Edge Function URL
    edge_function_url := supabase_url || '/functions/v1/cleanup-firebase-files';

    -- Call the Edge Function to cleanup Firebase files
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      edge_function_url,
      ARRAY[
        http_header('Authorization', 'Bearer ' || service_role_key),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      json_build_object('pledgeId', OLD.pledge_id)::text
    ));

    -- Log the result
    RAISE NOTICE 'Firebase cleanup for pledge %: status=%, body=%', OLD.pledge_id, response_status, response_body;

    -- For production, we might want to handle failures differently
    -- For now, we'll just log and continue with the delete
    -- If the cleanup fails, the files will remain in Firebase (which is safer than failing the delete)
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires on pledge delete
DROP TRIGGER IF EXISTS trigger_cleanup_firebase_files ON pledges;
CREATE TRIGGER trigger_cleanup_firebase_files
  BEFORE DELETE ON pledges
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_firebase_files_on_pledge_delete();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_firebase_files_on_pledge_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_firebase_files_on_pledge_delete() TO service_role;
