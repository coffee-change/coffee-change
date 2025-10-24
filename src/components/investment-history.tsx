"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Coffee, Clock } from "lucide-react";

interface InvestmentRecord {
  id: string;
  date: string;
  amount: number;
  transactionHash: string;
  poolShareChange: number;
  status: 'completed' | 'pending';
}

interface InvestmentHistoryProps {
  onBack: () => void;
}

export function InvestmentHistory({ onBack }: InvestmentHistoryProps) {
  const { walletAddress, isConnected } = useSolana();
  const [history, setHistory] = useState<InvestmentRecord[]>([]);

  // Mock data - replace with actual investment history data
  useState(() => {
    if (isConnected && walletAddress) {
      setHistory([
        {
          id: "1",
          date: "2024-12-15T14:30:00Z",
          amount: 3.25,
          transactionHash: "3Kj8...9Xm2",
          poolShareChange: 0.15,
          status: "completed"
        },
        {
          id: "2",
          date: "2024-12-10T09:15:00Z",
          amount: 2.80,
          transactionHash: "7Pm3...k9R1",
          poolShareChange: 0.12,
          status: "completed"
        },
        {
          id: "3",
          date: "2024-12-05T16:45:00Z",
          amount: 1.95,
          transactionHash: "9Qn5...f2H8",
          poolShareChange: 0.08,
          status: "completed"
        },
        {
          id: "4",
          date: "2024-11-28T11:30:00Z",
          amount: 4.20,
          transactionHash: "2Rf7...m4K9",
          poolShareChange: 0.18,
          status: "completed"
        }
      ]);
    }
  });

  if (!isConnected || !walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <Coffee className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="coffee-text-primary">Wallet Not Connected</CardTitle>
            <CardDescription className="coffee-text-secondary">
              Please connect your wallet to view investment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} className="w-full coffee-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Coffee className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold coffee-text-primary">Investment History</h1>
          </div>
        </div>

        {/* Investment History Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Auto-Investment History
            </CardTitle>
            <CardDescription>
              Record of all your round-up investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium coffee-text-primary">
                          ${record.amount.toFixed(2)} auto-invested
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Pool share change: <span className="font-medium">+{record.poolShareChange.toFixed(2)}%</span>
                        </div>
                      </div>
                      <Badge 
                        variant={record.status === 'completed' ? 'default' : 'secondary'}
                        className={record.status === 'completed' ? 'bg-green-500' : 'coffee-bg-mocha'}
                      >
                        {record.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()} at {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <a 
                        href={`https://solscan.io/tx/${record.transactionHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-mono bg-muted px-2 py-1 rounded"
                      >
                        {record.transactionHash}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No investment history yet. Your auto-investments will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold coffee-text-primary">
                {history.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Investments</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold coffee-text-primary">
                ${history.reduce((sum, record) => sum + record.amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold coffee-text-primary">
                {history.reduce((sum, record) => sum + record.poolShareChange, 0).toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Total Share Gain</div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}