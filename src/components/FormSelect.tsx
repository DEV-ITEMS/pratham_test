import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { type SelectProps } from '@mui/material/Select';
import { Controller, type FieldValues, type UseControllerProps } from 'react-hook-form';

type Option = { label: string; value: string };

type FormSelectProps<TFieldValues extends FieldValues> = UseControllerProps<TFieldValues> &
  Omit<SelectProps<string>, 'name' | 'defaultValue' | 'value' | 'onChange'> & {
    label: string;
    options: Option[];
  };

export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  label,
  options,
  ...selectProps
}: FormSelectProps<TFieldValues>) => (
  <Controller
    name={name}
    control={control}
    defaultValue={defaultValue}
    rules={rules}
    render={({ field, fieldState }) => (
      <FormControl fullWidth error={Boolean(fieldState.error)}>
        <InputLabel>{label}</InputLabel>
        <Select {...selectProps} label={label} {...field} value={field.value ?? ''}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
      </FormControl>
    )}
  />
);
