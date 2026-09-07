"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/common/StateViews";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (adminOnly && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, adminOnly, router]);

  if (isLoading || !user || (adminOnly && user.role !== "ADMIN")) {
    return <Loading label="Checking your session..." />;
  }

  return <>{children}</>;
}
