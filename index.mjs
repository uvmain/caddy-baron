import decompress from 'decompress';
import fs from 'fs';
import https from 'https';
import { URL } from 'url';

let fileString = '';
const options = { headers: { 'User-Agent': 'Node.js' } };

async function getLatestReleaseTag() {
  const latestUrl = new URL('https://api.github.com/repos/caddyserver/caddy/releases/latest');

  return new Promise((resolve, reject) => {
    const request = https.get(latestUrl, options, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        resolve(new URL(res.headers.location));
      } else {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData.tag_name);
        });
      }
    });

    request.on('error', (error) => {
      reject(error);
    });
  });
}

async function getLatestReleaseUrl() {
  const version = await getLatestReleaseTag();
  let platform = process.platform;
  let ext = 'tar.gz';

  switch (process.platform) {
    case 'darwin':
      platform = 'mac';
      break;
    case 'win32':
      platform = 'windows';
      ext = 'zip';
      break;
  }

  const arch = process.arch === 'x64' ? 'amd64' : process.arch;
  fileString = `caddy_${version.substr(1)}_${platform}_${arch}.${ext}`;
  const latestUrl = `https://github.com/caddyserver/caddy/releases/download/${version}/${fileString}`;
  return new URL(latestUrl);
}

async function unzip() {
  await decompress(fileString, '.', {
    filter: (file) => file.path.includes('caddy'),
  });
  fs.unlinkSync(fileString);
}

async function downloadFile(downloadUrl) {
  const request = https.get(downloadUrl, options, (res) => {
    if (res.statusCode === 302 && res.headers.location) {
      downloadFile(new URL(res.headers.location));
    } else if (res.statusCode === 200) {
      const writeStream = fs.createWriteStream(fileString);

      res.pipe(writeStream);

      writeStream.on('finish', () => {
        writeStream.close();
        unzip();
        console.log('Download Completed');
      });
    } else {
      console.error(`Failed to download. HTTP status code: ${res.statusCode}`);
    }
  });

  request.on('error', (error) => {
    console.error('Error:', error);
  });
}

const downloadUrl = await getLatestReleaseUrl();

await downloadFile(downloadUrl);
