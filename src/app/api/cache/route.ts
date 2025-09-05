import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, clearCachePattern, flushAnalyticsEvents } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await getCacheStats()
        return NextResponse.json({ 
          success: true, 
          stats,
          timestamp: new Date().toISOString()
        })

      case 'flush-analytics':
        const events = await flushAnalyticsEvents()
        return NextResponse.json({
          success: true,
          message: `Flushed ${events.length} analytics events`,
          events: events.length
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: stats, flush-analytics'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')

    if (!pattern) {
      return NextResponse.json({
        success: false,
        error: 'Pattern parameter is required'
      }, { status: 400 })
    }

    const deletedCount = await clearCachePattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      deletedCount
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}