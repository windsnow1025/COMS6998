import {Bricolage_Grotesque, Inter} from 'next/font/google';

const displayFont = Bricolage_Grotesque({ subsets: ['latin'], variable: '--dr-font-display' });
const bodyFont = Inter({ subsets: ['latin'], variable: '--dr-font-body' });

// The product's fonts as CSS variables: on the root, and on what MUI renders outside it (the voice chip's tooltip)
export const FontVariables = `${displayFont.variable} ${bodyFont.variable}`;
