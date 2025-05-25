-- Fix for existing tables - add missing policies and permissions

-- Add policies for consent table (if not already exists)
DO $$ 
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own consents' AND tablename = 'consents') THEN
CREATE POLICY "Users can view own consents" ON public.consents
FOR SELECT USING (auth.uid() = profile_id);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own consents' AND tablename = 'consents') THEN
CREATE POLICY "Users can insert own consents" ON public.consents
FOR INSERT WITH CHECK (auth.uid() = profile_id);
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own consents' AND tablename = 'consents') THEN
CREATE POLICY "Users can update own consents" ON public.consents
FOR UPDATE USING (auth.uid() = profile_id);
END IF;
END $$;

-- Add policies for disclosure log (if not already exists)  
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own disclosure log' AND tablename = 'name_disclosure_log') THEN
CREATE POLICY "Users can view own disclosure log" ON public.name_disclosure_log
FOR SELECT USING (auth.uid() = profile_id);
END IF;
END $$;