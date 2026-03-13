import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Rotate3D, Move } from "lucide-react";

interface ModelPositionDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modelId: number | null;
    modelName: string;
    initialData: any;
    onSave: (modelId: number, data: any) => void;
}

export function ModelPositionDrawer({
    open,
    onOpenChange,
    modelId,
    modelName,
    initialData,
    onSave
}: ModelPositionDrawerProps) {

    const [form, setForm] = useState({
        posX: 0, posY: 0, posZ: 0,
        rotX: 0, rotY: 0, rotZ: 0,
        scale: 1,
        moveX: 0, moveY: 0, moveZ: 0
    });

    useEffect(() => {
        if (open && initialData) {
            setForm({
                posX: initialData.position?.x || 0,
                posY: initialData.position?.y || 0,
                posZ: initialData.position?.z || 0,
                rotX: initialData.rotation?.x || 0,
                rotY: initialData.rotation?.y || 0,
                rotZ: initialData.rotation?.z || 0,
                scale: initialData.scale || 1,
                moveX: 0, moveY: 0, moveZ: 0
            });
        }
    }, [open, initialData]);

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    const applyMove = () => {
        const newX = form.posX + form.moveX;
        const newY = form.posY + form.moveY;
        const newZ = form.posZ + form.moveZ;

        setForm(prev => ({
            ...prev,
            posX: newX, posY: newY, posZ: newZ,
            moveX: 0, moveY: 0, moveZ: 0
        }));
    };

    const handleSave = () => {
        if (modelId === null) return;

        onSave(modelId, {
            position: { x: form.posX, y: form.posY, z: form.posZ },
            rotation: { x: form.rotX, y: form.rotY, z: form.rotZ },
            scale: form.scale
        });
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[350px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Position Settings</SheetTitle>
                    <div className="text-sm text-muted-foreground truncate">{modelName}</div>
                </SheetHeader>

                <div className="grid gap-6 py-6">

                    {/* GROUP 1: POSITIONING */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                            <Move className="w-4 h-4" /> Group Positioning (Absolute)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Position X</Label>
                                <Input type="number" step="0.1" value={form.posX} onChange={(e) => handleChange('posX', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Position Y</Label>
                                <Input type="number" step="0.1" value={form.posY} onChange={(e) => handleChange('posY', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Elevation (Z)</Label>
                                <Input type="number" step="0.1" value={form.posZ} onChange={(e) => handleChange('posZ', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Scale</Label>
                                <Input type="number" step="0.01" min="0.01" value={form.scale} onChange={(e) => handleChange('scale', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* GROUP 2: ROTATION */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                            <Rotate3D className="w-4 h-4" /> Group Rotation (Degrees)
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">X</Label>
                                <Input type="number" value={form.rotX} onChange={(e) => handleChange('rotX', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Y</Label>
                                <Input type="number" value={form.rotY} onChange={(e) => handleChange('rotY', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Z</Label>
                                <Input type="number" value={form.rotZ} onChange={(e) => handleChange('rotZ', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* GROUP 3: MOVE (Relative Adjustment) */}
                    <div className="space-y-4 bg-slate-50 p-3 rounded-md border">
                        <div className="flex items-center justify-between font-medium text-slate-700">
                            <div className="flex items-center gap-2">
                                <Move className="w-4 h-4" /> Group: Move (Relative)
                            </div>
                            <Button variant="outline" size="sm" onClick={applyMove} className="h-6 text-xs">Apply Move</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Offset X</Label>
                                <Input type="number" className="bg-white h-8" value={form.moveX} onChange={(e) => handleChange('moveX', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Offset Y</Label>
                                <Input type="number" className="bg-white h-8" value={form.moveY} onChange={(e) => handleChange('moveY', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Offset Elevation</Label>
                                <Input type="number" className="bg-white h-8" value={form.moveZ} onChange={(e) => handleChange('moveZ', e.target.value)} />
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            * Enter values and click "Apply Move" to update the Position above.
                        </div>
                    </div>

                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Settings</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}