import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface ExportTextFileResult {
  mode: 'downloaded' | 'shared' | 'saved'
  uri?: string
}

export function downloadTextFile(filename: string, text: string, mimeType = 'application/json'): void {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function exportTextFile(filename: string, text: string, mimeType = 'application/json'): Promise<ExportTextFileResult> {
  if (!Capacitor.isNativePlatform()) {
    downloadTextFile(filename, text, mimeType)
    return { mode: 'downloaded' }
  }

  const saved = await writeNativeTextFile(filename, text)
  const canShare = await Share.canShare()

  if (canShare.value) {
    await Share.share({
      title: filename,
      text: '新版备份已生成',
      files: [saved.uri],
      dialogTitle: '保存或分享备份文件'
    })
    return { mode: 'shared', uri: saved.uri }
  }

  return { mode: 'saved', uri: saved.uri }
}

async function writeNativeTextFile(filename: string, text: string) {
  try {
    return await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    })
  } catch {
    return Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8
    })
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('读取文件失败。'))
    reader.readAsText(file)
  })
}
