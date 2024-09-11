import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
    MenubarLabel
} from "@/components/ui/menubar"
import { useInspector } from "@/lib/Inspector"
import { ClientJoinMessage, ClientLeaveMessage, ClientMoveMessage, DisseminationMessage, PubMessage, SubscriptionDeleteMessage, SubscriptionNewMessage, TypedMessage } from "@/lib/messages";
import { useMemo } from "react";

export default function EventLogMenu({
    messageTypesEnabled,
    onEnableMessageTypesChanged,
    clientsDisabled,
    onClientsDisabledChanged,
    channelsDisabled,
    onChannelsDisabledChanged
}: {
    messageTypesEnabled: TypedMessage['type'][],
    onEnableMessageTypesChanged: (types: TypedMessage['type'][]) => void,
    clientsDisabled: string[],
    onClientsDisabledChanged: (clients: string[]) => void,
    channelsDisabled: string[],
    onChannelsDisabledChanged: (channels: string[]) => void
}) {
    const inspector = useInspector();

    const channels = useMemo(() => {
        const set = new Set([
            ...Object.values(inspector.state.subscriptions).map(sub => sub.channel),
            ...inspector.state.events.map(event => (
                event.type === 'pub' ? (event as PubMessage).pub.channel :
                event.type === 'dissemination' ? (event as DisseminationMessage).sub.channel :
                event.type === 'sub-new' ? (event as SubscriptionNewMessage).sub.channel :
                event.type === 'sub-delete' ? (event as SubscriptionDeleteMessage).sub.channel :
                event.type === 'client-join' ? (event as ClientJoinMessage).client.id :
                event.type === 'client-leave' ? (event as ClientLeaveMessage).client.id :
                event.type === 'client-move' ? (event as ClientMoveMessage).client.id :
                ''
            ))
        ]);
        set.delete('');
        return Array.from(set).sort();
    }, [inspector.state.events]);

    function createMessageTypeChangeHandler(type: TypedMessage['type']) {
        return function handler(checked: boolean) {
            if (checked) {
                onEnableMessageTypesChanged([...messageTypesEnabled, type]);
            } else {
                onEnableMessageTypesChanged(messageTypesEnabled.filter(t => t !== type));
            }
        }
    }

    return (
        <Menubar>
            <MenubarMenu>
                <MenubarTrigger>Types</MenubarTrigger>
                <MenubarContent>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('info')} 
                        onCheckedChange={createMessageTypeChangeHandler('info')}
                    >
                        Session Started
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('sub-new')}
                        onCheckedChange={createMessageTypeChangeHandler('sub-new')}
                    >
                        Subscription Created
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('sub-update')}
                        onCheckedChange={createMessageTypeChangeHandler('sub-update')}
                    >
                        Subscription Updated
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('sub-delete')}
                        onCheckedChange={createMessageTypeChangeHandler('sub-delete')}
                    >
                        Subscription Deleted
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('client-join')}
                        onCheckedChange={createMessageTypeChangeHandler('client-join')}
                    >
                        Client Joined
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('client-move')}
                        onCheckedChange={createMessageTypeChangeHandler('client-move')}
                    >
                        Client Moved
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('client-leave')}
                        onCheckedChange={createMessageTypeChangeHandler('client-leave')}
                    >
                        Client Left
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('pub')}
                        onCheckedChange={createMessageTypeChangeHandler('pub')}
                    >
                        Publication
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem 
                        checked={messageTypesEnabled.includes('dissemination')}
                        onCheckedChange={createMessageTypeChangeHandler('dissemination')}
                    >
                        Dissemination
                    </MenubarCheckboxItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Clients</MenubarTrigger>
                <MenubarContent>
                    {
                        Object.values(inspector.state.clients).map(client => <MenubarCheckboxItem 
                            key={client.id}
                            checked={!clientsDisabled.includes(client.id)}
                            onCheckedChange={checked => {
                                if (checked) {
                                    onClientsDisabledChanged(clientsDisabled.filter(id => id !== client.id));
                                } else {
                                    onClientsDisabledChanged([...clientsDisabled, client.id]);
                                }
                            }}
                        >
                            {`'${client.id}'`}
                        </MenubarCheckboxItem>)
                    }
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Channels</MenubarTrigger>
                <MenubarContent>
                    {
                        channels.map(channel => <MenubarCheckboxItem 
                            key={channel}
                            checked={!channelsDisabled.includes(channel)}
                            onCheckedChange={checked => {
                                if (checked) {
                                    onChannelsDisabledChanged(channelsDisabled.filter(c => c !== channel));
                                } else {
                                    onChannelsDisabledChanged([...channelsDisabled, channel]);
                                }
                            }}
                        >
                            {channel}
                        </MenubarCheckboxItem>)
                    }
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}
