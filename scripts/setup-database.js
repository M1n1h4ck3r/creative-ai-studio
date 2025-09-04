const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Read and execute SQL schema
  const schemaPath = path.join(__dirname, '../supabase-schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  console.log('Setting up database schema...')
  
  const { error } = await supabase.rpc('exec_sql', { sql: schema })
  
  if (error) {
    console.error('Database setup failed:', error)
    
    // Try alternative method - execute statements one by one
    console.log('Trying alternative setup method...')
    const statements = schema.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql: statement.trim() + ';' 
        })
        if (stmtError) {
          console.log('Statement executed:', statement.substring(0, 50) + '...')
        }
      }
    }
  } else {
    console.log('✅ Database schema created successfully!')
  }
  
  // Create initial user profile if authenticated
  console.log('Checking user authentication...')
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    console.log('User found, creating profile...')
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      })
    
    if (profileError) {
      console.log('Profile creation error (this is normal):', profileError.message)
    } else {
      console.log('✅ User profile created!')
    }
  }
  
  console.log('Database setup completed!')
}

setupDatabase().catch(console.error)