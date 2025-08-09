import path from 'path';
export const getGenerateURL = ({ bucket, region })=>({ filename, prefix = '' })=>{
        // Construct URL according to Hetzner Object Storage format
        return `https://${bucket}.${region}.your-objectstorage.com/${path.posix.join(prefix, filename)}`;
    };

//# sourceMappingURL=generateURL.js.map