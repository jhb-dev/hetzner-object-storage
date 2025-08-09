import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities';
import path from 'path';
// Type guard for NodeJS.Readable streams
const isNodeReadableStream = (body)=>{
    return typeof body === 'object' && body !== null && 'pipe' in body && typeof body.pipe === 'function' && 'destroy' in body && typeof body.destroy === 'function';
};
const destroyStream = (object)=>{
    if (object?.Body && isNodeReadableStream(object.Body)) {
        object.Body.destroy();
    }
};
// Convert a stream into a promise that resolves with a Buffer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const streamToBuffer = async (readableStream)=>{
    const chunks = [];
    for await (const chunk of readableStream){
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};
export const getHandler = ({ bucket, collection, getStorageClient })=>{
    return async (req, { params: { clientUploadContext, filename } })=>{
        let object = undefined;
        try {
            const prefix = await getFilePrefix({
                clientUploadContext,
                collection,
                filename,
                req
            });
            const key = path.posix.join(prefix, filename);
            object = await getStorageClient().getObject({
                Bucket: bucket,
                Key: key
            });
            if (!object.Body) {
                return new Response(null, {
                    status: 404,
                    statusText: 'Not Found'
                });
            }
            const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match');
            const objectEtag = object.ETag;
            // Handle 304 Not Modified responses
            if (etagFromHeaders && etagFromHeaders === objectEtag) {
                return new Response(null, {
                    headers: new Headers({
                        'Accept-Ranges': String(object.AcceptRanges),
                        'Content-Length': String(object.ContentLength),
                        'Content-Type': String(object.ContentType),
                        ETag: String(object.ETag)
                    }),
                    status: 304
                });
            }
            // On error, manually destroy stream to close socket
            if (object.Body && isNodeReadableStream(object.Body)) {
                const stream = object.Body;
                stream.on('error', (err)=>{
                    req.payload.logger.error({
                        err,
                        key,
                        msg: 'Error streaming Hetzner object, destroying stream'
                    });
                    stream.destroy();
                });
            }
            const bodyBuffer = await streamToBuffer(object.Body);
            return new Response(bodyBuffer, {
                headers: new Headers({
                    'Accept-Ranges': String(object.AcceptRanges),
                    'Content-Length': String(object.ContentLength),
                    'Content-Type': String(object.ContentType),
                    ETag: String(object.ETag)
                }),
                status: 200
            });
        } catch (err) {
            req.payload.logger.error(err);
            return new Response('Internal Server Error', {
                status: 500
            });
        } finally{
            destroyStream(object);
        }
    };
};

//# sourceMappingURL=staticHandler.js.map