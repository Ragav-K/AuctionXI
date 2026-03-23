import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Home } from './Home';
import { CreateAuction } from './CreateAuction';
import { JoinAuction } from './JoinAuction';
import { Lobby } from './Lobby';
import { AuctionRoom } from './AuctionRoom';
import type { Screen } from '../types/auction';

export const LegacyFlow = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home onNavigate={setCurrentScreen} />;
      case 'create':
        return <CreateAuction onNavigate={setCurrentScreen} />;
      case 'join':
        return <JoinAuction onNavigate={setCurrentScreen} />;
      case 'lobby':
        return <Lobby onNavigate={setCurrentScreen} />;
      case 'auction':
        return <AuctionRoom onNavigate={setCurrentScreen} />;
      default:
        return <Home onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg selection:bg-neon-green selection:text-navy-deep">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
