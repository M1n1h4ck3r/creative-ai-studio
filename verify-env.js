// Environment variables verification script
const fs = require('fs');
const path = require('path');

console.log('=== Environment Variables Verification ===\n');

// Check .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✓ .env.local file exists\n');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  const supabaseUrl = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='));
  const supabaseKey = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
  
  if (supabaseUrl) {
    const url = supabaseUrl.split('=')[1];
    console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', url ? url.substring(0, 30) + '...' : 'EMPTY');
  } else {
    console.log('✗ NEXT_PUBLIC_SUPABASE_URL: NOT FOUND');
  }
  
  if (supabaseKey) {
    const key = supabaseKey.split('=')[1];
    console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'Present (' + key.length + ' chars)' : 'EMPTY');
  } else {
    console.log('✗ NEXT_PUBLIC_SUPABASE_ANON_KEY: NOT FOUND');
  }
} else {
  console.log('✗ .env.local file NOT FOUND\n');
}

console.log('\n=== Process Environment ===\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

console.log('\n=== Recommendations ===\n');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('1. Make sure .env.local exists in the project root');
  console.log('2. Restart the dev server after changing environment variables');
  console.log('3. Check that variable names start with NEXT_PUBLIC_');
}
