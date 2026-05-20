export type Spectrum = {
  left: string;
  right: string;
  category?: string;
};

export const featuredSpectrums: Spectrum[] = [
  { left: "Frio", right: "Quente", category: "Clássico" },
  { left: "Sommelier", right: "Vinho é só sangue de boi", category: "Polêmico" },
  { left: "Era pra ser DM", right: "Era pra ser thread", category: "Internet" },
  { left: "Tapa de revista do coração", right: "Toca em Coachella", category: "Cultura pop" },
  { left: "Olor que te tira do chão", right: "Cheiro de domingo", category: "Comportamento" },
  { left: "Vino em caixinha", right: "Tem adega em casa", category: "Geração" },
  { left: "Meme bom", right: "Meme cringe", category: "Estética" },
  { left: "Touch grass", right: "Lê Roman Empire diariamente", category: "Internet" },
  { left: "Joyita", right: "Imóvel emocional", category: "Geração" },
  { left: "Pix na hora", right: "Boleto vencido", category: "Comportamento" },
];
