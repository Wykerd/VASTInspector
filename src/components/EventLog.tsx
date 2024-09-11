import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Antenna, CirclePlus, Compass, Locate, LocateFixed, LocateOff, LucideIcon, Radio, Unplug, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { Button } from "./ui/button"
import { useInspector } from "@/lib/Inspector"
import { ClientJoinMessage, ClientLeaveMessage, ClientMoveMessage, DisseminationMessage, InfoMessage, PubMessage, SubscriptionDeleteMessage, SubscriptionNewMessage, SubscriptionUpdateMessage, TypedMessage } from "@/lib/messages"
import { useVirtualizer } from '@tanstack/react-virtual';
import EventLogMenu from "./EventLogMenu"
import { useInspectionPane } from "@/lib/InspectionPaneProvider"

function EventLogEntry({
    log, icon: Icon, timestamp, children
}: {
    log: string,
    icon: LucideIcon,
    timestamp: number,
    children?: React.ReactNode
}) {
    const formattedTime = useMemo(() => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        }).format(timestamp)
    }, [timestamp]);

    return <>
        <div className="text-xs flex flex-row gap-2 items-center justify-between py-2 border-b border-border">
            <div className="flex flex-row gap-2 items-center">
                <Icon size={16} />
                <span>
                    {log}
                </span>
            </div>
            <div className="flex flex-row gap-2 items-center">
                {
                    children
                }
                <span className="text-slate-500">
                    {formattedTime}
                </span>
            </div>
        </div>
    </>
}

function toMessage(event: TypedMessage) {
    switch (event.type) {
        case 'client-join':
            {
                const join = event as ClientJoinMessage;
                return `Client '${join.client.id}' joined on matcher #${join.client.matcherID}`
            }
        case 'client-leave':
            {
                const leave = event as ClientLeaveMessage;
                return `Client '${leave.client.id}' left matcher #${leave.client.matcherID}`
            }

        case 'client-move':
            {
                const move = event as ClientMoveMessage;
                return `Client '${move.client.id}' moved to (${move.client.pos.x}, ${move.client.pos.y})`
            }

        case 'info':
            {
                const info = event as InfoMessage;
                return `Inspector session started for matcher #${info.id}`
            }

        case 'sub-new':
            {
                const sub = event as SubscriptionNewMessage;
                return `Client '${sub.sub.clientID}' created subscription '${sub.sub.subID}' on channel '${sub.sub.channel}'`
            }

        case 'sub-delete':
            {
                const sub = event as SubscriptionDeleteMessage;
                return `Client '${sub.sub.clientID}' dropped subscription '${sub.sub.subID}'`
            }

        case 'pub':
            {
                const pub = event as PubMessage;
                return `Client '${pub.pub.clientID}' published message on channel '${pub.pub.channel}'`
            }

        case 'dissemination':
            {
                const dis = event as DisseminationMessage;
                return `Matcher #${dis.sub.hostID} disseminated message on channel '${dis.sub.channel}' to '${dis.sub.subID}'`
            }

        case "sub-update":
            {
                const update = event as SubscriptionUpdateMessage;
                return `Client '${update.sub.clientID}' updated subscription '${update.sub.subID}' on channel '${update.sub.channel}'`
            }

        default:
            return `Unknown event type: ${event.type}`;
            break;
    }

}

export default function EventLog() {
    const inspector = useInspector();
    const inspectionPane = useInspectionPane();

    const [enabledMessageTypes, setEnabledMessageTypes] = useState<TypedMessage['type'][]>([
        'info', 'sub-new', 'sub-update', 'sub-delete', 'client-join', 'client-move', 'client-leave', 'pub', 'dissemination'
    ]);
    const [clientsDisabled, setClientsDisabled] = useState<string[]>([]);
    const [channelsDisabled, setChannelsDisabled] = useState<string[]>([]);

    const parentRef = useRef<HTMLDivElement>(null!);

    const filteredEvents = useMemo(() => {
        return inspector.state.events.filter(event => (
            enabledMessageTypes.includes(event.type) &&
            (
                event.type === 'client-join' ? !clientsDisabled.includes((event as ClientJoinMessage).client.id) :
                event.type === 'client-leave' ? !clientsDisabled.includes((event as ClientLeaveMessage).client.id) :
                event.type === 'client-move' ? !clientsDisabled.includes((event as ClientMoveMessage).client.id) :
                event.type === 'sub-new' ? !channelsDisabled.includes((event as SubscriptionNewMessage).sub.channel) && !clientsDisabled.includes((event as SubscriptionNewMessage).sub.clientID) :
                event.type === 'sub-delete' ? !channelsDisabled.includes((event as SubscriptionDeleteMessage).sub.channel) && !clientsDisabled.includes((event as SubscriptionDeleteMessage).sub.clientID) :
                event.type === 'sub-update' ? !channelsDisabled.includes((event as SubscriptionUpdateMessage).sub.channel) && !clientsDisabled.includes((event as SubscriptionUpdateMessage).sub.clientID) :
                event.type === 'pub' ? !channelsDisabled.includes((event as PubMessage).pub.channel) && !clientsDisabled.includes((event as PubMessage).pub.clientID) :
                event.type === 'dissemination' ? !channelsDisabled.includes((event as DisseminationMessage).sub.channel) :
                true
            )
        ));
    }, [inspector.state.events, enabledMessageTypes, clientsDisabled, channelsDisabled]);

    const rowVirtualizer = useVirtualizer({
        count: filteredEvents.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 33,
        overscan: 10,
    });

    return (
        <div className="flex flex-col h-full">
            <div className="py-2 bg-white border-b border-border mx-4 flex flex-row gap-2 items-center justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <h4 className="text-sm font-bold leading-none">Events</h4>
                    <EventLogMenu 
                        messageTypesEnabled={enabledMessageTypes}
                        onEnableMessageTypesChanged={setEnabledMessageTypes}
                        clientsDisabled={clientsDisabled}
                        onClientsDisabledChanged={setClientsDisabled}
                        channelsDisabled={channelsDisabled}
                        onChannelsDisabledChanged={setChannelsDisabled}
                    />
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <span className="tabular-nums text-xs text-gray-500">
                        {
                            new Intl.NumberFormat('en-US').format(filteredEvents.length)
                        } {filteredEvents.length === 1 ? 'event' : 'events'}
                    </span>
                    <Button onClick={() => inspector.clearEvents()} variant="secondary" size="xxs">
                        <X size={16} />
                        Clear
                    </Button>
                </div>
            </div>
            <div className="px-4 overflow-auto grow" ref={parentRef}>
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <div
                            key={virtualItem.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <EventLogEntry
                                log={toMessage(filteredEvents[virtualItem.index])}
                                timestamp={filteredEvents[virtualItem.index].time.getTime()}
                                icon={
                                    filteredEvents[virtualItem.index].type === "client-join" ? CirclePlus :
                                    filteredEvents[virtualItem.index].type === "client-leave" ? Unplug :
                                    filteredEvents[virtualItem.index].type === "client-move" ? Compass :
                                    filteredEvents[virtualItem.index].type === "pub" ? Radio :
                                    filteredEvents[virtualItem.index].type === "sub-new" ? Locate :
                                    filteredEvents[virtualItem.index].type === "sub-update" ? LocateFixed :
                                    filteredEvents[virtualItem.index].type === "sub-delete" ? LocateOff :
                                    Antenna
                                }
                            >
                            {
                                (filteredEvents[virtualItem.index].type === 'pub') &&
                                <button 
                                    className="hover:underline"
                                    onClick={() => {
                                        inspectionPane.inspectPublication(filteredEvents[virtualItem.index] as PubMessage);
                                    }}
                                >
                                    Details
                                </button>
                            }
                            </EventLogEntry>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
