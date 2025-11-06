
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
    const baseDeck = indexedCards.map(cq => Array(cq.qty).fill(null).map(_ => cq.index)).flat();

    const simulation = Array(size).fill(0);

    for(let i=0; i<iterations; i++){
        let start = i * cardsSeen;
        let deck = shuffle(baseDeck);
        for(let d=0; d<cardsSeen; d++){
            simulation[start+d] = deck[d];
        }
    }
    return simulation;
}

function onMessage(event: MessageEvent) {
    const data = event.data;
    if(data.action == "generate"){
        const startTime = Date.now();
        const draws = simulateDraws(data.iterations, data.sample, data.deckList);
        const elapsed = Date.now() - startTime;
        self.postMessage({
            status: 'complete',
            data: draws,
            elapsed
        });
    }
    /*else{
        self.postMessage({
            status: 'error',
            message: `Unknown action ${data.action}.`
        });        
    }*/
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