// Based on https://github.com/levelkdev/dxswap-dapp/blob/master/src/components/Input/NumericalInput/index.tsx

import React, { useState } from 'react';
import { Input, InputProps } from 'components/primitives/Forms/Input';
import { escapeRegExp } from 'utils';
import { IconRight } from './IconRight';

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

export const NumericalInput: React.FC<InputProps<string>> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  defaultValue,
  ...rest
}) => {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onChange(nextUserInput);
    }
  };

  const [disabledState, setDisabled] = useState(defaultValue ? true : disabled);
  const iconRightProps = {
    disabled: disabledState,
    value,
    onChange: onChange,
    defaultValue,
    setDisabled,
    type: 'number',
  };

  return (
    <Input
      {...rest}
      value={value}
      onChange={event => {
        // replace commas with periods, because Guilds exclusively uses period as the decimal separator
        enforcer(event.target.value.replace(/,/g, '.'));
      }}
      // universal input options
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="text"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder={placeholder || '0.0'}
      minLength={1}
      maxLength={79}
      spellCheck="false"
      disabled={disabledState}
      iconRight={<IconRight {...iconRightProps} />}
    />
  );
};
