import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ตรวจสอบว่าไม่มีตัวอักษรเกินหรือช่องว่างใน .env
export const supabase = createClient(supabaseUrl, supabaseAnonKey)