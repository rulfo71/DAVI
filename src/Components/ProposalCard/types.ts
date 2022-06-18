import { ProposalStatusProps } from 'Components/ProposalStatus/types';
import { Proposal, ENSAvatar } from '../Types';
import { DecodedAction } from 'Components/ActionsBuilder/types';

export interface ProposalCardProps {
  proposal?: Proposal;
  votes?: number[];
  ensAvatar?: ENSAvatar;
  href?: string;
  statusProps?: ProposalStatusProps;
  summaryActions?: DecodedAction[];
}
