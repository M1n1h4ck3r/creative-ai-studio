import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const results: any = {}
    
    // Check generations table
    try {
      const { data: generations, error: genError } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      results.generations = {
        count: generations?.length || 0,
        error: genError?.message || null,
        sample_data: generations?.slice(0, 3) || []
      }
    } catch (err: any) {
      results.generations = { error: err.message }
    }
    
    // Check analytics_events table
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      results.analytics_events = {
        count: analytics?.length || 0,
        error: analyticsError?.message || null,
        sample_data: analytics?.slice(0, 3) || []
      }
    } catch (err: any) {
      results.analytics_events = { error: err.message }
    }
    
    // Check profiles table
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      
      results.profiles = {
        count: profiles?.length || 0,
        error: profilesError?.message || null,
        sample_data: profiles?.map(p => ({ id: p.id, email: p.email, full_name: p.full_name })) || []
      }
    } catch (err: any) {
      results.profiles = { error: err.message }
    }
    
    // Check api_keys table
    try {
      const { data: apiKeys, error: keysError } = await supabase
        .from('api_keys')
        .select('id, user_id, provider, key_name, is_active, created_at')
        .limit(5)
      
      results.api_keys = {
        count: apiKeys?.length || 0,
        error: keysError?.message || null,
        sample_data: apiKeys || []
      }
    } catch (err: any) {
      results.api_keys = { error: err.message }
    }
    
    // Check auth users count
    try {
      const { data: authData } = await supabase.auth.admin.listUsers()
      results.auth_users = {
        count: authData?.users?.length || 0,
        sample_users: authData?.users?.slice(0, 3).map(u => ({ id: u.id, email: u.email, created_at: u.created_at })) || []
      }
    } catch (err: any) {
      results.auth_users = { error: err.message }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database_contents: results,
      summary: {
        total_generations: results.generations?.count || 0,
        total_analytics: results.analytics_events?.count || 0,
        total_profiles: results.profiles?.count || 0,
        total_api_keys: results.api_keys?.count || 0,
        total_auth_users: results.auth_users?.count || 0
      }
    })
    
  } catch (error: any) {
    console.error('Debug data error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}