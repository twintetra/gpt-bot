import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import {createWriteStream} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {removeFile} from './utils';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface IOggConverter {
  create(url: string, fileName: string): Promise<string | undefined>;
  toMp3(oggPath: string, output: string): Promise<string>;
}

class OggConverter implements IOggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  async create(url: string, fileName: string): Promise<string> {
    try {
      const oggPath = resolve(__dirname, '../voices', `${fileName}.ogg`);
      const response = await axios({method: 'get', url, responseType: 'stream'});
      return new Promise((resolve) => {
        const stream = createWriteStream(oggPath);
        response.data.pipe(stream);
        stream.on('finish', () => resolve(oggPath));
      });
    } catch (e) {
      console.error('Error create: ', e);
      throw e;
    }
  }

  toMp3(path: string, output: string): Promise<string> {
    try {
      const outputPath = resolve(dirname(path), `${output}.mp3`);
      return new Promise((resolve, reject) => {
        ffmpeg(path)
          .inputOption('-t 30')
          .output(outputPath)
          .on('end', () => {
            resolve(outputPath);
            void removeFile(path);
          })
          .on('error', (err) => reject(err.message))
          .run();
      });
    } catch (e) {
      console.error('Error convert to mp3: ', e);
      throw e;
    }
  }
}

export const oggConverter = new OggConverter();
