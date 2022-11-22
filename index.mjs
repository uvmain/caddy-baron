import decompress from 'decompress';
import fs from 'fs';
import got from 'got';
import ndh from 'node-downloader-helper';

let downloadDir = process.cwd().split('caddy-baron')[0];
downloadDir = `${downloadDir}.bin`;

console.info(process.argv)

switch (process.argv[2]) {
  case "postinstall":
    let version;

    // check if env var Caddy version is valid
    const envVersion = process.env.CADDYVERSION;
    if (envVersion != undefined) {
    const versionCheck = await got('https://api.github.com/repos/caddyserver/caddy/tags').json();
      if ((versionCheck.filter(release => release.name == envVersion)[0]) != undefined) {
        version = envVersion;
      }
    }
    if (version == undefined) {
      //get the latest release version
      const latest = await got('https://api.github.com/repos/caddyserver/caddy/releases/latest').json();
      version = latest.name;
    }

    // build Caddy download string
    let platform = 'linux';
    let ext = 'tar.gz';
    let arch = 'amd64';

    switch(process.platform) {
      case 'darwin':
        platform = 'mac';
      case 'windows':
        platform = 'win32';
        ext = 'zip';
    }

    switch(process.arch) {
      case 'arm64': arch = 'arm64';
      case 'arm': arch = 'arm';
    }

    const fileString = `caddy_${version.substr(1)}_${platform}_${arch}.${ext}`;
    const downloadString = `https://github.com/caddyserver/caddy/releases/download/${version}/${fileString}`;

    fs.mkdir(downloadDir, { recursive: true }, (err) => {
      if (err) throw err;
    });

    const saveString = (ext === 'zip') ? 'caddy.exe' : 'caddy'

    async function unzip() {
      await decompress(`${downloadDir}/${fileString}`, downloadDir, {
        filter: file => file.path.includes("caddy")
      });
      fs.unlinkSync(`${downloadDir}/${fileString}`);
    }

    const dl = new ndh.DownloaderHelper(downloadString, downloadDir);
    dl.on('end', () => {
      unzip();
    });
    dl.on('error', (err) => console.log('Caddy Download Failed', err));
    dl.start().catch(err => console.error(err));
    break;

  case "preuninstall":
    await fs.unlinkSync(`${downloadDir}${process.platform === 'win32' ? '.exe' : ''}`);
    break;
}