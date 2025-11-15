import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {  useState } from "react"
import { FileDown } from "lucide-react"
import { Textarea } from "./ui/textarea"

type ConstraintExportType = {
    onClick: () => string;
}

function ConstraintsExport({onClick}: ConstraintExportType) {
    const [data, setData] = useState<null | string>(null)
    function onOpen(isOpen: boolean){
        setData(isOpen? onClick(): null);
    }
    function selectAll(e: React.FocusEvent<HTMLTextAreaElement>) {
        e.target.select();
    }
    return (
    <Dialog open={data != null} onOpenChange={onOpen}>
        <DialogTrigger asChild>
            <Button variant="outline"><FileDown /></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Export Configuration</DialogTitle>
                <DialogDescription>
                    Copy the exported JSON data.    
                </DialogDescription>
            </DialogHeader>
            <Textarea
                value={data || ""}
                readOnly
                onFocus={selectAll}
                className="cursor-pointer select-text"
            />
        </DialogContent>
    </Dialog>
    );
}

export default ConstraintsExport;