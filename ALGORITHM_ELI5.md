# How Angkop Picks Jobs For You (Explained Like You're 5)

This is the simple version of `ALGORITHM.md`. No scary words, just the idea.

---

## 1. The big idea

Imagine you have **two friends** helping you find a job:

- **Friend A reads words.** They read your profile and the job post, and say
  "hey, these sound like they're about the same thing!"
- **Friend B watches what people do.** They remember "people kind of like you
  clicked Apply on jobs kind of like this one before."

Angkop asks both friends, then **mixes their answers together** into one
number — the **match score** — shown to you as a percent, like 87%.

```
Friend A (reads words)      Friend B (watches behavior)
        \                          /
         \                        /
          \                      /
           -->  mix together  <--
                     |
                     v
            Match Score (like 87%)
```

---

## 2. Turning words into dots on a map

Computers can't "read" the way we do, so first Angkop turns sentences into a
**dot on an invisible map**. Think of it like a sticker chart: sentences that
mean similar things get stickers placed *close together*, and sentences that
mean different things get stickers placed *far apart*.

- "React developer, 2 years experience" → one dot
- "Front-end engineer who knows React" → a dot **right next to it** (same meaning!)
- "Baker who makes bread" → a dot **way far away** (totally different thing)

This dot has 384 little numbers describing where it sits on the map. You
don't need to know the numbers — just that **similar meaning = close dots**.

---

## 3. Friend A's trick: comparing dots (semantic score)

Friend A looks at your profile's dot and the job's dot, and measures **how
close together they are** (really, the angle between them, but "how close"
is close enough). 

- Dots right on top of each other → score near **1.0** (great match!)
- Dots pointing in totally different directions → score near **0** (not a match)

That closeness number *is* the semantic score.

---

## 4. Friend B's trick: remembering what people did (collaborative score)

Friend B doesn't read any words at all. Friend B just remembers: "lots of
people who liked jobs like *this one* also did things like applying, saving,
or at least looking at it." If you remind Friend B of those people, Friend B
says "I bet you'd like this job too."

- If you **applied** to a job, that's a big hint you liked it.
- If you **saved** it, that's a medium hint.
- If you only **viewed** it, that's a small hint.
- If you **dismissed** it, that's a hint you *didn't* like it.

Friend B learned all this by watching lots of past examples, kind of like
practicing a guessing game many, many times before the big day.

**But what if you're brand new?** Friend B doesn't know you yet! So instead
of guessing wildly, Friend B politely says "I'm not sure yet," which Angkop
turns into a safe, neutral middle score (0.5) instead of making something up.

---

## 5. Mixing the two friends' answers (the hybrid score)

Here's the clever part: Angkop doesn't trust both friends equally all the
time.

- If you're **brand new**, Angkop mostly trusts **Friend A** (the one who
  reads words), because Friend B barely knows you yet.
- The **more things you do** on Angkop (view, save, apply...), the **more
  Angkop starts trusting Friend B**, because Friend B is learning your taste.

Like training wheels on a bike — you lean on them a lot at first, and less
and less as you get better.

```
Brand new user:        90% Friend A,  10% Friend B
A little experience:    80% Friend A,  20% Friend B
More experience:        65% Friend A,  35% Friend B
Lots of experience:     40% Friend A,  60% Friend B  (this is the max)
```

Whatever mix comes out, that's your **match score** — shown as a percent
with a color:
- **Green (≥70%)** = strong match
- **Yellow (40–69%)** = partial match
- **Red (<40%)** = weak match

---

## 6. Finding what skills you're missing (skill gap)

Separately, Angkop plays a little comparing game: for every skill the job
wants, it checks your skills and asks "do you have something close enough to
this?"

- Job wants "JavaScript," you have "JS" → close enough, no gap, nice job!
- Job wants "Docker," you have nothing close → that's a **gap**

For every gap, Angkop doesn't just say "you're missing this" meanly — it
finds a **course you could take** to learn it, and shows it in a friendly way,
like "Add Docker" instead of "Missing Docker."

---

## 7. A friendly helper explains it all in plain words

Last step: Angkop doesn't just show you numbers and percentages — that can
feel cold. So it asks an AI helper (Gemini) to write a little note, like:

> "You're a strong match for this role! Your React and TypeScript experience
> lines up really well with what they're looking for. You haven't worked
> with Docker yet, but that's an easy skill to pick up."

The AI helper is only allowed to **explain the numbers that were already
figured out** — it never gets to change the score itself. It's just the
friendly narrator.

---

## 8. The whole story, one more time

1. Your profile words and the job's words each become a dot on the map.
2. **Friend A** measures how close those dots are → semantic score.
3. **Friend B** remembers people like you → collaborative score (or "not sure
   yet" if you're new).
4. Angkop **mixes** both answers, trusting Friend B more the more you've used
   the app → your match score (shown as a %).
5. Separately, Angkop checks which skills from the job you don't have yet,
   and suggests courses to learn them.
6. A friendly AI helper writes it all up in plain, kind words.

That's it — two friends, a map of dots, a mixing bowl, and a friendly
narrator at the end.
