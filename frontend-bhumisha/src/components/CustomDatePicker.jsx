import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";

const CustomDatePicker = ({ name, value, onChange, className, required, min, max, disabled, readOnly }) => {
  const selectedDate = value ? new Date(value) : null;
  
  const handleChange = (date) => {
    const syntheticEvent = {
      target: {
        name: name || "",
        value: date ? dayjs(date).format('YYYY-MM-DD') : ''
      }
    };
    if (onChange) {
      onChange(syntheticEvent);
    }
  };

  return (
    <DatePicker
      selected={selectedDate}
      onChange={handleChange}
      dateFormat="dd-MM-yyyy"
      className={className || "border rounded p-2 w-full"}
      required={required}
      minDate={min ? new Date(min) : undefined}
      maxDate={max ? new Date(max) : undefined}
      placeholderText="dd-mm-yyyy"
      disabled={disabled}
      readOnly={readOnly}
    />
  );
};

export default CustomDatePicker;
