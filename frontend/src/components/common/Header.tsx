"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./Button";

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <nav className="app-nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          {user.role === "ADMIN" && <Link href="/admin">Summary</Link>}
          {user.role === "USER" && <Link href="/summary">Summary</Link>}
        </nav>

        <div className="app-header-user">
          <span className="user-chip">
            {user.name} <span className="role-badge">{user.role}</span>
          </span>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
