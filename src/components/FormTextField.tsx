import { TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldValues, UseControllerProps } from 'react-hook-form';

export const FormTextField = <TFieldValues extends FieldValues>({ name, control, rules, defaultValue, ...rest }: UseControllerProps<TFieldValues> & TextFieldProps) => (
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
