---
title: Variables and Expressions
description: Learn what variables are and how to read and write algebraic expressions
sidebar:
  order: 1
---

## What You'll Learn

In this lesson you'll learn what a variable is, how to translate everyday situations into algebraic expressions, and how to evaluate an expression by plugging in a number. This is the foundation everything else in algebra builds on.

## The Concept

A **variable** is a letter that stands in for a number we don't know yet. We usually use letters like $x$, $y$, or $n$, but any letter works.

An **algebraic expression** combines numbers, variables, and operations. For example:

$
3x + 5
$

This means "take some number $x$, multiply it by 3, then add 5." There's no equals sign — it's an expression, not an equation.

Some common vocabulary:

- **Coefficient** — the number in front of a variable. In $3x$, the coefficient is 3.
- **Constant** — a number on its own with no variable attached. In $3x + 5$, the constant is 5.
- **Term** — a single piece of an expression separated by $+$ or $-$ signs. The expression $3x + 5$ has two terms: $3x$ and $5$.

To **evaluate** an expression, replace the variable with a specific number and compute the result. If $x = 4$:

$
3(4) + 5 = 12 + 5 = 17
$

## Worked Example

A streaming service charges a $\$10$ monthly base fee plus $\$3$ per movie you rent. Write an expression for the monthly cost, then find the cost if you rent 6 movies.

1. **Identify the variable.** Let $m$ = the number of movies rented.

2. **Write the expression.**

$
10 + 3m
$

The base fee is the constant ($10$), and $3m$ represents $\$3$ times however many movies you rent.

3. **Evaluate for $m = 6$.**

$
10 + 3(6) = 10 + 18 = 28
$

Your monthly cost would be $\$28$.

## Real-World Application

Algebraic expressions are everywhere once you start looking. Budgeting ("I spend $x$ dollars on coffee each week"), fitness ("I burn $200 + 50t$ calories where $t$ is minutes of running"), and even cooking ("double the recipe" means multiplying every ingredient by 2) all use the same idea — a pattern with a slot you can fill in with different numbers.

Understanding expressions lets you set up problems before you solve them, which is the real power of algebra.

:::note[You've Got This]
If the jump from plain numbers to letters feels weird, that's totally normal. Think of a variable as a blank in a sentence — it's just waiting for you to fill it in. Once you see that $3x + 5$ is really just a recipe ("multiply by 3, add 5"), the rest follows naturally. Practice with small numbers and you'll build confidence fast.
:::

## Quiz

import Quiz from "../../components/Quiz.astro"

<Quiz client:load quizId="algebra-variables-and-expressions" questions={[
{
id: "q1",
text: "In the expression 7x + 2, what is the coefficient of x?",
options: ["2", "x", "7", "9"],
correctIndex: 2,
explanation: "The coefficient is the number multiplied by the variable. In 7x, the coefficient is 7."
},
{
id: "q2",
text: "Evaluate 4n - 3 when n = 5.",
options: ["17", "23", "2", "8"],
correctIndex: 0,
explanation: "Substitute n = 5: 4(5) - 3 = 20 - 3 = 17."
},
{
id: "q3",
text: "Which of these is an algebraic expression (not an equation)?",
options: ["x + 4 = 10", "2y - 7", "3 = 3", "5 + 1 = 6"],
correctIndex: 1,
explanation: "An expression has no equals sign. '2y - 7' is an expression; the others are equations."
},
{
id: "q4",
text: "A gym charges $25 per month plus $5 per class. Which expression represents the monthly cost for c classes?",
options: ["25c + 5", "5c + 25", "25 + 5 + c", "30c"],
correctIndex: 1,
explanation: "The fixed cost is $25 (constant) and each class costs $5, so the expression is 5c + 25."
}
]} />
