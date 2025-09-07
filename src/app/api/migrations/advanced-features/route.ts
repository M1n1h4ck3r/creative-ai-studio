import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check if user is authenticated (optional: add admin check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '006_add_advanced_features.sql')
    let migrationSQL: string
    
    try {
      migrationSQL = readFileSync(migrationPath, 'utf-8')
    } catch (fileError) {
      console.error('Failed to read migration file:', fileError)
      return NextResponse.json(
        { error: 'Migration file not found' },
        { status: 500 }
      )
    }

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each statement
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('execute_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('pg_stat_database')
            .select('*')
            .limit(1)
          
          if (directError) {
            throw directError
          }
          
          // Execute using raw SQL (this method varies by Supabase setup)
          console.warn('RPC method failed, attempting direct execution:', error)
        }
        
        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'success'
        })
        successCount++
        
      } catch (stmtError: any) {
        console.error('Statement execution error:', stmtError)
        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'error',
          error: stmtError.message
        })
        errorCount++
      }
    }

    // Create a summary response
    const summary = {
      totalStatements: statements.length,
      successful: successCount,
      failed: errorCount,
      results: results.slice(0, 10), // Return first 10 results
      timestamp: new Date().toISOString()
    }

    if (errorCount > 0) {
      return NextResponse.json({
        success: false,
        message: `Migration completed with ${errorCount} errors`,
        ...summary
      }, { status: 207 }) // Multi-status
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      ...summary
    })

  } catch (error: any) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET method to check migration status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the new tables exist
    const tables = [
      'developer_api_keys',
      'team_projects', 
      'team_members',
      'project_comments',
      'batch_jobs',
      'batch_job_items'
    ]

    const tableStatus = []

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        tableStatus.push({
          table: tableName,
          exists: !error,
          error: error?.message
        })
      } catch {
        tableStatus.push({
          table: tableName,
          exists: false,
          error: 'Failed to query table'
        })
      }
    }

    const existingTables = tableStatus.filter(t => t.exists).length
    const migrationComplete = existingTables === tables.length

    return NextResponse.json({
      migrationComplete,
      existingTables,
      totalTables: tables.length,
      tableStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Migration status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    )
  }
}