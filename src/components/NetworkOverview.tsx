import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { LocateFixed, Network, RadioReceiver, X } from "lucide-react"
import { Button } from "./ui/button"
import { Client, Matcher, Subscription, useInspector } from "@/lib/Inspector"
import { useEffect, useMemo } from "react";

function SubscriptionEntry({ subscription }: { subscription: Subscription }) {
    return <div className="flex flex-row gap-2">
        <span className="mt-0.5">
            <LocateFixed size={20} />
        </span>
        <div className="flex flex-col">
            <span className="mb-1">Subscription</span>
            <div className="text-xs flex flex-col">
                <span>
                    ID: {subscription.id}
                </span>
                <span>
                    Channel: {subscription.channel}
                </span>
                <span>
                    Region: {
                        subscription.aoi.isPolygon === true ?
                            `Poly(vertices = ${subscription.aoi.points.length}, follow = ${subscription.followClient})` :
                            `Circular(x = ${subscription.aoi.center.x}, y = ${subscription.aoi.center.y}, radius = ${subscription.aoi.radius}, follow = ${subscription.followClient})`
                    }
                </span>
            </div>
        </div>
    </div>
}

function ClientEntry({ client }: { client: Client }) {
    const inspector = useInspector();

    const clientSubscriptions = useMemo(() => {
        return Object.values(inspector.state.subscriptions).filter(sub => sub.clientId === client.id);
    }, [client, inspector.state.subscriptions]);
    
    return <div className="pl-4">
        <span className="flex flex-row gap-2 items-center py-2">
            <RadioReceiver size={20} />
            Client {JSON.stringify(client.id)}
        </span>
        {
            clientSubscriptions.length > 0 &&
            <div className="border-l pl-4 py-2 border-slate-500">
                {
                    clientSubscriptions.map(subscription => <SubscriptionEntry key={subscription.id} subscription={subscription} />)
                }
            </div>
        }
    </div>
}

function MatcherEntry({ matcher }: { matcher: Matcher }) {
    const inspector = useInspector();

    const matcherClients = useMemo(() => {
        return Object.values(inspector.state.clients).filter(client => client.matcherId === matcher.id);
    }, [matcher, inspector.state.clients]);

    return <>
        <div className="flex flex-row gap-2 justify-between">
            <span className="flex flex-row gap-2 items-center py-2">
                <Network size={20} />
                Matcher #{matcher.id} (known as {matcher.alias})
            </span>
            {
            // TODO: Implement remove matcher
            /* <div>
                <Button size="icon" variant="ghost">
                    <X size={20} />
                </Button>
            </div> */
            }
        </div>
        {
            matcherClients.length > 0 && 
            <div className="border-l border-slate-500">
                {
                    matcherClients.map(client => <ClientEntry key={client.id} client={client} />)
                }
            </div>
        }
    </>
}

export default function NetworkOverview() {
    const inspector = useInspector();

    const matchers = useMemo(() => {
        return Object.values(inspector.state.matchers);
    }, [inspector.state.matchers]);

    if (matchers.length === 0) 
        return <span className="text-xs text-slate-500 text-center">
            No matchers have been added yet.
        </span>

    return <div>
        {
            matchers.map((matcher) => (
                <MatcherEntry key={matcher.id} matcher={matcher} />
            ))
        }
    </div>
}
