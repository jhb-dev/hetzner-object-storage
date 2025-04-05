import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import path from 'path'

interface Args {
  bucket: string
  region: string
}

export const getGenerateURL =
  ({ bucket, region }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    // Construct URL according to Hetzner Object Storage format
    return `https://${bucket}.${region}.your-objectstorage.com/${path.posix.join(prefix, filename)}`
  }
