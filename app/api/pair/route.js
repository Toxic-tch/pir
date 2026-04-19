import { startPairingSession, checkPairingStatus } from '../../lib/baileys.js';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || !phoneNumber.trim()) {
      return Response.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return Response.json({ success: false, error: 'Invalid phone number. Include country code without +' }, { status: 400 });
    }

    const result = await startPairingSession(cleanPhone);

    if (!result.success) {
      return Response.json({ success: false, error: result.error || 'Failed to start pairing' }, { status: 500 });
    }

    // Wait up to 25 seconds for pairing code
    let pairingCode = result.pairingCode;
    if (!pairingCode && result.sessionId) {
      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const status = await checkPairingStatus(result.sessionId);
        if (status.pairingCode) {
          pairingCode = status.pairingCode;
          break;
        }
        if (status.status === 'error') {
          return Response.json({ success: false, error: 'Failed to generate pairing code. WhatsApp servers may be busy.' }, { status: 500 });
        }
      }
    }

    return Response.json({
      success: true,
      pairingCode: pairingCode || null,
      sessionId: result.sessionId,
      message: pairingCode
        ? 'Enter this pairing code in WhatsApp > Settings > Linked Devices > Link a Device'
        : 'Session started. Check status for pairing code.',
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message || 'Failed to request pairing code' }, { status: 500 });
  }
}
