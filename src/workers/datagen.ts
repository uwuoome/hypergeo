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

export type GameRequirements ={
    cards: string[];
    totalMana: number;
    colours: string[];
}

    
function hasRequiredColours(available: string[][], required: string[]){
    const avail = [...available]; 
    return required.every(rc =>{
        const foundIndex = avail.findIndex(a => a.find(b => b == rc));
        if(foundIndex == -1) return false;
        avail.splice(foundIndex, 1);    // remove the found colour source from the array so that it cant be used again
        return true;
    });
}

// true if meets colour and generic mana requirement
function canCast(cost: string[], available: string[][]){
    const genericCost = cost[0] == "X"? 0: parseInt(cost[0]); // TODO: this wont handle X2G,  or XXRR costs
    const hasColours = (cost: string[]) => hasRequiredColours(available, cost); 
    const hasGeneric = () => available.length - (cost.length-1)  >= genericCost;
    if(isNaN(genericCost)) return hasColours(cost);
    return hasColours(cost.slice(1)) && hasGeneric();
}

function gamesim(cards: Card[], draws: number[], cardsSeen: number, constraints: GameRequirements): boolean{
    const gameColoursAvailable: string[][] = [];
    const numDraws = Math.min(cardsSeen, draws.length);
    let totalManaAvailable = 0;
    
    // first we get all the mana produced by lands or 0 cost spells
    for(let i=0; i<numDraws; i++){
        let cardDrawn: Card = cards[ draws[i] ];
        if(cardDrawn.mana_produced){
            let manaCost = cardDrawn?.mana_cost;
            if(!manaCost?.length || !manaCost[0] ){   // if there is nop mana cost or the value is 0
                gameColoursAvailable.push(cardDrawn.mana_produced);
                totalManaAvailable += 1; // add one for now,  but some sources add multple mana
            }
        }
    }
    // now we go over it again checking for spells we can play that produce mana
    const manaRocks = draws.slice(0, numDraws).filter((draw) => {
        const cardDrawn: Card = cards[ draw ];
        const manaCost = cardDrawn?.mana_cost;
        return cardDrawn.mana_produced && manaCost && manaCost[0];
    });
    // if we have the mana to cast it using our lands, then we add it to the pool.
    // this isn't a perfect solution as one rock could enable casting another
    // this also assumes that any rock can produce the mana, when some only do so conditionally
    for(let i=0; i<manaRocks.length; i++){
        const rock = cards[ manaRocks[i] ];
        if(canCast(rock.mana_cost!, gameColoursAvailable)){
            gameColoursAvailable.push(rock.mana_produced!);
            totalManaAvailable += 1;
        }
    }
    // TODO: instead of true / false could return turn number conditions are met by
    const drawCardIds = draws.slice(0, numDraws).map(drawIndex => cards[drawIndex]._id);
    const hasSpecificCards = (cardIds: string[], requiredIds: string[]) => requiredIds.every(rid => cardIds.includes(rid));
    return totalManaAvailable >= constraints.totalMana && 
        hasRequiredColours(gameColoursAvailable, constraints.colours) &&
        hasSpecificCards(drawCardIds, constraints.cards);
}

function querySimulations(cards: Card[], cardsSeen: number, constraints: GameRequirements){//requiredCards: string[], colours: string[], totalMana: number){
    const simCount = simulation.length / simSize;
    const criterionMet = Array(simCount).fill(null);         // for each game we log if all criteria were met
    
    for(let s=0; s<simCount; s++){
        let gameDraws = simulation.slice(s*simSize, s*simSize+simSize);
        criterionMet[s] = gamesim(cards, gameDraws, cardsSeen, constraints);
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
        const result = querySimulations(data.cards, data.draws, data.constraints);//data.requiredCards, data.colours, data.totalMana);
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
    console.error("Worker CRASHED", error); 
};
