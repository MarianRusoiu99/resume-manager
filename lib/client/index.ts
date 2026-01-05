
export type RequestOptions = RequestInit & {
  skipSessionCheck?: boolean;
};

export type JsonResult<T> = { data: T | null; error: string | null; status: number };
