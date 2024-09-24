import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Switch } from "./ui/switch"
import { PlusIcon, MinusIcon, MaximizeIcon, ImageDownIcon, SettingsIcon, CombineIcon } from "lucide-react"

function MapControlButton({
    icon, onClick, label
}: {
    icon: React.ReactNode,
    onClick: () => void,
    label: string
}) {
    return <Tooltip>
        <TooltipTrigger asChild>
            <button aria-label={label} className="p-1 bg-white hover:bg-slate-50 transition-colors" onClick={onClick}>
                {icon}
            </button>
        </TooltipTrigger>
        <TooltipContent side="left">
            {label}
        </TooltipContent>
    </Tooltip>
}

export function MapController({
    onZoomIn, onZoomOut, onFit, onSnapshot, onExportElements,
    gridInterval, onGridIntervalChange,
    withCenterCrosshair, onCenterCrosshairChange
}: {
    onZoomIn: () => void,
    onZoomOut: () => void,
    onFit: () => void,
    onSnapshot: () => void,
    onExportElements: () => void,

    gridInterval: number,
    onGridIntervalChange: (value: number) => void,

    withCenterCrosshair: boolean,
    onCenterCrosshairChange: (value: boolean) => void
}) {
    return <TooltipProvider>
        <div className="absolute top-4 right-4">
            <div className="bg-border border border-border flex flex-col gap-[1px] rounded-md overflow-hidden">
                <MapControlButton icon={<PlusIcon size={21} />} onClick={onZoomIn} label="Zoom In" />
                <MapControlButton icon={<MinusIcon size={21} />} onClick={onZoomOut} label="Zoom Out" />
                <MapControlButton icon={<MaximizeIcon size={21} />} onClick={onFit} label="Fit" />
                <MapControlButton icon={<ImageDownIcon size={21} />} onClick={onSnapshot} label="Save Current Map" />
                <MapControlButton icon={<CombineIcon size={21} />} onClick={onExportElements} label="Export Elements" />
            </div>
            <div className="bg-border border border-border flex flex-col gap-[1px] rounded-md overflow-hidden mt-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <button aria-label="Display Settings" className="p-1 bg-white hover:bg-slate-50 transition-colors" >
                            <SettingsIcon size={21} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" className="w-96">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Network Map Display Settings</h4>
                                <p className="text-sm text-muted-foreground">
                                    Configure the appearance of the network map
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex flex-col gap-1">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="grid">Grid Interval</Label>
                                        <Input
                                            id="grid"
                                            type="number"
                                            className="col-span-2 h-8"
                                            value={gridInterval}
                                            onChange={(e) => onGridIntervalChange(Number(e.target.value))}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground text-right">
                                        * interval of zero disables grid
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <Label htmlFor="centerIndicator">Center Indicator</Label>
                                    <Switch 
                                        id="centerIndicator"  
                                        checked={withCenterCrosshair}
                                        onCheckedChange={onCenterCrosshairChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    </TooltipProvider>
}