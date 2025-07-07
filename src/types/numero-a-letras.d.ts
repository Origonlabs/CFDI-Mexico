declare module 'numero-a-letras' {
  export function numeroALetras(num: number, opciones?: { 
    plural?: string; 
    singular?: string; 
    centavos?: { plural?: string; singular?: string } | boolean; 
  }): string;
}
