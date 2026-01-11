// Mock for next/navigation module
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
});

export const useSearchParams = () => ({
  get: () => null,
});

export const useParams = () => ({});

export const usePathname = () => '/';

export const redirect = (url: string) => {
  throw new Error(`Redirect to: ${url}`);
};

export const notFound = () => {
  throw new Error('Not found');
};
