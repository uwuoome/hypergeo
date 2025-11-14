import { useEffect, useState } from 'react';
import RMana from '@/assets/mana/R.svg?react';
import GMana from '@/assets/mana/G.svg?react';
import UMana from '@/assets/mana/U.svg?react';
import BMana from '@/assets/mana/B.svg?react';
import WMana from '@/assets/mana/W.svg?react';
import CMana from '@/assets/mana/C.svg?react';


type ManaPickerType = {
    title: string;
    onChange?: (values: string[]) => void;
}


function ManaPicker(props: ManaPickerType){
    const [selected, setSelected] = useState<string[]>([]);
    function add(colour: string){
        if(selected.length > 12) return;
        setSelected([...selected, colour]);
    }
    function remove(index: number){
        setSelected(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    }
    function getSymbol(colour: string, index: number){
        const base = "cursor-pointer border border-gray-200 w-7 h-7 rounded-3xl hover:border-2 mr-1 mb-2";
        const lookup: Record<string, any> = {
            "W": <WMana key={index}className={`${base} hover:border-yellow-200`} onClick={remove.bind(null, index)} />,
            "G": <GMana key={index} className={`${base} hover:border-green-800`} onClick={remove.bind(null, index)} />,
            "R": <RMana key={index} className={`${base} hover:border-red-400`} onClick={remove.bind(null, index)} />,
            "B": <BMana key={index} className={`${base} hover:border-gray-500`} onClick={remove.bind(null, index)} />,
            "U": <UMana key={index} className={`${base} hover:border-blue-300`} onClick={remove.bind(null, index)} />,
            "C": <CMana key={index} className={`${base} hover:border-gray-400`} onClick={remove.bind(null, index)} />,
        };
        return lookup[colour] || <span>?</span>;
    }
    useEffect(() => {
        props.onChange && props.onChange(selected);
    }, [selected]);

    return (
    <div className="text-left">
        <div className="text-left">{props.title}</div>
        <div className="flex justify-end">
            {selected.length == 0? "None": selected.map(getSymbol)}
            </div>
        <div>
            <div className="flex h-12 gap-2 rounded-sm border border-gray-200 p-2">
                <span>Add: </span>
                <WMana onClick={add.bind(null, "W")}
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-yellow-200" />
                <GMana onClick={add.bind(null, "G")} 
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-green-800" />
                <RMana onClick={add.bind(null, "R")} 
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-red-400" />
                <BMana onClick={add.bind(null, "B")} 
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-gray-500" />
                <UMana onClick={add.bind(null, "U")} 
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-blue-300" />
                <CMana onClick={add.bind(null, "C")}  
                    className="cursor-pointer border border-gray-200 rounded-3xl hover:border-2 hover:border-gray-400" />
            </div>
        </div>
    </div>
    );
}

export default ManaPicker;