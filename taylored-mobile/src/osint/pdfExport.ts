import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { IntelCase } from './types';
import { buildPdfHtml } from './export';

export async function shareIntelPdf(intelCase: IntelCase): Promise<void> {
  const html = buildPdfHtml(intelCase);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `AiBhive Intel — ${intelCase.target.label}`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
