import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import { APIError, Forbidden } from 'payload'

import type { HetznerStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  cacheControl?: string
  collections: HetznerStorageOptions['collections']
  getStorageClient: () => AWS.S3
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  acl,
  bucket,
  cacheControl,
  collections,
  getStorageClient,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    const { collectionSlug, filename, mimeType } = await req.json()

    const collectionConfig = collections[collectionSlug]
    if (!collectionConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in Hetzner storage options`)
    }

    const prefix = (typeof collectionConfig === 'object' && collectionConfig.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const fileKey = path.posix.join(prefix, filename)

    const url = await getSignedUrl(
      getStorageClient(),
      new AWS.PutObjectCommand({
        ACL: acl,
        Bucket: bucket,
        CacheControl: cacheControl,
        ContentType: mimeType,
        Key: fileKey,
      }),
      {
        expiresIn: 600, // URL expires in 10 minutes
      },
    )

    return Response.json({ url })
  }
}
