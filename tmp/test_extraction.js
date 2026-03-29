
const testExtracted = (extracted) => {
  const phone = extracted.mobile || 
                extracted.phone_mobile || 
                (extracted.phone?.replace(/[^\d]/g, '').startsWith('010') ? extracted.phone : '') || 
                (extracted.tel?.replace(/[^\d]/g, '').startsWith('010') ? extracted.tel : '') ||
                '';
  return phone;
};

const cases = [
  { mobile: '010-4523-2084', phone: '031-784-1331' }, // Case 1: Both present
  { phone: '010-4523-2084' }, // Case 2: Only phone (but mobile)
  { mobile: '01045232084' }, // Case 3: Only mobile (no format)
  { phone: '031-784-1331' }, // Case 4: Only landline
  { phone_mobile: '010-1111-2222' }, // Case 5: phone_mobile key
];

cases.forEach((c, i) => {
  console.log(`Case ${i+1}:`, testExtracted(c));
});
