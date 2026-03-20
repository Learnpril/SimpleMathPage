---
title: Addition & Subtraction of Whole Numbers
description: Master multi-digit addition and subtraction with regrouping and borrowing
sidebar:
  order: 2
---

## What You'll Learn

In this lesson you'll learn how to add and subtract large whole numbers, including carrying (regrouping) in addition and borrowing in subtraction, and how to check your work.

## The Concept

**Addition** combines two or more numbers. For multi-digit addition, work from right to left:

- Add each column starting from the ones place.
- If the sum is 10 or more, write the ones digit and carry 1 to the next column.

Example: $456 + 789$

- Ones: $6 + 9 = 15$ → write 5, carry 1
- Tens: $5 + 8 + 1 = 14$ → write 4, carry 1
- Hundreds: $4 + 7 + 1 = 12$ → write 12

Result: $1{,}245$

**Subtraction** takes one number from another. When the top digit is smaller than the bottom digit, borrow from the next column:

- Borrowing adds 10 to the current column and subtracts 1 from the column to the left.

Example: $1{,}000 - 378$

- Ones: $0 - 8$ → borrow → $10 - 8 = 2$
- Tens: $9 - 7 = 2$ (after borrow)
- Hundreds: $9 - 3 = 6$ (after borrow)

Result: $622$

**Check your work**: Add the answer back to the number you subtracted. It should equal the original number.

## Worked Example

Add $2{,}847 + 1{,}569$.

- Ones: $7 + 9 = 16$ → write 6, carry 1
- Tens: $4 + 6 + 1 = 11$ → write 1, carry 1
- Hundreds: $8 + 5 + 1 = 14$ → write 4, carry 1
- Thousands: $2 + 1 + 1 = 4$

Result: $4{,}416$

Now subtract $3{,}416 - 1{,}928$.

- Ones: $6 - 8$ → borrow → $16 - 8 = 8$
- Tens: $0 - 2$ → borrow → $10 - 2 = 8$ (the 1 in tens became 0 after lending to ones, then borrows from hundreds)
- Hundreds: $3 - 9$ → borrow → $13 - 9 = 4$ (hundreds was 4, lent 1 to tens becoming 3, then borrows from thousands)
- Thousands: $2 - 1 = 1$

Result: $1{,}488$

**Check**: $1{,}488 + 1{,}928 = 3{,}416$ ✓

## Real-World Application

Addition tracks total income, shopping totals, or hours worked. Subtraction figures change due, remaining budget, or debt payoff. Example: Paycheck of $2,150 minus rent of $1,200 = $950 left for bills and food — simple subtraction keeps finances on track without surprises.

:::note[You've Got This]
Regrouping and borrowing feel tricky at first, but it's just trading — 10 ones for 1 ten, 10 tens for 1 hundred, and so on. Line up your columns carefully, work right to left, and always check by adding back. Practice a few problems daily and you'll get comfortable fast.
:::

## Quiz

import Quiz from "../../components/Quiz.astro"

<Quiz client:load quizId="arithmetic-add-sub-whole" questions={[
{
id: "q1",
text: "What is 567 + 389?",
options: ["856", "956", "946", "1,056"],
correctIndex: 1,
explanation: "7+9=16 (write 6, carry 1), 6+8+1=15 (write 5, carry 1), 5+3+1=9 → 956."
},
{
id: "q2",
text: "Subtract 742 - 385.",
options: ["367", "357", "457", "347"],
correctIndex: 1,
explanation: "2-5 borrow → 12-5=7, 3-8 borrow → 13-8=5 (4 becomes 3), 3-3=0 → 357."
},
{
id: "q3",
text: "A bill is $458. You pay with $500. How much change?",
options: ["$52", "$48", "$42", "$58"],
correctIndex: 2,
explanation: "500 - 458: 0-8 borrow → 10-8=2, 9-5=4 (after borrow), 4-4=0 → $42."
},
{
id: "q4",
text: "Add 1,234 + 567 + 89.",
options: ["1,980", "1,800", "1,890", "2,890"],
correctIndex: 2,
explanation: "Step-by-step: 1,234 + 567 = 1,801; 1,801 + 89 = 1,890."
}
]} />
