import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const tables = ['profiles', 'api_keys', 'generations', 'analytics_events']
    const results: Record<string, any> = {}
    
    for (const table of tables) {
      try {
        // Try to query the table to see if it exists
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          
        if (error && error.message.includes('does not exist')) {
          results[table] = { exists: false, error: 'Table does not exist' }
        } else if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = { exists: true, status: 'accessible' }
        }
      } catch (err: any) {
        results[table] = { exists: false, error: err.message }
      }
    }
    
    // Check if auth.users exists (should always exist in Supabase)
    try {
      const { data: authTest } = await supabase.auth.admin.listUsers()
      results['auth_users'] = { exists: true, status: 'accessible', user_count: authTest?.users?.length || 0 }
    } catch (err: any) {
      results['auth_users'] = { exists: false, error: err.message }
    }
    
    // Test if we can create a profile for current auth test
    try {
      const testUser = await supabase.auth.signUp({
        email: `dbtest${Date.now()}@example.com`,
        password: 'testpass123'
      })
      
      if (testUser.data.user) {
        results['auth_flow'] = { 
          status: 'working', 
          user_created: true,
          user_id: testUser.data.user.id
        }
        
        // Clean up test user
        try {
          await supabase.auth.admin.deleteUser(testUser.data.user.id)
          results['cleanup'] = { status: 'ok' }
        } catch {
          results['cleanup'] = { status: 'manual_required', user_id: testUser.data.user.id }
        }
      }
    } catch (err: any) {
      results['auth_flow'] = { status: 'error', error: err.message }
    }

    return NextResponse.json({
      success: true,
      database_status: results,
      recommendations: [
        results.profiles?.exists ? null : 'Run the incremental setup SQL to create profiles table',
        results.api_keys?.exists ? null : 'Run the incremental setup SQL to create api_keys table',
        results.generations?.exists ? null : 'Run the incremental setup SQL to create generations table',
        results.analytics_events?.exists ? null : 'Run the incremental setup SQL to create analytics_events table'
      ].filter(Boolean),
      sql_file: 'supabase-setup-incremental.sql'
    })
    
  } catch (error: any) {
    console.error('Database status check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}