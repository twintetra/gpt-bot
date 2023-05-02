import {unlink} from 'fs/promises';

export async function removeFile(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (e) {
    console.error('Error remove file: ', e);
  }
}
