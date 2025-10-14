// import "server-only";
// import { createServerClient as createServerClientSSR } from "@supabase/ssr"
// import { cookies } from "next/headers"

// /**
//  * Especially important if using Fluid compute: Don't put this client in a
//  * global variable. Always create a new client within each function when using
//  * it.
//  */
// export async function createClient() {
//   const cookieStore = await cookies()

//   return createServerClientSSR(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
//     cookies: {
//       getAll() {
//         return cookieStore.getAll()
//       },
//       setAll(cookiesToSet) {
//         try {
//           cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
//         } catch {
//           // The "setAll" method was called from a Server Component.
//           // This can be ignored if you have middleware refreshing
//           // user sessions.
//         }
//       },
//     },
//   })
// }

// export const createServerClient = createClient

import "server-only";
import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// 👇 compat alias so older imports keep working
export { createClient as createServerClient };

