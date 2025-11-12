import R from '@/assets/mana/R.svg?react';
import G from '@/assets/mana/G.svg?react';
import U from '@/assets/mana/U.svg?react';
import B from '@/assets/mana/B.svg?react';
import W from '@/assets/mana/W.svg?react';
import C from '@/assets/mana/C.svg?react';
import _1 from '@/assets/mana/1.svg?react';
import _2 from '@/assets/mana/2.svg?react';
import _3 from '@/assets/mana/3.svg?react';
import _4 from '@/assets/mana/4.svg?react';
import _5 from '@/assets/mana/5.svg?react';
import _6 from '@/assets/mana/6.svg?react';
import _7 from '@/assets/mana/7.svg?react';
import _8 from '@/assets/mana/8.svg?react';
import _9 from '@/assets/mana/9.svg?react';
import _10 from '@/assets/mana/10.svg?react';
import _11 from '@/assets/mana/11.svg?react';
import _12 from '@/assets/mana/12.svg?react';
import _13 from '@/assets/mana/13.svg?react';
import _14 from '@/assets/mana/14.svg?react';
import _15 from '@/assets/mana/15.svg?react';
import _16 from '@/assets/mana/16.svg?react';
import _17 from '@/assets/mana/17.svg?react';
import _18 from '@/assets/mana/18.svg?react';
import _19 from '@/assets/mana/19.svg?react';
import _20 from '@/assets/mana/20.svg?react';
import BG from '@/assets/mana/BG.svg?react';
import BR from '@/assets/mana/BR.svg?react';
import GU from '@/assets/mana/GU.svg?react';
import GW from '@/assets/mana/GW.svg?react';
import RG from '@/assets/mana/RG.svg?react';
import RW from '@/assets/mana/RW.svg?react';
import UB from '@/assets/mana/UB.svg?react';
import UR from '@/assets/mana/UR.svg?react';
import WB from '@/assets/mana/WB.svg?react';
import WU from '@/assets/mana/WU.svg?react';
import X from '@/assets/mana/X.svg?react';
import Y from '@/assets/mana/Y.svg?react';
import Z from '@/assets/mana/Z.svg?react';
// TODO: phyrexian and half mana


import { useRef } from 'react';
import { FlipHorizontal } from 'lucide-react';

const POPUP_DELAY = 800;

export type Card = {
    _id: string;
    name: string;
    oracle_text: string;
    thumb: string;
    image: string;
    crop: string;
    cmc: string;
    types: string[];
    text: string;
    colours: string[];
    colour_id: string[];
    keywords: string[]
    set: string;
    set_index: string;
    rarity: string;    
    mana_cost?: string[];
    mana_produced?: string[];
    dualSpell?: boolean;
    dualFace?: boolean;
}

export type DecklistEntryType = {
    card: Card;
    qty?: number | null;
    onClick?: () => void;
    disabled?: boolean;
    popup?: (data: DecklistEntryType | null) => void;
}

type ManaCostType = {
    cost: string[];
    className?: string;
}; 

function ManaCost(props: ManaCostType){
    return (
        <div className={props.className || "inline-block mr-1 mt-1"}>
            {props.cost.map((pt, i) => {
                const Icon = lookupManaIcon(pt);
                if(Icon == null) return pt;
                return <Icon key={i} className="w-4 h-4 float-end" />
            })}
        </div>
    );   
}


function lookupManaIcon(token: string): any {
    const manaIconMap: { [key: string]: any } = {
        'R': R, 'G': G, 'U': U, 'B': B, 'W': W, 'C': C,
        '1': _1, '2': _2, '3': _3, '4': _4, '5': _5,
        '6': _6, '7': _7, '8': _8, '9': _9, '10': _10,
        '11': _11, '12': _12, '13': _13, '14': _14, '15': _15,
        'B/G': BG, 'B/R': BR, 'G/U': GU, 'G/W': GW, 'R/G': RG,
        'R/W': RW, 'U/B': UB, 'U/R': UR, 'W/B': WB, 'W/U': WU,
        'X': X, 'Y': Y, 'Z': Z,
    };
    return manaIconMap[token];
}

function DecklistEntry(props: DecklistEntryType){
    const timerRef = useRef<number| null>(null);
    const revealCard = () => {
        timerRef.current = setTimeout(() => {
            props.popup && props.popup(props);
        }, POPUP_DELAY);
    };
    const hideCard = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        props.popup && props.popup(null);
    };
    const onClick = () => {
        hideCard();
        if(props.disabled  || !props.onClick) return;
        props.onClick();
    }
    // TODO: For dual faced cards add flip action and make sure mana cost is present in data. 
    const card = props.card;
    const name = card.dualSpell? card.name.split("/")[0] : card.name;
    return (
    <div onMouseOver={revealCard} onMouseOut={hideCard} onClick={onClick}
            className={`relative border bg-gray-100 select-none cursor-pointer text-sm w-60 p-0.5`}>
        <div className="flex pointer-events-none text-nowrap">
            {card.mana_cost && <ManaCost cost={card.mana_cost} className="flex-item mt-0.5 mr-0.5" />}
            <div className={`flex-item card-title mt-0.5 ${props.disabled? "text-gray-400": ""}`}>{name}</div>
            {card.dualFace && <FlipHorizontal className="w-4 h-4 ml-1 mt-0.5" />}
            {props.qty && <div className="inline-block ml-auto font-bold">&times;{props.qty}</div>}
        </div>
    </div>
    );
}

export default DecklistEntry;