import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
// Threshold for multipart upload, 50MB
const multipartThreshold = 1024 * 1024 * 50;
export const getHandleUpload = ({ acl, bucket, cacheControl, getStorageClient, prefix = '' })=>{
    return async ({ data, file })=>{
        const fileKey = path.posix.join(data.prefix || prefix, file.filename);
        const fileBufferOrStream = file.tempFilePath ? fs.createReadStream(file.tempFilePath) : file.buffer;
        // For small files, use simpler putObject
        if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
            await getStorageClient().putObject({
                ACL: acl,
                Body: fileBufferOrStream,
                Bucket: bucket,
                CacheControl: cacheControl,
                ContentType: file.mimeType,
                Key: fileKey
            });
            return data;
        }
        // For larger files, use multipart upload
        const parallelUpload = new Upload({
            client: getStorageClient(),
            params: {
                ACL: acl,
                Body: fileBufferOrStream,
                Bucket: bucket,
                CacheControl: cacheControl,
                ContentType: file.mimeType,
                Key: fileKey
            },
            partSize: multipartThreshold,
            queueSize: 4
        });
        await parallelUpload.done();
        return data;
    };
};

//# sourceMappingURL=handleUpload.js.map