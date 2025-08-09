import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types';
import type { PayloadHandler } from 'payload';
import * as AWS from '@aws-sdk/client-s3';
import type { HetznerStorageOptions } from './index.js';
interface Args {
    access?: ClientUploadsAccess;
    acl?: 'private' | 'public-read';
    bucket: string;
    cacheControl?: string;
    collections: HetznerStorageOptions['collections'];
    getStorageClient: () => AWS.S3;
}
export declare const getGenerateSignedURLHandler: ({ access, acl, bucket, cacheControl, collections, getStorageClient, }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=generateSignedURL.d.ts.map