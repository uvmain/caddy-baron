import { copyFileSync, createWriteStream, existsSync, rmSync, unlinkSync } from 'node:fs'
import os from 'node:os'
import { pipeline } from 'node:stream/promises'
import { URL } from 'node:url'
import decompress from 'decompress'

const platform = os.platform()
const arch = os.arch()

let fileString = ''
let target = ''

async function getLatestReleaseTag() {
  const url = new URL('https://api.github.com/repos/caddyserver/caddy/releases/latest')

  try {
    const response = await fetch(url, { redirect: 'follow' })

    if (!response.ok) {
      throw new Error(`Failed to get latest release tag: ${response.status}`)
    }
    const json = await response.json()
    if (!json.tag_name) {
      throw new Error('No tag_name found in the latest release data')
    }
    return json.tag_name
  }
  catch (error) {
    console.error('Error fetching latest release:', error)
    throw error
  }
}

function getTarget() {
  if (platform === 'win32') {
    if (arch === 'x64') {
      target = 'windows_amd64.zip'
    }
    else if (arch === 'arm64') {
      target = 'windows_arm64.zip'
    }
    else {
      throw new Error(`Unsupported architecture: ${arch} for Windows`)
    }
  }
  else if (platform === 'darwin') {
    if (arch === 'x64') {
      target = 'mac_amd64.tar.gz'
    }
    else if (arch === 'arm64') {
      target = 'mac_arm64.tar.gz'
    }
    else {
      throw new Error(`Unsupported architecture: ${arch} for Darwin`)
    }
  }
  else if (platform === 'linux') {
    if (arch === 'x64') {
      target = 'linux_amd64.tar.gz'
    }
    else if (arch === 'arm64') {
      target = 'linux_arm64.tar.gz'
    }
    else {
      throw new Error(`Unsupported architecture: ${arch} for Linux`)
    }
  }
  else {
    throw new Error('Unsupported platform/architecture.')
  }
  return target
}

async function getLatestReleaseUrl() {
  const version = await getLatestReleaseTag()
  target = getTarget()

  fileString = `caddy_${version.substr(1)}_${target}`
  const latestUrl = `https://github.com/caddyserver/caddy/releases/download/${version}/${fileString}`
  console.log(`Latest release URL: ${latestUrl}`)
  return new URL(latestUrl)
}

function cleanup() {
  if (existsSync(fileString)) {
    unlinkSync(fileString)
  }
  if (existsSync('./__MACOSX')) {
    rmSync('./__MACOSX', { recursive: true, force: true })
  }
}

async function unzip() {
  try {
    await decompress(fileString, '.', {
      filter: file => file.path.includes('caddy'),
    })
    cleanup()
  }
  catch (err) {
    console.error(err)
  }
}

async function downloadFile(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Node.js' } })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    const writeStream = createWriteStream(fileString)

    await pipeline(response.body, writeStream)

    await unzip()

    if (platform === 'win32') {
      copyFileSync('./caddy.exe', './caddy')
    }
  }
  catch (err) {
    console.error('Error downloading zip:', err)
    cleanup()
  }
}

(async () => {
  const downloadUrl = await getLatestReleaseUrl()
  await downloadFile(downloadUrl)
})()
