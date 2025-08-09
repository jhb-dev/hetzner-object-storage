import type { ClientUploadsConfig, CollectionOptions } from '@payloadcms/plugin-cloud-storage/types';
import type { Plugin, UploadCollectionSlug } from 'payload';
export type HetznerStorageOptions = {
    /**
     * Access control list for uploaded files.
     * Hetzner supports 'private' and 'public-read'.
     */
    acl?: 'private' | 'public-read';
    /**
     * Bucket name to upload files to.
     */
    bucket: string;
    /**
     * Cache-Control header value to set on uploaded files.
     * For example: 'max-age=31536000' for 1 year cache.
     */
    cacheControl?: string;
    /**
     * Do uploads directly on the client to bypass server upload limits.
     * You must allow CORS PUT method for the bucket to your website.
     */
    clientUploads?: ClientUploadsConfig;
    /**
     * Collection options to apply the Hetzner adapter to.
     */
    collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>;
    /**
     * Hetzner region for your bucket.
     * Available regions: 'fsn1', 'nbg1', 'hel1'
     */
    region: 'fsn1' | 'nbg1' | 'hel1';
    /**
     * Credentials for accessing Hetzner Object Storage.
     */
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    /**
     * Whether or not to disable local storage
     *
     * @default true
     */
    disableLocalStorage?: boolean;
    /**
     * Whether or not to enable the plugin
     *
     * Default: true
     */
    enabled?: boolean;
};
type HetznerStoragePlugin = (hetznerStorageArgs: HetznerStorageOptions) => Plugin;
export declare const hetznerStorage: HetznerStoragePlugin;
export {};
//# sourceMappingURL=index.d.ts.map