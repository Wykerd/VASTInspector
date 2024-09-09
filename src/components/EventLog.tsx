import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Antenna, CirclePlus, Compass, Locate, LocateFixed, LocateOff, LucideIcon, Radio, Unplug } from "lucide-react"
import { useMemo } from "react"
import { Button } from "./ui/button"
import { useInspector } from "@/lib/Inspector"
import { ClientJoinMessage, ClientLeaveMessage, ClientMoveMessage, DisseminationMessage, InfoMessage, PubMessage, SubscriptionDeleteMessage, SubscriptionNewMessage, TypedMessage } from "@/lib/messages"

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
        <div className="text-xs flex flex-row gap-2 items-center justify-between">
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
        <Separator className="my-2" />
    </>
}

function toMessage(event: TypedMessage)  {
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

    return (
        <ScrollArea className="max-h-full h-full">
            <div className="px-4">
                <div className="py-4 sticky top-0 bg-white border-b border-border mb-2">
                    <h4 className="text-sm font-medium leading-none">Events</h4>
                </div>
                {
                    inspector.state.events.map((event, index) => <EventLogEntry 
                        key={index}
                        timestamp={event.time.getTime()}
                        icon={
                            event.type === "client-join" ? CirclePlus :
                            event.type === "client-leave" ? Unplug :
                            event.type === "client-move" ? Compass :
                            event.type === "pub" ? Radio :
                            event.type === "sub-new" ? Locate :
                            event.type === "sub-delete" ? LocateOff :
                            Antenna
                        }
                        log={toMessage(event)}
                    />)
                }
            </div>
        </ScrollArea>
    )
}
