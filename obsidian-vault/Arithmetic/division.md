---
title: Division of Whole Numbers
description: Learn long division with remainders and how to interpret results
sidebar:
  order: 4
---

## What You'll Learn

In this lesson you'll learn the long division algorithm, how to handle remainders, and how to check your division with multiplication.

## The Concept

**Division** splits a number into equal groups or finds how many times one number fits into another.

The long division steps (Divide, Multiply, Subtract, Bring down):

1. **Divide**: How many times does the divisor go into the first digits?
2. **Multiply**: Multiply the quotient digit by the divisor.
3. **Subtract**: Subtract from the current partial dividend.
4. **Bring down** the next digit and repeat.
5. **Remainder**: Whatever is left over if the division isn't exact.

Example: $456 \div 6$

- 6 into 45 = 7 → $7 \times 6 = 42$, subtract → 3
- Bring down 6 → 36
- 6 into 36 = 6 → $6 \times 6 = 36$, subtract → 0

Quotient: $76$, remainder $0$.

If there's a remainder: $457 \div 6 = 76$ remainder $1$ (because $6 \times 76 + 1 = 457$).

**Check**: Quotient $\times$ divisor $+$ remainder $=$ dividend.

## Worked Example

Divide $8{,}736 \div 24$.

1. 24 into 87 = 3 → $3 \times 24 = 72$, subtract → 15
2. Bring down 3 → 153
3. 24 into 153 = 6 → $6 \times 24 = 144$, subtract → 9
4. Bring down 6 → 96
5. 24 into 96 = 4 → $4 \times 24 = 96$, subtract → 0

Quotient: $364$, remainder $0$.

**Check**: $364 \times 24 = 8{,}736$ ✓

## Real-World Application

Division figures shares, rates, or quantities: Split $840 among 4 people = $210 each; miles per gallon ($420$ miles $\div$ $15$ gallons $= 28$ mpg); or items per box ($96$ cookies $\div$ $12 = 8$ per box). It answers "how many" or "how much each" questions in budgeting, work, or planning.

:::note[You've Got This]
Long division is a step-by-step process — take it one digit at a time, guess conservatively, and always check by multiplying back. If remainders confuse you, just remember they mean "left over." Practice on paper and you'll master it quickly.
:::

## Quiz

import Quiz from "../../components/Quiz.astro"

<Quiz client:load quizId="arithmetic-division-whole" questions={[
{
id: "q1",
text: "What is 864 ÷ 12?",
options: ["82", "70", "72", "74"],
correctIndex: 2,
explanation: "12 into 86 = 7 (7×12=84), subtract 2; bring down 4 → 24; 12×2=24 → quotient 72."
},
{
id: "q2",
text: "Divide 500 ÷ 8. What is the quotient and remainder?",
options: ["60 r 4", "63 r 0", "62 r 4", "62 r 6"],
correctIndex: 2,
explanation: "8 into 50 = 6 (48), subtract 2; bring down 0 → 20; 8×2=16, subtract → remainder 4. So 62 r 4."
},
{
id: "q3",
text: "A total bill of $240 is split equally among 6 friends. How much does each person pay?",
options: ["$45", "$40", "$50", "$30"],
correctIndex: 1,
explanation: "240 ÷ 6 = 40 (6×40=240, exact)."
},
{
id: "q4",
text: "What is 1,575 ÷ 25?",
options: ["65", "60", "70", "63"],
correctIndex: 3,
explanation: "25 into 157 = 6 (6×25=150), subtract 7; bring down 5 → 75; 25×3=75 → quotient 63."
}
]} />
