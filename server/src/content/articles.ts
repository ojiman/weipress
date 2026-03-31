export type SectionTier = "free" | "standard" | "detail" | "premium";

export interface Section {
  sectionId:   number;
  tier:        SectionTier;
  title:       string;
  content:     string;
  priceUsdc:   string | null;
  priceAtomic: string | null;
}

export interface Article {
  articleId:   string;
  title:       string;
  description: string;
  sections:    Section[];
}

export interface SectionResponse {
  articleId:     string;
  sectionId:     number;
  tier:          SectionTier;
  title:         string;
  content:       string;
  price:         string | null;
  totalSections: number;
}

export interface ArticleListItem {
  articleId:     string;
  title:         string;
  description:   string;
  totalSections: number;
  freeSections:  number[];
  paidSections:  Array<{ sectionId: number; price: string; title: string }>;
  totalPrice:    string;
  currency:      "USDC";
}

export const articles: Article[] = [
  {
    articleId:   "boj-2026",
    title:       "BoJ Policy 2026 — Scenarios and Asset Allocation",
    description: "Zero-rate continuation or hike? Asset class impact by scenario.",
    sections: [
      {
        sectionId:   0,
        tier:        "free",
        title:       "Lead",
        priceUsdc:   null,
        priceAtomic: null,
        content: `The Bank of Japan's policy path in 2026 stands at a crossroads unseen since the late 1990s. \
After decades of ultra-loose monetary policy, a series of wage negotiations in the spring of 2025 \
delivered the largest pay increases in thirty years, pushing core CPI firmly above the 2% target \
for six consecutive quarters. Governor Ueda's successor now faces a market that has already priced \
in two rate hikes for the calendar year, yet the export sector continues to send distress signals \
as the yen strengthens past 130 to the dollar.

The central question for investors is not whether the BoJ will move, but how quickly, and what \
collateral damage will follow in JGB markets, equities, and real estate investment trusts. The \
Nikkei 225 has already shed 8% from its February peak on rate-hike fears, and 10-year JGB yields \
have climbed to levels not seen since the early 2000s. Foreign portfolio managers are split: \
some see a normalisation story that validates Japanese equities on fundamentals; others fear a \
disorderly unwind of the massive carry trade that has supported risk assets globally.

This report examines four macro scenarios ranging from a shallow, gradualist tightening cycle \
to an abrupt emergency pivot back to easing triggered by external shock. For each scenario we \
map the probable trajectory of the yen, JGB yields, domestic equity sectors, and J-REITs, and \
we propose concrete asset allocation tilts that institutional and sophisticated retail investors \
may wish to consider. The analysis draws on BoJ meeting minutes, Ministry of Finance flow data, \
and proprietary survey responses from 140 Japanese corporate treasurers collected in March 2026.`,
      },
      {
        sectionId:   1,
        tier:        "standard",
        title:       "Macro Environment Overview",
        priceUsdc:   "0.05",
        priceAtomic: "50000",
        content: `Japan's macroeconomic backdrop entering 2026 is characterised by three structural \
shifts that together create an environment qualitatively different from any the BoJ has navigated \
in the post-bubble era.

**Wage dynamics.** The 2025 shunto spring wage round delivered a 4.2% average base-pay increase, \
the highest since 1992. Critically, this was not confined to large corporations: smaller firms, \
which employ roughly 70% of Japan's private-sector workforce, posted a median increase of 3.6%, \
suggesting genuine second-round effects. The BoJ's core-core CPI — which strips out food and \
energy — reached 2.4% year-on-year in February 2026, providing the policy committee with the \
domestic demand-driven inflation it has explicitly stated is a precondition for sustained \
normalisation.

**Fiscal backdrop.** The government's supplementary budget for FY2026 allocates ¥8.5 trillion \
in stimulus, partly offsetting the drag from higher borrowing costs on household balance sheets. \
However, the Fiscal System Council has warned that debt-service costs will consume 27% of the \
general account budget if 10-year yields stabilise at 1.5%, creating a political constraint on \
how aggressive the BoJ can be without triggering a sovereign-risk premium in JGB markets.

**External sector vulnerability.** The yen's 12% appreciation since October 2025 has already \
compressed operating margins for export-oriented manufacturers. Toyota's Q3 FY2025 earnings \
release cited a ¥340 billion headwind from currency alone. If the yen moves through 125 — \
a level many exporters use as a stress-test floor — the BoJ may face calls from the Cabinet \
to slow its normalisation path regardless of inflation data.

Against this backdrop, the April 2026 BoJ meeting is almost universally expected to deliver \
a 25bp hike to 0.75%, but the language accompanying the decision — and in particular the \
quarterly Outlook Report's language on the pace of further adjustments — will be scrutinised \
far more closely than the rate decision itself. Market participants will focus on three phrases: \
"gradual," "data-dependent," and "risk balance," each of which has historically been a \
leading indicator of the committee's tightening or pausing bias in subsequent quarters.`,
      },
      {
        sectionId:   2,
        tier:        "standard",
        title:       "BoJ Scenario Simulations",
        priceUsdc:   "0.05",
        priceAtomic: "50000",
        content: `We model four discrete scenarios for BoJ policy through end-2026 and assign \
subjective probabilities based on current data and our proprietary corporate survey.

---

**Scenario A — Gradual Normalisation (45% probability)**

The BoJ delivers 25bp hikes in April and October, bringing the policy rate to 1.00% by \
year-end. Inflation stabilises near 2.2%, wage growth moderates to 3%, and the yen trades \
in a 125–135 range. JGB 10-year yields drift to 1.6%–1.8% without disorderly selling. \
Equity markets digest the moves after initial volatility, with value and financials \
outperforming growth and tech. J-REITs underperform but do not experience a structural \
de-rating. This is the consensus base case.

---

**Scenario B — Accelerated Tightening (20% probability)**

Inflation overshoots to 3%+ driven by a second consecutive strong shunto. The BoJ hikes \
in April, July, and October — three 25bp moves — reaching 1.25%. The yen strengthens \
sharply through 120. JGB 10-year yields breach 2%, prompting the BoJ to reinstate a \
soft yield cap at 2% via fixed-rate purchase operations. Exporters face severe margin \
compression; domestic demand sectors (healthcare, retail) outperform. The carry trade \
unwind accelerates, contributing to global risk-off, particularly in emerging market \
assets that benefited from yen-funded flows.

---

**Scenario C — Pause and Hold (25% probability)**

A sharp global growth scare — triggered by US tariff escalation or a China property \
sector relapse — causes the BoJ to hike in April but hold thereafter. The policy rate \
stays at 0.75% for the remainder of the year. The yen weakens back toward 140 as \
carry reasserts. JGB yields decline to 1.2%. Equities recover, led by exporters. \
This scenario is particularly favourable for J-REITs, which re-rate as the long-end \
yield retreat reduces capitalisation rate pressure.

---

**Scenario D — Emergency Pivot (10% probability)**

A severe external shock — analogous to the March 2020 COVID disruption — forces the \
BoJ to reverse course within the year, cutting back to 0.25% and restarting asset \
purchases. Domestic recession fears dominate. JGB yields collapse. The yen initially \
strengthens on safe-haven demand before weakening on policy divergence concerns. \
Equity markets suffer broad-based declines of 20%+. Gold and short-duration JGBs \
are the primary beneficiaries in yen terms.

---

**Scenario probability-weighted outlook.** Averaging across scenarios, our probability-\
weighted 10-year JGB yield target for end-2026 is 1.55%, with a standard deviation of \
±35bp. The probability-weighted yen forecast is 128.4, with tail risk skewed toward \
yen strength in Scenarios A and B and weakness in Scenarios C and D.`,
      },
      {
        sectionId:   3,
        tier:        "detail",
        title:       "Asset Class Impact Analysis",
        priceUsdc:   "0.10",
        priceAtomic: "100000",
        content: `This section translates the scenario framework into concrete asset class \
implications, focusing on the instruments most directly affected by BoJ normalisation.

**Japanese Government Bonds (JGBs)**

The JGB market faces its most complex supply-demand dynamic in a generation. The BoJ \
currently holds approximately 53% of outstanding JGBs; as quantitative tightening \
proceeds, the marginal buyer must increasingly be private domestic institutions \
(life insurers, pension funds, regional banks) and foreign investors. Life insurers \
have expressed willingness to absorb supply at 10-year yields above 1.5%, but their \
capacity is constrained by solvency regulations that penalise duration extension when \
equity portfolios are also under stress. Our base case (Scenario A) implies a 10-year \
yield range of 1.5%–1.8%, which we consider fair value given real yield parity with \
the US adjusted for currency hedge costs. Scenario B creates tail risk of a brief \
overshoot to 2.2%–2.4% before the BoJ intervenes.

**Equities — Sector Rotation**

The Nikkei 225's aggregate multiple is less informative than sector-level analysis in \
a rate-normalisation environment. We identify four distinct return profiles:

- *Outperform*: Regional banks (net interest margin expansion), insurance companies \
(investment yield improvement), domestic consumer staples (wage-driven demand, limited \
yen exposure).
- *Neutral*: Pharmaceuticals (defensive, but ageing demographics support long-term), \
construction (infrastructure spending offset by higher financing costs).
- *Underperform*: Export manufacturers (yen appreciation margin pressure), growth tech \
(duration effect on DCF valuations), utilities (debt refinancing costs).
- *Scenario-dependent*: Automobiles (Scenario A neutral, Scenario B underperform, \
Scenario C outperform).

Small-cap domestics merit particular attention. The TSE Prime / Growth divergence has \
widened sharply in 2025; if wage growth sustains domestic consumption, smaller \
consumer-facing companies trading at 12x–15x forward earnings may offer superior \
risk-adjusted returns relative to large-cap exporters.

**J-REITs**

J-REITs are the asset class most mechanically sensitive to BoJ policy normalisation. \
The 10-year JGB yield serves as the discount rate anchor; each 25bp yield increase \
compresses NAV by approximately 3%–5% for a typical diversified REIT at current \
capitalisation rates. However, two offsetting factors prevent a structural collapse: \
(1) rental income is rising in logistics and urban office segments as demand recovers \
post-pandemic; (2) BoJ normalisation is itself a signal of economic health, which \
supports occupancy rates. Our recommendation is to maintain underweight J-REITs in \
Scenarios A and B, move to neutral in Scenario C, and overweight selectively in \
Scenario D. Within the sector, logistics REITs with long-term fixed-rent contracts \
and low floating-rate debt offer the best defensive characteristics.

**Currency (USD/JPY)**

Yen strengthening is both an input to and an output of our framework. Under Scenario A, \
a move to 125–128 is orderly and manageable; the MoF's currency intervention threshold \
is widely estimated at sub-120, providing a floor of sorts. Under Scenario B, a rapid \
move through 120 would likely prompt verbal intervention and possibly coordinated \
G7 FX action, given that a disorderly yen spike would export deflation to trading \
partners. Hedging costs for USD-based investors holding Japanese assets have fallen \
as the Fed-BoJ rate differential narrows; this is structurally supportive of continued \
foreign inflows into JGBs and equities at longer horizons.`,
      },
      {
        sectionId:   4,
        tier:        "premium",
        title:       "Economist Commentary (Premium)",
        priceUsdc:   "0.20",
        priceAtomic: "200000",
        content: `*The following commentary represents the personal views of our senior economist \
and is intended for institutional subscribers only. It contains forward-looking \
statements and model-based projections that should not be construed as investment advice.*

---

After twenty-five years of covering the Bank of Japan, I find myself in the unusual \
position of believing that this time genuinely is different — not because the institution \
has changed, but because the external conditions that perpetuated its policy paralysis \
have finally, irreversibly shifted.

The deflation psychology that gripped Japanese households from the late 1990s through \
the 2010s was not irrational. Rational expectations of falling prices, anchored by \
decades of experience, made it individually sensible to defer large purchases and \
demand higher real wages as compensation for nominal stagnation. The BoJ could not \
break this equilibrium through monetary policy alone because monetary policy cannot \
directly change the wage-setting norms of millions of small and medium enterprises \
operating in implicit long-term employment relationships.

What changed was demographics combined with a global supply shock. The working-age \
population contraction that economists had been predicting for thirty years finally \
became acute enough to give labour genuine bargaining power in the 2024–2025 shunto \
rounds. Simultaneously, the post-COVID supply chain disruption and energy price pass-\
through gave firms the cover to raise prices without losing market share to domestic \
competitors who faced identical cost pressures. The inflation that emerged was not \
demand-pull in the traditional sense — it was a structural repricing of labour and \
imported inputs that, crucially, proved durable because it changed the *expectation* \
of future inflation.

This matters enormously for the policy path. If I am right that the inflation regime \
has genuinely shifted, the BoJ's central task is not to achieve a specific rate level \
but to credibly communicate that it will not allow inflation expectations to become \
unanchored in either direction. The risk I most fear is not that the BoJ tightens too \
aggressively — the institution's historical bias toward gradualism provides a natural \
brake — but that political pressure from the export lobby causes it to pause at 0.75% \
or 1.00% when underlying inflation dynamics warrant continuation. Such a pause would \
embed a real policy rate that remains deeply negative, perpetuating the distortions in \
capital allocation that have weighed on Japan's productivity growth for decades.

My probability-weighted view is that the BoJ reaches 1.25%–1.50% by end-2027, a path \
that is modest by any international comparison but represents a profound normalisation \
for an economy that has not experienced positive real short rates since 1995. The \
transition will be uncomfortable for levered balance sheets — particularly in real \
estate and among regional banks with legacy JGB portfolios — but the alternative of \
indefinite financial repression carries its own systemic risks that are harder to model \
but no less real.

For investors, I would frame the opportunity as follows: Japan is undergoing the \
normalisation of its cost of capital. Assets that were priced under the assumption \
of permanent zero rates will reprice lower; assets that benefit from economic \
dynamism unlocked by positive real rates will reprice higher. The rotation has begun, \
but it is in the early innings. The investors who will benefit most are those willing \
to hold through the inevitable volatility of the transition rather than trading \
around each BoJ meeting.`,
      },
    ],
  },
];
