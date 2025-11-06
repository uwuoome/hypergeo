
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import  hypergeo  from "@/lib/hypergeo";
import { useState } from "react";



function HyperGeo(){
    const [population, setPopulation] = useState<number>(40);
    const [sample, setSample] = useState<number>(7);
    const [sp, setSP] = useState<number>(9);
    const [ss, setSS] = useState<number>(1);
    const [resultText, setResultText] = useState<string>("");

    function calculate(){
         // validate inputs
        if(isNaN(population)) return;
        if(isNaN(sample) || sample > population) return;
        if(isNaN(sp) || sp > population) return;
        if(isNaN(ss) || ss > sample) return;

        // at least
        const asOrLess = hypergeo.asOrLess(population, sp, sample, ss);
        const atLeast = hypergeo.asOrMore(population, sp, sample, ss);
        const exactly = hypergeo.exactly(population, sp, sample, ss);

        setResultText(`
            Exactly: ${exactly.toFixed(3)}
            At Least: ${atLeast.toFixed(3)}
            As Many or Less: ${asOrLess.toFixed(3)}
            None: ${(1-atLeast).toFixed(3)}
        `);
    }

    return (
    <>
    <h2>Hypergeometric Distribution Calculator</h2>
    <div>
        <pre className="text-left float-end">
            {resultText}
        </pre> 
        <table className="text-left">
            <thead></thead>
            <tbody>
            <tr>
                <td>Population</td>
                <td>
                    <Input type="number" min="1" max="500"  step="1" value={population} 
                        onChange={(evt) => setPopulation(parseInt(evt.target.value))} />
                </td>
            </tr>
            <tr>
                <td>Sample Size</td>
                <td>
                    <Input type="number" min="1" max="500"  step="1" value={sample} 
                     onChange={(evt) => setSample(parseInt(evt.target.value))} />
                </td>
            </tr>
            <tr>
                <td>Successes in Population</td>
                <td><Input type="number" min="1" max="500"  step="1" value={sp} 
                     onChange={(evt) => setSP(parseInt(evt.target.value))} /></td>
            </tr>
            <tr>
                <td>Successes in Sample</td>
                <td>
                    <Input type="number" min="1" max="500"  step="1"  value={ss} 
                     onChange={(evt) => setSS(parseInt(evt.target.value))} />
                </td>
            </tr>  
            <tr>
                <td></td>
                <td>
                    <Button variant="outline" onClick={calculate}>Calculate</Button>
                </td>
            </tr>
            </tbody>
        </table>
      
    </div>
    </>
    );
}


export default HyperGeo;