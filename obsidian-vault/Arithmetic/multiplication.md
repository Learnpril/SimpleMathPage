---
title: Multiplication of Whole Numbers
description: Learn multi-digit multiplication and strategies for quick calculation
sidebar:
  order: 3
---

## What You'll Learn

In this lesson you'll learn how to multiply multi-digit numbers, use partial products, and understand why the standard algorithm works with place value.

## The Concept

**Multiplication** is repeated addition or scaling. For multi-digit multiplication:

- Multiply by each digit of the bottom number, starting from the right.
- Shift left (add a zero) for tens, two zeros for hundreds, etc.
- Add the partial products together.

Example: $23 \times 14$

Break it down: $23 \times 14 = 23 \times 4 + 23 \times 10$

- $23 \times 4 = 92$
- $23 \times 10 = 230$
- $92 + 230 = 322$

This works because of the **distributive property**: $23 \times (10 + 4) = 23 \times 10 + 23 \times 4$.

For larger numbers, the same idea applies — just more partial products to add up.

## Worked Example

Multiply $456 \times 32$.

1. $456 \times 2 = 912$
2. $456 \times 30 = 13{,}680$ (multiply by 3, then shift left one position)
3. Add: $912 + 13{,}680 = 14{,}592$

**Estimate to check**: $450 \times 30 = 13{,}500$ — close to 14,592, so our answer is reasonable.

## Real-World Application

Multiplication calculates totals: 12 items at $7 each = $84; area of a room ($12 \times 15 = 180$ square feet for flooring); or weekly pay ($40$ hours $\times$ $18$/hour = $720). It scales recipes, budgets, or work estimates quickly.

:::note[You've Got This]
Multiplication is just adding groups — if you get stuck on a big problem, break it into tens and ones. Practice with small multipliers first, line up your columns neatly, and double-check by estimating. You'll handle everyday calculations with ease.
:::

## Quiz

import Quiz from "../../components/Quiz.astro"

<Quiz client:load quizId="arithmetic-multiplication-whole" questions={[
{
id: "q1",
text: "What is 34 × 6?",
options: ["194", "204", "214", "180"],
correctIndex: 1,
explanation: "4×6=24 (write 4, carry 2), 3×6=18+2=20 → 204."
},
{
id: "q2",
text: "Multiply 125 × 40.",
options: ["5,200", "500", "5,000", "4,000"],
correctIndex: 2,
explanation: "125 × 40 = 125 × 4 × 10 = 500 × 10 = 5,000."
},
{
id: "q3",
text: "A store sells 28 packs of batteries at $15 each. Total cost?",
options: ["$430", "$400", "$380", "$420"],
correctIndex: 3,
explanation: "28 × 15: 28 × 10 = 280, 28 × 5 = 140, 280 + 140 = $420."
},
{
id: "q4",
text: "What is 213 × 23?",
options: ["4,989", "5,000", "4,899", "4,799"],
correctIndex: 2,
explanation: "213 × 3 = 639, 213 × 20 = 4,260, 639 + 4,260 = 4,899."
}
]} />
