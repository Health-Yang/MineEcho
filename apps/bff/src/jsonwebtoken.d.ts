declare module "jsonwebtoken" {
  export interface JwtPayload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: { algorithms?: string[]; clockTolerance?: number }
  ): JwtPayload | string;

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: { algorithm?: string; expiresIn?: string | number }
  ): string;

  export function decode(token: string, options?: { complete?: boolean; json?: boolean }): JwtPayload | string | null;
}
