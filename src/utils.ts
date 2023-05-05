import {unlink} from 'fs/promises';
import config from 'config';

export async function removeFile(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (e) {
    console.log('Error remove file: ', e);
  }
}

export function validID(id: number) {
  return !config.get<number[]>('IDS').includes(id);
}
