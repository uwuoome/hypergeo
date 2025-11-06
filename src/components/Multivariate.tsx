import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import hypergeo from "@/lib/hypergeo";
import { parseDecklist, type MtgCardQty } from "@/lib/decklist";
import AddCardButton from "./AddCardButton";


interface RemoveCardButtonProps{
    name: string;
    index: number;
    onClick?: () => void;
}
function RemoveCardButton({name, index, onClick}: RemoveCardButtonProps){
    return <Button key={index} variant="outline" onClick={onClick}
                className="flex items-center justify-between w-full text-left px-4 py-2 rounded-2xl shadow-sm hover:bg-muted transition">
        {name}
    </Button>
}


function DrawChance(){
    const [resultText, setResultText] = useState<string>("");
    const [addButtons, setAddButtons] = useState<MtgCardQty[]>([]);
    const [required, setRequired] = useState<string[]>([]);

    const [byTurn, setByTurn] = useState(5);
    const [onThePlay, setOnThePlay] = useState("play");

    useEffect(() => {
        if(required.length) calculate();
    }, [required, byTurn, onThePlay]);

    function load(text: string){
        setAddButtons( parseDecklist(text) || []);
    }
    function add(data: MtgCardQty){
        setRequired([...required, data.name]);
    }
    function canAdd(data: MtgCardQty){
        return required.reduce((acc, cur) => {
            return cur == data.name? acc+1: acc;
        }, 0) >= data.qty;
    }
    function remove(index: number){
        const next = [...required];
        next.splice(index, 1);
        setRequired(next);
    }

    function deckSize(){
        return addButtons.reduce((acc, cur) => acc+cur.qty, 0);
    }

    function calculate(){
        let cardsSeen = 7 + byTurn - (onThePlay == "play"? 1: 0);
        const collapsed = required.reduce((acc: any, cur) => {
            acc[cur] = (acc[cur] != null)? acc[cur]+1: 1;
            return acc;
        }, {});

        const numbersRequired = Object.values(collapsed) as number[];
        const numbersInDeck = Object.keys(collapsed).map(k => {
            const cardQty = addButtons.find(cq => cq.name == k);
            return cardQty?.qty || 0;
        });
        console.log("combined requirements", deckSize(), numbersInDeck, numbersRequired, cardsSeen);

        const overall = hypergeo.combinedRequirements(deckSize(), numbersInDeck, numbersRequired, cardsSeen); 
        if(isNaN(overall)){
            setResultText("Cannot calculate result.");
        }else{
            setResultText(`P ${overall.toFixed(3)}`);
        }
    }

    function clear(){
        setAddButtons([]);
        setRequired([]);
        setResultText("");
    }
    //Does not work well for working out the probability of obtaining resources required other than basic lands.
    return (
    <>
    <h2 className="">Multivariate Hypergeometric Calculator for MTG</h2>   
    <div className="flex gap-4">
        <div className="flex-item w-[450px] text-left">
            <p>
                Evaluate the chance of drawing any combination of cards by a given turn. 
                Useful for finding the probability of specific combos.
                A multivariate hypergeometric calculation requires each category to be mutually exclusive of one another, 
                so this is not suitable for determining resource availability for with dual lands (one card that covers multiple categories).
                For more complex queries see monte carlo simulation. 
            </p>
            <p>
                Future implementations should also allow to check for hitting a land count threashold by creating a 
                category labelled 'other lands' containing all lands not explicitly sampled for.
            </p>
        </div>
        {addButtons.length == 0? 
        <div className="flex-item w-full pt-4">
            <Textarea placeholder="Paste decklist here." onChange={(evt) => load(evt.target.value)}></Textarea>
            <p>Copy a decklist from MTG Arena, 17Lands, or your favourite online deck builder the paste it above.</p>
        </div>
        :
        <div className="flex-item w-full">
            <div className="flex">
                <div>
                    <h3>Deck List</h3>
                    {addButtons.map(data => AddCardButton({...data, disabled: canAdd(data), onClick: add.bind(null, data)}))}
                </div>
                <div className="ml-10">
                    {required.length == 0? 
                        <p>Select cards from your deck list to add as criteria here...</p> 
                    : 
                    <div>
                        <h3>Cards To Draw</h3>
                        {required.map((name, index) => RemoveCardButton({name, index, onClick: remove.bind(null, index)}))}
                        <div className="flex">
                            <Label htmlFor="by-turn" className="mr-4">By Turn Number</Label> 
                            <Input type="number" min="1" max="50" step="1" value={byTurn} className="w-20" 
                                onChange={(evt) => setByTurn(parseInt(evt.target.value))}/>
                        </div>
                        <Select value={onThePlay} onValueChange={setOnThePlay}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="on the play?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="play">On the Play</SelectItem>
                                <SelectItem value="draw">On the Draw</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <pre className="m-4">
                            {resultText}
                        </pre>
                        
                    </div>
                    }
                    <Button variant="outline" onClick={clear}>Clear Deck</Button>
                </div>
            </div>
        </div>
        }
    </div>
    </>
    );
}

export default DrawChance;