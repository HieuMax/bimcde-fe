'use client'

import {
    ArrowLeft,
    MousePointer,
    CopyPlusIcon,
    MessageCircleDashed,
    CameraIcon,
    SquareScissors,
    Box,
    ClipboardCheck,
    MoreVertical,
    Settings,
    Fullscreen,
    Eye,
    Download,
    LucideIcon,
    Ruler,
    Grid3x3,
    RotateCcw,
    ChevronDown,
    Ghost,
    Move, // Icon Pan
    Orbit, // Icon Rotate
    Footprints,
    Check,
    ArrowRight,
    ArrowDown,
    ArrowUp, // Icon Walk
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export type CameraMode = 'orbit' | 'pan' | 'look-around' | 'walk';
export type ActiveToolType = 'todo' | 'view' | 'measurement' | 'clipping' | 'properties' | null;
export type SelectionMode = 'single' | 'multiple';
export type ViewOptionType = 'axon' | 'top' | 'front' | 'left' | 'right' | 'back' | 'bottom';

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
    onAddView: () => void;
    modelOpacity?: number;
    onOpacityChange?: (value: number) => void;
    activeTool?: ActiveToolType;
    onToolSelect?: (tool: ActiveToolType) => void;
    cameraMode?: CameraMode;
    onCameraModeChange?: (mode: CameraMode) => void;
    selectionMode?: SelectionMode;
    onSelectionModeChange?: (mode: SelectionMode) => void;
    activeView?: ViewOptionType;
    onViewChange?: (view: ViewOptionType) => void;
}

// Helper component to render a button with a tooltip to avoid code repetition
interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    className?: string;
}

function NavIconButton({ icon: Icon, label, onClick, isActive, className }: NavButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClick}
                    className={cn(
                        "h-9 w-9 transition-colors",
                        isActive
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
    onRefresh,
    onAction,
    onAddTodo,
    activeTool,
    modelOpacity = 1,
    onOpacityChange,
    onAddView,
    cameraMode = 'orbit',
    onCameraModeChange,
    selectionMode = 'single',
    onSelectionModeChange,
    activeView,
    onViewChange,
}: NavbarProps) {

    const CurrentCameraIcon = useMemo(() => {
        switch (cameraMode) {
            case 'pan': return Move;
            case 'look-around': return Eye;
            case 'walk': return Footprints;
            default: return Orbit;
        }
    }, [cameraMode]);


    return (
        <TooltipProvider delayDuration={300}>
            <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
                <div className="flex items-center h-16 px-4 gap-1">
                    {/* Left Section */}
                    <div className="flex items-center gap-1">

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
                        {/* --- SELECTION TOOLS --- */}

                        {/* Single Select */}
                        <NavIconButton
                            icon={MousePointer}
                            label="Single Selection"
                            isActive={selectionMode === 'single'}
                            onClick={() => onSelectionModeChange?.('single')}
                        />

                        {/* Multiple Select */}
                        <NavIconButton
                            icon={CopyPlusIcon}
                            label="Multiple Selection"
                            isActive={selectionMode === 'multiple'}
                            onClick={() => onSelectionModeChange?.('multiple')}
                        />

                        <div className="w-px h-6 bg-border mx-1" />

                        <NavIconButton icon={Ruler} label="Measurement option" />
                        <NavIconButton icon={MessageCircleDashed} label="Add markup" />
                        <NavIconButton icon={SquareScissors} label="Clip plane" />
                        <NavIconButton icon={CameraIcon} label="Add view" onClick={onAddView} isActive={activeTool === 'view'} />
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

                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right Section */}
                    <div className="flex items-center gap-1">
                        {/* Divider */}
                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Settings & Actions */}
                        <NavIconButton icon={Download} label="Download" />
                        <NavIconButton icon={Settings} label="Settings" />
                        <NavIconButton icon={Fullscreen} label="Fullscreen" />
                    </div>
                </div>
            </nav>
        </TooltipProvider>
    )
}