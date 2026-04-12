import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { articleRouter, x402Middleware } from "./routes/articles.js";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Log 402 responses — distinguish initial challenge (no X-PAYMENT) from settlement failure (X-PAYMENT present)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (res.statusCode === 402) {
      const hasPayment = !!(req.headers["x-payment"] ?? req.headers["X-PAYMENT"]);
      if (hasPayment) {
        console.error(
          `[x402] Settlement failed: ${req.method} ${req.url} returned 402 with X-PAYMENT header present`,
        );
      }
    }
  });
  next();
});

// x402 payment middleware (intercepts protected routes before they reach the router)
// Step 2 & 5–7 of x402 flow: issues 402, verifies, and settles payments
app.use(x402Middleware);

// Route handlers
app.use(articleRouter);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`[weipress] Server running at http://localhost:${port}`);
  console.log(`[weipress] Network: ${process.env.NETWORK ?? "eip155:84532"}`);
  console.log(`[weipress] Receiver: ${process.env.RECEIVER_ADDRESS ?? "(not set)"}`);
});
