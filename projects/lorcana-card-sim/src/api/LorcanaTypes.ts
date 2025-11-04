export type LorcanaDeck = {
    cards: LorcanaCard[];
}
export interface LorcanaCard {
    cost: number;
    name: string;
    image: string;
}