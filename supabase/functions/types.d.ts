// Deno runtime type declarations for Edge Functions
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Module declarations for Deno-specific imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}
