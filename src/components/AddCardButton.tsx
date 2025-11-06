import { Button } from "./ui/button";

export interface AddCardButtonProps {
  name: string;
  qty: number;
  disabled: boolean;
  onClick?: () => void;
}

function AddCardButton({ name, qty, onClick, disabled }: AddCardButtonProps) {
  return (
    <Button    
      key={name}
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between w-full text-left"
      >
      <span>{name}</span>
      <span className="text-sm text-muted-foreground">×{qty}</span>
    </Button>
  );
}
export default AddCardButton;