// One shared fetch of the prebuilt word→image manifest (public/word-images.json).
let imagesPromise: Promise<Record<string, string>> | null = null
export function loadWordImages(): Promise<Record<string, string>> {
  imagesPromise ??= fetch('/word-images.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  return imagesPromise
}
