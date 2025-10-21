"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  History, 
  Settings,
  Wallet,
  Coffee
} from "lucide-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { NetworkBadge } from "@/components/network-indicator";

interface NavigationMenuProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function NavigationMenu({ currentScreen, onNavigate }: NavigationMenuProps) {
  const { isConnected } = useSolana();
  
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'roundup-charges', label: 'Charges', icon: DollarSign },
    { id: 'investment-position', label: 'Portfolio', icon: TrendingUp },
    { id: 'investment-history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:sticky md:top-0 md:left-0 md:h-screen md:w-64 md:border-r md:border-t-0 md:flex md:flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Coffee className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg coffee-text-primary">Coffee Change</span>
          <NetworkBadge />
        </div>
        <WalletConnectButton />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex md:flex-col md:gap-3 md:p-6 md:border-b md:border-border">
        <div className="flex items-center gap-3">
          <Coffee className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold coffee-text-primary">Coffee Change</h1>
        </div>
        <NetworkBadge />
      </div>

      {/* Navigation Items */}
      <div className="flex md:flex-col overflow-x-auto md:overflow-visible py-2 md:py-4 md:px-4 gap-1 md:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`flex flex-col items-center justify-center py-2 px-3 h-auto rounded-none md:rounded-lg md:flex-row md:justify-start md:gap-3 flex-1 md:flex-none ${
                isActive ? "coffee-button" : ""
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Wallet Connect - Desktop */}
      <div className="hidden md:block md:mt-auto md:p-4">
        <WalletConnectButton />
      </div>
    </div>
  );
}