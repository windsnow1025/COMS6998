// The routes of the product under one week's base path
export interface RoastPaths {
  today: string;
  top: string;
  roast: string;
  me: string;
  signIn: (redirect: string) => string;
  batch: (date: string) => string;
  photo: (id: string) => string;
}

export function createRoastPaths(base: string): RoastPaths {
  return {
    today: base,
    top: `${base}/top`,
    roast: `${base}/roast`,
    me: `${base}/me`,
    signIn: (redirect) => `${base}/signin?redirect=${encodeURIComponent(redirect)}`,
    batch: (date) => `${base}/batch/${date}`,
    photo: (id) => `${base}/photo/${id}`,
  };
}
