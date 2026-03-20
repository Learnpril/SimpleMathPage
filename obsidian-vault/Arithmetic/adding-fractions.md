---
title: Adding Fractions
description: Learn how to add fractions with like and unlike denominators
sidebar:
  order: 1
---

## What You'll Learn

In this lesson you'll learn how to add fractions — both when the denominators match and when they don't. By the end you'll be comfortable finding common denominators and simplifying your results.

## The Concept

A fraction represents a part of a whole. When we write $\frac{a}{b}$, the top number $a$ is the **numerator** (how many parts we have) and the bottom number $b$ is the **denominator** (how many equal parts the whole is divided into).

**Adding fractions with the same denominator** is straightforward — just add the numerators:

$$
\frac{a}{c} + \frac{b}{c} = \frac{a + b}{c}
$$

For example: $\frac{2}{5} + \frac{1}{5} = \frac{3}{5}$.

**Adding fractions with different denominators** requires a common denominator. The least common denominator (LCD) is the smallest number that both denominators divide into evenly.

The general formula is:

$$
\frac{a}{b} + \frac{c}{d} = \frac{a \times d + c \times b}{b \times d}
$$

After adding, always check whether the result can be simplified by dividing the numerator and denominator by their greatest common factor.

## Worked Example

Let's add $\frac{1}{2} + \frac{1}{3}$ step by step.

1. **Find the LCD.** The denominators are 2 and 3. The smallest number both divide into is 6.

2. **Convert each fraction.**

$$
\frac{1}{2} = \frac{1 \times 3}{2 \times 3} = \frac{3}{6}
$$

$$
\frac{1}{3} = \frac{1 \times 2}{3 \times 2} = \frac{2}{6}
$$

3. **Add the numerators.**

$$
\frac{3}{6} + \frac{2}{6} = \frac{5}{6}
$$

4. **Simplify if possible.** 5 and 6 share no common factors, so $\frac{5}{6}$ is already in simplest form.

## Real-World Application

Fractions show up constantly in everyday life. Imagine you're following a recipe that calls for $\frac{1}{2}$ cup of flour and you want to add an extra $\frac{1}{3}$ cup for a thicker batter. Knowing that $\frac{1}{2} + \frac{1}{3} = \frac{5}{6}$ means you can measure out exactly the right amount instead of guessing.

Fractions are also essential in construction (measuring lumber), music (time signatures), and finance (splitting costs).

:::note[You've Got This]
If fractions feel tricky at first, that's completely normal. The key insight is that you can only add fractions when they speak the same "language" — that is, when they have the same denominator. Once you find that common ground, the rest is just addition. Take your time and practice with small numbers until it clicks.
:::

## Quiz

import Quiz from "../../components/Quiz.astro"

<Quiz client:load quizId="arithmetic-adding-fractions" questions={[
{
id: "q1",
text: "What is 1/2 + 1/3?",
options: ["2/5", "5/6", "1/6", "2/6"],
correctIndex: 1,
explanation: "Find a common denominator (6), then add: 3/6 + 2/6 = 5/6."
},
{
id: "q2",
text: "What is 2/5 + 1/5?",
options: ["3/10", "3/5", "1/5", "2/10"],
correctIndex: 1,
explanation: "The denominators are the same, so just add the numerators: 2/5 + 1/5 = 3/5."
},
{
id: "q3",
text: "What is the least common denominator of 4 and 6?",
options: ["24", "10", "12", "6"],
correctIndex: 2,
explanation: "12 is the smallest number that both 4 and 6 divide into evenly."
},
{
id: "q4",
text: "What is 3/4 + 1/6?",
options: ["4/10", "11/12", "5/6", "7/12"],
correctIndex: 1,
explanation: "LCD is 12. Convert: 9/12 + 2/12 = 11/12."
}
]} />
