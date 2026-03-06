import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("=== Checking Projects ===");
    const { data: projects, error: err1 } = await supabase.from('projects').select('*');
    console.log("Projects:", projects?.length, projects?.[0]?.name);
    if (err1) console.error("Projects Error:", err1);

    console.log("\n=== Checking Project Members ===");
    const { data: members, error: err2 } = await supabase.from('project_members').select('*');
    console.log("Members:", members?.length);
    if (err2) console.error("Members Error:", err2);

    console.log("\n=== Checking Profiles ===");
    const { data: profiles, error: err3 } = await supabase.from('profiles').select('*');
    console.log("Profiles:", profiles?.length);
    if (err3) console.error("Profiles Error:", err3);
}

checkData();
