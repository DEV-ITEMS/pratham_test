import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { Controller } from 'react-hook-form';

export const FormSelect = ({
  name,
  control,
  defaultValue,
  rules,
  label,
  options,
  ...selectProps
}) => (
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

