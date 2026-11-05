// base44-Version: SEB-Datei über die base44-Dateiablage hochladen, URL zurückgeben
import { base44 } from '@/api/base44Client';

export async function uploadSebFile(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}
