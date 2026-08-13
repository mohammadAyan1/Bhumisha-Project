import dayjs from 'dayjs';

/**
 * Formats a given date to DD-MM-YYYY format.
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string or 'N/A' if invalid
 */
export const formatDateDMY = (date) => {
  if (!date) return 'N/A';
  const d = dayjs(date);
  if (!d.isValid()) return 'N/A';
  return d.format('DD-MM-YYYY');
};
