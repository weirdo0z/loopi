import { useEffect, useRef, useState } from 'preact/hooks'
import wordsData from './data/words.json'

type Word = {
  id: string
  word: string
  ipa: string
  katakana: string
  meaning: string
  etymology: string
  example: string
}

type BufferedCard = {
  key: string
  word: Word
  revealed: boolean
}

const PAGE_SIZE = 10

function pickRandomWord(excludeId?: string): Word {
  const pool = excludeId
    ? (wordsData as Word[]).filter((w) => w.id !== excludeId)
    : (wordsData as Word[])

  return pool[Math.floor(Math.random() * pool.length)]
}

function generatePage(
  afterId?: string,
  count = PAGE_SIZE
): BufferedCard[] {
  const out: BufferedCard[] = []
  let last = afterId

  for (let i = 0; i < count; i++) {
    const word = pickRandomWord(last)
    last = word.id

    out.push({
      key: `c_${word.id}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}_${i}`,
      word,
      revealed: false,
    })
  }

  return out
}

export function App() {
  const [cards, setCards] = useState<BufferedCard[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore] = useState(true)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const lastCardRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setCards(generatePage(undefined, PAGE_SIZE))
  }, [])

  function loadMore() {
    if (!hasMore || loading) return

    setLoading(true)

    setCards((prev) => {
      const tail = prev[prev.length - 1]

      return [
        ...prev,
        ...generatePage(tail?.word.id, PAGE_SIZE),
      ]
    })

    setLoading(false)
  }

  useEffect(() => {
    const lastEl = lastCardRef.current
    const feedEl = feedRef.current

    if (!lastEl || !feedEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      {
        root: feedEl,
        threshold: 1,
      }
    )

    observer.observe(lastEl)

    return () => {
      observer.disconnect()
    }
  }, [cards.length, loading, hasMore])

  function revealCard(index: number) {
    setCards((prev) =>
      prev.map((card, i) =>
        i === index
          ? { ...card, revealed: true }
          : card
      )
    )
  }

  return (
    <div
      ref={feedRef}
      class="h-dvh w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scrollbar-hide scroll-smooth relative"
      style={{ background: '#fffafb' }}
    >
      {cards.map((card, idx) => {
        const isLast = idx === cards.length - 1

        return (
          <section
            key={card.key}
            ref={isLast ? lastCardRef : undefined}
            onClick={() => revealCard(idx)}
            class="relative w-full h-dvh snap-start snap-always overflow-hidden px-6 py-12 sm:px-12 sm:py-16 cursor-pointer"
            style={{ background: '#fffafb' }}
          >
            <div class="h-full w-full max-w-2xl mx-auto flex flex-col justify-between">
              <div class="flex-1 flex flex-col justify-center items-center text-center">
                <h1
                  class="font-extrabold tracking-tight text-5xl sm:text-7xl lg:text-8xl leading-[0.95] mb-5 sm:mb-7"
                  style={{ color: '#3b2a31' }}
                >
                  {card.word.word}
                </h1>

                <p
                  class="font-mono mb-2 sm:mb-3"
                  style={{
                    color: '#a77b87',
                    fontSize: '1rem',
                  }}
                >
                  {card.word.ipa}
                </p>

                <p
                  class="tracking-widest"
                  style={{
                    color: '#6b4855',
                    fontSize:
                      'clamp(1.05rem, 2.4vw, 1.55rem)',
                  }}
                >
                  {card.word.katakana}
                </p>
              </div>

              <div
                class="w-full pb-2 blur-tap-reveal"
                style={{
                  filter: card.revealed
                    ? 'none'
                    : 'blur(12px)',
                  userSelect: card.revealed
                    ? 'auto'
                    : 'none',
                }}
              >
                <InfoBlock
                  title="意味 / Meaning"
                  value={card.word.meaning}
                  large
                />

                <InfoBlock
                  title="語源 / Etymology"
                  value={card.word.etymology}
                />

                <InfoBlock
                  title="例文 / Example"
                  value={`"${card.word.example}"`}
                  italic
                />
              </div>
            </div>
          </section>
        )
      })}

      {loading && (
        <div class="w-full h-28 flex items-center justify-center">
          <div
            class="flex items-center gap-3 text-sm"
            style={{ color: '#a77b87' }}
          >
            <span class="w-4 h-4 rounded-full border-2 border-[#ffd0da] border-t-[#e15a74] animate-spin" />
            Loading...
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBlock({
  title,
  value,
  large = false,
  italic = false,
}: {
  title: string
  value: string
  large?: boolean
  italic?: boolean
}) {
  return (
    <div class="mb-6 sm:mb-8">
      <p
        class="mb-1.5 uppercase tracking-[0.22em] font-semibold"
        style={{
          color: '#c56a7f',
          fontSize: '0.72rem',
        }}
      >
        {title}
      </p>

      <p
        class={
          `${large ? 'font-semibold' : ''} ${
            italic ? 'italic' : ''
          } leading-relaxed`
        }
        style={{
          color: large ? '#3b2a31' : '#5a3e48',
          fontSize: large
            ? 'clamp(1.25rem, 2.8vw, 1.85rem)'
            : 'clamp(0.95rem, 2vw, 1.1rem)',
        }}
      >
        {value}
      </p>
    </div>
  )
}
