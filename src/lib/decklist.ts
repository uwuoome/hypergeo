

export type MtgCardQty = {
    name: string;
    qty: number;
    id: string; 
}

export function parseDecklist(deckText: string): MtgCardQty[] {
    const deck = [];
    const lines = deckText.split(/\r?\n/);
    for(let i=0; i<lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (/^Sideboard/i.test(trimmed)) break;
        // try match decklist with set and set indices
        const match = trimmed.match(/^(\d+)\s+(.+)\s+\(([A-Z0-9]{3})\)\s+(\d+)$/);
        if (match) {
            const qty = parseInt(match[1], 10);
            const name = match[2].trim();
            const id = match[3]+match[4];
            deck.push({ name, qty, id});
            continue;
        }
        // otherwise match decklist without set ID using line number as id.
        const match2 = trimmed.match(/^(\d+)\s+(.+)$/);
        if(match2){
            const qty = parseInt(match2[1], 10);
            const name = match2[2].trim();
            const id = ""+i;
            deck.push({name, qty, id});
            continue;
        }
    }
    return deck;
}