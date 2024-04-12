import { LibsqlError } from '@libsql/client';
import type { ColumnsConfig, DBConfigInput, TableConfig } from '../core/types.js';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
export type Database = Omit<LibSQLDatabase, 'transaction'>;
export declare function isDbError(err: unknown): err is LibsqlError;
export declare const column: {
    number: <T extends ({
        name?: string | undefined;
        label?: string | undefined;
        unique?: boolean | undefined;
        deprecated?: boolean | undefined;
        collection?: string | undefined;
    } & ({
        primaryKey?: false | undefined;
        optional?: boolean | undefined;
        default?: number | import("drizzle-orm").SQL<any> | undefined;
    } | {
        primaryKey: true;
        optional?: false | undefined;
        default?: undefined;
    })) & {
        references?: (() => {
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
            } & any) | ({
                name?: string | undefined;
                label?: string | undefined;
                unique?: boolean | undefined;
                deprecated?: boolean | undefined;
                collection?: string | undefined;
            } & {
                primaryKey: true;
                optional?: false | undefined;
                default?: undefined;
            } & any);
        }) | undefined;
    }>(opts?: T) => {
        type: "number";
        /**
         * @internal
         */
        schema: T;
    };
    boolean: <T_1 extends {
        name?: string | undefined;
        label?: string | undefined;
        optional?: boolean | undefined;
        unique?: boolean | undefined;
        deprecated?: boolean | undefined;
        collection?: string | undefined;
        default?: boolean | import("drizzle-orm").SQL<any> | undefined;
    }>(opts?: T_1) => {
        type: "boolean";
        /**
         * @internal
         */
        schema: T_1;
    };
    text: <T_2 extends ({
        name?: string | undefined;
        label?: string | undefined;
        unique?: boolean | undefined;
        deprecated?: boolean | undefined;
        collection?: string | undefined;
        default?: string | import("drizzle-orm").SQL<any> | undefined;
        multiline?: boolean | undefined;
    } & ({
        primaryKey?: false | undefined;
        optional?: boolean | undefined;
    } | {
        primaryKey: true;
        optional?: false | undefined;
    })) & {
        references?: (() => {
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
            } & any) | ({
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
            } & any);
        }) | undefined;
    }>(opts?: T_2) => {
        type: "text";
        /**
         * @internal
         */
        schema: T_2;
    };
    date<T_3 extends {
        name?: string | undefined;
        label?: string | undefined;
        optional?: boolean | undefined;
        unique?: boolean | undefined;
        deprecated?: boolean | undefined;
        collection?: string | undefined;
        default?: Date | import("drizzle-orm").SQL<any> | undefined;
    }>(opts?: T_3): {
        type: "date";
        /**
         * @internal
         */
        schema: T_3;
    };
    json<T_4 extends {
        name?: string | undefined;
        label?: string | undefined;
        optional?: boolean | undefined;
        unique?: boolean | undefined;
        deprecated?: boolean | undefined;
        collection?: string | undefined;
        default?: unknown;
    }>(opts?: T_4): {
        type: "json";
        /**
         * @internal
         */
        schema: T_4;
    };
};
export declare function defineTable<TColumns extends ColumnsConfig>(userConfig: TableConfig<TColumns>): TableConfig<TColumns>;
export declare function defineDb(userConfig: DBConfigInput): {
    tables?: unknown;
};
export declare const NOW: import("drizzle-orm").SQL<unknown>;
export declare const TRUE: import("drizzle-orm").SQL<unknown>;
export declare const FALSE: import("drizzle-orm").SQL<unknown>;
export { sql, eq, gt, gte, lt, lte, ne, isNull, isNotNull, inArray, notInArray, exists, notExists, between, notBetween, like, notIlike, not, asc, desc, and, or, count, countDistinct, avg, avgDistinct, sum, sumDistinct, max, min, } from 'drizzle-orm';