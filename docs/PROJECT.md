# Project: OmniYield

## Problem Statement 🚦

Decentralized Finance (DeFi) offers incredible opportunities for passive income through yield farming, liquidity provision, and lending. However, the ecosystem remains severely fragmented across multiple chains (Ethereum, BNB Chain, Arbitrum, Solana, etc.), creating massive friction:

1. **Complexity Barrier:** Retail users find assessing the risk, APY, and volatility of differing liquidity pools intimidating. Delta-neutral strategies, while safer, require complex active management.
2. **Fragmented UI:** Monitoring an Omni-Chain portfolio currently involves juggling dozens of tabs, block explorers, and disparate wallet interfaces.
3. **Information Overload:** Constantly tracking pool health, impermanent loss risk, and network congestion is unmanageable for the average investor.

## Solution: Meet Omni 💡

OmniYield introduces an **AI-driven Delta-Neutral Yield Advisor (`Omni`)** that aggregates cross-chain liquidity markets into a singular, highly intuitive conversational interface. 

By analyzing user intent through Google's powerful **Gemma 3** AI model, OmniYield serves as an intelligent middleman:

- **Simplifies Execution**: The AI calculates predictive probability scores and generates one-click transaction breakdowns. 
- **Simulates Portfolio Action**: Seamlessly simulates mock-wallets and cross-chain transactions alongside integrating Real BSC Testnet executions via MetaMask.
- **Unified Analytics**: Aggregates balances, conversion rates, and history all inside a beautiful glass-morphic drawer interface to track performance easily.

## Impact 🔥

OmniYield accelerates the onboarding of non-technical users into complex DeFi strategies by abstracting the friction points completely.

By relying on natural language over clunky smart-contract interaction portals, OmniYield empowers users to safely allocate capital with a significantly lower barrier to entry, contributing toward the ultimate goal of democratizing decentralized finance.

## Roadmap 🗺️

**Phase 1 (MVP - Current State):**
- ✅ Next.js + Tailwind CSS UI integrated with `wagmi` and RainbowKit for Base/BSC connections.
- ✅ Python FastAPI intelligent routing backend powered by Google's Gemma 3 model.
- ✅ Conversational context logging tracking user intent and executing dynamic transaction validation.
- ✅ Hybrid Omni-chain wallet modeling (Mock Wallets integrated alongside live MetaMask transactions).

**Phase 2 (Cross-Chain Infrastructure):**
- ⏳ Complete generic smart contract integration using LayerZero or Wormhole for actual cross-chain liquidity provision.
- ⏳ Real-time oracle indexing (e.g., Pyth/Chainlink) replacing static Python mock data to feed real-time pool metrics into Gemma 3.
- ⏳ Dynamic gas optimization routing to suggest the cheapest times to bridge.

**Phase 3 (Autonomy & Scaling):**
- ⏳ Agentic sub-routines allowing Omni to actively adjust yield portfolios (auto-compounding) based on pre-approved user risk tolerances.
- ⏳ Social Yield discovery: Share the AI's transaction breakdowns publicly as "Verified Saftey Plays."
