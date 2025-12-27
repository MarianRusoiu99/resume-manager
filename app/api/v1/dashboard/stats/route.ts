import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { analyticsService } from '@/lib/services';

export async function GET() {
  try {
    const session = await verifySession();
    const result = await analyticsService.getDashboardStats(session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
