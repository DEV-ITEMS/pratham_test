import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

export const FormTextField = ({ name, control, rules, defaultValue, ...rest }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    defaultValue={defaultValue}
    render={({ field, fieldState }) => (
      <TextField
        {...rest}
        {...field}
        error={Boolean(fieldState.error)}
        helperText={fieldState.error?.message ?? rest.helperText}
        fullWidth
      />
    )}
  />
);

