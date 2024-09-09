import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import NetworkOverview from "./components/NetworkOverview"
import AddMatcherButton from "./components/AddMatcherButton"
import EventLog from "./components/EventLog"
import NetworkMap from "./components/NetworkMap"

export default function App() {
    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="min-h-screen"
        >
            <ResizablePanel defaultSize={25}>
                <div className="flex flex-col p-6 gap-6">
                    <div className="flex flex-row justify-between items-center">
                        <h1 className="font-bold text-xl">
                            VAST Inspector
                        </h1>
                        <AddMatcherButton />
                    </div>
                    <NetworkOverview />
                </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
                <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={75}>
                        <NetworkMap />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={25} className="relative">
                        <EventLog />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={25}>
                <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Stats</span>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
