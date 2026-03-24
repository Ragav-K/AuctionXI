/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuctionSocket } from './hooks/useAuctionSocket';
import { LegacyFlow } from './components/LegacyFlow';
import { AuctionRoom } from './components/AuctionRoom';
import { AuctioneerSetupPage } from './components/AuctioneerSetupPage';
import { warmupServer } from './services/api';

export default function App() {
  useAuctionSocket();

  React.useEffect(() => {
    warmupServer();
    const intervalId = window.setInterval(() => {
      warmupServer();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LegacyFlow />} />
        <Route path="/auctioneer/setup" element={<AuctioneerSetupPage />} />
        <Route path="/auction/live" element={<AuctionRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
