import fs from "fs/promises"
import path from "path"
import { Storage } from "@google-cloud/storage"

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".storage")

function isGcsConfigured() {
  return Boolean(
    process.env.GCS_BUCKET &&
      process.env.GCS_PROJECT_ID &&
      process.env.GCS_CLIENT_EMAIL &&
      process.env.GCS_PRIVATE_KEY,
  )
}

function getStorageClient() {
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  })
}

export class StorageService {
  static isConfigured() {
    return isGcsConfigured()
  }

  static buildPath(folder: string, filename: string) {
    return `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  }

  static async uploadBuffer(
    buffer: Buffer,
    storagePath: string,
    contentType: string,
  ): Promise<{ storagePath: string; publicUrl: string }> {
    if (isGcsConfigured()) {
      const bucket = getStorageClient().bucket(process.env.GCS_BUCKET!)
      const file = bucket.file(storagePath)
      await file.save(buffer, { contentType, resumable: false })
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
      return { storagePath, publicUrl: signedUrl }
    }

    const localPath = path.join(LOCAL_STORAGE_DIR, storagePath)
    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, buffer)

    const publicUrl = `/api/media/${encodeURIComponent(storagePath)}`
    return { storagePath, publicUrl }
  }

  static async uploadFromUrl(
    sourceUrl: string,
    storagePath: string,
    options?: { headers?: Record<string, string> },
  ): Promise<{ storagePath: string; publicUrl: string }> {
    const absoluteUrl = sourceUrl.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${sourceUrl}`
      : sourceUrl

    const response = await fetch(absoluteUrl, {
      headers: options?.headers,
    })
    if (!response.ok) {
      throw new Error(`Falha ao baixar arquivo: ${response.status}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    return this.uploadBuffer(buffer, storagePath, contentType)
  }

  static async persistExistingImage(
    sourceUrl: string,
    storagePath: string,
  ): Promise<{ storagePath: string; publicUrl: string }> {
    if (sourceUrl.startsWith("/api/media/")) {
      const relativePath = decodeURIComponent(sourceUrl.replace(/^\/api\/media\//, ""))
      const localPath = path.join(LOCAL_STORAGE_DIR, relativePath)
      const buffer = await fs.readFile(localPath)
      const ext = path.extname(localPath).toLowerCase()
      const contentType =
        ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".webp" ? "image/webp" :
        "image/png"
      return this.uploadBuffer(buffer, storagePath, contentType)
    }

    return this.uploadFromUrl(sourceUrl, storagePath)
  }

  static async resolveMediaBuffer(sourceUrl: string): Promise<Buffer> {
    const absoluteUrl = sourceUrl.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${sourceUrl}`
      : sourceUrl

    const mediaMarker = "/api/media/"
    if (absoluteUrl.includes(mediaMarker)) {
      const relativePath = decodeURIComponent(absoluteUrl.split(mediaMarker)[1] || "")
      const localPath = path.join(LOCAL_STORAGE_DIR, relativePath)
      return fs.readFile(localPath)
    }

    const response = await fetch(absoluteUrl)
    if (!response.ok) {
      throw new Error(`Falha ao baixar mídia: ${response.status}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  static async getSignedUrl(storagePath: string): Promise<string> {
    if (isGcsConfigured()) {
      const bucket = getStorageClient().bucket(process.env.GCS_BUCKET!)
      const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000,
      })
      return signedUrl
    }

    return `/api/media/${encodeURIComponent(storagePath)}`
  }

  static pathFromPublicUrl(url?: string | null): string | null {
    if (!url) return null
    const marker = "/api/media/"
    if (url.includes(marker)) {
      return decodeURIComponent(url.split(marker)[1] || "").split("?")[0]
    }
    return null
  }

  static async deleteFile(storagePath: string) {
    if (!storagePath) return
    try {
      if (isGcsConfigured()) {
        await getStorageClient().bucket(process.env.GCS_BUCKET!).file(storagePath).delete({ ignoreNotFound: true })
        return
      }
      await fs.unlink(path.join(LOCAL_STORAGE_DIR, storagePath))
    } catch {
      /* já pode ter sido apagado */
    }
  }

  static async deletePrefix(prefix: string) {
    if (!prefix) return
    if (isGcsConfigured()) {
      await getStorageClient().bucket(process.env.GCS_BUCKET!).deleteFiles({ prefix, force: true })
      return
    }
    await fs.rm(path.join(LOCAL_STORAGE_DIR, prefix), { recursive: true, force: true })
  }
}
