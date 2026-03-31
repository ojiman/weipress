import { Router, Request, Response } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { articles } from "../content/articles.js";
import { paymentConfig } from "../config/x402.js";
import type { SectionResponse, ArticleListItem } from "../content/articles.js";

// ---------------------------------------------------------------------------
// x402 setup — resource server + payment middleware
// ---------------------------------------------------------------------------

const facilitatorClient = new HTTPFacilitatorClient({
  url: paymentConfig.facilitatorUrl,
});

const resourceServer = new x402ResourceServer(facilitatorClient).register(
  paymentConfig.network as Network,
  new ExactEvmScheme(),
);

// Register each paid section with its price (dollar-formatted string)
// Step 2 of x402 flow: server declares payment requirements per route
export const x402Middleware = paymentMiddleware(
  {
    "GET /article/boj-2026/section/1": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.05",
          network: paymentConfig.network as Network,
          payTo: paymentConfig.payTo as `0x${string}`,
        },
      ],
      description: "Section 1: Macro Environment Overview",
      mimeType: "application/json",
    },
    "GET /article/boj-2026/section/2": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.05",
          network: paymentConfig.network as Network,
          payTo: paymentConfig.payTo as `0x${string}`,
        },
      ],
      description: "Section 2: BoJ Scenario Simulations",
      mimeType: "application/json",
    },
    "GET /article/boj-2026/section/3": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.10",
          network: paymentConfig.network as Network,
          payTo: paymentConfig.payTo as `0x${string}`,
        },
      ],
      description: "Section 3: Asset Class Impact Analysis",
      mimeType: "application/json",
    },
    "GET /article/boj-2026/section/4": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.20",
          network: paymentConfig.network as Network,
          payTo: paymentConfig.payTo as `0x${string}`,
        },
      ],
      description: "Section 4: Economist Commentary (Premium)",
      mimeType: "application/json",
    },
  },
  resourceServer,
);

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export const articleRouter = Router();

/** GET /health */
articleRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    facilitatorUrl: paymentConfig.facilitatorUrl,
    network: paymentConfig.network,
    receiverAddress: paymentConfig.payTo,
  });
});

/** GET /articles — free listing */
articleRouter.get("/articles", (_req: Request, res: Response) => {
  const items: ArticleListItem[] = articles.map((article) => {
    const paidSections = article.sections
      .filter((s) => s.tier !== "free")
      .map((s) => ({
        sectionId: s.sectionId,
        price: s.priceUsdc ?? "0",
        title: s.title,
      }));

    const totalPrice = paidSections
      .reduce((sum, s) => sum + parseFloat(s.price), 0)
      .toFixed(2);

    return {
      articleId: article.articleId,
      title: article.title,
      description: article.description,
      totalSections: article.sections.length,
      freeSections: article.sections
        .filter((s) => s.tier === "free")
        .map((s) => s.sectionId),
      paidSections,
      totalPrice,
      currency: "USDC",
    };
  });

  res.json({ articles: items });
});

/** GET /article/:articleId/section/:sectionId */
articleRouter.get(
  "/article/:articleId/section/:sectionId",
  (req: Request, res: Response) => {
    const { articleId, sectionId } = req.params;
    const sectionNum = parseInt(sectionId, 10);

    if (isNaN(sectionNum)) {
      res.status(404).json({ error: "Section not found", articleId, sectionId });
      return;
    }

    const article = articles.find((a) => a.articleId === articleId);
    if (!article) {
      res.status(404).json({ error: "Article not found", articleId });
      return;
    }

    const section = article.sections.find((s) => s.sectionId === sectionNum);
    if (!section) {
      res.status(404).json({
        error: "Section not found",
        articleId,
        sectionId: sectionNum,
      });
      return;
    }

    // Step 8: 200 OK + content (payment already verified by middleware for paid sections)
    const response: SectionResponse = {
      articleId: article.articleId,
      sectionId: section.sectionId,
      tier: section.tier,
      title: section.title,
      content: section.content,
      price: section.priceUsdc,
      totalSections: article.sections.length,
    };

    res.json(response);
  },
);
