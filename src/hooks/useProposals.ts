import { ProposalsContext, ProposalsContextInterface } from 'contexts/proposals';
import { useContext } from 'react';

export const useProposals = () => {
  const context = useContext<ProposalsContextInterface>(ProposalsContext);
  if (context === undefined) {
    throw new Error('useProposals must be within ProposalsProvider');
  }

  return context;
};
