/**
 * Common validators (prod: reusable for forms; extracts dupes from login/permissions etc.).
 * Relevant only for input checks.
 */

// User/perm validation
export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateUniqueId = (id, existingIds, fieldName = 'ID') => {
  if (existingIds.some(existing => existing.toLowerCase() === id.toLowerCase())) {
    return `${fieldName} already exists (must be unique)`;
  }
  return null;
};

export const validateLength = (value, max, fieldName) => {
  if (value && value.length > max) {
    return `${fieldName} too long (max ${max} chars)`;
  }
  return null;
};

// Form validator factory (for modals/forms)
export const validateForm = (form, rules) => {
  const errors = {};
  Object.keys(rules).forEach(field => {
    const value = form[field];
    const rule = rules[field];
    let error = null;
    if (rule.required) error = validateRequired(value, rule.label || field) || error;
    if (rule.unique && rule.existing) error = validateUniqueId(value, rule.existing, rule.label) || error;
    if (rule.maxLength) error = validateLength(value, rule.maxLength, rule.label || field) || error;
    if (error) errors[field] = error;
  });
  return errors;
};