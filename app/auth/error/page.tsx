// app/auth/error/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Keep the param type broad so it matches Next's generated PageProps
export default function ErrorPage(props: any) {
  // Works whether Next gives you a plain object or a Promise-wrapped one
  const error =
    props?.searchParams && typeof props.searchParams.then === "function"
      ? undefined // if it's a Promise, we won't await here—just render generic
      : (props?.searchParams?.error as string | undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <p className="text-sm text-muted-foreground">Error: {error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
