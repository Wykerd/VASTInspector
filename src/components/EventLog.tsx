import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Antenna, CirclePlus, Compass, Locate, LocateFixed, LocateOff, LucideIcon, Radio, Unplug } from "lucide-react"
import { useMemo, useRef } from "react"
import { Button } from "./ui/button"
import { useInspector } from "@/lib/Inspector"
import { ClientJoinMessage, ClientLeaveMessage, ClientMoveMessage, DisseminationMessage, InfoMessage, PubMessage, SubscriptionDeleteMessage, SubscriptionNewMessage, TypedMessage } from "@/lib/messages"
import { useVirtualizer } from '@tanstack/react-virtual';

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

        default:
            return "Unknown event";
            break;
    }

}

export default function EventLog() {
    const inspector = useInspector();

    const parentRef = useRef<HTMLDivElement>(null!);

    const rowVirtualizer = useVirtualizer({
        count: inspector.state.events.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 33,
        overscan: 10,
    });

    return (
        <div className="flex flex-col h-full">
            <div className="py-4 bg-white border-b border-border mx-4">
                <h4 className="text-sm font-medium leading-none">Events</h4>
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
                                log={toMessage(inspector.state.events[virtualItem.index])}
                                timestamp={inspector.state.events[virtualItem.index].time.getTime()}
                                icon={
                                    inspector.state.events[virtualItem.index].type === "client-join" ? CirclePlus :
                                    inspector.state.events[virtualItem.index].type === "client-leave" ? Unplug :
                                    inspector.state.events[virtualItem.index].type === "client-move" ? Compass :
                                    inspector.state.events[virtualItem.index].type === "pub" ? Radio :
                                    inspector.state.events[virtualItem.index].type === "sub-new" ? Locate :
                                    inspector.state.events[virtualItem.index].type === "sub-delete" ? LocateOff :
                                    Antenna
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
