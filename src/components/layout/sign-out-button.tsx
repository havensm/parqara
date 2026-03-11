"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/signout", {
            method: "POST",
          });
          router.push("/");
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Signing out" : "Sign out"}
    </Button>
  );
}
