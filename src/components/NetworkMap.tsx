import { ImageDownIcon, LocateIcon, MaximizeIcon, MinusIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react"
import MapSurface, { MapElement, MapSurfaceController } from "./MapSurface"
import { useMemo, useRef, useState } from "react"
import { MapController } from "./MapController"
import { Point } from "@/lib/messages"
import { useInspector } from "@/lib/Inspector"
import { useInspectionPane } from "@/lib/InspectionPaneProvider"

function MapViewportIndicator({
    scale,
    coordinates
}: {
    scale: number,
    coordinates: Point
}) {
    return <div className="absolute bottom-4 right-4 bg-white p-1 rounded-md border border-border flex items-center gap-1">
        <LocateIcon size={12} />
        <span className="text-xs text-slate-500 tabular-nums block">
            {`(${coordinates.x.toFixed(2)}, ${coordinates.y.toFixed(2)})`}
        </span>
        <span className="h-[10px] w-[1px] bg-black/25 mx-0.5" />
        <SearchIcon size={12} />
        <span className="text-xs text-slate-500 tabular-nums block">
            {scale.toFixed(2)}
        </span>
    </div>
}

export default function NetworkMap() {
    const inspector = useInspector();

    const mapControllerRef = useRef<MapSurfaceController>(null!);
    const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
    const [scale, setScale] = useState<number>(1);
    const [logicalCoordinates, setLogicalCoordinates] = useState<Point>({ x: 0, y: 0 });
    const [physicalCoordinates, setPhysicalCoordinates] = useState<[number, number]>([0, 0]);
    const [withGrid, setWithGrid] = useState<number>(100);
    const [withCenterCrosshair, setWithCenterCrosshair] = useState<boolean>(true);
    const [hoveringElementsIndices, setHoveringElementsIndices] = useState<number[]>([]);

    const inspectionPane = useInspectionPane();

    const hoverLabels = useMemo(() => {
        const ret = [
            ...Object.values(inspector.state.subscriptions).map(subscription => (
                `Subscription '${subscription.id}'`
            )),

            ...Object.values(inspector.state.matchers).map(matcher => (
                `Matcher #${matcher.id}`
            )),
    
            ...Object.values(inspector.state.clients).map(client => (
                `Client '${client.id}'`
            )),
        ];

        if (inspectionPane.currentPublicationInspection) {
            ret.push(`Publication '${inspectionPane.currentPublicationInspection.pub.pubID}'`);
        }

        return ret;
    }, [inspector.state.matchers, inspector.state.clients, inspector.state.subscriptions, inspectionPane.currentPublicationInspection]);

    function handleCreateSnapshot() {
        const canvas = mapControllerRef.current.getCanvas();
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `NetworkMap-${Date.now()}.png`;
        link.click();
    }

    const mapElements: MapElement[] = [
        ...Object.values(inspector.state.subscriptions).map(subscription => {
            const entry: MapElement = {
                elementType: 'region',
                region: subscription.aoi,
                regionType: 'subscription'
            };

            return entry;
        }),

        ...Object.values(inspector.state.matchers).map(matcher => {
            const entry: MapElement = {
                elementType: 'point',
                point: matcher.pos,
                pointType: 'matcher'
            };

            return entry;
        }),

        ...Object.values(inspector.state.clients).map(client => {
            const entry: MapElement = {
                elementType: 'point',
                point: client.pos,
                pointType: 'client'
            };

            return entry;
        }),

        ...(inspectionPane.currentPublicationInspection ? [
                {
                    elementType: 'region',
                    region: inspectionPane.currentPublicationInspection.pub.aoi,
                    regionType: 'publication'
                } satisfies MapElement
            ] : []
        )
    ];

    function handleExportElements() {
        const blob = new Blob([JSON.stringify(mapElements)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `NetworkMapElements-${Date.now()}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    return <div className="flex h-full items-center justify-center relative">
        <MapController
            onZoomIn={() => setScale(scale => scale * 1.1)}
            onZoomOut={() => setScale(scale => scale / 1.1)}
            onFit={() => {
                const idealVP = mapControllerRef.current.getIdealViewport();

                setCenter(idealVP.center);
                setScale(idealVP.scale);
            }}
            onSnapshot={handleCreateSnapshot}
            onExportElements={handleExportElements}

            gridInterval={withGrid}
            onGridIntervalChange={setWithGrid}

            withCenterCrosshair={withCenterCrosshair}
            onCenterCrosshairChange={setWithCenterCrosshair}
        />
        <MapSurface
            center={center}
            scale={scale}
            onRescale={setScale}
            onMouseMove={(logicalCoordinates, physicalCoordinates) => {
                setLogicalCoordinates(logicalCoordinates);
                setPhysicalCoordinates(physicalCoordinates);
            }}
            onInteractionEnd={() => setLogicalCoordinates(center)}
            onMove={setCenter}
            onElementsHovering={setHoveringElementsIndices}
            elements={mapElements}
            ref={mapControllerRef}
            withGrid={withGrid}
            withCenterCrosshair={withCenterCrosshair}
        />
        <MapViewportIndicator scale={scale} coordinates={logicalCoordinates} />
        {
            hoveringElementsIndices.length > 0 &&
            <div className="absolute w-52 bg-white shadow-md border border-border overflow-hidden rounded-md py-1 px-2 flex flex-col gap-2" style={{
                top: `${physicalCoordinates[1]}px`,
                left: `${physicalCoordinates[0] - 220}px`
            }}>
            {
                hoveringElementsIndices.map(index => (
                    <div key={index} className="text-xs text-slate-500">
                        {hoverLabels[index]}
                    </div>
                ))
            }
            </div>
        }
    </div>
}

// renderMapElement(ctx, {
//     elementType: 'point',
//     point: { x: 10, y: 20 },
//     pointType: 'client'
// }, viewport);


// renderMapElement(ctx, {
//     elementType: 'point',
//     point: { x: 30, y: 20 },
//     pointType: 'matcher'
// }, viewport);

// renderMapElement(ctx, {
//     elementType: 'region',
//     region: {
//         isPolygon: true,
//         points: [
//             { x: 120, y: 120 },
//             { x: 180, y: 120 },
//             { x: 180, y: 180 },
//             { x: 120, y: 180 }
//         ]
//     },
//     regionType: 'subscription'
// }, viewport);

// renderMapElement(ctx, {
//     elementType: 'region',
//     region: {
//         isPolygon: false,
//         center: { x: 200, y: 200 },
//         radius: 70
//     },
//     regionType: 'subscription'
// }, viewport);