"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, Coffee, RefreshCw, Settings } from "lucide-react";

interface SettingsProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsProps) {
  const { 
    walletAddress, 
    isConnected, 
    solBalance, 
    usdcBalance, 
    isLoadingBalances, 
    fetchBalances,
    networkName
  } = useSolana();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [preferredPayment, setPreferredPayment] = useState<'sol' | 'usdc'>('sol');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBalances();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isConnected || !walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <Coffee className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="coffee-text-primary">Wallet Not Connected</CardTitle>
            <CardDescription className="coffee-text-secondary">
              Please connect your wallet to access settings
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
      <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold coffee-text-primary">Settings</h1>
          </div>
        </div>

        {/* Wallet Information Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connected Wallet
            </CardTitle>
            <CardDescription>
              Your wallet information and balances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium coffee-text-secondary">Address</span>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium coffee-text-secondary">Network</span>
              <Badge variant="secondary" className="coffee-bg-mocha text-white">
                {networkName}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold coffee-text-primary">
                  {isLoadingBalances ? "..." : `${solBalance?.toFixed(4) || "0"} SOL`}
                </div>
                <div className="text-xs text-muted-foreground">SOL Balance</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold coffee-text-primary">
                  {isLoadingBalances ? "..." : `${usdcBalance?.toFixed(2) || "0"} USDC`}
                </div>
                <div className="text-xs text-muted-foreground">USDC Balance</div>
              </div>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Balances'}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your Coffee Change experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium coffee-text-primary">Preferred Payment Method</div>
                <div className="text-sm text-muted-foreground">
                  Choose your default currency for investments
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={preferredPayment === 'sol' ? 'default' : 'outline'}
                  size="sm"
                  className={preferredPayment === 'sol' ? 'coffee-button' : ''}
                  onClick={() => setPreferredPayment('sol')}
                >
                  SOL
                </Button>
                <Button
                  variant={preferredPayment === 'usdc' ? 'default' : 'outline'}
                  size="sm"
                  className={preferredPayment === 'usdc' ? 'coffee-button' : ''}
                  onClick={() => setPreferredPayment('usdc')}
                >
                  USDC
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <div className="font-medium coffee-text-primary">Auto-Invest Round-ups</div>
                <div className="text-sm text-muted-foreground">
                  Automatically invest spare change from transactions
                </div>
              </div>
              <Badge variant="default" className="coffee-bg-mocha">
                Enabled
              </Badge>
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