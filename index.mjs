import decompress from 'decompress';
import fs, { createWriteStream } from 'fs';
import got from 'got';

let downloadDir = process.cwd().split('caddy-baron')[0];
downloadDir = `${downloadDir}.bin`;

console.info(process.argv)

switch (process.argv[2]) {
  case "postinstall":
    //get the latest release version
    const latest = await got('https://api.github.com/repos/caddyserver/caddy/releases/latest').json();
    const version = latest.tag_name;

    // build mkcert download string
    let platform = process.platform;
    let ext = 'tar.gz'

    switch(process.platform) {
      case 'darwin':
        platform = 'mac';
      case 'win32':
        platform = 'windows';
        ext = 'zip';
    }

    const arch = (process.arch == 'x64') ? 'amd64' : process.arch

    const fileString = `caddy_${version.substr(1)}_${platform}_${arch}.${ext}`;

    console.log(fileString);

    const downloadString = `https://github.com/caddyserver/caddy/releases/download/${version}/${fileString}`;

    console.log(downloadString);

    fs.mkdir(downloadDir, { recursive: true }, (err) => {
      if (err) throw err;
    });

    const downloadStream = got.stream(downloadString)
    const fileStream = createWriteStream(`${downloadDir}/${fileString}`)

    async function unzip() {
      await decompress(`${downloadDir}/${fileString}`, downloadDir, {
        filter: file => file.path.includes("caddy")
      });
      fs.unlinkSync(`${downloadDir}/${fileString}`);
    }

    downloadStream
      .on('error', (error) => {
        console.log(`Failed to download caddy: ${error}`)
      })
    fileStream
    .on('error', (error) => {
      console.log(`Failed to save caddy: ${error}`)
    })
    .on("finish", () => {
      unzip();
    });

    downloadStream.pipe(fileStream)

    break;

  case "preuninstall":
    await fs.unlinkSync(`${downloadDir}${process.platform === 'win32' ? '.exe' : ''}`);
    break;
}