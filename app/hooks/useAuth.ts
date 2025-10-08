"use client"

import { useQuery } from "@tanstack/react-query"

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user")
      if (!res.ok) {
        if (res.status === 401) {
          return null
        }
        throw new Error("Failed to fetch user")
      }
      return res.json()
    },
    retry: false,
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  }
}
