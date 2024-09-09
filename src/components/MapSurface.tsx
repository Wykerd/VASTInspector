import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon"
import { Point, Region } from "@/lib/messages";

export interface MapRegion {
    elementType: "region",
    region: Region,
    regionType: "subscription" | "publication"
}

export interface MapPoint {
    elementType: "point",
    point: Point,
    pointType: "client" | "matcher"
}

export type MapElement = MapRegion | MapPoint;

export interface MapViewport {
    physical: {
        width: number,
        height: number
    },
    center: Point,
    scale: number
}

function getPhysicalCenter(viewport: MapViewport): Point {
    return {
        x: viewport.physical.width / 2,
        y: viewport.physical.height / 2
    };
}

/**
 * Takes a point in the logical coordinate system and transforms it to the canvas coordinate system
 * @param point 
 * @param viewport 
 */
function transformPoint(point: Point, viewport: MapViewport): [number, number] {
    const physicalCenter = getPhysicalCenter(viewport);

    // we need to remember that the canvas coordinate system is flipped
    const x = physicalCenter.x + (point.x - viewport.center.x) * viewport.scale;
    const y = physicalCenter.y - (point.y - viewport.center.y) * viewport.scale;

    return [x, y];
}

function transformToLogical(point: [number, number], viewport: MapViewport): Point {
    const physicalCenter = getPhysicalCenter(viewport);

    const x = viewport.center.x + (point[0] - physicalCenter.x) / viewport.scale;
    const y = viewport.center.y - (point[1] - physicalCenter.y) / viewport.scale;

    return { x, y };
}

function renderCenterCrosshair(ctx: CanvasRenderingContext2D, vp: MapViewport) {
    const centerCrosshairSize = 10;

    const physicalCenter = getPhysicalCenter(vp);

    ctx.save();

    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgb(0 0 0 / 0.5)';

    ctx.beginPath();
    ctx.moveTo(physicalCenter.x - (centerCrosshairSize / 2), physicalCenter.y);
    ctx.lineTo(physicalCenter.x + (centerCrosshairSize / 2), physicalCenter.y);
    ctx.moveTo(physicalCenter.x, physicalCenter.y - (centerCrosshairSize / 2));
    ctx.lineTo(physicalCenter.x, physicalCenter.y + (centerCrosshairSize / 2));
    ctx.stroke();

    ctx.restore();
}

function renderGrid(ctx: CanvasRenderingContext2D, vp: MapViewport, gridSpacing: number) {
    const edgeTopLeft = transformToLogical([0, 0], vp);
    const edgeBottomRight = transformToLogical([vp.physical.width, vp.physical.height], vp);

    const firstLineX = edgeTopLeft.x - (edgeTopLeft.x % gridSpacing);
    const firstLineY = edgeTopLeft.y - (edgeTopLeft.y % gridSpacing);
    
    const lastLineX = edgeBottomRight.x - (edgeBottomRight.x % gridSpacing);
    const lastLineY = edgeBottomRight.y - (edgeBottomRight.y % gridSpacing);

    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0 0 0 / 0.1)';

    let shouldDrawCenterLineX = false,
        shouldDrawCenterLineY = false;

    ctx.beginPath();

    for (let x = firstLineX; x <= lastLineX; x += gridSpacing) {
        const [ physicalX, _ ] = transformPoint({ x, y: 0 }, vp);

        if (x === 0) 
            shouldDrawCenterLineX = true;

        ctx.moveTo(physicalX, 0);
        ctx.lineTo(physicalX, vp.physical.height);
    }

    for (let y = firstLineY; y >= lastLineY; y -= gridSpacing) {
        const [ _, physicalY ] = transformPoint({ x: 0, y }, vp);

        if (y === 0)
            shouldDrawCenterLineY = true;

        ctx.moveTo(0, physicalY);
        ctx.lineTo(vp.physical.width, physicalY);
    }

    ctx.stroke();

    if (shouldDrawCenterLineX || shouldDrawCenterLineY) {
        ctx.strokeStyle = 'rgb(255 0 0 / 0.15)';

        const [ physicalX, physicalY ] = transformPoint({ x: 0, y: 0 }, vp);

        ctx.beginPath();

        if (shouldDrawCenterLineX) {
            ctx.moveTo(physicalX, 0);
            ctx.lineTo(physicalX, vp.physical.height);
        }

        if (shouldDrawCenterLineY) {
            ctx.moveTo(0, physicalY);
            ctx.lineTo(vp.physical.width, physicalY);
        }

        ctx.stroke();
    }

    ctx.restore();
}

function renderMapPoint(ctx: CanvasRenderingContext2D, point: MapPoint, viewport: MapViewport, isHovering: boolean) {
    const [ x, y ] = transformPoint(point.point, viewport);

    ctx.save();

    ctx.fillStyle = 
        point.pointType === 'client' 
            ? isHovering ? 'rgb(190 18 60)' : 'rgb(244 63 94)' 
            : isHovering ? 'rgb(4 120 87)' : 'rgb(16 185 129)';

    ctx.beginPath();
    ctx.arc(x, y, isHovering ? 6 : 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
}

function renderMapRegion(ctx: CanvasRenderingContext2D, region: MapRegion, viewport: MapViewport, isHovering: boolean) {
    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = region.regionType === 'publication' ? 'rgb(139 92 246)' : 'rgb(6 182 212)';
    ctx.fillStyle = 
        region.regionType === 'publication' 
            ? `rgb(139 92 246 / ${isHovering ? 0.2 : 0.1})` 
            : `rgb(6 182 212 / ${isHovering ? 0.2 : 0.1})` ;

    ctx.beginPath();

    if (region.region.isPolygon) {
        const [ firstPoint, ...points] = region.region.points;

        const [ x, y ] = transformPoint(firstPoint, viewport);

        ctx.moveTo(x, y);

        for (const point of points) {
            const [ x, y ] = transformPoint(point, viewport);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
    } else {
        const { center, radius } = region.region;

        const [ x, y ] = transformPoint(center, viewport);

        ctx.arc(x, y, radius * viewport.scale, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.fill();

    ctx.restore();
}

function renderMapElement(ctx: CanvasRenderingContext2D, element: MapElement, viewport: MapViewport, isHovering: boolean) {
    switch (element.elementType) {
        case 'region':
            return renderMapRegion(ctx, element, viewport, isHovering);
        case 'point':
            return renderMapPoint(ctx, element, viewport, isHovering);
        default:
            throw new Error('Invalid element type');
    }
}

const FIT_PADDING = 20;

function determineFitViewport(elements: MapElement[], viewport: MapViewport): { center: Point, scale: number } {
    const minX = Math.min(...elements
        .map(element => {
            if (element.elementType === 'point') {
                return element.point.x - 4;
            } else {
                if (element.region.isPolygon) {
                    return Math.min(...element.region.points.map(({ x }) => x));
                } else {
                    return element.region.center.x - element.region.radius;
                }
            }
        })) - FIT_PADDING;

    const minY = Math.min(...elements
        .map(element => {
            if (element.elementType === 'point') {
                return element.point.y - 4;
            } else {
                if (element.region.isPolygon) {
                    return Math.min(...element.region.points.map(({ y }) => y));
                } else {
                    return element.region.center.y - element.region.radius;
                }
            }
        })) - FIT_PADDING;

    const maxX = Math.max(...elements
        .map(element => {
            if (element.elementType === 'point') {
                return element.point.x + 4;
            } else {
                if (element.region.isPolygon) {
                    return Math.max(...element.region.points.map(({ x }) => x));
                } else {
                    return element.region.center.x + element.region.radius;
                }
            }
        })) + FIT_PADDING;

    const maxY = Math.max(...elements
        .map(element => {
            if (element.elementType === 'point') {
                return element.point.y + 4;
            } else {
                if (element.region.isPolygon) {
                    return Math.max(...element.region.points.map(({ y }) => y));
                } else {
                    return element.region.center.y + element.region.radius;
                }
            }
        })) + FIT_PADDING;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const logicalWidth = maxX - minX;
    const logicalHeight = maxY - minY;

    const scaleX = viewport.physical.width / logicalWidth;
    const scaleY = viewport.physical.height / logicalHeight;

    const scale = Math.min(scaleX, scaleY);

    return {
        center: { x: centerX, y: centerY },
        scale
    };
}

function isPointInElement(point: Point, element: MapElement, viewport: MapViewport): boolean {
    switch (element.elementType) {
        case 'point':
            const distance = Math.sqrt(
                Math.pow(point.x - element.point.x, 2) +
                Math.pow(point.y - element.point.y, 2)
            );

            if (distance <= 8 / viewport.scale) return true;

            return false;

        case 'region':
            if (element.region.isPolygon) {
                return booleanPointInPolygon(
                    [point.x, point.y],
                    {
                        type: 'Polygon',
                        coordinates: [element.region.points.map(({ x, y }) => [x, y])]
                    }
                );
            } else {
                const distance = Math.sqrt(
                    Math.pow(point.x - element.region.center.x, 2) +
                    Math.pow(point.y - element.region.center.y, 2)
                );

                if (distance <= element.region.radius) return true;

                return false;
            }
    
        default:
            throw new Error('Invalid element type');
    }
}

export interface MapSurfaceController {
    getCanvas: () => HTMLCanvasElement,
    getIdealViewport: () => { center: Point, scale: number }
}

export interface MapSurfaceProps {
    onMove?: (center: Point) => void,
    onRescale?: (scale: number) => void,
    onMouseMove?: (logicalCoords: Point, physicalCoords: [number, number]) => void,
    onInteractionEnd?: () => void,
    onElementsHovering?: (indices: number[]) => void,
    center: Point,
    scale: number,
    elements: MapElement[],
    withGrid?: boolean | number,
    withCenterCrosshair?: boolean
}

const MapSurface = forwardRef<MapSurfaceController, MapSurfaceProps>(function MapSurface({
    onMove,
    onRescale,
    onMouseMove,
    onInteractionEnd,
    onElementsHovering,
    center,
    scale,
    elements,
    withGrid,
    withCenterCrosshair
}, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null!);
    const [ interactionStartPhysicalPoint, setInteractionStartPhysicalPoint ] = useState<[number, number] | null>(null);
    const [ interactionStartLogicalCenter, setInteractionStartLogicalCenter ] = useState<Point | null>(null);

    const [ hoveringElementsIndices, setHoveringElementsIndices ] = useState<number[]>([]);

    const [ dimensions, setDimensions ] = useState({ width: 0, height: 0 });

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        getIdealViewport: () => determineFitViewport(elements, {
            physical: dimensions,
            center,
            scale
        })
    } satisfies MapSurfaceController), [elements, dimensions, center, scale]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            const { width, height } = canvasRef.current.getBoundingClientRect();
            setDimensions({ width, height });
        });

        resizeObserver.observe(canvasRef.current);

        // stop rubber banding
        function handleMouseWheel(e: WheelEvent) {
            e.preventDefault();
        }

        canvasRef.current.addEventListener('wheel', handleMouseWheel, { passive: false });

        return () => {
            resizeObserver.disconnect();
        }
    }, []);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const viewport: MapViewport = {
            physical: dimensions,
            center,
            scale
        }

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        ctx.beginPath();

        if (withCenterCrosshair) renderCenterCrosshair(ctx, viewport);

        if (withGrid) renderGrid(ctx, viewport, withGrid === true ? 100 : withGrid);

        elements.forEach((element, index) => renderMapElement(ctx, element, viewport, hoveringElementsIndices.includes(index)));
    }, [dimensions, center, scale, withCenterCrosshair, withGrid, elements, hoveringElementsIndices]);

    return <canvas 
        className="w-full h-full overscroll-y-none" 
        width={dimensions.width} 
        height={dimensions.height} 
        ref={canvasRef}
        onMouseMove={e => {
            const rect = canvasRef.current.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            const logicalCoords = transformToLogical([relativeX, relativeY], {
                physical: dimensions,
                center,
                scale
            });

            onMouseMove?.(logicalCoords, [relativeX, relativeY]);

            if (interactionStartPhysicalPoint && interactionStartLogicalCenter) {
                const dx = relativeX - interactionStartPhysicalPoint[0];
                const dy = relativeY - interactionStartPhysicalPoint[1];

                const logicalDeltaX = dx / scale;
                const logicalDeltaY = dy / scale;

                const newLogicalCenter = {
                    x: interactionStartLogicalCenter.x - logicalDeltaX,
                    y: interactionStartLogicalCenter.y + logicalDeltaY
                };

                onMove?.(newLogicalCenter);
            }

            const hitElements = elements
                .map((v, i) => [v, i] as const)
                .filter(([element]) => isPointInElement(logicalCoords, element, {
                    physical: dimensions,
                    center,
                    scale
                }))
                .map(([_, i]) => i);

            setHoveringElementsIndices(hitElements);

            onElementsHovering?.(hitElements);
        }}
        onMouseLeave={() => {
            onInteractionEnd?.();
            setInteractionStartPhysicalPoint(null);
            setInteractionStartLogicalCenter(null);
            setHoveringElementsIndices([]);
            onElementsHovering?.([]);
        }}
        onMouseDown={e => {
            const rect = canvasRef.current.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;

            setInteractionStartPhysicalPoint([relativeX, relativeY]);
            setInteractionStartLogicalCenter({...center});
        }}
        onMouseUp={() => {
            setInteractionStartPhysicalPoint(null);
            setInteractionStartLogicalCenter(null);
        }}
        onWheel={e => {
            const delta = e.deltaY;

            // use logarithmic scaling
            const newScale = scale * (1 + delta / 1000);

            onRescale?.(newScale);
        }}
    >
        You're browser is ancient
    </canvas>
});

export default MapSurface;