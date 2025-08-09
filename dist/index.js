import * as AWS from '@aws-sdk/client-s3';
import { cloudStoragePlugin } from './plugin.js';
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities';
import { getGenerateSignedURLHandler } from './generateSignedURL.js';
import { getGenerateURL } from './generateURL.js';
import { getHandleDelete } from './handleDelete.js';
import { getHandleUpload } from './handleUpload.js';
import { getHandler } from './staticHandler.js';
let storageClient = null;
const defaultRequestHandlerOpts = {
    httpAgent: {
        keepAlive: true,
        maxSockets: 100
    },
    httpsAgent: {
        keepAlive: true,
        maxSockets: 100
    }
};
export const hetznerStorage = (hetznerStorageOptions)=>(incomingConfig)=>{
        const { region, credentials, bucket } = hetznerStorageOptions;
        // Configure S3 client with Hetzner-specific endpoint
        const s3Config = {
            region: 'eu-central-1',
            endpoint: `https://${region}.your-objectstorage.com`,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            },
            forcePathStyle: true,
            requestHandler: defaultRequestHandlerOpts
        };
        const getStorageClient = ()=>{
            if (storageClient) {
                return storageClient;
            }
            storageClient = new AWS.S3(s3Config);
            return storageClient;
        };
        const isPluginDisabled = hetznerStorageOptions.enabled === false;
        initClientUploads({
            clientHandler: '@joneslloyd/payload-storage-hetzner/client#HetznerClientUploadHandler',
            collections: hetznerStorageOptions.collections,
            config: incomingConfig,
            enabled: !isPluginDisabled && Boolean(hetznerStorageOptions.clientUploads),
            serverHandler: getGenerateSignedURLHandler({
                access: typeof hetznerStorageOptions.clientUploads === 'object' ? hetznerStorageOptions.clientUploads.access : undefined,
                acl: hetznerStorageOptions.acl,
                bucket: hetznerStorageOptions.bucket,
                cacheControl: hetznerStorageOptions.cacheControl,
                collections: hetznerStorageOptions.collections,
                getStorageClient
            }),
            serverHandlerPath: '/hetzner-storage-generate-signed-url'
        });
        if (isPluginDisabled) {
            return incomingConfig;
        }
        const adapter = hetznerStorageInternal(getStorageClient, hetznerStorageOptions);
        // Add adapter to each collection option object
        const collectionsWithAdapter = Object.entries(hetznerStorageOptions.collections).reduce((acc, [slug, collOptions])=>({
                ...acc,
                [slug]: {
                    ...collOptions === true ? {} : collOptions,
                    adapter
                }
            }), {});
        // Set disableLocalStorage: true for collections specified in the plugin options
        const config = {
            ...incomingConfig,
            collections: (incomingConfig.collections || []).map((collection)=>{
                if (!collectionsWithAdapter[collection.slug]) {
                    return collection;
                }
                return {
                    ...collection,
                    upload: {
                        ...typeof collection.upload === 'object' ? collection.upload : {},
                        disableLocalStorage: true
                    }
                };
            })
        };
        return cloudStoragePlugin({
            collections: collectionsWithAdapter
        })(config);
    };
function hetznerStorageInternal(getStorageClient, { acl, bucket, cacheControl, clientUploads, region }) {
    return ({ collection, prefix })=>{
        return {
            name: 'hetzner',
            clientUploads,
            generateURL: getGenerateURL({
                bucket,
                region
            }),
            handleDelete: getHandleDelete({
                bucket,
                getStorageClient
            }),
            handleUpload: getHandleUpload({
                acl,
                bucket,
                cacheControl,
                collection,
                getStorageClient,
                prefix
            }),
            staticHandler: getHandler({
                bucket,
                collection,
                getStorageClient
            })
        };
    };
}

//# sourceMappingURL=index.js.map