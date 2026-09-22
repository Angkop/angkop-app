// Bounds how many `fn` calls run at once. Used for the ML service calls in particular:
// firing all of them at once (e.g. one per job in the feed) can overwhelm a single local
// CPU-bound inference process — see the comment in ml/app/services/embedder.py.
export async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  limit: number,
  fn: (item: TItem) => Promise<TResult>
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++
      results[currentIndex] = await fn(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
