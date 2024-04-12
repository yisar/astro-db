import type { AstroConfig } from 'astro';
/**
 * Load a user’s `astro:db` configuration file and additional configuration files provided by integrations.
 */
export declare function resolveDbConfig({ root, integrations, }: Pick<AstroConfig, 'root' | 'integrations'>): Promise<{
    /** Resolved `astro:db` config, including tables added by integrations. */
    dbConfig: {
        tables: Record<string, {
            indexes: Record<string, {
                on: (string | string[]) & (string | string[] | undefined);
                unique?: boolean | undefined;
            }>;
            deprecated: boolean;
            columns: Record<string, {
                type: "boolean";
                schema: {
                    optional: boolean;
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                    default?: boolean | import("../runtime/types.js").SerializedSQL | undefined;
                };
            } | {
                type: "number";
                schema: ({
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                } & {
                    optional: boolean;
                    primaryKey: false;
                    default?: number | import("../runtime/types.js").SerializedSQL | undefined;
                } & {
                    references?: any | undefined;
                }) | ({
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                } & {
                    primaryKey: true;
                    optional?: false | undefined;
                    default?: undefined;
                } & {
                    references?: any | undefined;
                });
            } | {
                type: "text";
                schema: ({
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                    default?: string | import("../runtime/types.js").SerializedSQL | undefined;
                    multiline?: boolean | undefined;
                } & {
                    optional: boolean;
                    primaryKey: false;
                } & {
                    references?: any | undefined;
                }) | ({
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                    default?: string | import("../runtime/types.js").SerializedSQL | undefined;
                    multiline?: boolean | undefined;
                } & {
                    primaryKey: true;
                    optional?: false | undefined;
                } & {
                    references?: any | undefined;
                });
            } | {
                type: "date";
                schema: {
                    optional: boolean;
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                    default?: string | import("../runtime/types.js").SerializedSQL | undefined;
                };
            } | {
                type: "json";
                schema: {
                    optional: boolean;
                    unique: boolean;
                    deprecated: boolean;
                    name?: string | undefined;
                    label?: string | undefined;
                    collection?: string | undefined;
                    default?: unknown;
                };
            }>;
            foreignKeys?: (Omit<{
                columns: import("./schemas.js").MaybeArray<string>;
                references: () => import("./schemas.js").MaybeArray<Omit<{
                    type: "number";
                    schema: ({
                        name?: string | undefined;
                        label?: string | undefined;
                        unique?: boolean | undefined;
                        deprecated?: boolean | undefined;
                        collection?: string | undefined;
                    } & {
                        primaryKey?: false | undefined;
                        optional?: boolean | undefined;
                        default?: number | import("drizzle-orm").SQL<any> | undefined;
                    } & {
                        references?: (() => any) | undefined;
                    }) | ({
                        name?: string | undefined;
                        label?: string | undefined;
                        unique?: boolean | undefined;
                        deprecated?: boolean | undefined;
                        collection?: string | undefined;
                    } & {
                        primaryKey: true;
                        optional?: false | undefined;
                        default?: undefined;
                    } & {
                        references?: (() => any) | undefined;
                    });
                } | {
                    type: "text";
                    schema: ({
                        name?: string | undefined;
                        label?: string | undefined;
                        unique?: boolean | undefined;
                        deprecated?: boolean | undefined;
                        collection?: string | undefined;
                        default?: string | import("drizzle-orm").SQL<any> | undefined;
                        multiline?: boolean | undefined;
                    } & {
                        primaryKey?: false | undefined;
                        optional?: boolean | undefined;
                    } & {
                        references?: (() => any) | undefined;
                    }) | ({
                        name?: string | undefined;
                        label?: string | undefined;
                        unique?: boolean | undefined;
                        deprecated?: boolean | undefined;
                        collection?: string | undefined;
                        default?: string | import("drizzle-orm").SQL<any> | undefined;
                        multiline?: boolean | undefined;
                    } & {
                        primaryKey: true;
                        optional?: false | undefined;
                    } & {
                        references?: (() => any) | undefined;
                    });
                }, "references">>;
            }, "references"> & {
                references: import("./schemas.js").MaybeArray<Omit<{
                    type: "number";
                    schema: ({
                        unique: boolean;
                        deprecated: boolean;
                        name?: string | undefined;
                        label?: string | undefined;
                        collection?: string | undefined;
                    } & {
                        optional: boolean;
                        primaryKey: false;
                        default?: number | import("../runtime/types.js").SerializedSQL | undefined;
                    } & {
                        references?: any | undefined;
                    }) | ({
                        unique: boolean;
                        deprecated: boolean;
                        name?: string | undefined;
                        label?: string | undefined;
                        collection?: string | undefined;
                    } & {
                        primaryKey: true;
                        optional?: false | undefined;
                        default?: undefined;
                    } & {
                        references?: any | undefined;
                    });
                } | {
                    type: "text";
                    schema: ({
                        unique: boolean;
                        deprecated: boolean;
                        name?: string | undefined;
                        label?: string | undefined;
                        collection?: string | undefined;
                        default?: string | import("../runtime/types.js").SerializedSQL | undefined;
                        multiline?: boolean | undefined;
                    } & {
                        optional: boolean;
                        primaryKey: false;
                    } & {
                        references?: any | undefined;
                    }) | ({
                        unique: boolean;
                        deprecated: boolean;
                        name?: string | undefined;
                        label?: string | undefined;
                        collection?: string | undefined;
                        default?: string | import("../runtime/types.js").SerializedSQL | undefined;
                        multiline?: boolean | undefined;
                    } & {
                        primaryKey: true;
                        optional?: false | undefined;
                    } & {
                        references?: any | undefined;
                    });
                }, "references">>;
            })[] | undefined;
        }>;
    };
    /** Dependencies imported into the user config file. */
    dependencies: string[];
    /** Additional `astro:db` seed file paths provided by integrations. */
    integrationSeedPaths: (string | URL)[];
}>;
/**
 * Bundle arbitrary `mjs` or `ts` file.
 * Simplified fork from Vite's `bundleConfigFile` function.
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
export declare function bundleFile({ fileUrl, root, virtualModContents, }: {
    fileUrl: URL;
    root: URL;
    virtualModContents: string;
}): Promise<{
    code: string;
    dependencies: string[];
}>;
/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
export declare function importBundledFile({ code, root, }: {
    code: string;
    root: URL;
}): Promise<{
    default?: unknown;
}>;