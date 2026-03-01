import * as dgii from 'dgii-rnc';

try {
  console.log('Exports:', Object.keys(dgii));
  if (dgii.default) {
      console.log('Default export keys:', Object.keys(dgii.default));
  }
} catch (e) {
  console.error(e);
}
