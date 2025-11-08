import { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { parseDecklist } from "@/lib/decklist";
import DecklistEntry, { type Card, type DecklistEntryType} from './DecklistEntry';
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CircleX, Play, Trash2 } from "lucide-react";
import { Spinner } from "./ui/spinner";
//import { chunk } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RMana from '@/assets/mana/R.svg?react';
import GMana from '@/assets/mana/G.svg?react';
import UMana from '@/assets/mana/U.svg?react';
import BMana from '@/assets/mana/B.svg?react';
import WMana from '@/assets/mana/W.svg?react';
import CMana from '@/assets/mana/C.svg?react';
 
const DATA_URI = "/api/cards"


function MonteCarlo(){
    const simulation = useRef<number[] | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    const [iterations, setIterations] = useState<number>(1);
    const [sample, setSample] = useState<number>(7);
    const [deckList, setDeckList] = useState<DecklistEntryType[]>([]);

    const [byTurn, setByTurn] = useState<number>(5);
    const [onThePlay, setOnThePlay] = useState<string>("play");

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
        if(simulation.current != null){
            if(! confirm("Rerun simulation and lose current dataset?")) return; 
        }
        setProgress(1);
        console.log("generating dataset");
        workerRef.current.postMessage({action: "generate", iterations: iterations*1000, sample, deckList: deckList});
    }
    function clearData(){
        if(simulation.current != null){
            if(! confirm("Clear deck and generated simulation data?")) return;
        }
        loadDeckList("");
        simulation.current = [];
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

    return (
    <>
    <h2 className="">Monte Carlo Draw Simulator for MTG</h2>   
    <div className="flex gap-4">
        <div className="flex-item w-[450px] text-left">
            <p>
                Simulate thousands of games then query the results to guage the probability of events.
            </p>
            <div className="flex gap-4 mb-2">
                <Label htmlFor="iterations" className="w-20">Iterations </Label>
                <Input id="iterations" className="w-30" type="number" min="1" max="1000" step="1" 
                        value={iterations} onChange={(evt) => setIterations(parseInt(evt.target.value))} />
                <code className="mt-1">x1000</code> 
            </div>
            <div className="flex gap-4">
                <Label htmlFor="sample-size" className="w-20">
                    Sample 
                </Label>
                <Input id="sample-size" className="w-30"  type="number" min="7" max="30" step="1"
                    value={sample} onChange={(evt) => setSample(parseInt(evt.target.value))} />
                <span className="text-sm text-gray-400 font-normal text-nowrap">(cards seen)</span>
            </div>
            {deckList.length > 0 &&
            <div className="flex gap-4 mt-10">
                <Button variant="outline" className="w-30" onClick={runSimulation} disabled={progress != null}>
                    {progress != null? <Spinner />: <Play />} {simulation.current == null? "Run": "Rerun"}
                </Button>
                {progress != null?
                <Button variant="destructive" className="w-30 text-sm" onClick={() => setProgress(null)}>
                    <CircleX /> Stop
                </Button>
                :
                <Button variant="destructive" className="w-30 text-sm" onClick={clearData}>
                    <Trash2 /> {simulation.current == null? "Clear Deck": "Clear Data"}
                </Button>
                }
            </div>}
        </div>
        {deckList.length == 0? 
        <div className="flex-item w-full pt-4">
            <Textarea placeholder="Paste decklist here." onChange={(evt) => loadDeckList(evt.target.value)}></Textarea>
        </div>
        :
        <div className="flex-item w-full">
            <div className="flex">
                <div>
                    <h3>Deck List</h3>
                    <ul className="text-left">
                        {deckList.map((d: DecklistEntryType, i) => 
                            <DecklistEntry {...d} key={i} /> 
                        )}
                    </ul>
                </div>
                <div className="ml-4 w-70">
                    <h3>Constraints</h3>
                    <div className="flex">
                        <Label htmlFor="by-turn" className="mr-4">By Turn:</Label> 
                        <Input type="number" min="1" max="50" step="1" value={byTurn} className="w-20" 
                            onChange={(evt) => setByTurn(parseInt(evt.target.value))}/>
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
                   
                    <h4 className="text-left">Specific Cards Seen: None</h4>
                    <div>
                        
                    </div>
                    <h4 className="text-left">Colour Sources Available: None</h4>
                    <div>
                        <div className="flex h-6 gap-2">
                            <span>Add: </span>
                            <WMana className="cursor-pointer" />
                            <GMana className="cursor-pointer" />
                            <RMana className="cursor-pointer" />
                            <BMana className="cursor-pointer" />
                            <UMana className="cursor-pointer" />
                            <CMana className="cursor-pointer" />
                        </div>
                    </div>
                    <h4 className="text-left">Total Mana Available: None</h4>
                    <div>
                        <div className="flex h-6 gap-2">
                            <span>Add: </span>
                            <WMana className="cursor-pointer" />
                            <GMana className="cursor-pointer" />
                            <RMana className="cursor-pointer" />
                            <BMana className="cursor-pointer" />
                            <UMana className="cursor-pointer" />
                            <CMana className="cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        }
    </div>
    </>
    );
}

export default MonteCarlo;