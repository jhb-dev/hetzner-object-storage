'use client';
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client';
// Explicitly type the handler
export const HetznerClientUploadHandler = createClientUploadHandler({
    handler: async ({ apiRoute, collectionSlug, file, prefix, serverHandlerPath, serverURL })=>{
        // Request a signed URL from the server
        const response = await fetch(`${serverURL}${apiRoute}${serverHandlerPath}`, {
            body: JSON.stringify({
                collectionSlug,
                filename: file.name,
                mimeType: file.type
            }),
            credentials: 'include',
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error(`Failed to get signed URL: ${response.status} ${response.statusText}`);
        }
        const { url } = await response.json();
        // Upload the file directly to Hetzner using the signed URL
        const uploadResponse = await fetch(url, {
            body: file,
            headers: {
                'Content-Length': file.size.toString(),
                'Content-Type': file.type
            },
            method: 'PUT'
        });
        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        // Return the prefix if provided
        return {
            prefix
        };
    }
});

//# sourceMappingURL=HetznerClientUploadHandler.js.map