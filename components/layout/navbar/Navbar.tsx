'use client'

import { ArrowLeft, MousePointer, CopyPlusIcon, MessageCircleDashed, CameraIcon, SquareScissors, Box, ClipboardCheck, Fullscreen, Eye, LucideIcon, RotateCcw, ChevronDown, Ghost, Trash, SquareDashed, Move, Orbit, Footprints, Check, ArrowRight, ArrowDown, ArrowUp, Trash2, RulerDimensionLine, Crosshair, TriangleRight, Axis3D, CircleCheck, Plus, SquareArrowOutDownLeft, GitCommitHorizontal, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { IView } from '@/types/view3d';

export type CameraMode = 'orbit' | 'pan' | 'look-around' | 'walk';
export type ActiveToolType = 'todo' | 'view' | 'measurement' | 'clipping' | 'properties' | null;
export type ViewOptionType = 'axon' | 'top' | 'front' | 'left' | 'right' | 'back' | 'bottom';

type ActiveHeader = 'main' | 'measure'
export type SelectionMode = 'single' | 'area' | 'multiple'

export type MeasureType =
  | 'perpendicular'
  | 'single-point'
  | 'angle'
  | 'slope'
  | null

export interface ViewOptions {
    annotations: boolean;
    clipPlanes: boolean;
    grids: boolean;
    ifcTypes: boolean;
    objectAttachments: boolean;
}

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
    onAddView: () => void;
    modelOpacity?: number;
    onOpacityChange?: (value: number) => void;

    onOpenViewDrawer?: (view: IView | null, mode: "create" | "edit" | "view") => void;
    
    // SELECTION MODE
    selectionMode?: SelectionMode;
    onChangeSelectionMode?: (mode: SelectionMode) => void;
    onSelectionModeChange?: (mode: SelectionMode) => void;
    
    // MULTI SELECT
    multiSelectEnabled?: boolean;
    onToggleMultiSelect?: () => void;
    
    // MEASUREMENT MODE
    measureType?: MeasureType;
    onMeasureTypeChange?: (type: MeasureType) => void;
    measureColor?: string;
    onMeasureColorChange?: (color: string) => void;
    isMeasureActive?: boolean;
    onMeasureActiveChange?: (active: boolean) => void;
    onClearAllMeasurements?: () => void;

    viewOptions?: ViewOptions;
    onToggleViewOption?: (key: keyof ViewOptions) => void;

    // DEV BRANCH TOOLS
    activeTool?: ActiveToolType;
    onToolSelect?: (tool: ActiveToolType) => void;
    cameraMode?: CameraMode;
    onCameraModeChange?: (mode: CameraMode) => void;
    activeView?: ViewOptionType;
    onViewChange?: (view: ViewOptionType) => void;
    onClipSave?: () => void;
    onClipCancel?: () => void;
    onToolChange?: (tool: ActiveToolType) => void;
}

interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;
    isActive?: boolean; 
}

function NavIconButton({ icon: Icon, label, onClick, className, active, isActive }: NavButtonProps) {
    const isBtnActive = active || isActive;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClick}
                    className={cn(
                        "h-9 w-9 transition-colors",
                        isBtnActive
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200"
                            : "hover:text-foreground hover:bg-accent",
                        className
                    )}
                >
                    <Icon className="h-6 w-6" />
                    <span className="sr-only">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    )
}

export function Navbar({
    onBack,
    onAddTodo,
    activeTool,
    modelOpacity = 1,
    onOpacityChange,
    onOpenViewDrawer,
    selectionMode = 'single',
    onChangeSelectionMode,
    onSelectionModeChange,
    multiSelectEnabled = false,
    onToggleMultiSelect,
    
    // MEASUREMENT
    measureType: externalMeasureType = null,
    onMeasureTypeChange,
    measureColor: externalMeasureColor = '#D81B60',
    onMeasureColorChange,
    isMeasureActive: externalIsMeasureActive = false,
    onMeasureActiveChange,
    onClearAllMeasurements,
    
    viewOptions,
    onToggleViewOption,

    onAddView,
    cameraMode = 'orbit',
    onCameraModeChange,
    activeView,
    onViewChange,
    onToolSelect,
    onClipSave,
    onClipCancel,
}: NavbarProps) {

    const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
    const toggleAction = (id: string) => {
        setActiveActions(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
            next.delete(id)
            } else {
            next.add(id)
            }
            return next
        })
    }
    
    // measure 
    const isActive = (id: string) => activeActions.has(id)
    const isMeasureActive = externalIsMeasureActive !== undefined ? externalIsMeasureActive : isActive('measure')
    const measureType = externalMeasureType
    const measureColor = externalMeasureColor 

    const measureMap: Record<
        Exclude<MeasureType, null>,
        { icon: LucideIcon; label: string }
        > = {
        'perpendicular': {
            icon: RulerDimensionLine,
            label: 'Perpendicular measure',
        },
        'single-point': {
            icon: Crosshair,
            label: 'Single point',
        },
        'angle': {
            icon: TriangleRight,
            label: 'Angle measure',
        },
        'slope': {
            icon: Axis3D,
            label: 'Slope measure',
        },
    }

    const ActiveMeasureIcon = measureType
    ? measureMap[measureType].icon
    : RulerDimensionLine

    const activeMeasureLabel = measureType
    ? measureMap[measureType].label
    : 'Measurement'


    const CurrentCameraIcon = useMemo(() => {
        switch (cameraMode) {
            case 'pan': return Move;
            case 'look-around': return Eye;
            case 'walk': return Footprints;
            default: return Orbit;
        }
    }, [cameraMode]);

    // Determine active header
    const activeHeader: ActiveHeader = (() => {
        if (isMeasureActive) return 'measure'
        return 'main'
    })()


    if (activeTool === 'clipping') {
        return (
            <TooltipProvider delayDuration={300}>
                <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
                    <div className="flex items-center h-16 px-4 gap-1 justify-between bg-blue-50/50">

                        {/* Left: Message */}
                        <div className="flex items-center gap-2 text-sm text-blue-700 font-medium animate-pulse">
                            <SquareScissors className="h-5 w-5" />
                            <span>Clipping Mode: Click on model to place cut</span>
                        </div>

                        {/* Right: Actions (Dev save/cancel) */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 border-red-200 gap-2"
                                onClick={onClipCancel}
                            >
                                <Trash2 className="h-4 w-4" /> Cancel
                            </Button>

                            <Button
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                                onClick={onClipSave}
                            >
                                <Check className="h-4 w-4" /> Save Plane
                            </Button>
                        </div>
                    </div>
                </nav>
            </TooltipProvider>
        );
    }


    return (
        <TooltipProvider delayDuration={300}>
            <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
                <div className="flex items-center h-16 px-4 gap-1 w-full justify-between">
                    
                    {/* Left Section */}
                    <div className="flex items-center gap-1">
                        {activeHeader === 'main' && (
                            <>
                                    {/* Back Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-auto hover:bg-accent p-2"
                                            onClick={onBack}
                                        >
                                            <ArrowLeft className="h-6 w-6 mr-1" />
                                            Back
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Go back</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-6 bg-border mx-1" />
                                
                                {/* --- CAMERA CONTROLS DROPDOWN --- */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-9 w-9",
                                                cameraMode !== 'orbit'
                                                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <CurrentCameraIcon className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center">
                                        <DropdownMenuItem onClick={() => onCameraModeChange?.('orbit')}>
                                            <Orbit className="mr-2 h-4 w-4" /> Orbit (Rotate)
                                            {cameraMode === 'orbit' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onCameraModeChange?.('pan')}>
                                            <Move className="mr-2 h-4 w-4" /> Pan Only
                                            {cameraMode === 'pan' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onCameraModeChange?.('look-around')}>
                                            <Eye className="mr-2 h-4 w-4" /> Look Around
                                            {cameraMode === 'look-around' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onCameraModeChange?.('walk')}>
                                            <Footprints className="mr-2 h-4 w-4" /> Walk Mode (WASD)
                                            {cameraMode === 'walk' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Divider */}
                                <div className="w-px h-6 bg-border mx-1" />

                                {/* Layout Tools */}
                                <NavIconButton
                                    icon={MousePointer}
                                    label="Single Selection"
                                    isActive={selectionMode === 'single'}
                                    onClick={() => {
                                        onChangeSelectionMode?.('single');
                                        onSelectionModeChange?.('single');
                                    }}
                                />

                                <NavIconButton
                                    icon={SquareDashed}
                                    label="Area Selection"
                                    isActive={selectionMode === 'area'}
                                    onClick={() => {
                                        onChangeSelectionMode?.('area');
                                    }}
                                />
                                
                                <div className="w-px h-6 bg-border mx-1" />

                                <NavIconButton
                                    icon={CopyPlusIcon}
                                    label="Multiple Selection"
                                    isActive={selectionMode === 'multiple' || multiSelectEnabled}
                                    onClick={() => {
                                        onToggleMultiSelect?.();
                                        onSelectionModeChange?.('multiple');
                                    }}
                                />                                
                                
                                <div className="w-px h-6 bg-border mx-1" />
                                
                                {/* MEASUREMENT (Nếu click vào sẽ mở activeHeader measure) */}
                                {!isMeasureActive &&(
                                    <DropdownMenu>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`
                                                        h-8 w-12 flex items-center justify-center gap-1
                                                        ${isActive('measure')
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'hover:bg-accent'}
                                                    `}
                                                    onClick={() => toggleAction('measure')}
                                                >
                                                <ActiveMeasureIcon className="h-5 w-5" />
                                                <ChevronDown className="h-2 w-2 opacity-70" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">{activeMeasureLabel}</TooltipContent>
                                        </Tooltip>

                                        <DropdownMenuContent align="start" className="w-56">
                                            {(
                                            Object.keys(measureMap) as Array<Exclude<MeasureType, null>>
                                            ).map(type => {
                                            const Icon = measureMap[type].icon
                                            return (
                                                <DropdownMenuItem
                                                key={type}
                                                className={measureType === type ? 'bg-accent' : ''}
                                                onClick={() => {
                                                    onMeasureTypeChange?.(type)
                                                    onMeasureActiveChange?.(true)
                                                    onToolSelect?.('measurement')
                                                }}
                                                >
                                                <Icon className="mr-2 h-4 w-4" />
                                                {measureMap[type].label}
                                                </DropdownMenuItem>
                                            )
                                            })}

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => {
                                                onMeasureTypeChange?.(null)
                                                onMeasureActiveChange?.(false)
                                                onClearAllMeasurements?.()
                                            }}
                                            >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete all measurements
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                
                                <NavIconButton
                                    icon={MessageCircleDashed}
                                    label="Add markup"
                                    isActive={isActive('markup')}
                                    onClick={() => toggleAction('markup')}
                                />

                                <NavIconButton
                                    icon={SquareScissors}
                                    label="Add Clip Plane"
                                    onClick={() => onToolSelect?.('clipping')}
                                />

                                <NavIconButton 
                                    icon={CameraIcon} 
                                    label="Add view" 
                                    onClick={() => {
                                        onAddView?.();
                                        if (onOpenViewDrawer) {
                                            onOpenViewDrawer(null, "create");
                                        }
                                    }} 
                                    isActive={activeTool === 'view'}
                                />
                                <NavIconButton icon={ClipboardCheck} label="Add todo" onClick={onAddTodo} isActive={activeTool === 'todo'} />

                                {/* Divider */}
                                <div className="w-px h-6 bg-border mx-1" />

                                {/* --- VIEW OPTIONS DROPDOWN --- */}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-12">
                                                    <Box className="h-5 w-5" />
                                                    <ChevronDown className="h-2 w-2 ml-0.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">View Options</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-40">
                                        <DropdownMenuItem onClick={() => onViewChange?.('axon')}>
                                            <RotateCcw className="mr-2 h-4 w-4" /> Axon View
                                            {activeView === 'axon' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onViewChange?.('top')}>
                                            <ArrowDown className="mr-2 h-4 w-4" /> Top View
                                            {activeView === 'top' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewChange?.('bottom')}>
                                            <ArrowUp className="mr-2 h-4 w-4" /> Bottom View
                                            {activeView === 'bottom' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onViewChange?.('front')}>
                                            <Box className="mr-2 h-4 w-4" /> Front View
                                            {activeView === 'front' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewChange?.('back')}>
                                            <Box className="mr-2 h-4 w-4 opacity-50" /> Back View
                                            {activeView === 'back' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewChange?.('left')}>
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Left View
                                            {activeView === 'left' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewChange?.('right')}>
                                            <ArrowRight className="mr-2 h-4 w-4" /> Right View
                                            {activeView === 'right' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="w-px h-6 bg-border mx-1" />

                                {/* Collaboration Tools */}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-12">
                                                    <Eye />
                                                    <ChevronDown className="h-2 w-2 ml-0.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Visibility Controls</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuCheckboxItem
                                            checked={viewOptions?.annotations}
                                            onCheckedChange={() => onToggleViewOption?.('annotations')}
                                        >
                                            Annotation
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={viewOptions?.clipPlanes}
                                            onCheckedChange={() => onToggleViewOption?.('clipPlanes')}
                                        >
                                            Clip planes
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={viewOptions?.grids}
                                            onCheckedChange={() => onToggleViewOption?.('grids')}
                                        >
                                            Grids
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={viewOptions?.ifcTypes}
                                            onCheckedChange={() => onToggleViewOption?.('ifcTypes')}
                                        >
                                            IFC element types
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={viewOptions?.objectAttachments}
                                            onCheckedChange={() => onToggleViewOption?.('objectAttachments')}
                                        >
                                            Object attachments
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="w-px h-6 bg-border mx-1" />


                                {/* --- BUTTON TRANSPARENCY --- */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-9 w-9 ${modelOpacity < 1 ? "bg-blue-100 text-blue-600" : ""}`}
                                        >
                                            <Ghost className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 p-4" align="start">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Model Opacity</span>
                                                <span className="text-xs text-muted-foreground">{Math.round(modelOpacity * 100)}%</span>
                                            </div>

                                            <div className="flex items-center h-5">
                                                <input
                                                    type="range"
                                                    min="0.2"
                                                    max="1"
                                                    step="0.01"
                                                    value={modelOpacity}
                                                    onChange={(e) => onOpacityChange?.(parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>

                        {/* CLIP MODE MEASURE */}
                        {isMeasureActive && activeHeader === 'measure' && (
                            <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 absolute inset-x-0 mx-auto pointer-events-none">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 shadow-sm pointer-events-auto">
                                    
                                    {/* 1. Measure Type Selector (Dropdown) */}
                                    <DropdownMenu>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 gap-1 bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 shadow-sm px-2">
                                                        <ActiveMeasureIcon className="h-4 w-4" />
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">Change Measurement Type</TooltipContent>
                                        </Tooltip>
                                        
                                        <DropdownMenuContent align="start" className="w-56">
                                            {(Object.keys(measureMap) as Array<Exclude<MeasureType, null>>).map(type => {
                                                const Icon = measureMap[type].icon
                                                return (
                                                    <DropdownMenuItem key={type} onClick={() => onMeasureTypeChange?.(type)} className={measureType === type ? 'bg-accent' : ''}>
                                                        <Icon className="mr-2 h-4 w-4" /> {measureMap[type].label}
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* 2. Point Color Picker (Chọn màu điểm đo) */}
                                    <DropdownMenu>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-10 hover:bg-slate-200 gap-1 px-1">
                                                        <div 
                                                            className="h-3 w-8 rounded-full ring-1 ring-slate-300 transition-colors duration-200" 
                                                            style={{ backgroundColor: measureColor }}
                                                        />
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>Point Color</TooltipContent>
                                        </Tooltip>
                                        
                                        {/* Bảng màu */}
                                        <DropdownMenuContent className="p-3 w-[260px]" align="start">
                                            <div className="grid grid-cols-6 gap-2">
                                                {[
                                                    '#880E4F', '#F4511E', '#FFEA00', '#004D40', '#304FFE', '#000000',
                                                    '#D81B60', '#FB8C00', '#FDD835', '#00897B', '#5C6BC0', '#546E7A',
                                                    '#E53935', '#FFB300', '#C0CA33', '#00ACC1', '#8E24AA', '#B0BEC5',
                                                    '#FF5252', '#FFCA28', '#66BB6A', '#42A5F5', '#AB47BC', '#FFFFFF'
                                                ].map((color) => (
                                                    <button 
                                                        key={color} 
                                                        onClick={() => onMeasureColorChange?.(color)}
                                                        className={`
                                                            w-7 h-7 rounded-full border border-slate-200 
                                                            hover:scale-110 transition-transform focus:outline-none 
                                                            flex items-center justify-center
                                                            ${measureColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                                                        `}
                                                        style={{backgroundColor: color}}
                                                    >
                                                        {measureColor === color && (
                                                            <CircleCheck className={`w-4 h-4 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                                                        )}
                                                    </button>
                                                ))}
                                                
                                                {/*Custom Color */}
                                                <button className="w-7 h-7 rounded-full border border-dashed border-slate-400 flex items-center justify-center hover:bg-slate-100 text-slate-500">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="w-px h-5 bg-slate-300 mx-1" />

                                    {/* 3. Snap Tools  */}
                                    <div className="flex bg-slate-200/50 p-0.5 rounded-sm gap-0.5">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200">
                                                    <SquareArrowOutDownLeft className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Snap to points</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200">
                                                    <GitCommitHorizontal className="h-4 w-4" /> 
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Snap to lines</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white text-blue-600 shadow-sm">
                                                    <SquareDashed className="h-4 w-4" /> 
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Snap to faces</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200">
                                                    <CircleDot className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Snap to center</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    <div className="w-px h-5 bg-slate-300 mx-1" />

                                    {/* 4. Action Buttons */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600 hover:bg-slate-200"
                                                onClick={() => {
                                                    if (onOpenViewDrawer) {
                                                        onOpenViewDrawer(null, "create");
                                                    }
                                                }}
                                            >
                                                <CameraIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Capture view</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-red-50 hover:text-red-600"
                                            onClick={() => {
                                                onClearAllMeasurements?.()
                                            }} 
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete all measurements</TooltipContent>
                                    </Tooltip>

                                    <div className="w-px h-5 bg-slate-300 mx-1" />

                                    {/* 5. Done Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 uppercase tracking-wide"
                                        onClick={() => {
                                            onMeasureActiveChange?.(false);
                                            onToolSelect?.(null);
                                        }}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}

                    {/* ================= RIGHT SECTION ================= */}
                    {activeHeader === 'main' && (
                        <div className="flex items-center gap-1 ml-auto">
                            <NavIconButton icon={Fullscreen} label="Fullscreen" />
                        </div>
                    )}
                </div>
            </nav>
        </TooltipProvider>
    )
}