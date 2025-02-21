import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { bulkDecodeCallsFromOptions } from 'hooks/Guilds/contracts/useDecodedCall';
import { decodeCall } from 'hooks/Guilds/contracts/useDecodedCall';
import useProposal from 'Modules/Guilds/Hooks/useProposal';
import { useVotingResults } from 'Modules/Guilds/Hooks/useVotingResults';
import { Call, Option } from 'components/ActionsBuilder/types';
import { preventEmptyString, ZERO_HASH } from 'utils';
import useProposalMetadata from 'hooks/Guilds/useProposalMetadata';
import { useRichContractRegistry } from 'hooks/Guilds/contracts/useRichContractRegistry';
import { ERC20_APPROVE_SIGNATURE } from 'utils';
import { useNetwork } from 'wagmi';
import { getBigNumberPercentage } from 'utils/bnPercentage';
import { EMPTY_CALL } from 'Modules/Guilds/pages/CreateProposal';
import useGuildImplementationTypeConfig from './useGuildImplementationType';

const isApprovalData = (data: string) =>
  data && data?.substring(0, 10) === ERC20_APPROVE_SIGNATURE;
const isApprovalCall = (call: Call) => isApprovalData(call?.data);
const isZeroHash = (data: string) => data === ZERO_HASH;

const useProposalCalls = (guildId: string, proposalId: `0x${string}`) => {
  // Decode calls from existing proposal
  const { data: proposal } = useProposal(guildId, proposalId);
  const { data: metadata } = useProposalMetadata(guildId, proposalId);
  const votingResults = useVotingResults(guildId, proposalId);

  const { contracts } = useRichContractRegistry();
  const { chain } = useNetwork();
  const { t } = useTranslation();
  // Used to wait for the bytecode to be fetched
  const { loaded } = useGuildImplementationTypeConfig(guildId);
  const theme = useTheme();
  const [options, setOptions] = useState<Option[]>([]);

  const {
    totalVotes,
    to: toArray,
    data: dataArray,
    value: valuesArray,
  } = proposal || {};

  const totalOptionsNum = totalVotes?.length || 0;
  const displayableOptionsNum = totalOptionsNum - 1; // Not counting AGAINST (index 0) option

  const callsPerOption = totalOptionsNum
    ? Math.ceil(dataArray?.length / displayableOptionsNum)
    : 0;
  const optionLabels = metadata?.voteOptions;

  const calls: Call[] = useMemo(() => {
    const buildCall = (idx: number): Call => ({
      from: guildId,
      to: toArray[idx],
      data: dataArray[idx],
      value: valuesArray[idx],
    });
    return dataArray
      ?.map((_, index) => {
        const call = buildCall(index);
        if (isApprovalData(dataArray[index - 1])) {
          return {
            ...call,
            // We assume that if previous call was an approval, then current one is the one that is being approved
            // So passing nested temporary approvalCall and remove it from the calls array
            approvalCall: buildCall(index - 1),
          };
        }

        // Inyecting empty call to keep consistency on number of calls per option after nesting approval call. This will be skipped later when decoding options.
        if (isApprovalCall(call)) return EMPTY_CALL;
        return call;
      })
      .filter(Boolean);
  }, [guildId, toArray, dataArray, valuesArray]);

  const splitCalls = useMemo(() => {
    if (!calls) return null;
    const splitCalls: Call[][] = [];
    for (let i = 0; i < totalOptionsNum; i++) {
      const start = (i - 1) * callsPerOption;
      const end = i * callsPerOption;
      // skipping index 0 since is the "Against" option and doesn't have any call
      splitCalls.push(i === 0 ? [] : calls.slice(start, end));
    }
    return splitCalls;
  }, [calls, callsPerOption, totalOptionsNum]);

  useEffect(() => {
    if (!guildId || !proposalId || !splitCalls || !loaded) {
      setOptions([]);
      return;
    }
    async function decodeOptions() {
      const encodedOptions: Option[] = await Promise.all(
        splitCalls.map(async (calls, index) => {
          const filteredActions = calls.filter(
            call =>
              !isZeroHash(call?.data) ||
              !preventEmptyString(call?.value).isZero()
          );
          const actions = await Promise.all(
            filteredActions.map(async call => {
              if (!!call?.approvalCall) {
                // If current call is an "spending" call will have a inner approvalCall
                const { decodedCall: decodedApprovalCall } = await decodeCall(
                  call?.approvalCall,
                  contracts,
                  chain?.id
                );
                // Avoid spreading unnecesary approvalCall;
                const { approvalCall, ...newCall } = call;

                return {
                  ...newCall,
                  approval: {
                    /**
                     * amount being approved. Is extracted from the decoded approval call data (_value field).
                     * token is the token address
                     * More info on how we set these values: bulkEncodeCallsFromOptions function in hooks/Guilds/contracts/useEncodedCall.ts
                     */
                    ...decodedApprovalCall,
                    amount: decodedApprovalCall?.args?._value,
                    token: decodedApprovalCall?.to,
                  },
                };
              }
              return call;
            })
          );
          const optionLabel = optionLabels?.[index]
            ? optionLabels?.[index]
            : index === 0
            ? t('against', { defaultValue: 'Against' })
            : null;

          return {
            id: `option-${index}`,
            label: optionLabel || `Option ${index}`,
            color: theme?.colors?.votes?.[index],
            actions,
            totalVotes: votingResults?.options[index],
            votePercentage: getBigNumberPercentage(
              votingResults?.options[index],
              votingResults?.totalLocked,
              2
            ),
          };
        })
      );

      return bulkDecodeCallsFromOptions(encodedOptions, contracts, chain?.id);
    }
    decodeOptions().then(options =>
      // Return options putting default against-call last
      setOptions([...options.slice(1), options[0]])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    guildId,
    proposalId,
    contracts,
    chain,
    splitCalls,
    theme,
    optionLabels,
    totalOptionsNum,
    votingResults?.totalLocked,
    loaded,
  ]);

  return {
    options,
  };
};

export default useProposalCalls;
