import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArticleSection } from "@/components/ArticleSection";

const SERVER_URL = process.env["NEXT_PUBLIC_SERVER_URL"] ?? "http://localhost:3001";
const ARTICLE_ID = "boj-2026";

interface SectionResponse {
  articleId: string;
  sectionId: number;
  tier: string;
  title: string;
  content: string;
  price: string | null;
  totalSections: number;
}

async function getFreeSection(): Promise<SectionResponse> {
  const res = await fetch(`${SERVER_URL}/article/${ARTICLE_ID}/section/0`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch free section: ${res.status}`);
  }
  return res.json() as Promise<SectionResponse>;
}

const PAID_SECTIONS = [
  { sectionId: 1, price: "0.05 USDC", title: "Macro Environment Overview" },
  { sectionId: 2, price: "0.05 USDC", title: "BoJ Scenario Simulations" },
  { sectionId: 3, price: "0.10 USDC", title: "Asset Class Impact Analysis" },
  { sectionId: 4, price: "0.20 USDC", title: "Economist Commentary (Premium)" },
];

export default async function ArticlePage() {
  const freeSection = await getFreeSection();

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">weipress × x402</p>
          <h1 className="text-2xl font-bold">BoJ Policy 2026</h1>
        </div>
        <ConnectButton />
      </div>

      {/* Section 0 — free, fetched server-side */}
      <section className="border border-gray-200 rounded-lg p-5 bg-white space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{freeSection.title}</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Free</span>
        </div>
        <p className="text-sm leading-relaxed">{freeSection.content}</p>
      </section>

      {/* Sections 1–4 — paid, rendered client-side */}
      {PAID_SECTIONS.map((s) => (
        <ArticleSection
          key={s.sectionId}
          articleId={ARTICLE_ID}
          sectionId={s.sectionId}
          price={s.price}
          title={s.title}
        />
      ))}
    </main>
  );
}
