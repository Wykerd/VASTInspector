import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useInspector } from "@/lib/Inspector"
import { Plus } from "lucide-react"
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";

export default function AddMatcherButton() {
    const [hostname, setHostname] = useState("http://127.0.0.1:3344");
    const [open, setOpen] = useState(false);
    const inspector = useInspector();

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    Add matcher
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add a Matcher</DialogTitle>
                    <DialogDescription>
                        Inspect network traffic by adding a matcher.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="hostname">
                        Inspector Server URL
                    </Label>
                    <Input
                        type="text"
                        placeholder="http://127.0.0.1:3344"
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={() => {
                        inspector.addMatcher(hostname);
                        setOpen(false);
                    }}>
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
