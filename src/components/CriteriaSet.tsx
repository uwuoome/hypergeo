import { useEffect, useState } from "react";
import DecklistEntry, { type DecklistEntryType } from "./DecklistEntry";
import ManaPicker from "./ManaPicker";
import { Input } from "./ui/input";



type CriteriaSetType = {
    index: number;
    onUpdate: (coloursRequired: string[], manaRequired: number) => void;
    showCardData: (data: DecklistEntryType | null) => void;
    cardsRequired: DecklistEntryType[];
    coloursRequired: string [];
    manaRequired: number;
    removeCardRequirement: (setIndex: number, cardIndex: number) => void;
};  

function CriteriaSet({index, showCardData, onUpdate, cardsRequired, coloursRequired, manaRequired, removeCardRequirement}: CriteriaSetType){

    const [coloursRequired2, setColoursRequired2] = useState<string[]>(coloursRequired);
    const [manaRequired2, setManaRequired2] = useState<number>(manaRequired || 0);

    function colourRequirementsUpdated(val: string[]){
        setColoursRequired2(val);
        if(val.length > manaRequired){
            setManaRequired2(val.length);
        }
    }  
    function manaRequirementsUpdated(evt: any){
        console.log("mana requirements", evt.target.value)
        setManaRequired2(Math.floor(Math.min(Math.max(coloursRequired2.length, evt.target.value), 20))    );
    }    

    useEffect(() => {
        onUpdate(coloursRequired2, manaRequired2);
    }, [coloursRequired2, manaRequired2]);

    return  (<>
    {index > 0 && <div className="float-end p-1 mr-2 border-2 border-gray-200 text-lg bg-white font-bold" style={{marginTop: "-20px"}}>OR</div>}
    <div className="border border-gray-200 p-2">
        
        <div className="flex mb-2">
            <div className="text-left mr-2">Specific Cards Seen: </div>
            <div>
                {cardsRequired.length > 0 && cardsRequired.map((d, i) => 
                    <DecklistEntry {...d} key={i} popup={showCardData}  onClick={removeCardRequirement.bind(null, index, i)} />
                ) || <span>None Required</span>}
            </div>
        </div>
        <div className="flex my-2">
            <ManaPicker title="Colour Sources Required:" colours={coloursRequired} onChange={colourRequirementsUpdated} /> 
        </div>
        <div className="flex"> 
            <span className="text-left my-1 mr-2">Total Mana Required: </span>
            <Input type="number" min={coloursRequired2.length || 0} max="20" value={manaRequired2} 
                onChange={manaRequirementsUpdated} className="w-20" />
        </div>
    </div>
    </>);
}

export default CriteriaSet;