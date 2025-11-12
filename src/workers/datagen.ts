import type { Card } from "@/components/DecklistEntry";

let simulation: number[] = [];
let simSize = 0;

function shuffle(array: number[]) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}


function simulateDraws(iterations: number, cardsSeen: number, indexedCards: any[]) {
    if(iterations < 100 || iterations > 10000000) return [];
    if(cardsSeen < 1 || cardsSeen > 30) return [];
    if(indexedCards.length == 0) return [];

    const size = Math.floor(iterations) * Math.floor(cardsSeen);
    const baseDeck = indexedCards.map((cq, i) => 
        Array(cq.qty).fill(null).map(_ => i)
    ).flat();

    simSize = cardsSeen;
    simulation = Array(size).fill(0);

    for(let i=0; i<iterations; i++){
        let start = i * cardsSeen;
        let deck = shuffle(baseDeck);
        for(let d=0; d<cardsSeen; d++){
            simulation[start+d] = deck[d];
        }
    }
    return { // don't provide direct access to the array
        length: simulation.length,
        maxDrawsPerGame: cardsSeen
    };
}


function querySimulations(cards: Card[], cardsSeen: number, requiredCards: string[], colours: string[], totalMana: number){
    const simCount = simulation.length / simSize;
    const criterionMet = Array(simCount).fill(null);         // for each game we log if all criteria were met
    
    function hasRequiredColours(available: string[][], required: string[]){
        return required.every(rc =>{
            const foundIndex = available.findIndex(a => a.find(b => b == rc));
            if(foundIndex == -1) return false;
            available.splice(foundIndex, 1);    // remove the found colour source from the array so that it cant be used again
            return true;
        });
    }

    
    function gamesim(draws: number[]): boolean{
        const gameColoursAvailable: string[][] = [];
        const numDraws = Math.min(cardsSeen, draws.length);
        let totalManaAvailable = 0;
        for(let i=0; i<numDraws; i++){
            let cardDrawn: Card = cards[ draws[i] ];
            if(cardDrawn.mana_produced){
                gameColoursAvailable.push(cardDrawn.mana_produced);
                // mana_produced gives the colour produced but not the number of mana, unless we parse the oracle text.
                totalManaAvailable += 1; // add one for now,  but some sources add multple mana
            }
        }
        // IGNORING REQUIRED CARDS FOR NOW
        // TODO: instead of true / false could return turn number conditions are met by
        return totalManaAvailable >= totalMana && hasRequiredColours(gameColoursAvailable, colours);// check all requoiirements met
    }

    for(let s=0; s<simCount; s++){
        let gameDraws = simulation.slice(s*simSize, s*simSize+simSize);
        criterionMet[s] = gamesim(gameDraws);
    }

    const successes = criterionMet.reduce((acc, success) => success? acc+1: acc, 0);
    return {successes, p: (1.0 / simCount * successes)};
}

function onMessage(event: MessageEvent) {
    const data = event.data;
    if(data.action == "generate"){
        const startTime = Date.now();
        const draws = simulateDraws(data.iterations, data.sample, data.deckList);
        const elapsed = Date.now() - startTime;
        self.postMessage({
            status: 'generate-complete',
            result: draws,
            elapsed
        });
    }else if(data.action == "query"){
        const startTime = Date.now();
        const result = querySimulations(data.cards, data.draws, data.requiredCards, data.colours, data.totalMana);
        const elapsed = Date.now() - startTime;
        self.postMessage({
            status: 'query-complete',
            result: result,
            elapsed
        });
    }else if(data.action == "clear"){
        simulation = [];
        simSize = 0;
        self.postMessage({
            status: 'clear-complete',
            message: `Simulation data cleared.`
        });              
    }else{
        self.postMessage({
            status: 'error',
            message: `Unknown action ${data.action}.`
        });        
    }
}

self.onmessage = onMessage;
self.onerror = (error) => {
    // This is your lifeline! If it logs, the worker crashed immediately 
    // after the script was loaded/parsed.
    console.error("Worker CRASHED on startup:", error); 
};
/*
self.onmessage = function(event) {
    console.log("Message received in worker.");
    self.postMessage({ status: 'test_ok' });
};*/