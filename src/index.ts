import fs from 'node:fs'
import os from 'node:os'
import { pipeline } from 'node:stream/promises'
import { URL } from 'node:url'
import decompress from 'decompress'

type PlatformTarget = 'win32' | 'darwin' | 'linux'
type ArchTarget = 'x64' | 'arm64'

const platform = os.platform() as PlatformTarget
const arch = os.arch() as ArchTarget

let fileString = ''
let target = ''

async function getLatestReleaseTag(): Promise<string> {
  const url = new URL('https://api.github.com/repos/caddyserver/caddy/releases/latest')

  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Failed to get latest release tag: ${response.status}`)
  }

  const json = await response.json() as { tag_name?: string }
  if (!json.tag_name) {
    throw new Error('No tag_name found in the latest release data')
  }

  return json.tag_name
}

function getTarget(): string {
  switch (platform) {
    case 'win32':
      if (arch === 'x64')
        return 'windows_amd64.zip'
      if (arch === 'arm64')
        return 'windows_arm64.zip'
      break

    case 'darwin':
      if (arch === 'x64')
        return 'mac_amd64.tar.gz'
      if (arch === 'arm64')
        return 'mac_arm64.tar.gz'
      break

    case 'linux':
      if (arch === 'x64')
        return 'linux_amd64.tar.gz'
      if (arch === 'arm64')
        return 'linux_arm64.tar.gz'
      break
  }

  throw new Error(`Unsupported platform/architecture: ${platform}/${arch}`)
}

async function getLatestReleaseUrl(): Promise<URL> {
  const version = await getLatestReleaseTag()
  target = getTarget()
  fileString = `caddy_${version.slice(1)}_${target}`

  const latestUrl = `https://github.com/caddyserver/caddy/releases/download/${version}/${fileString}`
  console.log(`Latest release URL: ${latestUrl}`)
  return new URL(latestUrl)
}

function cleanup(): void {
  if (fs.existsSync(fileString))
    fs.unlinkSync(fileString)
  if (fs.existsSync('./__MACOSX'))
    fs.rmSync('./__MACOSX', { recursive: true, force: true })
}

async function unzip(): Promise<void> {
  try {
    await decompress(fileString, '.', {
      filter: file => file.path.includes('caddy'),
    })
    cleanup()
  }
  catch (err) {
    console.error('Error during extraction:', err)
  }
}

async function downloadFile(url: URL): Promise<void> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Node.js' },
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    const writeStream = fs.createWriteStream(fileString)
    await pipeline(response.body as any, writeStream)

    await unzip()

    if (platform === 'win32' && fs.existsSync('./caddy.exe')) {
      fs.copyFileSync('./caddy.exe', './caddy')
    }
  }
  catch (err) {
    console.error('Error downloading or extracting file:', err)
    cleanup()
  }
}

async function main(): Promise<void> {
  const downloadUrl = await getLatestReleaseUrl()
  await downloadFile(downloadUrl)
}

main().catch(console.error)
