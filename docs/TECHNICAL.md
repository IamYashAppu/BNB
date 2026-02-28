# Technical Architecture 🛠️

OmniYield is built using a modern decoupled architecture that separates the heavy NLP operations from the decentralized frontend application.

## Frontend (Next.js + Tailwind CSS)

The user interface handles conversational state, interactive dynamic cards, wallet aggregation, and wallet interactions.
- **Framework**: Built with React and `Next.js` (App Router).
- **Styling**: Extensive use of `Tailwind CSS` for animations, glassmorphism, responsive navigation drawers, and gradient rendering.
- **Web3 Integration**: Uses `wagmi` via `viem` coupled with `@rainbow-me/rainbowkit` for actual injected wallet integrations (MetaMask connecting to BSC testnet).
- **Omni Wallet Modeling**: Implements a robust state manager that seamlessly toggles real on-chain reads/writes alongside a robust Mock-Wallet environment simulating Arbitrum/Solana connectivity.

## Backend (Python FastAPI)

The intelligence layer acts as a semantic router:
- **Framework**: `FastAPI` powered by Uvicorn.
- **AI Engine**: Connects to the `google-generativeai` SDK querying the advanced `gemma-3-27b-it` model. 
- **Prompt Structure**: Enforces strict JSON execution output structures to delineate between User intent ("exploration", "execution", "clarification").

---

# Local Setup & Installation 🏃

Running OmniYield requires launching both the FastAPI server and the Next.js Frontend.

### 1. Python AI Backend (`/src/backend`)
```bash
cd src/backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux

# Install requirements
pip install -r requirements.txt

# Create a `.env` file referencing your Google GenAI Token:
# GEMINI_API_KEY="your-api-key"

# Run the Uvicorn Server
.\venv\Scripts\python.exe -m uvicorn main:app --reload
# (Server runs on http://localhost:8000)
```

### 2. Next.js Frontend (`/src/frontend-ui/frontend`)
```bash
cd src/frontend-ui/frontend

# Install node modules
npm install

# Optional: Add .env.local with your WalletConnect Project ID if integrating deeply
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"

# Start the dev server
npm run dev
# (App runs on http://localhost:3000)
```

---

# Presentation Demo 🎮

To showcase the key interactions during our pitch/evaluation, follow this path:
1. **Explore**: Type *"What are the safest yield options currently available?"* - Omni will display 3 different mock pools.
2. **Predictive Interaction**: Click any of the simulated cards to open a dynamically created "AI Prediction Model".
3. **Sidebar Analytics**: Hover on the right edge of the screen to smoothly interact with the aggregated cross-chain Wallet Dashboard.
4. **Execution**: Verify the execution flow by clicking *"Confirm & Sign"*, choosing either a mock wallet (simulating bridges) or MetaMask mapping a real testnet transaction hash. 
5. **Receipt**: View the generated "Receipt History" showing exactly how Omni structured the transaction logic in the backend. 
