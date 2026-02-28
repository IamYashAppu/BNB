'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useRef, useEffect } from 'react';
import { formatUnits, parseEther } from 'viem';

type AIMessageData = {
  type: string;
  message: string;
  data?: any[];
  transaction?: any;
};

type Message = {
  role: 'user' | 'bot';
  content: string;
  aiData?: AIMessageData;
  isInteractiveCard?: boolean;
  protocol?: string;
  asset?: string;
  recommendedAmount?: number;
  probabilityScore?: string;
  isWalletSelection?: boolean;
  isTransactionPending?: boolean;
  isTransactionSuccess?: boolean;
  txHash?: string;
  historyDetails?: any;
};

const MOCK_WALLETS = [
  { id: 'phantom', name: 'Phantom', network: 'Solana', balance: 45.0, symbol: 'SOL', usdValue: 6500.00 },
  { id: 'trust', name: 'Trust Wallet', network: 'Arbitrum', balance: 1500, symbol: 'USDT', usdValue: 1500.00 },
  { id: 'coinbase', name: 'Coinbase Wallet', network: 'Base', balance: 1.5, symbol: 'ETH', usdValue: 4500.00 },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading, isError } = useBalance({ address });
  const { data: hash, sendTransaction, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I am your AI assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [connectedMockWallets, setConnectedMockWallets] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [pendingExecution, setPendingExecution] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const bnbPrice = 590.20;
  const realBnbAmount = balance ? Number(formatUnits(balance.value, balance.decimals)) : 0;
  const realBnbUsd = realBnbAmount * bnbPrice;

  const mockUsdTotal = connectedMockWallets.reduce((sum, walletId) => {
    const w = MOCK_WALLETS.find(w => w.id === walletId);
    return sum + (w ? w.usdValue : 0);
  }, 0);

  const totalPortfolioValue = realBnbUsd + mockUsdTotal;
  const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add the user's message to the chat UI immediately
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput(''); // clear the input box

    try {
      // 2. Send the message to your Python FastAPI backend
      const recentHistory = messages.slice(-2).map(m => m.content).join(" | ");
      const contextMessage = recentHistory ? `${recentHistory} | User says: ${input}` : input;

      const response = await fetch('http://localhost:8000/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: contextMessage })
      });

      const aiData = await response.json();

      // 3. Extract the clean JSON your Python backend sent back
      const extractedIntent = aiData.data;

      // 4. Format it nicely for the UI
      const botReply = extractedIntent.message || '✅ Request processed.';

      // 5. Add the real AI response to the chat UI
      setMessages([...newMessages, { role: 'bot', content: botReply, aiData: extractedIntent }]);

    } catch (error) {
      console.error("Error connecting to Python backend:", error);
      setMessages([...newMessages, { role: 'bot', content: "Error: Could not reach the AI Brain. Is the Python server running on port 8000?" }]);
    }
  };

  const startVoiceInput = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();

    // @ts-ignore
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript); // Drops the spoken words right into the text box!
    };

    recognition.start();
  };

  const handleStrategyClick = (strategy: any) => {
    // 1. Mock the AI "Prediction" logic (e.g., suggesting a safe 15% portfolio allocation)
    // We dynamically calculate this based on the real BNB balance just for a massive flex if they have money, or fallback to 150.
    const predictedSafeAmount = realBnbAmount > 0 ? (realBnbAmount * 0.15).toFixed(2) : 150;

    // 2. Add a new custom message type to the chat UI
    const newPredictiveMessage: Message = {
      role: 'bot',
      content: "I analyzed your omni-chain balance profile. Based on a safe-yield risk tolerance, here is my AI prediction for your optimal allocation:",
      isInteractiveCard: true,
      protocol: strategy.protocol,
      asset: strategy.pool || 'USDT',
      recommendedAmount: Number(predictedSafeAmount),
      probabilityScore: "94.2%" // Hackathon flex!
    };

    setMessages(prev => [...prev, newPredictiveMessage]);
  };

  const handleConfirmAndSign = () => {
    const selectionMessage: Message = {
      role: 'bot',
      content: 'Please select the funding source for this transaction:',
      isWalletSelection: true
    };
    setMessages(prev => [...prev, selectionMessage]);
  };

  const handleExecuteTransaction = async (walletId: string) => {
    if (walletId === 'BSC') {
      try {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: 'Waiting for MetaMask confirmation...',
          isTransactionPending: true
        }]);
        sendTransaction({
          to: '0x000000000000000000000000000000000000dEaD',
          value: parseEther('0.001')
        });
      } catch (error) {
        console.error("Transaction failed", error);
        setMessages(prev => [...prev, { role: 'bot', content: 'Transaction failed or rejected by user.' }]);
      }
    } else {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `Cross-chain bridge initiated via ${walletId}.`,
        isTransactionSuccess: true,
        historyDetails: {
          wallet: walletId,
          ...pendingExecution
        }
      }]);
      setTransactionHistory(prev => [{
        hash: 'mock-tx-' + Math.random().toString(36).slice(2, 12),
        wallet: walletId,
        ...pendingExecution,
        timestamp: new Date().toISOString()
      }, ...prev]);
      setPendingExecution(null);
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTransactionPending);
        return [...filtered, {
          role: 'bot',
          content: 'Transaction Confirmed!',
          isTransactionSuccess: true,
          txHash: hash,
          historyDetails: {
            wallet: 'BSC (MetaMask)',
            ...pendingExecution
          }
        }];
      });
      setTransactionHistory(prev => [{
        hash,
        wallet: 'BSC (MetaMask)',
        ...pendingExecution,
        timestamp: new Date().toISOString()
      }, ...prev]);
      setPendingExecution(null);
    }
  }, [isConfirmed, hash, pendingExecution]);

  return (
    <main className="flex h-screen bg-[#0d0d12] text-gray-100 overflow-hidden font-sans">
      {/* Left Panel - Chat Interface - Full width when sidebar is closed */}
      <section
        className="flex flex-col w-full bg-[#0d0d12] relative z-10 transition-all duration-500"
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-[#262636] bg-[#0d0d12]/80 backdrop-blur-md shadow-md z-20 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-wide">
              Omni
            </h1>
            <div className="flex space-x-2 bg-[#12121a] p-1 rounded-lg border border-[#262636]">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-[#1e1e2d] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[#1e1e2d] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
              >
                History {transactionHistory.length > 0 && `(${transactionHistory.length})`}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span className="text-xs text-green-400 font-medium tracking-wider uppercase">Online</span>
          </div>
        </header>

        {/* Dynamic Content Area based on Tab */}
        {activeTab === 'chat' ? (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed transition-all duration-300 ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-[0_8px_16px_rgba(79,70,229,0.2)]'
                      : 'bg-[#181824] text-gray-200 rounded-bl-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-[#2a2a3c]'
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.aiData?.type === 'exploration' && msg.aiData.data && (
                      <div className="mt-4 space-y-3">
                        {msg.aiData.data.map((strategy: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => handleStrategyClick(strategy)}
                            className="bg-[#1e1e2d] p-3 rounded-xl border border-[#2a2a3c] flex justify-between items-center group hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-white mb-0.5">{strategy.protocol}</p>
                              <p className="text-xs text-gray-400 font-medium">{strategy.pool}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-extrabold">{strategy.apy}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Risk: {strategy.risk}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.aiData?.type === 'execution' && msg.aiData.transaction && (
                      <div className="mt-4 bg-[#12121a] p-4 rounded-xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          <h4 className="font-bold text-white text-sm tracking-wide">Transaction Confirmation</h4>
                        </div>
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-sm py-1 border-b border-[#2a2a3c]">
                            <span className="text-gray-400">Action:</span>
                            <span className="text-white capitalize font-medium">{msg.aiData.transaction.action}</span>
                          </div>
                          <div className="flex justify-between text-sm py-1 border-b border-[#2a2a3c]">
                            <span className="text-gray-400">Protocol:</span>
                            <span className="text-white font-medium">{msg.aiData.transaction.protocol}</span>
                          </div>
                          <div className="flex justify-between text-sm py-1">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-blue-400 font-extrabold">{msg.aiData.transaction.amount} {msg.aiData.transaction.asset}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPendingExecution(msg.aiData?.transaction);
                            handleConfirmAndSign();
                          }}
                          className="relative w-full overflow-hidden group py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]"
                        >
                          <span className="relative z-10 flex items-center justify-center space-x-2">
                            <span>Confirm & Sign</span>
                            <svg className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    )}
                    {msg.isInteractiveCard && (
                      <div className="mt-4 p-5 rounded-xl border border-purple-500 bg-gray-900 shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h3 className="text-lg font-bold text-white mb-2">
                          ⚡ AI Yield Prediction: {msg.protocol}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Based on your unified portfolio and current market depth, we predict a <span className="text-green-400 font-bold">{msg.probabilityScore} safety probability</span> for this allocation.
                        </p>

                        {/* THE EDITABLE INPUT & BUTTON */}
                        <div className="flex items-center gap-3">
                          <div className="flex bg-black border border-gray-700 rounded-lg p-1 w-1/2 focus-within:border-purple-500 transition-colors">
                            <input
                              type="number"
                              defaultValue={msg.recommendedAmount}
                              className="bg-transparent text-white w-full p-2 outline-none font-mono"
                              id={`predictive-input-${idx}`}
                            />
                            <span className="p-2 text-gray-500 font-bold">{msg.asset}</span>
                          </div>

                          <button
                            onClick={() => {
                              const el = document.getElementById(`predictive-input-${idx}`) as HTMLInputElement;
                              setPendingExecution({
                                amount: el ? el.value : msg.recommendedAmount,
                                asset: msg.asset,
                                protocol: msg.protocol,
                                action: 'Allocation'
                              });
                              handleConfirmAndSign();
                            }}
                            className="w-1/2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-purple-500/25"
                          >
                            Confirm & Sign
                          </button>
                        </div>
                      </div>
                    )}
                    {msg.isWalletSelection && (
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => handleExecuteTransaction('BSC')}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all font-semibold"
                        >
                          <span className="text-yellow-400">BSC (MetaMask)</span>
                        </button>
                        {connectedMockWallets.map(wId => {
                          const w = MOCK_WALLETS.find(x => x.id === wId);
                          if (!w) return null;
                          return (
                            <button
                              key={w.id}
                              onClick={() => handleExecuteTransaction(w.name)}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2a2a3c] bg-[#1a1a27] hover:bg-[#202030] transition-all font-semibold"
                            >
                              <span className="text-gray-300">{w.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {msg.isTransactionPending && (
                      <div className="mt-4 flex flex-col items-center justify-center p-6 bg-[#12121a] border border-[#262636] rounded-xl text-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-blue-400 font-bold">{isConfirming ? 'Waiting for Network Block...' : 'Waiting for MetaMask confirmation...'}</p>
                        <p className="text-xs text-gray-500 mt-2">Please check your wallet extension</p>
                      </div>
                    )}
                    {msg.isTransactionSuccess && (
                      <div className="mt-4 p-5 rounded-xl border border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-in zoom-in-95 duration-500">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-400 drop-shadow-md">Transaction Confirmed!</h3>
                        </div>

                        {msg.historyDetails && (
                          <div className="bg-[#08080c]/50 rounded-lg p-4 border border-[#2a2a3c] mb-4 space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-[#2a2a3c] pb-2 mb-2">Receipt History</h4>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Wallet Used:</span>
                              <span className="text-blue-400 font-medium bg-blue-500/10 px-2 rounded">{msg.historyDetails.wallet}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Protocol:</span>
                              <span className="text-white font-semibold">{msg.historyDetails.protocol || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Action:</span>
                              <span className="text-white capitalize">{msg.historyDetails.action || 'Deposit'}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center border-t border-[#2a2a3c] pt-2 mt-2">
                              <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">Total Amount:</span>
                              <span className="text-green-400 font-black text-lg">{msg.historyDetails.amount} {msg.historyDetails.asset}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-300 mt-2">Funds routing successfully recorded on-chain.</p>

                        {msg.txHash && (
                          <a
                            href={`https://testnet.bscscan.com/tx/${msg.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 text-xs font-mono text-blue-400 hover:text-blue-300 underline break-all p-2 bg-[#0d0d12] rounded-md border border-[#262636] hover:border-blue-500/50 transition-colors w-full"
                          >
                            View on Block Explorer: {msg.txHash}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-5 pl-16 bg-[#0d0d12] border-t border-[#262636] relative z-20">
              <div className="flex items-center bg-[#151520] rounded-xl overflow-hidden border border-[#2a2a3c] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-300 shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent pl-6 pr-3 py-4 outline-none text-gray-100 placeholder-gray-600 text-[15px]"
                />
                <button
                  onClick={startVoiceInput}
                  className="px-3 py-4 text-gray-400 hover:text-blue-400 transition-colors duration-200 outline-none flex items-center justify-center"
                  title="Voice Input"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="pr-6 pl-3 py-4 font-semibold text-blue-400 hover:text-blue-300 hover:bg-[#1a1a27] disabled:text-gray-700 disabled:hover:bg-transparent transition-colors duration-200"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
            {transactionHistory.length === 0 ? (
              <p className="text-gray-500 italic p-6 text-center border border-dashed border-[#2a2a3c] rounded-xl bg-[#12121a]">
                No transactions have been successfully executed yet.
              </p>
            ) : (
              transactionHistory.map((tx, idx) => (
                <div key={idx} className="bg-[#12121a] p-5 rounded-xl border border-[#2a2a3c] shadow-lg flex flex-col space-y-3">
                  <div className="flex justify-between items-center border-b border-[#2a2a3c] pb-3">
                    <span className="text-xs font-mono text-gray-500 bg-[#0d0d12] px-2 py-1 rounded-md">{new Date(tx.timestamp).toLocaleString()}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded-md border border-green-500/20">Success</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Action</p>
                      <p className="text-white font-medium capitalize">{tx.action || 'Deposit'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Protocol</p>
                      <p className="text-white font-medium">{tx.protocol || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wallet Used</p>
                      <p className="text-blue-400 font-medium">{tx.wallet}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-green-400 font-black">{tx.amount} {tx.asset}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Transaction Hash</p>
                    <a
                      href={tx.wallet.includes('BSC') ? `https://testnet.bscscan.com/tx/${tx.hash}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-400 hover:text-blue-300 block truncate bg-[#0d0d12] border border-[#2a2a3c] p-2 rounded-md hover:border-blue-500/50 transition-colors"
                    >
                      {tx.hash}
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Sidebar Edge Trigger */}
      <div
        className={`fixed top-1/2 right-0 -translate-y-1/2 z-40 p-1.5 bg-[#1a1a27] border border-[#2a2a3c] border-r-0 rounded-l-xl cursor-pointer hover:bg-[#202030] hover:pl-3 transition-all duration-300 flex items-center shadow-[-5px_0_15px_rgba(0,0,0,0.5)] ${isSidebarOpen ? 'translate-x-full' : 'translate-x-0'}`}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onClick={() => setIsSidebarOpen(true)}
      >
        <div className="flex flex-col items-center justify-center py-4 space-y-2 select-none">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-blue-400 font-bold tracking-[0.2em] text-xs uppercase" style={{ writingMode: 'vertical-rl' }}>Wallets</span>
        </div>
      </div>

      {/* Right Panel - Control Panel - Floating Sidebar */}
      <section
        className={`fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-[#08080c]/95 backdrop-blur-xl border-l border-[#262636] z-50 flex flex-col items-center pt-24 space-y-12 overflow-y-auto transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl ${isSidebarOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.7)]' : 'translate-x-full'}`}
      >
        {/* Close Button for Sidebar */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Subtle background glow */}
        <div className="absolute top-0 w-full h-96 bg-blue-900/10 blur-[100px] pointer-events-none rounded-b-full"></div>

        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent z-10">
          Wallet Control
        </h2>

        <div className="w-full flex justify-center z-10 px-8">
          <div className="p-1 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <ConnectButton />
          </div>
        </div>

        {isConnected && address && (
          <div className="w-full max-w-[85%] mt-8 space-y-6 z-10 flex flex-col">
            {connectedMockWallets.length === 0 ? (
              <>
                {/* Real Balance Widget Part 1 */}
                <div className="bg-[#12121a] p-6 rounded-2xl shadow-xl border border-[#262636] group hover:border-[#38384a] transition-all duration-300">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Status</p>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    <p className="text-sm font-medium text-gray-300">Connected to BSC Testnet</p>
                  </div>
                  <div className="bg-[#08080c] p-3 rounded-lg border border-[#1e1e2d]">
                    <p className="font-mono text-xs text-gray-400 break-all text-center">{address}</p>
                  </div>
                </div>

                {/* Real Balance Widget Part 2 */}
                <div className="bg-[#12121a] p-6 rounded-2xl shadow-xl border border-[#262636] group hover:border-[#38384a] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Balance</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                      {isLoading ? '...' : isError ? 'Error' : realBnbAmount.toFixed(4)}
                    </p>
                    <span className="text-blue-400 font-bold text-lg tracking-wide shadow-blue-500/50">{balance ? balance.symbol : 'tBNB'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 p-5 border rounded-2xl border-gray-700 bg-gray-900 text-white shadow-2xl relative z-10 w-full animate-in fade-in zoom-in duration-300">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Unified Omni-Chain Portfolio
                </h2>

                <div className="text-4xl font-black mb-2 flex items-baseline gap-2">
                  {formatCurrency(totalPortfolioValue)} <span className="text-sm font-bold text-green-400">+2.4%</span>
                </div>

                <div className="space-y-2 text-sm">
                  {/* Real BSC Row */}
                  <div
                    onClick={() => setSelectedNetwork(selectedNetwork === 'BSC' ? null : 'BSC')}
                    className="flex justify-between border-b border-gray-800 pb-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors"
                  >
                    <span className="text-gray-400 pointer-events-none">BSC (MetaMask)</span>
                    <span className="font-mono text-gray-200 pointer-events-none">{realBnbAmount.toFixed(4)} BNB</span>
                  </div>
                  {selectedNetwork === 'BSC' && (
                    <div className="bg-[#12121a] border border-[#262636] rounded-xl p-4 my-2 shadow-2xl animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-white">BSC Network</h4>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedNetwork(null); }} className="text-gray-500 hover:text-white">✕</button>
                      </div>
                      <div className="mb-4 space-y-1">
                        <p className="text-sm text-gray-400">Current Balance: <span className="text-white font-mono">{realBnbAmount.toFixed(4)} BNB</span></p>
                        <p className="text-sm text-gray-400">Conversion Rate: <span className="text-white font-mono">1 BNB = {formatCurrency(bnbPrice)}</span></p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Mock Wallet Rows */}
                  {connectedMockWallets.map(walletId => {
                    const w = MOCK_WALLETS.find(w => w.id === walletId);
                    if (!w) return null;
                    return (
                      <div key={w.id}>
                        <div
                          onClick={() => setSelectedNetwork(selectedNetwork === w.network ? null : w.network)}
                          className="flex justify-between border-b border-gray-800 pb-2 cursor-pointer hover:bg-gray-800/50 p-1 rounded transition-colors mt-2"
                        >
                          <span className="text-gray-400 pointer-events-none">{w.network} ({w.name})</span>
                          <span className="font-mono text-gray-200 pointer-events-none">{w.balance} {w.symbol}</span>
                        </div>
                        {selectedNetwork === w.network && (
                          <div className="bg-[#12121a] border border-[#262636] rounded-xl p-4 my-2 shadow-2xl animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-bold text-white">{w.network} Network</h4>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedNetwork(null); }} className="text-gray-500 hover:text-white">✕</button>
                            </div>
                            <div className="mb-4 space-y-1">
                              <p className="text-sm text-gray-400">Current Balance: <span className="text-white font-mono">{w.balance} {w.symbol}</span></p>
                              <p className="text-sm text-gray-400">Total Value: <span className="text-white font-mono">{formatCurrency(w.usdValue)}</span></p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectedMockWallets(prev => prev.filter(id => id !== w.id));
                                setSelectedNetwork(null);
                              }}
                              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg py-2 text-sm font-bold transition-colors"
                            >
                              Disconnect Wallet
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Always Render Mock Wallet Connectors for Unadded Wallets */}
            {MOCK_WALLETS.filter(w => !connectedMockWallets.includes(w.id)).length > 0 && (
              <div className="pt-4 border-t border-[#1e1e2d] w-full mt-4">
                <button
                  onClick={() => setShowWalletPopup(true)}
                  className="w-full py-3 rounded-xl font-bold text-white bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Wallet</span>
                </button>
              </div>
            )}

            {showWalletPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#12121a] border border-[#2a2a3c] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-[#2a2a3c] flex justify-between items-center bg-[#151520]">
                    <h3 className="text-lg font-bold text-white">Select a Wallet</h3>
                    <button onClick={() => setShowWalletPopup(false)} className="text-gray-500 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {MOCK_WALLETS.filter(w => !connectedMockWallets.includes(w.id)).map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setIsSimulating(w.id);
                          setTimeout(() => {
                            setConnectedMockWallets(prev => [...prev, w.id]);
                            setIsSimulating(null);
                            if (MOCK_WALLETS.filter(wallet => !connectedMockWallets.includes(wallet.id) && wallet.id !== w.id).length === 0) {
                              setShowWalletPopup(false);
                            }
                          }, 1000);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2a2a3c] hover:border-blue-500/50 hover:bg-[#1a1a27] transition-all group"
                      >
                        <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">{w.name}</span>
                        {isSimulating === w.id ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-sm text-gray-500 group-hover:text-blue-400">Connect</span>
                        )}
                      </button>
                    ))}
                    {MOCK_WALLETS.filter(w => !connectedMockWallets.includes(w.id)).length === 0 && (
                      <p className="text-center text-sm text-gray-500 py-4">All wallets connected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
