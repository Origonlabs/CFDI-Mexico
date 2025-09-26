import { NextRequest, NextResponse } from 'next/server';
import { performHealthCheck, performSimpleHealthCheck } from '@/lib/health-check';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'full';
    
    if (type === 'simple') {
      const result = await performSimpleHealthCheck();
      return NextResponse.json(result, { 
        status: result.status === 'ok' ? 200 : 503 
      });
    }
    
    const healthStatus = await performHealthCheck();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    logger.error('Error en health check endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, requestId);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
