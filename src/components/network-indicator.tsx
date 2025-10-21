"use client";

import React from 'react';
import { getCurrentNetworkConfig } from '@/lib/config';
import { Badge } from './ui/badge';

/**
 * Network Indicator Component
 * Displays the current Solana network (Mainnet or Devnet)
 */
export function NetworkIndicator() {
  const networkConfig = getCurrentNetworkConfig();
  const isMainnet = networkConfig.CHAIN === 'solana:mainnet';

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isMainnet ? 'default' : 'secondary'}
        className={`
          ${isMainnet
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }
          font-medium px-3 py-1
        `}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
        {networkConfig.DISPLAY_NAME}
      </Badge>

      {!isMainnet && (
        <span className="text-xs text-yellow-600 dark:text-yellow-500">
          (Test Network)
        </span>
      )}
    </div>
  );
}

/**
 * Compact Network Badge
 * Smaller version for use in navigation or headers
 */
export function NetworkBadge() {
  const networkConfig = getCurrentNetworkConfig();
  const isMainnet = networkConfig.CHAIN === 'solana:mainnet';

  return (
    <Badge
      variant={isMainnet ? 'default' : 'secondary'}
      className={`
        ${isMainnet
          ? 'bg-green-600 text-white'
          : 'bg-yellow-600 text-white'
        }
        text-xs px-2 py-0.5
      `}
    >
      {isMainnet ? 'Mainnet' : 'Devnet'}
    </Badge>
  );
}
