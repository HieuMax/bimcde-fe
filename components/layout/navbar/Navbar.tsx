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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
    modelOpacity?: number;
    onOpacityChange?: (value: number) => void;
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
    onOpacityChange
}: NavbarProps) {
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
                        <NavIconButton icon={SquareScissors} label="Clip plane" />
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