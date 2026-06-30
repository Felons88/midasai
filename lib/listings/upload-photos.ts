/** Upload local photos to a listing and merge with existing image URLs. */
export async function uploadListingPhotos(
  listingId: string,
  files: File[]
): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = []

  for (const file of files) {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`/api/listings/${listingId}/media`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { urls, error: (data as { error?: string }).error ?? "Photo upload failed" }
    }

    const data = (await res.json()) as { url?: string; kind?: string }
    if (data.kind === "image" && data.url) {
      urls.push(data.url)
    }
  }

  return { urls }
}

export async function saveListingImages(listingId: string, images: string[]) {
  const res = await fetch(`/api/listings/${listingId}/media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? "Failed to save images")
  }
}
