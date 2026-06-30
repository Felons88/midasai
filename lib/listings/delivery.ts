export type ListingDelivery = "file" | "github" | "install"

export function listingHasUploadedFile(files: unknown): boolean {
  if (Array.isArray(files)) {
    return files.some((file) => {
      const entry = file as { url?: string; path?: string }
      return Boolean(entry?.url || entry?.path)
    })
  }

  if (files && typeof files === "object") {
    const entry = files as { url?: string; path?: string }
    return Boolean(entry.url || entry.path)
  }

  return false
}

export function getListingDelivery(
  files: unknown,
  githubUrl: string | null | undefined,
  hasInstallCommands = false
): ListingDelivery {
  if (listingHasUploadedFile(files)) return "file"
  if (hasInstallCommands) return "install"
  if (githubUrl) return "github"
  return "file"
}

export function getAcquireButtonLabel(options: {
  price: number
  delivery: ListingDelivery
  loading?: boolean
}): string {
  if (options.loading) return "Processing..."

  const { price, delivery } = options

  if (delivery === "github") {
    if (price > 0) return `Get on GitHub — $${price}`
    return "Get on GitHub"
  }

  if (delivery === "install") {
    if (price > 0) return `Install — $${price}`
    return "Install"
  }

  if (price > 0) return `Download — $${price}`
  return "Download"
}

export function getAcquireSuccessTitle(delivery: ListingDelivery): string {
  if (delivery === "github") return "Opening repository…"
  if (delivery === "install") return "Install instructions ready"
  return "Download started!"
}

export function getAcquireErrorMessage(
  code: string | undefined,
  delivery: ListingDelivery,
  fallback?: string
): string {
  if (code === "PURCHASE_REQUIRED") {
    if (delivery === "github") {
      return "Purchase this listing before opening on GitHub."
    }
    if (delivery === "install") {
      return "Purchase this listing before installing."
    }
    return "Purchase this listing before downloading."
  }
  if (delivery === "github") {
    return fallback ?? "Could not open repository."
  }
  if (delivery === "install") {
    return fallback ?? "Could not load install instructions."
  }
  return fallback ?? "Download failed"
}
