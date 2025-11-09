import { useEffect, useRef, useState } from "react";
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
import ManaPicker from "./ManaPicker";

 
const DATA_URI = "/api/cards"

function MonteCarlo(){
    const title = "Monte Carlo Draw Simulator for MTG";
    const simulation = useRef<number[]>([]);
    const workerRef = useRef<Worker | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    const [iterations, setIterations] = useState<number>(1);
    const [sample, setSample] = useState<number>(7);
    const [deckList, setDeckList] = useState<DecklistEntryType[]>([]);

    const [byTurn, setByTurn] = useState<number>(5);
    const [onThePlay, setOnThePlay] = useState<string>("play");

    const [cardsRequired, setCardsRequired] = useState<Card[]>([]);
    const [coloursRequired, setColoursRequired] = useState<string[]>([]);
    const [manaRequired, setManaRequired] = useState<number>(0);

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
                    return {name: "N/A", qty: li.qty};
                }
                return {...dualSpell, qty: li.qty, dualSpell: true, dualFace: Array.isArray(dualSpell.thumb)};
            }
            return {...dataItem, qty: li.qty};
        });
        setDeckList(mergedData);
    }
    async function runSimulation(){
        if(progress != null || workerRef.current == null) return; 
        if(simulation.current.length > 0){
            if(! confirm("Rerun simulation and lose current dataset?")) return; 
        }
        simulation.current = [];
        setProgress(1);
        console.log("generating dataset");
        workerRef.current.postMessage({action: "generate", iterations: iterations*1000, sample, deckList: deckList});
    }
    function clearData(){
        if(simulation.current.length > 0){
            if(! confirm("Clear deck and generated simulation data?")) return;
        }
        loadDeckList("");
        simulation.current = [];
    }

    const simComplete = () => simulation.current.length > 0;

    function canAddCard(data: DecklistEntryType){
        if(data.qty == null) return false;
        return cardsRequired.reduce((acc, cur) => {
            return cur._id == data._id? acc+1: acc;
        }, 0) >= data.qty;
    } 
    function addCardRequirement(data: DecklistEntryType){
        if(! simComplete()) return;
        console.log(data);
        const alreadyAdded = cardsRequired.reduce((acc, cur) => {
            return cur._id == data._id? acc+1: acc;
        }, 0);
        if(data.qty == null || alreadyAdded >= data.qty) return;
        const toAdd = {...data, qty: null};
        setCardsRequired(prev => [...prev,  toAdd]);
    }

    function removeCardRequirement(index: number){
        setCardsRequired(prev => prev.filter((_, i) => i != index));
    }


    function colourRequirementsUpdated(val: string[]){
        setColoursRequired(val);
        if(val.length > manaRequired){
            setManaRequired(val.length);
        }
    }  
    function manaRequirementsUpdated(evt: any){
        setManaRequired(Math.floor(Math.min(Math.max(coloursRequired.length, evt.target.value), 20))    );
    }

    useEffect(() => {
        const workerURL = new URL('@/workers/datagen.ts', import.meta.url);
        workerRef.current = new Worker(workerURL, {
            type: "module",
        });
        workerRef.current.onmessage = (event: any) => {
            const { status, data, elapsed, message } = event.data;
            if(status == "complete"){
                simulation.current = data;
                console.log("Dataset of", data.length, "elements generated in ", elapsed, "millisecs");
                setProgress(null);
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
    <h2 className="">{title}</h2> 
    <div className="flex">
        
        <div className="mr-6">
            <h3>Deck List</h3>
            <ul className="text-left">
                {deckList.map((d: DecklistEntryType, i) => 
                    <DecklistEntry {...d} key={i} disabled={canAddCard(d)} onClick={addCardRequirement.bind(null, d)} /> 
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
                        <Trash2 /> {simulation.current.length == 0? "Clear Deck": "Clear Data"}
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
                    {simComplete()? `Data for ${simulation.current.length} games has been generated.`: ""}
                </div>
            </div>

            {simulation.current.length > 0 && 
            <div className="block mt-4 p-2 w-[450px]">
                <p className="text-left">Step 3: Impose <b>Constraints</b> to query the data.</p>
                <div className="flex my-1">
                    <Label htmlFor="by-turn" className="mr-4">By Turn:</Label> 
                    <Input type="number" min="1" max="50" step="1" value={byTurn} className="w-20" 
                        onChange={(evt) => setByTurn(parseInt(evt.target.value))}/>
                    <span className="m-1">on the</span>
                    <Select value={onThePlay} onValueChange={setOnThePlay}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="on the play?" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="play">Play</SelectItem>
                            <SelectItem value="draw">Draw</SelectItem>
                        </SelectContent>
                    </Select>      
                </div>

                <div className="flex my-2">
                    <div className="text-left mr-2">Specific Cards Seen: </div>
                    <div>
                        {cardsRequired.length > 0 && cardsRequired.map((d, i) => 
                            <DecklistEntry {...d} key={i}  onClick={removeCardRequirement.bind(null, i)} />
                        ) || <span>None Required</span>}
                    </div>
                </div>
                <div className="flex my-2">
                    <ManaPicker title="Colour Sources Required:" onChange={colourRequirementsUpdated} /> 
                </div>
                <div className="flex my-2"> 
                    <span className="text-left my-1 mr-2">Total Mana Required: </span>
                    <Input type="number" min={coloursRequired.length} max="20" value={manaRequired} 
                        onChange={manaRequirementsUpdated} className="w-20" />
                    <Button variant="outline" className="ml-auto"><Search /> Search</Button>
                </div>
            </div>
            }
        </div>
    </div>
    </>
    );
}

export default MonteCarlo;