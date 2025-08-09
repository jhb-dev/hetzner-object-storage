import type { CollectionBeforeChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload';
import type { GeneratedAdapter } from '../types.js';
interface Args {
    adapter: GeneratedAdapter;
    collection: CollectionConfig;
}
export declare const getBeforeChangeHook: ({ adapter, collection }: Args) => CollectionBeforeChangeHook<FileData & TypeWithID>;
export {};
//# sourceMappingURL=beforeChange.d.ts.map