export const API_VERSION = "v1" as const;
export const API_V1_PREFIX = `/api/${API_VERSION}` as const;

export type ApiVersion = typeof API_VERSION;
