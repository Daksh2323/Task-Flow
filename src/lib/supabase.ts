/**
 * Supabase Configuration — Email/Password Auth
 * 
 * Setup steps:
 * 1. Go to Supabase Dashboard → Authentication → Settings
 *    - (Optional) Disable "Confirm email" for instant sign-in
 * 
 * 2. Go to SQL Editor and run the tasks table creation query
 *    (see bottom of this file)
 * 
 * SQL to create the tasks table:
 * 
 *    CREATE TABLE tasks (
 *      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *      title TEXT NOT NULL,
 *      description TEXT DEFAULT '',
 *      completed BOOLEAN DEFAULT false,
 *      priority TEXT DEFAULT 'medium',
 *      category TEXT DEFAULT 'personal',
 *      due_date DATE,
 *      subtasks JSONB DEFAULT '[]',
 *      task_order INTEGER DEFAULT 0,
 *      created_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 * 
 *    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
 * 
 *    CREATE POLICY "Users can view own tasks" ON tasks
 *      FOR SELECT USING (auth.uid() = user_id);
 * 
 *    CREATE POLICY "Users can insert own tasks" ON tasks
 *      FOR INSERT WITH CHECK (auth.uid() = user_id);
 * 
 *    CREATE POLICY "Users can update own tasks" ON tasks
 *      FOR UPDATE USING (auth.uid() = user_id);
 * 
 *    CREATE POLICY "Users can delete own tasks" ON tasks
 *      FOR DELETE USING (auth.uid() = user_id);
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzgvxmfnazaxssyypdol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z3Z4bWZuYXpheHNzeXlwZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDQ5NDAsImV4cCI6MjA5NTMyMDk0MH0.nkQtFBpyCz2T_l4LgPrQtyUaCr8BcJOFgMwLZswJEEM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
