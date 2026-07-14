# Autonomous Editorial Intelligence Platform Specification

This document defines the permanent operational standards, agent behaviors, routing logic, budget controls, and safety protocols for our Enterprise Autonomous Editorial Intelligence Platform for WordPress.

---

## 1. Product Identity

The Editorial Intelligence Platform is a fully autonomous, full-stack enterprise publishing suite designed specifically for WordPress publishers. The system operates continuously to:
*   Discover high-potential content opportunities by crawling curated XML RSS feeds.
*   Filter, score, and rank opportunities using a multidimensional scoring algorithm.
*   Route validated opportunities through advanced, multi-agent editorial workspaces.
*   Produce original, highly engaging, and brand-safe articles tailored to distinct publications.
*   Enforce absolute linguistic compliance and comprehensive quality checks.
*   Actively throttle and manage API usage costs dynamically under customizable workspace budgets.
*   Directly publish polished, SEO-optimized, and WordPress-ready content on remote sites.

---

## 2. Agent Architecture

The workspace is powered by a coordinated council of specialized digital agents, each designed for high-density cognitive tasks and absolute procedural safety:

1.  **RSS Catalog & Crawl Engine**: Constantly active feed ingest processor that structures and normalizes raw RSS XML payload feeds from industry-standard sources.
2.  **Fingerprinted Deduplication Engine**: Sanitizes incoming leads by using normalized, alphanumeric string-distance fingerprinting algorithms to prevent processing duplicate drafts of already managed source feed contexts.
3.  **Article Opportunity Scoring Engine**: Evaluates item quality using a 9-Point Weighted Scoring formula spanning SEO potential, category warmth, freshness, historical authority of the source URL, and risk profiling.
4.  **Fact-Checker & Research Agent**: Runs primary intelligence briefs by cross-referencing seed storylines against verified context, compiling a structured, high-truth factual reference payload for drafting.
5.  **Strategic SEO Architect**: Calculates optimal slug pathways, target densities, metadata tags, and RankMath search quality guidelines, embedding them as strict constraints.
6.  **Brand Voice Writer Agent**: Composes original editorial drafts matching custom-tailored, approved publication profiles without copying source formatting or structures.
7.  **Natural Style Editor**: Audits draft flows to remove predictable digital markers, repeating sentence frameworks, or artificial vocabularies, ensuring a fluid, reader-friendly editorial style.
8.  **Lead Quality & Safety Auditor**: Inspects completed works against brand-safety policies (trademark risk, fake quote prevention, factual verification, formatting structures, and keyword density).
9.  **Visual Media Director**: Performs clean, safe public domain or accredited image asset matching to support longform engagement metrics without using trademarked or copyright-risky graphics.
10. **WordPress SEO Publisher Agent**: Interfaces directly with remote core REST APIs to push drafts, structure categories, apply tags, update RankMath metadata, and log reference WordPress post links.
11. **Cost & Usage Audit Engine**: Analyzes exact token-by-token resource consumption, calculates real-time expenditures based on active model pricing arrays, and updates database SaaS dashboards.

---

## 3. Model Routing & Provider Guidelines

To maintain complete transparency and vendor independence, the platform utilizes a dual-engine API strategy:

*   **Native Gemini SDK Flow**: Any standard Google Gemini models (`gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3.1-pro-preview`, etc.) are routed natively using `GoogleGenAI` client setups with absolute payload-size safety and direct telemetry tracking.
*   **OpenRouter Routing Engine**: Any third-party models or custom-defined model slugs (such as `deepseek/deepseek-chat`, `deepseek/deepseek-reasoner`, `meta-llama/llama-3.3-70b-instruct`, `anthropic/claude-3.5-sonnet`, `mistral`, `qwen`, `minimax`, `kimi`, etc.) must be dynamically processed via OpenRouter gateway APIs using secure custom keys.
*   **Auto-Routing Fallback Guard**: In the event that a native Gemini request terminates with a rate limit error or quota ceiling breach (`429`), the model router must automatically redirect the active step request to the pre-configured OpenRouter backup model (e.g., Llama or DeepSeek) to protect operation pipelines from interruption.

---

## 4. Pipeline Tiers

The Editorial Intelligence Platform features three distinct pipeline configurations designed to balance resource cost against output refinement:

*   **Cheap Pipeline**: Optimizes resource consumption for low-priority opportunities. Utilizes fast, highly cost-effective model models (such as `gemini-2.5-flash`) for all research, drafting, and editing steps.
*   **Balanced Pipeline**: The standard operational default. Deploys premium drafting models (`gemini-2.5-pro` or equivalent) for primary creative steps, while using fast models (`gemini-2.5-flash` or equivalent) for secondary tasks like research, formatting checks, and SEO audits.
*   **Premium Pipeline**: Reserved for high-value article opportunities (Opportunity Score ≥ 88). Commands fully decentralized premium models (such as `gemini-2.5-pro` or `claude-3.5-sonnet`) across all workflow steps to secure master-level research and unmatched editorial naturalness.
*   **Emergency Fallback Pipeline**: Automatically engaged when active rate limits are triggered on both primary and secondary pipelines. Uses resilient open-source models with high token ceilings (e.g., Llama 3) to execute local heuristic cleaning.

---

## 5. Cost Guardrails & SaaS Budget Auditing

To maintain corporate financial control, the system enforces multi-tiered financial barriers at the programmatic level:

*   **Max Cost Per Article**: Restricts workflows from consuming unnecessary token budgets. If a drafted piece exceeds the configured per-article cap ($0.15 threshold split between text and image generation), subsequent editing loops are automatically simplified.
*   **Monthly Workspace Budget**: Tracks the cumulative dollar spend against a rigid Monthly Budget ceiling (e.g., $15.00 limit).
*   **Hard limit Enforcer**: The engine checks the current cumulative spend prior to kicking off any multi-agent creation run. If the next generation loop will breach the monthly ceiling, the request is immediately blocked, aborting further API executions.
*   **SaaS Telemetry Tracking**: Logs and updates workspace spend categories divided by:
    *   Specific Digital Agent type
    *   Individual model ID Used
    *   Article ID
    *   Feeds / Niche Category
    *   WordPress Target Site
    *   Initiating User
*   **Plan-Based Throttling**: Restricts heavy model iterations and variant assets (Unsplash searches or Imagen requests) based on the user's active billing level.

---

## 6. Publishing Gates

Prior to auto-publishing or drafting posts on a target remote site, articles must successfully pass through a rigid compliance gateway:

*   **Quality Score Gate**: Standard readability indexes (Flesch-Kincaid, RankMath metrics) must meet or exceed 80%.
*   **Fact Safety Gate**: The research agent must verify that all claim payloads align perfectly with crawled inputs (Factual Safety Score ≥ 85%).
*   **Originality Gate**: Editorial Naturalness Score and N-gram verification indicators must confirm zero direct sequence overlap with original feeds.
*   **Formatting Gate**: Validates that all headers, paragraph blocks, lists, and comparative grids are in clean, safe, standard Markdown, free from corrupted HTML classes.
*   **Image Safety Gate**: Confirms asset graphics carry approved, verified branding, free from trade risk.
*   **Risk Score Gate**: Restricts items from auto-publishing if the calculated risk level triggers warnings (e.g., > 3).

---

## 7. Manual Review Triggers

When an automated article runs into high-risk domains, it is programmatically gated and held for human intervention under a `Manual Review` queue:

*   **High Risk Score**: Seed story contains highly speculative claims or inflammatory headlines.
*   **Source Reliability Breach**: Seed article originates from an unverified, secondary feed with a low crawl authority score.
*   **Sensitive Topics**: Headlines touching on highly regulated spaces including medical guidance, legal representation, direct financial investment advice, or partisan political commentary.
*   **Fake Quote Risk**: The checker cannot verify that quotes in the generated draft are exact historical matches of the seed source.
*   **Defamation Risk**: Stories mentioning legal proceedings, personal records, or reputations of public figures are auto-flagged.
*   **Provider Fallbacks**: If the emergency pipeline is used, the post is auto-routed to review to guarantee visual consistency.

---

## 8. Brand-Safety & Editorial Rules

Every model, template, and persona operating within the ecosystem must strictly align with the following standard guidelines:

*   **Do Not Invent Facts**: The platform must never manufacture names, statistics, specifications, pricing, releases, dates, or historical occurrences that are not present in original raw feeds or research briefs.
*   **Do Not Create Fake Quotes**: Quotes must originate directly from verified source articles, accompanied by literal attributions.
*   **Do Not Impersonate Real Writers**: Persona profiles must be designated as original editorial personas (e.g., "Sleek hardware consumer analyst" or "Positive sports culture analyst") and focused on a reader-friendly editorial style rather than claiming fake real-world identity or replicating live human reporters.
*   **Do Not Copy Source Structure**: Multi-agent writing must synthesize information and construct a completely new structural outline, distinct from the source XML layout.
*   **Do Not Use Copyrighted Images Directly**: Only utilize accredited placeholders, clear vector layouts, or authorized non-brand images.
*   **Do Not Keyword Stuff**: Limit SEO Focus Keywords strictly to natural occurrences, keeping the total keyword density below 2.5%.
*   **Do Not Autopublish Sensitive Content**: Anything flagged under health, cryptocurrency, financial investments, or live court proceedings must require explicit human approval.
*   **Do Not Use Detection-Bypass Terminology**: Avoid utilizing terms that imply evasion or technical mimicry in instructions or logs. Promote instead: "Natural style editing", "Original editorial voice profile", "Editorial naturalness", "Brand-Safe validation".

---

## 9. WordPress Publishing Rules

The WordPress connection interface operates under precise transaction guidelines to guarantee data synchronization:

*   **Persistent Identifiers**: The database must permanently store the remote WordPress post ID (`wpPostId`) and public live destination URL (`destinationUrl`) upon successful API publication.
*   **Post Status Handlers**: Support standard WordPress states: `draft` (save for staging), `future` (scheduled queue), `publish` (live immediately), and `manual_review` (held on gateway side).
*   **Category & Profile Mapping**: Automatically assigns posts to destination category tags according to active configurations (e.g., Hollywood gossip to "Glamour Feed", Tech breakdowns to "Teardowns").
*   **Rate Limits**: Respect daily, weekly, and hourly publishing throttle limits configured per individual target destination domain, spreading the server queue safely.
*   **Clean Structural HTML Payload**: Strip all raw markdown before submitting, replacing with standard clean WordPress-ready block HTML (including correctly placed image tag headings and centered comparative tables).

---

## 10. Development & Extension Principles

Future upgrades and modifications to the platform codebase must strictly conform to these architectural standards:

*   **Keep Model & Cost Transparency**: Never obscure computational cost tracking, input/output token counters, or provider pathways. Calculations must remain queryable.
*   **Retain Logs, Safety Gates & Review Triggers**: Do not simplify, disable, or remove any verification steps, safety score metrics, or manual gatekeepers.
*   **Strict Terminology Compliance**: Under no circumstances should brand-safe, professional digital copyediting terminology be reverted to unsafe terminology or phrasing. Keep the core product positioning focused entirely on high-quality humanized editorial aesthetics, brand safety, and budget safety.
*   **Installation Documentation Parity**: Every correction or modification affecting installation, upgrade, configuration, recovery, verification, dependencies, or operator-visible installer behavior must update `INSTALLATION_RUNBOOK.md` in the same change. Document revised commands and prerequisites, and record released-issue symptoms, corrected behavior, and safe recovery steps where applicable.
