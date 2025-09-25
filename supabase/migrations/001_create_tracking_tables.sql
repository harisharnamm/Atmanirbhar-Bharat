-- Create tracking_links table
CREATE TABLE IF NOT EXISTS tracking_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id VARCHAR(50) UNIQUE NOT NULL,
  pledge_id VARCHAR(50) NOT NULL,
  original_pledge_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100), -- Optional: who created the tracking link
  metadata JSONB DEFAULT '{}', -- Store additional metadata like campaign info
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  CONSTRAINT fk_pledge_id FOREIGN KEY (pledge_id) REFERENCES pledges(pledge_id) ON DELETE CASCADE
);

-- Create link_clicks table for analytics
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_link_id UUID NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic click data
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geographic data (can be populated by geolocation service)
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Device analytics
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  
  -- Additional analytics
  screen_resolution VARCHAR(20), -- e.g., "1920x1080"
  language VARCHAR(10),
  timezone VARCHAR(50),
  
  -- User behavior
  session_id VARCHAR(100), -- To track user sessions
  is_bot BOOLEAN DEFAULT false,
  
  -- Conversion tracking
  converted_to_pledge BOOLEAN DEFAULT false,
  conversion_pledge_id VARCHAR(50), -- If they completed a pledge
  
  CONSTRAINT fk_tracking_link FOREIGN KEY (tracking_link_id) REFERENCES tracking_links(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracking_links_pledge_id ON tracking_links(pledge_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_tracking_id ON tracking_links(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_created_at ON tracking_links(created_at);

CREATE INDEX IF NOT EXISTS idx_link_clicks_tracking_link_id ON link_clicks(tracking_link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_link_clicks_country ON link_clicks(country);
CREATE INDEX IF NOT EXISTS idx_link_clicks_device_type ON link_clicks(device_type);
CREATE INDEX IF NOT EXISTS idx_link_clicks_converted ON link_clicks(converted_to_pledge);

-- Create a view for analytics summary
CREATE OR REPLACE VIEW tracking_analytics AS
SELECT 
  tl.tracking_id,
  tl.pledge_id,
  tl.original_pledge_id,
  tl.created_at as link_created_at,
  tl.metadata,
  
  -- Click statistics
  COUNT(lc.id) as total_clicks,
  COUNT(DISTINCT lc.ip_address) as unique_visitors,
  COUNT(CASE WHEN lc.converted_to_pledge THEN 1 END) as conversions,
  
  -- Geographic distribution
  COUNT(CASE WHEN lc.country = 'India' THEN 1 END) as clicks_from_india,
  COUNT(CASE WHEN lc.country != 'India' OR lc.country IS NULL THEN 1 END) as clicks_from_other,
  
  -- Device distribution
  COUNT(CASE WHEN lc.device_type = 'mobile' THEN 1 END) as mobile_clicks,
  COUNT(CASE WHEN lc.device_type = 'desktop' THEN 1 END) as desktop_clicks,
  COUNT(CASE WHEN lc.device_type = 'tablet' THEN 1 END) as tablet_clicks,
  
  -- Time-based analytics
  MIN(lc.clicked_at) as first_click,
  MAX(lc.clicked_at) as last_click,
  
  -- Conversion rate
  CASE 
    WHEN COUNT(lc.id) > 0 
    THEN ROUND((COUNT(CASE WHEN lc.converted_to_pledge THEN 1 END)::DECIMAL / COUNT(lc.id)) * 100, 2)
    ELSE 0 
  END as conversion_rate

FROM tracking_links tl
LEFT JOIN link_clicks lc ON tl.id = lc.tracking_link_id
GROUP BY tl.id, tl.tracking_id, tl.pledge_id, tl.original_pledge_id, tl.created_at, tl.metadata;

-- Enable Row Level Security (RLS)
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access to tracking_links" ON tracking_links
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to link_clicks" ON link_clicks
  FOR INSERT WITH CHECK (true);

-- Create a function to generate tracking ID
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS VARCHAR(50) AS $$
DECLARE
  tracking_id VARCHAR(50);
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a random tracking ID: TRK-XXXXXX
    tracking_id := 'TRK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_check FROM tracking_links WHERE tracking_id = tracking_id;
    
    -- If it doesn't exist, we can use it
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN tracking_id;
END;
$$ LANGUAGE plpgsql;
