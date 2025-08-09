import { getFields } from './fields/getFields.js';
import { getAfterDeleteHook } from './hooks/afterDelete.js';
import { getBeforeChangeHook } from './hooks/beforeChange.js';
// This plugin extends all targeted collections by offloading uploaded files
// to cloud storage instead of solely storing files locally.
// It is based on an adapter approach, where adapters can be written for any cloud provider.
// Adapters are responsible for providing four actions that this plugin will use:
// 1. handleUpload, 2. handleDelete, 3. generateURL, 4. staticHandler
// Optionally, the adapter can specify any Webpack config overrides if they are necessary.
export const cloudStoragePlugin = (pluginOptions)=>(incomingConfig)=>{
        const { collections: allCollectionOptions, enabled } = pluginOptions;
        const config = {
            ...incomingConfig
        };
        // Return early if disabled. Only webpack config mods are applied.
        if (enabled === false) {
            return config;
        }
        const initFunctions = [];
        return {
            ...config,
            collections: (config.collections || []).map((existingCollection)=>{
                const options = allCollectionOptions[existingCollection.slug];
                if (options?.adapter) {
                    const adapter = options.adapter({
                        collection: existingCollection,
                        prefix: options.prefix
                    });
                    if (adapter.onInit) {
                        initFunctions.push(adapter.onInit);
                    }
                    const fields = getFields({
                        adapter,
                        collection: existingCollection,
                        disablePayloadAccessControl: options.disablePayloadAccessControl,
                        generateFileURL: options.generateFileURL,
                        prefix: options.prefix
                    });
                    const handlers = [
                        ...typeof existingCollection.upload === 'object' && Array.isArray(existingCollection.upload.handlers) ? existingCollection.upload.handlers : []
                    ];
                    if (options.disablePayloadAccessControl) {
                        // When disablePayloadAccessControl: true:
                        // - use the static handler for client uploads
                        // - use a redirect handler for all other requests that redirects to direct storage URLs
                        handlers.push(async (req, args)=>{
                            if ('clientUploadContext' in args.params) {
                                return await adapter.staticHandler(req, args);
                            } else {
                                try {
                                    const { filename } = args.params;
                                    const url = await adapter.generateURL?.({
                                        collection: existingCollection,
                                        data: args.doc || {},
                                        filename,
                                        prefix: options.prefix
                                    });
                                    if (url) {
                                        return new Response(null, {
                                            status: 302,
                                            headers: {
                                                Location: url
                                            }
                                        });
                                    }
                                    return new Response('Not Found', {
                                        status: 404
                                    });
                                } catch (err) {
                                    req.payload.logger.error(err);
                                    return new Response('Internal Server Error', {
                                        status: 500
                                    });
                                }
                            }
                        });
                    } else {
                        handlers.push(adapter.staticHandler);
                    }
                    return {
                        ...existingCollection,
                        fields,
                        hooks: {
                            ...existingCollection.hooks || {},
                            afterDelete: [
                                ...existingCollection.hooks?.afterDelete || [],
                                getAfterDeleteHook({
                                    adapter,
                                    collection: existingCollection
                                })
                            ],
                            beforeChange: [
                                ...existingCollection.hooks?.beforeChange || [],
                                getBeforeChangeHook({
                                    adapter,
                                    collection: existingCollection
                                })
                            ]
                        },
                        upload: {
                            ...typeof existingCollection.upload === 'object' ? existingCollection.upload : {},
                            adapter: adapter.name,
                            disableLocalStorage: typeof options.disableLocalStorage === 'boolean' ? options.disableLocalStorage : true,
                            handlers
                        }
                    };
                }
                return existingCollection;
            }),
            onInit: async (payload)=>{
                initFunctions.forEach((fn)=>fn());
                if (config.onInit) {
                    await config.onInit(payload);
                }
            }
        };
    };

//# sourceMappingURL=plugin.js.map