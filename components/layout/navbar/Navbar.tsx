'use client'

import {
    ArrowLeft,
    RotateCw,
    Square,
    Maximize2,
    ZoomIn,
    Trash2,
    Copy,
    Users,
    MessageCircle,
    MoreHorizontal,
    Camera,
    Settings,
    Fullscreen,
    Eye,
    Lock,
    Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
    onBack?: () => void;
    onRefresh?: () => void;
    onAction?: () => void;

}

export function Navbar({ onBack, onRefresh, onAction }: NavbarProps) {
    return (
        <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm flex-none">
            <div className="flex items-center h-16 px-4 gap-1">
                {/* Left Section */}
                <div className="flex items-center gap-1">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-auto p-0 hover:bg-accent p-2"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    {/* Refresh */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        onClick={onRefresh}
                    >
                        <RotateCw className="h-4 w-4" />
                    </Button>

                    {/* Primary Action Button */}
                    <Button
                        className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                        onClick={onAction}
                    >
                        Action
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Layout Tools */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Square className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Copy className="h-4 w-4" />
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Collaboration Tools */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right Section */}
                <div className="flex items-center gap-1">
                    {/* View Tools */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Camera className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Lock className="h-4 w-4" />
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Settings & Actions */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                        <Fullscreen className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </nav>
    )
}