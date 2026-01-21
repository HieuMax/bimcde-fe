'use client'

import {
    ArrowLeft,
    RotateCw,
    Square,
    Maximize2,
    ZoomIn,
    Trash2,
    ClipboardCheck,
    Users,
    MessageCircle,
    MoreHorizontal,
    Camera,
    Settings,
    Fullscreen,
    Eye,
    Lock,
    Download,
    LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;
    onAddTodo?: () => void;
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

export function Navbar({ onBack, onRefresh, onAction, onAddTodo }: NavbarProps) {
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

                        {/* Refresh */}
                        <NavIconButton icon={RotateCw} label="Refresh" onClick={onRefresh} />

                        {/* Primary Action Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs ml-1"
                                    onClick={onAction}
                                >
                                    Action
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Perform action</TooltipContent>
                        </Tooltip>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Layout Tools */}
                        <NavIconButton icon={Square} label="Square" />
                        <NavIconButton icon={Maximize2} label="Maximize" />
                        <NavIconButton icon={ZoomIn} label="Zoom in" />
                        <NavIconButton icon={Trash2} label="Delete" />
                        <NavIconButton icon={ClipboardCheck} label="Add todo" onClick={onAddTodo} />

                        {/* Divider */}
                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Collaboration Tools */}
                        <NavIconButton icon={Users} label="Users" />
                        <NavIconButton icon={MessageCircle} label="Messages" />
                        <NavIconButton icon={MoreHorizontal} label="More options" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right Section */}
                    <div className="flex items-center gap-1">
                        {/* View Tools */}
                        <NavIconButton icon={Camera} label="Snapshot" />
                        <NavIconButton icon={Eye} label="Preview" />
                        <NavIconButton icon={Lock} label="Lock" />

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