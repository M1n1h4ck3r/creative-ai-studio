import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: `Auth error: ${authError.message}`
      }, { status: 500 })
    }
    
    const results = []
    
    for (const user of authData.users) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
          
        if (existingProfile) {
          results.push({
            user_id: user.id,
            email: user.email,
            status: 'profile_already_exists'
          })
          continue
        }
        
        // Create profile for this user
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
          .select()
          
        if (createError) {
          results.push({
            user_id: user.id,
            email: user.email,
            status: 'error',
            error: createError.message
          })
        } else {
          results.push({
            user_id: user.id,
            email: user.email,
            status: 'profile_created',
            profile: newProfile?.[0]
          })
        }
      } catch (err: any) {
        results.push({
          user_id: user.id,
          email: user.email,
          status: 'error',
          error: err.message
        })
      }
    }
    
    // Get final counts
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('*')
      
    return NextResponse.json({
      success: true,
      message: 'Profile creation process completed',
      results,
      summary: {
        total_auth_users: authData.users.length,
        total_profiles_after: finalProfiles?.length || 0,
        profiles_created: results.filter(r => r.status === 'profile_created').length,
        profiles_already_existed: results.filter(r => r.status === 'profile_already_exists').length,
        errors: results.filter(r => r.status === 'error').length
      }
    })
    
  } catch (error: any) {
    console.error('Fix profiles error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}