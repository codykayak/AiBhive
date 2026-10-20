/** Twilio API Key SID (SK…) for browser Voice SDK — secret name in GCP: TWILIO_sk_key */
export function twilioApiKeySid() {
  return process.env.TWILIO_sk_key || process.env.TWILIO_API_KEY || '';
}

export function twilioApiSecret() {
  return process.env.TWILIO_API_SECRET || '';
}
