import fs from 'fs/promises'
import path from 'path'
import { createWriteStream, createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import archiver from 'archiver'
import { prisma } from '../utils/prisma'
import { env } from '../config'

// ==============================
// UPLOAD
// ==============================

export async function saveFile(
  userId: string,
  folderId: string | null,
  filename: string,
  mimeType: string,
  stream: NodeJS.ReadableStream,
  sizeBytes: number,
) {
  // Vérifie le quota
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('USER_NOT_FOUND')

  if (user.usedBytes + BigInt(sizeBytes) > user.quotaBytes) {
    throw new Error('QUOTA_EXCEEDED')
  }

  // Dossier de stockage par user
  const userDir = path.join(env.STORAGE_PATH, userId)
  await fs.mkdir(userDir, { recursive: true })

  // Nom unique sur le disque pour éviter les collisions
  const diskName = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const storagePath = path.join(userDir, diskName)

  // Écrit le fichier sur le volume
  const writeStream = createWriteStream(storagePath)
  await pipeline(stream, writeStream)

  // Vérifie la taille réelle
  const stat = await fs.stat(storagePath)
  const realSize = stat.size

  // Crée l'entrée en BDD
  const file = await prisma.file.create({
    data: {
      name: filename,
      mimeType,
      sizeBytes: BigInt(realSize),
      storagePath,
      userId,
      folderId,
    },
  })

  // Met à jour le quota utilisé
  await prisma.user.update({
    where: { id: userId },
    data: { usedBytes: { increment: BigInt(realSize) } },
  })

  return file
}

// ==============================
// TÉLÉCHARGEMENT
// ==============================

export async function getFileStream(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  })

  if (!file) throw new Error('FILE_NOT_FOUND')

  await fs.access(file.storagePath) // lève une erreur si manquant
  return { file, stream: createReadStream(file.storagePath) }
}

// ==============================
// TÉLÉCHARGEMENT DOSSIER (ZIP)
// ==============================

export async function createFolderZip(
  folderId: string,
  userId: string,
  outputStream: NodeJS.WritableStream,
) {
  const archive = archiver('zip', { zlib: { level: 6 } })
  archive.pipe(outputStream)

  await addFolderToArchive(archive, folderId, userId, '')

  await archive.finalize()
}

async function addFolderToArchive(
  archive: archiver.Archiver,
  folderId: string,
  userId: string,
  prefix: string,
) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    include: {
      files: true,
      children: true,
    },
  })

  if (!folder) return

  const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name

  // Ajoute les fichiers du dossier
  for (const file of folder.files) {
    try {
      const stream = createReadStream(file.storagePath)
      archive.append(stream, { name: `${folderPath}/${file.name}` })
    } catch {
      // Fichier manquant sur le disque — on skip sans planter tout le ZIP
    }
  }

  // Récurse sur les sous-dossiers
  for (const child of folder.children) {
    await addFolderToArchive(archive, child.id, userId, folderPath)
  }
}

// ==============================
// SUPPRESSION (vers corbeille)
// ==============================

export async function moveFileToTrash(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({ where: { id: fileId, userId } })
  if (!file) throw new Error('FILE_NOT_FOUND')

  await prisma.trashItem.create({
    data: {
      userId,
      fileId,
      originalPath: file.folderId ?? '',
    },
  })

  return file
}

export async function moveFolderToTrash(folderId: string, userId: string) {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } })
  if (!folder) throw new Error('FOLDER_NOT_FOUND')

  await prisma.trashItem.create({
    data: {
      userId,
      folderId,
      originalPath: folder.parentId ?? '',
    },
  })

  return folder
}

// ==============================
// RESTAURATION DEPUIS CORBEILLE
// ==============================

export async function restoreFromTrash(trashItemId: string, userId: string) {
  const item = await prisma.trashItem.findFirst({
    where: { id: trashItemId, userId },
    include: { file: true, folder: true },
  })

  if (!item) throw new Error('TRASH_ITEM_NOT_FOUND')

  await prisma.trashItem.delete({ where: { id: trashItemId } })

  return item
}

// ==============================
// SUPPRESSION DÉFINITIVE
// ==============================

export async function deleteFilePermanently(fileId: string, userId: string) {
  const file = await prisma.file.findFirst({ where: { id: fileId, userId } })
  if (!file) throw new Error('FILE_NOT_FOUND')

  // Supprime le fichier physique
  try {
    await fs.unlink(file.storagePath)
  } catch {
    // Déjà supprimé physiquement — on continue
  }

  await prisma.file.delete({ where: { id: fileId } })

  // Libère le quota
  await prisma.user.update({
    where: { id: userId },
    data: { usedBytes: { decrement: file.sizeBytes } },
  })
}
