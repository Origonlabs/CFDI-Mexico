import { NextRequest, NextResponse } from 'next/server';
import { livenessCheck } from '@/lib/health-check';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  try {
    const isAlive = await livenessCheck();
    
    if (isAlive) {
      return NextResponse.json({ status: 'alive' }, { status: 200 });
    } else {
      return NextResponse.json({ status: 'dead' }, { status: 503 });
    }
  } catch (error) {
    logger.error('Error en liveness check', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, undefined, requestId);
    
    return NextResponse.json(
      { status: 'dead', error: 'Liveness check failed' },
      { status: 503 }
    );
  }
}
