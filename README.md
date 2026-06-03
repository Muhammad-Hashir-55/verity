# Verity — AI Fact-Checker

> Truth, sentence by sentence.

Verity is an AI-powered fact-checking web app. Paste any text (article, speech, tweet, paragraph), and Verity breaks it into individual atomic claims, verifies each claim independently using web search + AI reasoning, and renders the original text with color-coded sentence highlights showing which claims are verified, disputed, false, or unverifiable. Every verified/falsified claim is stored in a pgvector knowledge base so future similar claims resolve from cache instantly.

## Features

- **Claim Extraction** — AI-powered analysis breaks your text into individual, atomic claims
- **Web Verification** — Each claim is searched against the live web and analyzed with AI reasoning
- **Knowledge Base** — Verified claims are cached with vector embeddings for instant future lookups
- **Color-Coded Highlights** — Original text is annotated with green (verified), yellow (disputed), red (false), and gray (unverifiable) highlights
- **SSE Streaming** — Claims appear one-by-one as they resolve in real-time
- **History** — Browse and drill into past fact-checking sessions
- **Dark-First UI** — Clean, modern dark theme with indigo accent

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth + Vectors | Supabase (PostgreSQL + pgvector + Supabase Auth) |
| Fast LLM (claim extraction + verdicts) | Groq API — `llama-3.3-70b-versatile` |
| Heavy reasoning LLM (summary) | OpenRouter — `openrouter/owl-alpha` |
| Web Search | Tavily AI |
| Embeddings | Google Gemini — `text-embedding-004` (768 dimensions) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- API keys for Groq, OpenRouter, Tavily, and Google Gemini

### 1. Clone & Install

```bash
git clone https://github.com/Muhammad-Hashir-55/verity.git
cd verity
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Fact check sessions
create table fact_check_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  original_text text not null,
  overall_summary text,
  created_at timestamptz default now()
);

-- Individual claims
create table claims (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references fact_check_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  claim_text text not null,
  source_sentence text,
  embedding vector(768),
  verdict text check (verdict in ('verified', 'disputed', 'false', 'unverifiable')) not null,
  reasoning text not null,
  sources jsonb default '[]',
  is_cached boolean default false,
  similarity_score float,
  created_at timestamptz default now()
);

-- Vector index
create index on claims using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row Level Security
alter table fact_check_sessions enable row level security;
alter table claims enable row level security;

create policy "Users manage own sessions" on fact_check_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own claims" on claims
  for all using (auth.uid() = user_id);

-- Knowledge base search function
create or replace function match_claims(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  claim_text text,
  verdict text,
  reasoning text,
  sources jsonb,
  similarity float
)
language sql stable
as $$
  select
    id, claim_text, verdict, reasoning, sources,
    1 - (embedding <=> query_embedding) as similarity
  from claims
  where user_id = p_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
verity/
├── app/
│   ├── (auth)/login/page.tsx       # Login page
│   ├── (auth)/signup/page.tsx      # Signup page
│   ├── auth/callback/route.ts      # OAuth callback
│   ├── dashboard/page.tsx          # Main fact-checking interface
│   ├── history/page.tsx            # Past sessions
│   ├── api/
│   │   ├── extract-claims/         # Groq claim extraction
│   │   ├── embed/                  # Gemini embeddings
│   │   ├── check-kb/               # pgvector similarity search
│   │   ├── search-web/             # Tavily web search
│   │   ├── verify-claim/           # Groq fact verification
│   │   ├── fact-check/             # Main orchestrator (SSE streaming)
│   │   └── summary/                # OpenRouter summary generation
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── auth/                       # LoginForm, SignupForm
│   ├── ClaimCard.tsx               # Claim result card
│   ├── ClaimSidebar.tsx            # Slide-out detail panel
│   ├── FactCheckInput.tsx          # Main fact-checking UI
│   ├── HighlightedText.tsx         # Color-coded text highlighting
│   ├── HistoryCard.tsx             # Session preview card
│   ├── HistoryList.tsx             # Session list with drill-down
│   └── Navbar.tsx                  # Navigation bar
├── lib/
│   ├── supabase/                   # Client & server Supabase helpers
│   ├── groq.ts                     # Groq SDK config
│   ├── openrouter.ts               # OpenRouter API helper
│   ├── tavily.ts                   # Tavily web search helper
│   └── gemini.ts                   # Gemini embeddings helper
└── middleware.ts                    # Auth route protection
```

## How It Works

1. **Paste text** → User submits any text to the fact-checker
2. **Extract claims** → Groq (Llama 3.3 70B) breaks the text into atomic, verifiable claims
3. **For each claim (in parallel):**
   - Generate an embedding via Gemini (768-dim vector)
   - Search the knowledge base via pgvector for similar past claims (>88% similarity = cache hit)
   - **Cache hit:** Return the stored verdict instantly
   - **Cache miss:** Search the web via Tavily, verify via Groq, store result with embedding for future lookups
4. **Stream results** → Claims appear one-by-one via Server-Sent Events
5. **Generate summary** → OpenRouter Owl Alpha writes an overall reliability assessment

## Demo Inputs

The app includes three pre-loaded demo inputs for quick testing:

- **Mixed Truth/False** — Classic misconceptions (Great Wall from space, Einstein's math, etc.)
- **Tech Claims** — Python creation, Apple garage, iPhone release date, etc.
- **Recent-ish** — OpenAI founding, GPT name, ChatGPT growth, etc.

## License

MIT