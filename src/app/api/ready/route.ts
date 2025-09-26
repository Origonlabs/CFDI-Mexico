import { NextRequest, NextResponse } from 'next/server';
import { readinessCheck } from '@/lib/health-check';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  try {
    const isReady = await readinessCheck();
    
    if (isReady) {
      return NextResponse.json({ status: 'ready' }, { status: 200 });
    } else {
      return NextResponse.json({ status: 'not ready' }, { status: 503 });
    }
  } catch (error) {
    logger.error('Error en readiness check', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, requestId);
    
    return NextResponse.json(
      { status: 'not ready', error: 'Readiness check failed' },
      { status: 503 }
    );
  }
}
