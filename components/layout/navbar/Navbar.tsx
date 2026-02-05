'use client'

import {
    ArrowLeft,
    SquareDashed,
    MousePointer,
    CopyPlusIcon,
    MessageCircleDashed,
    CameraIcon,
    SquareScissors,
    Rotate3D,
    Box,
    ClipboardCheck,
    MoreVertical,
    Camera,
    Settings,
    Fullscreen,
    Eye,
    Lock,
    Download,
    LucideIcon,
    Ruler,
    Grid3x3,
    RotateCcw,
    ChevronDown,
    Ghost,
    Trash,
    GitCommitHorizontal,
    SquareSquare,
    ScissorsLineDashed,
    Scissors,
    RulerDimensionLine,
    TrendingUp,
    TriangleRight,
    Plus,
    SquareArrowOutDownLeft,
    CircleDot,
    CircleCheck,
    Crosshair,
    Axis3D,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

type ActiveHeader = 'main' | 'clip' | 'measure'

export type ClipType = 'none' | 'plane' | 'vertical' | 'box'

export type ClipHoverMode = 'both'| 'lines' | 'faces'

export type SelectionMode = 'single' | 'area'

type MeasureType =
  | 'perpendicular'
  | 'single-point'
  | 'angle'
  | 'slope'
  | null

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
    modelOpacity?: number;
    onOpacityChange?: (value: number) => void;
    // SELECTION MODE
    selectionMode?: SelectionMode;
    onChangeSelectionMode?: (mode: SelectionMode) => void;
    // MULTI SELECT (additive) can be toggled alongside single/area
    multiSelectEnabled?: boolean;
    onToggleMultiSelect?: () => void;
    //  CLIP MODE
    clipType: ClipType;
    onChangeClipType: (type:ClipType ) => void;
    hoverMode: ClipHoverMode;
    onChangeHoverMode: (mode: ClipHoverMode) => void;

    onFlipClipDirection?: () => void;
    onDeleteClip?: () => void;
    hasActiveVerticalClip?: boolean;
    setHasActiveVerticalClip?: (v: boolean) => void
    onClearAllClips?: () => void;
}

// Helper component to render a button with a tooltip to avoid code repetition
interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    className?: string;
    active?: boolean;

}

function NavIconButton({ icon: Icon, label, onClick, className, active }: NavButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    // className={`h-8 w-8 p-0 hover:bg-accent ${className || ''}`}
                    
                    onClick={onClick}
                    className={`
                        h-8 w-8 p-0
                        transition-colors
                        ${active ? 'bg-blue-100 text-blue-600' : 'hover:bg-accent'}
                        ${className || ''}
                    `}
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

export function Navbar({ onBack, onRefresh, onAction, onAddTodo,
    modelOpacity = 1,
    onOpacityChange,
    selectionMode = 'single',
    onChangeSelectionMode,
    multiSelectEnabled = false,
    onToggleMultiSelect,
    clipType,
    onChangeClipType,
    hasActiveVerticalClip = false,
    onFlipClipDirection,
    onDeleteClip,
    hoverMode,
    onChangeHoverMode,
    setHasActiveVerticalClip,
    onClearAllClips
}: NavbarProps) {

    const clipIconMap: Record<ClipType, LucideIcon> = {
        none: Scissors,
        plane: Scissors,
        vertical: ScissorsLineDashed,
        box: SquareScissors,
    }
    const clipMode = clipType
    const ClipIcon = clipIconMap[clipMode]

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

    const isMeasureActive = isActive('measure')

    const [measureType, setMeasureType] = useState<MeasureType>(null)
    const [measureColor, setMeasureColor] = useState('#D81B60'); 

    // Map measure types to icons and labels
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

    // Determine active header
    const activeHeader: ActiveHeader = (() => {
        if (isMeasureActive) return 'measure'
        if (clipMode !== 'none') return 'clip'
        return 'main'
    })()

    return (
        <TooltipProvider delayDuration={300}>
            <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
                <div className="flex items-center h-16 px-4 gap-1">
                    {/* Left Section */}
                    <div className="flex items-center gap-1">

                        {activeHeader === 'main' && (
                            <>
                                    {/* Back Button (Handled separately due to text label next to icon) */}
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
                                {/* Camera Controls */}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-12"
                                                >
                                                    <Box />
                                                    <ChevronDown className="h-2 w-2 ml-0.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Camera Controls</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-40">
                                        <DropdownMenuItem>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Rotate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Pan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4" />
                                            Look around
                                        </DropdownMenuItem>
                                        {/* <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Walk mode
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Path navigation
                                        </DropdownMenuItem> */}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Divider */}
                                <div className="w-px h-6 bg-border mx-1" />

                                {/* Layout Tools */}
                                <NavIconButton
                                    icon={MousePointer}
                                    label="Single Selection mode"
                                    active={selectionMode === 'single'}
                                    onClick={() => onChangeSelectionMode && onChangeSelectionMode('single')}
                                />

                                <NavIconButton
                                    icon={SquareDashed}
                                    label="Area Selection mode"
                                    active={selectionMode === 'area'}
                                    onClick={() => onChangeSelectionMode && onChangeSelectionMode('area')}
                                />
                                
                                <div className="w-px h-6 bg-border mx-1" />

                                <NavIconButton
                                    icon={CopyPlusIcon}
                                    label="Multiple-select mode"
                                    active={multiSelectEnabled}
                                    onClick={() => onToggleMultiSelect?.()}
                                />                                
                                
                                <div className="w-px h-6 bg-border mx-1" />
                                
                                {/* perpendicular measurement */}
                                {clipMode==='none' && !isMeasureActive &&(
                                    <>
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
                                                        setMeasureType(type)
                                                        setActiveActions(new Set(['measure']))
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
                                                    setMeasureType(null)
                                                    setActiveActions(prev => {
                                                    const next = new Set(prev)
                                                    next.delete('measure')
                                                    return next
                                                    })
                                                    // clear measurement logic
                                                }}
                                                >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete all measurements
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                                

                                <NavIconButton
                                    icon={MessageCircleDashed}
                                    label="Add markup"
                                    active={isActive('markup')}
                                    onClick={() => toggleAction('markup')}
                                />

                                {/* <NavIconButton icon={SquareScissors} label="Clip plane" /> */}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-12 flex items-center justify-center gap-1 ${
                                                        clipMode !== 'none' ? 'bg-accent text-primary' : ''
                                                    }`}
                                                    onClick={(e) => {
                                                        const target = e.target as HTMLElement
                                                        if (!target.closest('[data-dropdown-arrow]')) {
                                                            onChangeClipType('plane')
                                                        }
                                                    }}
                                                >
                                                    <ClipIcon className="h-5 w-5" />

                                                    <span data-dropdown-arrow className="flex items-center">
                                                        <ChevronDown className="h-2 w-2 ml-0.5" />
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Clip</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => onChangeClipType('plane')}>
                                            <Scissors className="mr-2 h-4 w-4" />
                                            Clip plane
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => onChangeClipType('vertical')}>
                                            <ScissorsLineDashed className="mr-2 h-4 w-4" />
                                            Vertical clip plane
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => onChangeClipType('box')}>
                                            <SquareScissors className="mr-2 h-4 w-4" />
                                            Clip box
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() =>{onChangeClipType('none')
                                                onClearAllClips?.()
                                            }}
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete all clip planes
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/*  */}
                                <NavIconButton icon={CameraIcon} label="Add view" />
                                <NavIconButton icon={ClipboardCheck} label="Add todo" onClick={onAddTodo} />

                                {/* Divider */}
                                <div className="w-px h-6 bg-border mx-1" />

                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-12"
                                                >
                                                    <Box />
                                                    <ChevronDown className="h-2 w-2 ml-0.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Perform action</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-40">
                                        <DropdownMenuItem>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Axon View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Top view
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4" />
                                            Front View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Left View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Back View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Right View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Bottom View
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="w-px h-6 bg-border mx-1" />

                                {/* Collaboration Tools */}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-12"
                                                >
                                                    <Eye />
                                                    <ChevronDown className="h-2 w-2 ml-0.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Visibility Controls</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-40">
                                        <DropdownMenuItem>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Annotations
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Clip planes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4" />
                                            Grids
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            IFC element types
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Grid3x3 className="mr-2 h-4 w-4 rotate-90" />
                                            Object attachments
                                        </DropdownMenuItem>
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

                                <div className="w-px h-6 bg-border mx-1" />

                                <NavIconButton icon={MoreVertical} label="More options" />
                            </>
                        )}
                    </div>

                        {/* --- CLIP MODE TOOLBAR --- */}
                        {clipMode !== 'none' && !hasActiveVerticalClip &&(
                            <div className="flex-1 flex items-center justify-center">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                {/* ===== CLIP MODE DROPDOWN ===== */}
                                <DropdownMenu>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-10 flex items-center justify-center gap-0.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 shadow-sm"
                                        >
                                            {clipMode === 'plane' && <Scissors className="h-4 w-4" />}
                                            {clipMode === 'vertical' && <ScissorsLineDashed className="h-4 w-4" />}
                                            {clipMode === 'box' && <SquareScissors className="h-4 w-4" />}
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Change Clip Mode</TooltipContent>
                                    </Tooltip>

                                    <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuItem
                                        onClick={() => {
                                        onChangeClipType('plane')
                                        onChangeHoverMode('both')
                                        }}
                                    >
                                        <Scissors className="mr-2 h-4 w-4" />
                                        Clip plane
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() => {
                                        onChangeClipType('vertical')
                                        onChangeHoverMode('both')
                                        }}
                                    >
                                        <ScissorsLineDashed className="mr-2 h-4 w-4" />
                                        Vertical clip plane
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() => {
                                        onChangeClipType('box')
                                        }}
                                    >
                                        <SquareScissors className="mr-2 h-4 w-4" />
                                        Clip box
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="w-px h-5 bg-slate-300 mx-1" />

                                {(clipMode === 'plane' || clipMode === 'vertical') && (
                                    <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onChangeHoverMode('lines')}
                                            className={`h-8 w-8 transition-all duration-200 ${
                                            hoverMode === 'lines'
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <GitCommitHorizontal className="h-4 w-4" />
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Show lines only</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onChangeHoverMode('faces')}
                                            className={`h-8 w-8 transition-all duration-200 ${
                                            hoverMode === 'faces'
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <SquareSquare className="h-4 w-4" />
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Show faces only</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onChangeHoverMode('both')}
                                            className={`h-8 w-8 transition-all duration-200 ${
                                            hoverMode === 'both'
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <SquareDashed className="h-4 w-4" />
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Show lines & faces</TooltipContent>
                                    </Tooltip>

                                    <div className="w-px h-5 bg-slate-300 mx-1" />
                                    </>
                                )}

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-600 hover:bg-slate-200"
                                    >
                                        <CameraIcon className="h-4 w-4" />
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Capture view</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            onClearAllClips?.()
                                        }}
                                        className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clear all clips</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-5 bg-slate-300 mx-1" />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 uppercase tracking-wide"
                                    onClick={() => onChangeClipType('none')}
                                >
                                    Done
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => {
                                    setHasActiveVerticalClip?.(true)
                                    }}
                                    >
                                    Preview header 3
                                </Button>

                                </div>
                            </div>
                        )}

                        {clipMode !== 'none' && hasActiveVerticalClip && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="flex items-center justify-center h-12 gap-2 px-4 animate-in fade-in slide-in-from-top-2 duration-200">

                                <span className="text-sm font-medium text-slate-600 mr-2">
                                    Clip active
                                </span>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={onFlipClipDirection}
                                >
                                    Switch direction
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={ () => {onClearAllClips?.()}}
                                >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>

                                <Button
                                    size="sm"
                                    variant="default"
                                    className="h-8"
                                    onClick={() => onChangeClipType('none')}
                                >
                                    Done
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="h-8"
                                    onClick={() => {
                                    setHasActiveVerticalClip?.(false)
                                    }}
                                    >
                                    Back
                                </Button>
                                </div>
                            </div>
                        )}

                        {/* CLIP MODE MEASURE */}
                        {isMeasureActive && (
                            <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 shadow-sm">
                                    
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
                                                    <DropdownMenuItem key={type} onClick={() => setMeasureType(type)} className={measureType === type ? 'bg-accent' : ''}>
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
                                                        {/* Hiển thị màu đang chọn (Reactive) */}
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
                                                        onClick={() => setMeasureColor(color)} // Cập nhật màu khi click
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-200">
                                                <CameraIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Add view</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => {
                                                    
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
                                            setActiveActions(prev => {
                                                const next = new Set(prev)
                                                next.delete('measure')
                                                return next
                                            })
                                            setMeasureType(null)
                                        }}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}

                    {/* ================= RIGHT SECTION ================= */}
                    {activeHeader === 'main' && (
                        <>
                        <div className="flex-1" />

                        <div className="flex items-center gap-1">
                            <div className="w-px h-6 bg-border mx-1" />
                            <NavIconButton icon={Download} label="Download" />
                            <NavIconButton icon={Settings} label="Settings" />
                            <NavIconButton icon={Fullscreen} label="Fullscreen" />
                        </div>
                        </>
                    )}

                </div>
            </nav>
        </TooltipProvider>
    )
}