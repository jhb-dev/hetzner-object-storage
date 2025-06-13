import type {
  Adapter,
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { NodeHttpHandlerOptions } from '@smithy/node-http-handler'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { cloudStoragePlugin } from './plugin.js'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export type HetznerStorageOptions = {
  /**
   * Access control list for uploaded files.
   * Hetzner supports 'private' and 'public-read'.
   */
  acl?: 'private' | 'public-read'

  /**
   * Bucket name to upload files to.
   */
  bucket: string

  /**
   * Cache-Control header value to set on uploaded files.
   * For example: 'max-age=31536000' for 1 year cache.
   */
  cacheControl?: string

  /**
   * Do uploads directly on the client to bypass server upload limits.
   * You must allow CORS PUT method for the bucket to your website.
   */
  clientUploads?: ClientUploadsConfig

  /**
   * Collection options to apply the Hetzner adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Hetzner region for your bucket.
   * Available regions: 'fsn1', 'nbg1', 'hel1'
   */
  region: 'fsn1' | 'nbg1' | 'hel1'

  /**
   * Credentials for accessing Hetzner Object Storage.
   */
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }

  /**
   * Whether or not to disable local storage
   *
   * @default true
   */
  disableLocalStorage?: boolean

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
}

type HetznerStoragePlugin = (hetznerStorageArgs: HetznerStorageOptions) => Plugin

let storageClient: AWS.S3 | null = null

const defaultRequestHandlerOpts: NodeHttpHandlerOptions = {
  httpAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
  httpsAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
}

export const hetznerStorage: HetznerStoragePlugin =
  (hetznerStorageOptions: HetznerStorageOptions) =>
  (incomingConfig: Config): Config => {
    const { region, credentials, bucket } = hetznerStorageOptions

    // Configure S3 client with Hetzner-specific endpoint
    const s3Config: AWS.S3ClientConfig = {
      region: 'eu-central-1', // Hetzner uses eu-central-1 as region in the SDK
      endpoint: `https://${region}.your-objectstorage.com`,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      forcePathStyle: true, // Required for Hetzner Object Storage
      requestHandler: defaultRequestHandlerOpts,
    }

    const getStorageClient: () => AWS.S3 = () => {
      if (storageClient) {
        return storageClient
      }

      storageClient = new AWS.S3(s3Config)
      return storageClient
    }

    const isPluginDisabled = hetznerStorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@joneslloyd/payload-storage-hetzner/client#HetznerClientUploadHandler',
      collections: hetznerStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(hetznerStorageOptions.clientUploads),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof hetznerStorageOptions.clientUploads === 'object'
            ? hetznerStorageOptions.clientUploads.access
            : undefined,
        acl: hetznerStorageOptions.acl,
        bucket: hetznerStorageOptions.bucket,
        cacheControl: hetznerStorageOptions.cacheControl,
        collections: hetznerStorageOptions.collections,
        getStorageClient,
      }),
      serverHandlerPath: '/hetzner-storage-generate-signed-url',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    const adapter = hetznerStorageInternal(getStorageClient, hetznerStorageOptions)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      hetznerStorageOptions.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
          adapter,
        },
      }),
      {} as Record<string, CollectionOptions>,
    )

    // Set disableLocalStorage: true for collections specified in the plugin options
    const config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collectionsWithAdapter[collection.slug]) {
          return collection
        }

        return {
          ...collection,
          upload: {
            ...(typeof collection.upload === 'object' ? collection.upload : {}),
            disableLocalStorage: true,
          },
        }
      }),
    }

    return cloudStoragePlugin({
      collections: collectionsWithAdapter,
    })(config)
  }

function hetznerStorageInternal(
  getStorageClient: () => AWS.S3,
  { acl, bucket, cacheControl, clientUploads, region }: HetznerStorageOptions,
): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'hetzner',
      clientUploads,
      generateURL: getGenerateURL({ bucket, region }),
      handleDelete: getHandleDelete({ bucket, getStorageClient }),
      handleUpload: getHandleUpload({
        acl,
        bucket,
        cacheControl,
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, getStorageClient }),
    }
  }
}
