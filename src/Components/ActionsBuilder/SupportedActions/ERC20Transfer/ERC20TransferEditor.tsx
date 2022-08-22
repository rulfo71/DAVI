import { ActionEditorProps } from '..';
import { BigNumber } from 'ethers';
import { Button } from 'components/Primitives/Button';
import { Controller, useForm } from 'react-hook-form';
import useENSAvatar from 'hooks/Guilds/ether-swr/ens/useENSAvatar';
import { useERC20Info } from 'hooks/Guilds/ether-swr/erc20/useERC20Info';
import { useTokenList } from 'hooks/Guilds/tokens/useTokenList';
import Avatar from 'components/Avatar';
import { TokenPicker } from 'components/TokenPicker';
import Input from 'components/Primitives/Forms/Input';
import TokenAmountInput from 'components/Primitives/Forms/TokenAmountInput';
import { Box } from 'components/Primitives/Layout/Box';
import { useMemo, useState } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { MAINNET_ID } from 'utils';
import { resolveUri } from 'utils/url';
import {
  Control,
  ControlLabel,
  ControlRow,
} from 'components/Primitives/Forms/Control';
import { useTranslation } from 'react-i18next';
import { useNetwork } from 'wagmi';
import validateERC20Transfer from './validateERC20Transfer';
import { ErrorLabel } from 'components/Primitives/Forms/ErrorLabel';
import { useTypedParams } from 'Modules/Guilds/Hooks/useTypedParams';

const Error = styled(ErrorLabel)`
  margin-top: 0.5rem;
`;

const Spacer = styled(Box)`
  margin-right: 1rem;
`;

const ClickableIcon = styled(Box)`
  display: flex;
  align-items: center;
  cursor: pointer;
`;
interface TransferValues {
  tokenAddress: string;
  amount: BigNumber;
  recipientAddress: string;
}

const ERC20TransferEditor: React.FC<ActionEditorProps> = ({
  decodedCall,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const parsedData = useMemo(() => {
    if (!decodedCall) return null;

    return {
      source: decodedCall.from,
      tokenAddress: decodedCall.to,
      amount: decodedCall.args._value,
      recipientAddress: decodedCall.args._to,
    };
  }, [decodedCall]);

  const { control, handleSubmit, getValues } = useForm({
    resolver: validateERC20Transfer,
    context: { t },
    defaultValues: parsedData,
  });

  const { tokenAddress, recipientAddress } = getValues();

  const [isTokenPickerOpen, setIsTokenPickerOpen] = useState(false);

  const { guildId } = useTypedParams();
  const { chain } = useNetwork();

  // Get token details from the token address
  const { tokens } = useTokenList(chain?.id);
  const token = useMemo(() => {
    if (!tokenAddress || !tokens) return null;

    return tokens.find(({ address }) => address === tokenAddress);
  }, [tokens, tokenAddress]);

  const { data: tokenInfo } = useERC20Info(tokenAddress);
  const { imageUrl: destinationAvatarUrl } = useENSAvatar(
    recipientAddress,
    MAINNET_ID
  );

  const submitAction = (values: TransferValues) => {
    onSubmit({
      ...decodedCall,
      to: values.tokenAddress,
      args: {
        ...decodedCall.args,
        _value: values.amount,
        _to: values.recipientAddress,
      },
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(submitAction, console.error)}>
        <Controller
          name="recipientAddress"
          control={control}
          render={({ field: { ref, ...field }, fieldState }) => {
            const { invalid, error } = fieldState;

            return (
              <Control>
                <ControlLabel>{t('recipient')}</ControlLabel>
                <ControlRow>
                  <Input
                    {...field}
                    placeholder={t('ethereumAddress')}
                    isInvalid={invalid && !!error}
                    onChange={e => field.onChange(e.target.value)}
                    icon={
                      <div>
                        {!invalid && !error && (
                          <Avatar
                            src={destinationAvatarUrl}
                            defaultSeed={field.value}
                            size={24}
                          />
                        )}
                      </div>
                    }
                    iconRight={
                      field.value ? (
                        <ClickableIcon onClick={() => field.onChange('')}>
                          <FiX size={18} />
                        </ClickableIcon>
                      ) : null
                    }
                  />
                </ControlRow>
                {invalid && !!error && <Error>{error.message}</Error>}
              </Control>
            );
          }}
        />

        <ControlRow>
          <Controller
            name="amount"
            control={control}
            render={({ field: { ref, ...field }, fieldState }) => {
              const { invalid, error } = fieldState;

              return (
                <Control>
                  <ControlLabel>{t('amount')}</ControlLabel>
                  <ControlRow>
                    <TokenAmountInput
                      {...field}
                      decimals={tokenInfo?.decimals}
                      isInvalid={invalid && !!error}
                    />
                  </ControlRow>

                  {invalid && !!error && <Error>{error.message}</Error>}
                </Control>
              );
            }}
          />

          <Spacer />

          <Controller
            name="tokenAddress"
            control={control}
            render={({ field: { ref, ...field }, fieldState }) => {
              const { invalid, error } = fieldState;
              return (
                <>
                  <Control>
                    <ControlLabel>{t('asset')}</ControlLabel>
                    <ControlRow onClick={() => setIsTokenPickerOpen(true)}>
                      <Input
                        {...field}
                        value={tokenInfo?.symbol}
                        placeholder={t('token')}
                        isInvalid={invalid && !!error}
                        icon={
                          <div>
                            {field.value && (
                              <Avatar
                                src={resolveUri(token?.logoURI)}
                                defaultSeed={field.value}
                                size={18}
                              />
                            )}
                          </div>
                        }
                        iconRight={<FiChevronDown size={20} />}
                        readOnly
                      />
                    </ControlRow>
                    {invalid && !!error && <Error>{error.message}</Error>}
                  </Control>

                  <TokenPicker
                    {...field}
                    walletAddress={guildId}
                    isOpen={isTokenPickerOpen}
                    onClose={() => setIsTokenPickerOpen(false)}
                    onSelect={tokenAddress => {
                      field.onChange(tokenAddress);
                      setIsTokenPickerOpen(false);
                    }}
                  />
                </>
              );
            }}
          />
        </ControlRow>

        <Button
          m="1rem 0 0"
          fullWidth
          data-testid="submit-erc20transfer"
          type="submit"
        >
          {t('saveAction')}
        </Button>
      </form>
    </div>
  );
};

export default ERC20TransferEditor;
