"use client"

import { useState, useEffect } from "react"
import { isTauri } from "@/lib/utils"
import * as tauriCommands from "@/lib/commands"

export function useTauriProducts() {
  const [products, setProducts] = useState<tauriCommands.Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!isTauri()) {
      setError("Not running in Tauri")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await tauriCommands.getProducts()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { products, loading, error, refresh }
}

export function useTauriCategories() {
  const [categories, setCategories] = useState<tauriCommands.Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!isTauri()) {
      setError("Not running in Tauri")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await tauriCommands.getCategories()
      setCategories(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { categories, loading, error, refresh }
}

export function useTauriCustomers() {
  const [customers, setCustomers] = useState<tauriCommands.Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!isTauri()) {
      setError("Not running in Tauri")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await tauriCommands.getCustomers()
      setCustomers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { customers, loading, error, refresh }
}
