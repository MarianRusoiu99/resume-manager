// Mock for next/server module
export const cookies = () => ({
  get: () => undefined,
  set: () => {},
  delete: () => {},
});

export const headers = () => ({});

export const redirect = (url: string) => {
  throw new Error(`Redirect to: ${url}`);
};

// Mock NextRequest for proxy tests
export class NextRequest {
  url: string;
  _headers: Map<string, string>;

  constructor(url: URL | string, options?: any) {
    this.url = url instanceof URL ? url.toString() : url;
    this._headers = new Map();
    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        this._headers.set(key, value as string);
      }
    }
  }

  async json() {
    return {};
  }

  async text() {
    return '';
  }
}

export class NextResponse {
  private _status: number;
  private _headers: Map<string, string>;
  private body: string;

  constructor(body: string | null, init?: ResponseInit) {
    this._status = init?.status || 200;
    this._headers = new Map();
    this.body = body || '';
    if (init?.headers) {
      for (const [key, value] of Object.entries(init.headers)) {
        this._headers.set(key, value as string);
      }
    }
  }

  static json(data: any): NextResponse {
    return new NextResponse(JSON.stringify(data));
  }

  static redirect(url: string): NextResponse {
    return new NextResponse(null, {
      status: 307,
      headers: { location: url },
    });
  }

  get status() {
    return this._status;
  }

  get headers() {
    return {
      get: (key: string) => this._headers.get(key),
      set: (key: string, value: string) => this._headers.set(key, value),
    };
  }

  async text() {
    return this.body;
  }
}
