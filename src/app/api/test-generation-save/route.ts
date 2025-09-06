import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test 1: Check if we can authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const testResults: any = {
      step1_auth: {
        success: !authError,
        user_id: user?.id,
        error: authError?.message
      }
    }
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        test_results: testResults,
        message: 'Authentication failed - user needs to be logged in'
      })
    }
    
    // Test 2: Check if user has a profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      testResults.step2_profile = {
        exists: !!profile,
        error: profileError?.message,
        profile_data: profile ? { id: profile.id, email: profile.email } : null
      }
    } catch (err: any) {
      testResults.step2_profile = { error: err.message }
    }
    
    // Test 3: Try to insert a test generation
    try {
      const testGeneration = {
        user_id: user.id,
        provider: 'test',
        prompt: 'Test prompt for database debugging',
        model_used: 'test-model',
        image_url: 'https://example.com/test-image.jpg',
        format: '1:1',
        generation_time_ms: 1000,
        cost_credits: 1,
        status: 'completed',
        metadata: { test: true }
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('generations')
        .insert(testGeneration)
        .select()
        
      testResults.step3_insert_generation = {
        success: !insertError,
        error: insertError?.message,
        inserted_data: insertData?.[0] || null
      }
      
      // If insert worked, try to read it back
      if (!insertError && insertData?.[0]) {
        const { data: readData, error: readError } = await supabase
          .from('generations')
          .select('*')
          .eq('id', insertData[0].id)
          .single()
          
        testResults.step4_read_generation = {
          success: !readError,
          error: readError?.message,
          read_data: readData
        }
      }
    } catch (err: any) {
      testResults.step3_insert_generation = { error: err.message }
    }
    
    // Test 4: Check RLS policies
    try {
      const { data: userGenerations, error: rlsError } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .limit(5)
        
      testResults.step5_rls_check = {
        success: !rlsError,
        error: rlsError?.message,
        user_generations_count: userGenerations?.length || 0
      }
    } catch (err: any) {
      testResults.step5_rls_check = { error: err.message }
    }

    return NextResponse.json({
      success: true,
      test_results: testResults,
      summary: {
        auth_working: testResults.step1_auth.success,
        profile_exists: testResults.step2_profile?.exists,
        can_insert: testResults.step3_insert_generation?.success,
        can_read: testResults.step4_read_generation?.success,
        rls_working: testResults.step5_rls_check?.success
      }
    })
    
  } catch (error: any) {
    console.error('Test generation save error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}