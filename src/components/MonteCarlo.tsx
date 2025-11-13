import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Textarea } from "./ui/textarea";
import { parseDecklist } from "@/lib/decklist";
import DecklistEntry, { type Card, type DecklistEntryType} from './DecklistEntry';
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CircleX, Play, Search, Trash2 } from "lucide-react";
import { Spinner } from "./ui/spinner";
//import { chunk } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CriteriaSet from "./CriteriaSet";

 
const DATA_URI = "/api/cards";
const TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

type SimulationResult = {
    length: number;
    maxDrawsPerGame: number;
}

function MonteCarlo(){
    const title = "Monte Carlo Draw Simulator for MTG";
    const simulation = useRef<SimulationResult>({length: 0, maxDrawsPerGame: 0});
    const workerRef = useRef<Worker | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    const [iterations, setIterations] = useState<number>(500);
    const [sample, setSample] = useState<number>(20);
    const [deckList, setDeckList] = useState<DecklistEntryType[]>([]);

    const [byTurn, setByTurn] = useState<number>(1);
    const [onThePlay, setOnThePlay] = useState<string>("play");

    const [cardsRequired, setCardsRequired] = useState<DecklistEntryType[][]>([[]]);
    const [coloursRequired, setColoursRequired] = useState<string[][]>([[]]);
    const [manaRequired, setManaRequired] = useState<number[]>([0]);
    
    const [cardPopup, setCardPopup] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>("");

    const [queryProgress, setQueryProgress] = useState<number | null>(null);
    const [result, setResult] = useState<string>("");

    async function loadDeckList(text: string){
        const list = parseDecklist(text);
        const names = list.map(li => li.name);
        const response = await fetch(DATA_URI, {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({names})
        });
        const data = await response.json();
        // console.log("Fetched card data", data.map(c => c.name));
        const mergedData = list.map(li => {
            const dataItem = data.find((di: Card) => di.name == li.name);
            if(! dataItem){
                const dualSpell = data.find((di: Card) => di.name.match(`^${li.name}.*$`));
                if(! dualSpell){
                    return {card: {name: "N/A"}, qty: li.qty};
                }
                return {
                    card: {...dualSpell, dualSpell: true, dualFace: Array.isArray(dualSpell.thumb) },
                    qty: li.qty
                };
            }
            return {card: dataItem, qty: li.qty};
        });
        setDeckList(mergedData);
    }
    async function runSimulation(){
        if(progress != null || workerRef.current == null) return; 
        if(simComplete()){
            if(! confirm("Rerun simulation and lose current dataset?")) return; 
        }
        simReset();
        setProgress(1);
        console.log("generating dataset");
        workerRef.current.postMessage({action: "generate", iterations: iterations*1000, sample, deckList: deckList});
    }
    function clearData(){
        if(simComplete()){
            if(! confirm("Clear deck and generated simulation data?")) return;
            simReset();
            workerRef.current?.postMessage({action: "clear", iterations: iterations*1000, sample, deckList: deckList});
        }
        loadDeckList("");
    }

    const simReset = () => {
        simulation.current = {length: 0, maxDrawsPerGame: 0};
    }
    const simComplete = () => simulation.current?.length > 0;

    function canAddCard(data: DecklistEntryType){
        if(data.qty == null) return false;
        return cardsRequired[0].reduce((acc, cur) => {
            return cur.card._id == data.card._id? acc+1: acc;
        }, 0) >= data.qty;
    } 
    function addCardRequirement(data: DecklistEntryType){
        if(! simComplete()) return;
        const alreadyAdded = cardsRequired[0].reduce((acc, cur) => {
            return cur.card._id == data.card._id? acc+1: acc;
        }, 0);
        if(data.qty == null || alreadyAdded >= data.qty) return;
        const toAdd = {...data, qty: null};
        setCardsRequired(prev => {
            const result = [...prev];
            const updatedInnerArray = [...result[0], toAdd]; // need to copy inner array to be idempotent
            result[0] = updatedInnerArray;
            return result;
        });
    }
    function showCardData(data: DecklistEntryType | null){
        if(data == null){
            setCardPopup(null);
            setDebugInfo("");
        }else{
            setCardPopup(data.card.image);
            setDebugInfo([
                `Colours: ${data.card.colours.join(", ")}`,
                `CMC: ${data.card.cmc}`,
                `Types: ${data.card.types}`,
                `Keywords: ${data.card.keywords.join(", ")}`,
                `Mana Cost: ${data.card.mana_cost || 0}`,
                `Mana Produced: ${data.card.mana_produced || "None"}`,
                `Rarity: ${data.card.rarity}`,
                `${data.card.dualFace? "Dual Faced": data.card.dualSpell? "Dual Spell": ""}`,
            ].join("\n"));
        }
    }

    function changeTurnLimitRequirement(evt: ChangeEvent<HTMLInputElement>){
        const turnLimit = parseInt(evt.target.value);
        const lastTurnInSample = simulation.current?.maxDrawsPerGame-6;
        if(turnLimit >= lastTurnInSample){
            setOnThePlay("play"); 
            setByTurn(lastTurnInSample);
        }else{
            setByTurn(turnLimit);
        }
    }
    function removeCardRequirement(setIndex: number, cardIndex: number){
        setCardsRequired(prev => {
            const result = [...prev];
            result[setIndex] = result[setIndex].filter((_, i) => i != cardIndex);
            return result;
        });
    }
    function updateCriteria(coloursRequired: string[], manaRequired: number){
        setColoursRequired([coloursRequired]);
        setManaRequired([manaRequired]);
    }
    function newCriteriaSet(){
        setCardsRequired(prev => [...prev, []]);
        setColoursRequired(prev => [...prev, []]);
        setManaRequired(prev => [...prev, 0]);
    }
    function removeCriteriaSet(){
        setCardsRequired(prev => prev.slice(0, prev.length-1));
        setColoursRequired(prev => prev.slice(0, prev.length-1));
        setManaRequired(prev =>  prev.slice(0, prev.length-1));
    }

    function query(){
        if(workerRef.current == null || queryProgress != null) return;
        setQueryProgress(1);
        setResult("Querying....");
        workerRef.current.postMessage({
            action: "query", 
            cards: deckList.map(li => li.card),
            draws: 6 + byTurn + (onThePlay? 0: 1),
            constraints: { 
                cards: cardsRequired[0].map(entry => entry.card._id), 
                colours: coloursRequired[0], 
                totalMana: manaRequired[0]
            }
        });
    }

    useEffect(() => {
        const workerURL = new URL('@/workers/datagen.ts', import.meta.url);
        workerRef.current = new Worker(workerURL, {
            type: "module",
        });
        workerRef.current.onmessage = (event: any) => {
            const { status, result, elapsed, message } = event.data;
            if(status == "generate-complete"){
                simulation.current = result;
                console.log("Dataset of", result.length, "elements generated in ", elapsed, "millisecs");
                setProgress(null);
            }else if(status == "query-complete"){
                setQueryProgress(null);
                setResult(result.p.toFixed(3));
            }else if(message){
                alert(message);
            }
        };
        workerRef.current.onerror = (error) => {
            console.error("Worker error:", error); 
        };
        return () => {
            if(workerRef.current == null) return;
            workerRef.current.terminate();
            workerRef.current.onmessage = null;
            workerRef.current.onerror = null;
            workerRef.current = null;
        };
    }, []);

    if(deckList.length == 0){
        return (
        <>
        <h2 className="">{title}</h2> 
        <div className="flex w-full">   
            <div className="w-100 mr-4">
                <Textarea placeholder="Paste decklist here." onChange={(evt) => loadDeckList(evt.target.value)}></Textarea>
            </div>
            <div className="text-left">
                Simulate thousands of games then query the results to guage the probability of events.
                <ol>
                    <li>Step 1: Paste your deck.</li>
                    <li>Step 2: Run a simulation.</li>
                    <li>Step 3: Apply constraints to the resulting data.</li>
                </ol>
            </div>
        </div>
        </>
        );
    }

    return (
    <>
    <img src={cardPopup || TRANSPARENT_PIXEL_SRC} style={{top: (window.scrollY+100)+"px"}}
            className={
            `absolute left-10 z-100 w-60 h-80 transition-opacity duration-300 delay-0 bg-black
            ${cardPopup ? "opacity-100" : "opacity-0 pointer-events-none"}`}/>
    {debugInfo && <pre style={{top: (window.scrollY+500)+"px"}}
        className="absolute left-10 w-60 text-left text-xs bg-gray-200 p-2 border-gray-400">{debugInfo}</pre>}
    <h2 className="">{title}</h2> 
    <div className="flex">
        
        <div className="mr-6">
            <h3>Deck List</h3>
            <ul className="text-left">
                {deckList.map((d: DecklistEntryType, i) => 
                    <DecklistEntry {...d} key={i} disabled={canAddCard(d)} popup={showCardData} /*setCardPopup showCardData.bind(null, d)*/
                        onClick={addCardRequirement.bind(null, d)}  /> 
                )}
            </ul>
        </div>


        <div className="flex-item w-full">
            <div className={`flex-item w-[450px] p-2 text-left ${simComplete()? "border": ""}`}>
                <p>Step 2: <b>Simulate</b> thousands of games played.</p>
                <div className="flex gap-4 mb-2">
                    <Label htmlFor="iterations" className="w-20">Iterations </Label>
                    <Input id="iterations" className="w-30" type="number" min="1" max="1000" step="1" 
                            value={iterations} onChange={(evt) => setIterations(parseInt(evt.target.value))} />
                    <code className="mt-1">x1000</code> 

                    {progress != null?
                    <Button variant="destructive" className="w-30 text-sm ml-auto" onClick={() => setProgress(null)}>
                        <CircleX /> Stop
                    </Button>
                    :
                    <Button variant="destructive" className="w-30 text-sm ml-auto" onClick={clearData}>
                        <Trash2 /> {!simComplete()? "Clear Deck": "Clear Data"}
                    </Button>
                    }
                </div>
                <div className="flex gap-4">
                    <Label htmlFor="sample-size" className="w-20">
                        Sample 
                    </Label>
                    <Input id="sample-size" className="w-30"  type="number" min="7" max="30" step="1"
                        value={sample} onChange={(evt) => setSample(parseInt(evt.target.value))} />
                    <span className="text-sm text-gray-400 font-normal text-nowrap">(cards seen)</span>
                    <Button variant="outline" className="w-30 ml-auto" onClick={runSimulation} disabled={progress != null}>
                        {progress != null? <Spinner />: <Play />} {!simComplete()? "Run": "Rerun"}
                    </Button>
                </div>
                <div className="flex m-4">
                    {simComplete()? `Data for ${simulation.current.length} draws has been generated.`: ""}
                </div>
            </div>

            {simComplete() && 
            <div className="block mt-4 p-2 w-[450px]">

                <p className="text-left">Step 3: Impose <b>Constraints</b> to query the data.</p>
                <div className="flex my-1">
                    <Label htmlFor="by-turn" className="mr-4">By Turn:</Label> 
                    <Input type="number" min="1" max={simulation.current.maxDrawsPerGame-6} step="1" value={byTurn} className="w-20" 
                        onChange={changeTurnLimitRequirement}/>
                    <span className="m-1">on the</span>
                    <Select value={onThePlay} onValueChange={setOnThePlay} disabled={byTurn >= simulation.current.maxDrawsPerGame-6}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="on the play?" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="play">Play</SelectItem>
                            <SelectItem value="draw">Draw</SelectItem>
                        </SelectContent>
                    </Select>      
                </div>
                
                {cardsRequired.map((_, i) => 
                    <CriteriaSet index={i} key={i} showCardData={showCardData} onUpdate={updateCriteria} 
                            cardsRequired={cardsRequired[i]} removeCardRequirement={removeCardRequirement} />
                )}

                <div className="flex my-2 text-center text-bold">
                {cardsRequired.length > 1 && 
                    <Button variant="destructive" onClick={removeCriteriaSet}>Remove Last Constraint Set</Button>
                }
                    <Button variant="outline" className="ml-auto" onClick={newCriteriaSet}>Add Constraint Set</Button>
                </div>
                <div className="flex my-2 text-center text-bold"> 
                    {result} 
                    <Button variant="outline" className="ml-auto" onClick={query}><Search /> Search</Button>
                </div>
            </div>
            }
        </div>
    </div>
    </>
    );
}

export default MonteCarlo;