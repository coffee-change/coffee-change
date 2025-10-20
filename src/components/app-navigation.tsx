"use client";

import { useState } from "react";
import { Dashboard } from "./dashboard";
import { RoundUpReview } from "./roundup-review";
import { InvestmentPosition } from "./investment-position";
import { RoundUpCharges } from "./roundup-charges";
import { InvestmentHistory } from "./investment-history";
import { SettingsPage } from "./settings";
import { NavigationMenu } from "./navigation-menu";

type AppScreen = 'dashboard' | 'roundup-review' | 'investment-position' | 'roundup-charges' | 'investment-history' | 'settings';

export function AppNavigation() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');

  const navigateToScreen = (screen: string) => {
    // Type guard to ensure screen is a valid AppScreen
    if (['dashboard', 'roundup-review', 'investment-position', 'roundup-charges', 'investment-history', 'settings'].includes(screen)) {
      setCurrentScreen(screen as AppScreen);
    }
  };

  const handleRoundUpReview = () => {
    navigateToScreen('roundup-review');
  };

  const handleInvestmentPosition = () => {
    navigateToScreen('investment-position');
  };

  const handleRoundUpCharges = () => {
    navigateToScreen('roundup-charges');
  };

  const handleInvestmentHistory = () => {
    navigateToScreen('investment-history');
  };

  const handleSettings = () => {
    navigateToScreen('settings');
  };

  const handleBackToDashboard = () => {
    navigateToScreen('dashboard');
  };

  const handleRoundUpSuccess = () => {
    navigateToScreen('investment-position');
  };

  // Screens that should show the navigation menu
  const showNavigation = !['roundup-review'].includes(currentScreen);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard 
            onReviewRoundUp={handleRoundUpReview}
            onViewPosition={handleInvestmentPosition}
            onViewRoundUpCharges={handleRoundUpCharges}
            onViewInvestmentHistory={handleInvestmentHistory}
            onSettings={handleSettings}
          />
        );
      case 'roundup-review':
        return (
          <RoundUpReview 
            onBack={handleBackToDashboard}
            onSuccess={handleRoundUpSuccess}
          />
        );
      case 'investment-position':
        return (
          <InvestmentPosition 
            onBack={handleBackToDashboard}
          />
        );
      case 'roundup-charges':
        return (
          <RoundUpCharges
            onBack={handleBackToDashboard}
            onConfirmInvest={handleRoundUpSuccess}
          />
        );
      case 'investment-history':
        return (
          <InvestmentHistory
            onBack={handleBackToDashboard}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onBack={handleBackToDashboard}
          />
        );
      default:
        return (
          <Dashboard 
            onReviewRoundUp={handleRoundUpReview}
            onViewPosition={handleInvestmentPosition}
            onViewRoundUpCharges={handleRoundUpCharges}
            onViewInvestmentHistory={handleInvestmentHistory}
            onSettings={handleSettings}
          />
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {showNavigation && (
        <NavigationMenu 
          currentScreen={currentScreen} 
          onNavigate={navigateToScreen} 
        />
      )}
      <main className="flex-1 md:ml-0">
        {renderCurrentScreen()}
      </main>
    </div>
  );
}