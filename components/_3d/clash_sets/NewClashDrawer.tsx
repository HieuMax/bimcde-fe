'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Play } from 'lucide-react'
import { toast } from "sonner"

interface NewClashDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableModels: { id: string | number; name: string }[];
    projectId: string;
    onClashSetCreated: (newSet: any) => void; // Legacy
    onRunTest: (data: any) => void;
}

export function NewClashDrawer({
    open,
    onOpenChange,
    availableModels,
    onRunTest
}: NewClashDrawerProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"clash" | "clearance">("clash");
    const [tolerance, setTolerance] = useState("0.01");
    const [ignoreSameType, setIgnoreSameType] = useState(false);
    const [selectedModels, setSelectedModels] = useState<Set<string | number>>(new Set());
    const [modelVersions, setModelVersions] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName("");
            setType("clash");
            setTolerance("0.01");
            setSelectedModels(new Set());
        }
    }, [open]);

    const handleToggleModel = (id: string | number) => {
        const next = new Set(selectedModels);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedModels(next);
    };

    const handleSubmit = () => {
        if (!name.trim()) { toast.error("Name required"); return; }
        if (selectedModels.size < 2) { toast.error("Select at least 2 models"); return; }

        const payload = {
            name,
            type,
            tolerance: parseFloat(tolerance),
            ignoreSameType,
            models: Array.from(selectedModels).map(id => ({
                modelId: id,
                version: modelVersions[id] || "latest"
            }))
        };
        onRunTest(payload);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[450px] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> New Clash Test</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6 pr-2">
                    <div className="space-y-4">
                        <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name..." /></div>
                        <div className="space-y-3"><Label>Type</Label>
                            <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="flex gap-4">
                                <div className="flex items-center space-x-2 border rounded p-3 flex-1"><RadioGroupItem value="clash" id="r-clash" /><Label htmlFor="r-clash">Clash</Label></div>
                                <div className="flex items-center space-x-2 border rounded p-3 flex-1"><RadioGroupItem value="clearance" id="r-clearance" /><Label htmlFor="r-clearance">Clearance</Label></div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-1"><Label>Tolerance</Label><Input type="number" step="0.001" value={tolerance} onChange={(e) => setTolerance(e.target.value)} /></div>
                        <div className="flex items-center space-x-2"><Checkbox id="ignore" checked={ignoreSameType} onCheckedChange={(c) => setIgnoreSameType(c === true)} /><Label htmlFor="ignore">Ignore same type</Label></div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Label>Models ({selectedModels.size})</Label>
                        <div className="border rounded-md divide-y">
                            {availableModels.map((model) => (
                                <div key={model.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Checkbox checked={selectedModels.has(model.id)} onCheckedChange={() => handleToggleModel(model.id)} />
                                        <span className="text-sm font-medium">{model.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <SheetFooter className="pt-2 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} className="gap-2"><Play className="w-4 h-4" /> Run Test</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}