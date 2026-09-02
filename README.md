AI Learning AGENTS.md

A reusable AGENTS.md designed to turn an AI coding assistant into a technical mentor rather than a code generator.

The goal is simple: use AI to learn a new technology while making sure you actually understand and can apply what you’re learning.

How it works

The learning process follows a progressive validation system:

1. Learn in context — New concepts are introduced when they naturally appear during the project.
2. Understand — The AI explains what the concept is, why it exists, and how it applies to the current implementation.
3. Validate theory — You explicitly confirm when you understand the concept.
4. Practice later — The AI eventually asks you to implement a different feature requiring the same concept.
5. Validate practice — Your implementation is reviewed to confirm that you can apply the concept autonomously.

A concept is considered fully acquired only after both validations:

Theory validated + Practice validated = Concept acquired

Once acquired, basic explanations for that concept are no longer repeated.

Why?

AI coding assistants make it extremely easy to generate working software without necessarily understanding the code being produced.

This approach deliberately trades some development speed for active learning and long-term understanding.

Instead of:

“Build this feature for me.”

The workflow progressively moves toward:

“I understand this concept. Give me something to build with it.”

Example project

The current AGENTS.md uses a small backend project as its learning environment:

Node.js + TypeScript + NestJS + TypeORM + SQLite

The application itself is intentionally simple: a blog API with users, articles, authentication, authorization and other common backend features.

The product is not really the project.

The project is the learning process.

Reusing it

Although the current version targets NestJS/backend development, the methodology is technology-agnostic.

Fork or copy the repository and adapt:

* the technology stack;
* existing knowledge and prerequisites;
* learning objectives;
* project scope;
* concepts to validate.

The same approach can be adapted to another framework, language or technical domain.

Philosophy

AI should progressively make you less dependent on AI, not more.

Use it to explain, challenge, review and provide feedback — while keeping the actual learning in your hands.
