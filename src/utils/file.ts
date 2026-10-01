import * as path from 'path';
import * as fs from 'fs';

export function readFromFile<T>(fileName: string) {
  const filePath = path.join(
    __dirname,
    '..',
    'seeds',
    fileName,
  );

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as T;
}
