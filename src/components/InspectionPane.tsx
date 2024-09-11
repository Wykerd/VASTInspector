import { useInspectionPane } from "@/lib/InspectionPaneProvider"
import { Button } from "./ui/button";

export default function InspectionPane() {
    const inspectionPane = useInspectionPane();

    return <div className="flex flex-col h-full p-6 text-sm">
        <h2 className="text-xl font-bold">
            Inspection
        </h2>
        {
            inspectionPane.currentPublicationInspection ?
            <div className="text-xs text-slate-600">
                Inspecting publication {inspectionPane.currentPublicationInspection.pub.pubID}
            </div> :
            <div className="text-xs text-slate-600">
                Not inspecting anything. Click 'details' on a publication event to inspect it.
            </div>
        }
        {
            inspectionPane.currentPublicationInspection &&
            <>
                <span className="mb-1 mt-4">
                    From client '{inspectionPane.currentPublicationInspection.pub.clientID}' to matcher #{inspectionPane.currentPublicationInspection.pub.matcherID}
                </span>
                <span className="mb-1">
                    Channel: {inspectionPane.currentPublicationInspection.pub.channel}
                </span>
                <span className="mb-1">
                    Region: {
                        inspectionPane.currentPublicationInspection.pub.aoi.isPolygon === true ?
                            `Poly(vertices = ${inspectionPane.currentPublicationInspection.pub.aoi.points.length})` :
                            `Circular(x = ${inspectionPane.currentPublicationInspection.pub.aoi.center.x}, y = ${inspectionPane.currentPublicationInspection.pub.aoi.center.y}, radius = ${inspectionPane.currentPublicationInspection.pub.aoi.radius})`
                    }. Shown on map.
                </span>
                <span className="mb-1">
                    Payload
                </span>
                <pre className="text-xs text-wrap whitespace-pre-wrap break-all">
                    {
                        JSON.stringify(inspectionPane.currentPublicationInspection.pub.payload)
                    }
                </pre>
                <Button className="mt-8" onClick={() => inspectionPane.clear()}>
                    Clear Inspection
                </Button>
            </>
        }
    </div>
}