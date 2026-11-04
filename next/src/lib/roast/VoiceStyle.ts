import * as React from 'react';
import { FlavorResDto } from '@/client/nest';

// The voice's color as the product's styles take it: an element that shows a voice sets the token on itself
export function voiceStyle(flavor: FlavorResDto): React.CSSProperties {
  return { '--dr-flavor': flavor.color } as React.CSSProperties;
}
