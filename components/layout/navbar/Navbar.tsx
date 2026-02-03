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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type ClipType = 'none' | 'plane' | 'vertical' | 'box'

export type ClipHoverMode = 'both'| 'lines' | 'faces'

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
    modelOpacity?: number;
    onOpacityChange?: (value: number) => void;
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
    
}

function NavIconButton({ icon: Icon, label, onClick, className }: NavButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 hover:bg-accent ${className || ''}`}
                    onClick={onClick}
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

    return (
        <TooltipProvider delayDuration={300}>
            <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
                <div className="flex items-center h-16 px-4 gap-1">
                    {/* Left Section */}
                    <div className="flex items-center gap-1">

                        {clipMode === 'none' && (
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
                                <NavIconButton icon={MousePointer} label="Single Selection mode" />
                                <NavIconButton icon={SquareDashed} label="Area Selection mode" />
                                <NavIconButton icon={CopyPlusIcon} label="Multiple-select mode" />

                                <div className="w-px h-6 bg-border mx-1" />

                                <NavIconButton icon={Ruler} label="Measurement option" />
                                <NavIconButton icon={MessageCircleDashed} label="Add markup" />

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

                            {/* ===== HOVER MODE (ONLY PLANE / VERTICAL) ===== */}
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
                                    // onChangeClipType('none')
                                    // onChangeHoverMode('both')
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

                    {/* ================= RIGHT SECTION ================= */}
                    {clipMode === 'none' && (
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