import { checkPairingStatus } from '../../lib/baileys.js';

export async function GET(req) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const result = await checkPairingStatus(sessionId);

    if (!result.success) {
      return Response.json({ success: false, error: result.error || 'Session not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      status: result.status,
      pairingCode: result.pairingCode || null,
      authState: result.authState || null,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message || 'Status check failed' }, { status: 500 });
  }
}
