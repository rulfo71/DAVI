import { Loading } from 'components/primitives/Loading';
import { BigNumber } from 'ethers';
import {
  ActionCount,
  ActionCountWrapper,
  ActionDetailsButton,
  OptionVotesAndLabelWrapper,
  WinningOptionWrapper,
} from './ProposalCardWinningOption.styled';
import { getInfoLineView } from 'components/ActionsBuilder/SupportedActions';
import UndecodableCallInfoLine from 'components/ActionsBuilder/UndecodableCalls/UndecodableCallInfoLine';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpandedActionsList } from '../ExpandedActionsList';
import { ProposalCardWinningOptionProps } from './types';

const bn = (n?: string | number | BigNumber) => BigNumber.from(n ?? 0);

const ProposalCardWinningOption: React.FC<ProposalCardWinningOptionProps> = ({
  options,
}) => {
  const [expandedActionsVisible, setExpandedActionsVisible] = useState(false);
  const { t } = useTranslation();

  const option = useMemo(() => {
    if (!options) return null;
    return options?.reduce(
      (acc, option) =>
        bn(option?.totalVotes).gt(bn(acc?.totalVotes)) ? option : acc,
      options[0]
    );
  }, [options]);

  if (!option) {
    return (
      <Loading
        style={{ margin: 0 }}
        loading
        text
        skeletonProps={{ width: '200px' }}
      />
    );
  }

  const firstDecodedAction = option?.decodedActions[0];
  const firstUnknownAction = option?.actions[0];
  const numberOfActions = option?.actions?.length;

  const handleExpandActions = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (numberOfActions > 1) setExpandedActionsVisible(!expandedActionsVisible);
  };

  const InfoLine = getInfoLineView(firstDecodedAction?.decodedCall?.callType);

  return (
    <WinningOptionWrapper>
      <OptionVotesAndLabelWrapper>
        {option.votePercentage !== null ? (
          <>
            {option.votePercentage}% - {option.label}
          </>
        ) : (
          <Loading
            style={{ margin: 0 }}
            loading
            text
            skeletonProps={{ width: '70px' }}
          />
        )}
      </OptionVotesAndLabelWrapper>

      <ActionDetailsButton
        onClick={handleExpandActions}
        isClickable={numberOfActions > 1}
        aria-label={'action details button'}
      >
        {numberOfActions === 1 ? (
          !!InfoLine ? (
            <InfoLine
              decodedCall={firstDecodedAction?.decodedCall}
              approveSpendTokens={firstDecodedAction?.approval}
              compact
              noAvatar
            />
          ) : (
            <UndecodableCallInfoLine
              call={firstUnknownAction}
              compact
              noAvatar
            />
          )
        ) : (
          <ActionCountWrapper>
            <ActionCount>{numberOfActions}</ActionCount> {t('actions_other')}
          </ActionCountWrapper>
        )}

        {expandedActionsVisible && <ExpandedActionsList option={option} />}
      </ActionDetailsButton>
    </WinningOptionWrapper>
  );
};

export default ProposalCardWinningOption;
