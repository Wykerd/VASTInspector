import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
    ClientJoinMessage,
    ClientJoinMessageSchema,
    ClientLeaveMessage,
    ClientLeaveMessageSchema,
    ClientMoveMessageSchema,
    DisseminationMessageSchema,
    InfoMessage,
    InfoMessageSchema,
    Message,
    Point,
    PubMessageSchema,
    Region,
    SubscriptionDeleteMessage,
    SubscriptionDeleteMessageSchema,
    SubscriptionNewMessage,
    SubscriptionNewMessageSchema,
    TypedMessage
} from "./messages";

// Define types
export interface Subscription {
    id: string;
    channel: string;
    aoi: Region;
    followClient: boolean;
    clientId: string;
    matcherId: number;
}

export interface Client {
    id: string;
    pos: Point;
    matcherId: number;
}

export interface Matcher {
    id: number;
    alias: string;
    pos: Point;
    aoi: Region;
}

interface State {
    matchers: Record<number, Matcher>;
    clients: Record<string, Client>;
    subscriptions: Record<string, Subscription>;
    events: TypedMessage[];
}

type Action =
    | { type: 'ADD_MATCHER'; payload: InfoMessage }
    | { type: 'REMOVE_SUBSCRIPTION'; payload: SubscriptionDeleteMessage }
    | { type: 'REMOVE_CLIENT'; payload: ClientLeaveMessage }
    | { type: 'ADD_CLIENT'; payload: ClientJoinMessage }
    | { type: 'MOVE_CLIENT'; payload: ClientJoinMessage }
    | { type: 'ADD_SUBSCRIPTION'; payload: SubscriptionNewMessage }
    | { type: 'ADD_PUB_EVENT'; payload: Message }
    | { type: 'ADD_INFO_EVENT'; payload: InfoMessage }
    | { type: 'ADD_SUB_DELETE_EVENT'; payload: SubscriptionDeleteMessage }
    | { type: 'ADD_CLIENT_LEAVE_EVENT'; payload: ClientLeaveMessage }
    | { type: 'ADD_CLIENT_JOIN_EVENT'; payload: ClientJoinMessage }
    | { type: 'ADD_CLIENT_MOVE_EVENT'; payload: ClientJoinMessage }
    | { type: 'ADD_SUB_NEW_EVENT'; payload: SubscriptionNewMessage } 
    | { type: 'ADD_DISSEMINATE_EVENT'; payload: Message };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'ADD_MATCHER':
            return {
                ...state,
                matchers: {
                    ...state.matchers,
                    [action.payload.id]: {
                        id: action.payload.id,
                        alias: action.payload.alias,
                        pos: action.payload.pos,
                        aoi: action.payload.aoi,
                    },
                },
                clients: action.payload.clientList.reduce((acc, client) => ({
                    ...acc,
                    [client.id]: {
                        id: client.id,
                        pos: client.pos,
                        matcherId: client.matcherID,
                    },
                }), state.clients),
                subscriptions: action.payload.subscriptions.reduce((acc, sub) => ({
                    ...acc,
                    [sub.subID]: {
                        id: sub.subID,
                        channel: sub.channel,
                        aoi: sub.aoi,
                        followClient: sub.followClient,
                        clientId: sub.clientID,
                        matcherId: sub.hostID,
                    },
                }), state.subscriptions),
            };

        case 'REMOVE_SUBSCRIPTION':
            const { [action.payload.sub.subID]: _, ...remainingSubscriptions } = state.subscriptions;
            return {
                ...state,
                subscriptions: remainingSubscriptions,
            };

        case 'REMOVE_CLIENT':
            const { [action.payload.client.id]: __, ...remainingClients } = state.clients;
            return {
                ...state,
                clients: remainingClients,
                subscriptions: Object.fromEntries(
                    Object.entries(state.subscriptions).filter(([, sub]) => sub.clientId !== action.payload.client.id)
                ),
            };

        case 'ADD_CLIENT':
            return {
                ...state,
                clients: {
                    ...state.clients,
                    [action.payload.client.id]: {
                        id: action.payload.client.id,
                        pos: action.payload.client.pos,
                        matcherId: action.payload.client.matcherID,
                    },
                },
            };

        case 'MOVE_CLIENT':
            return {
                ...state,
                clients: {
                    ...state.clients,
                    [action.payload.client.id]: {
                        ...state.clients[action.payload.client.id],
                        pos: action.payload.client.pos,
                    },
                },
            };

        case 'ADD_SUBSCRIPTION':
            return {
                ...state,
                subscriptions: {
                    ...state.subscriptions,
                    [action.payload.sub.subID]: {
                        id: action.payload.sub.subID,
                        channel: action.payload.sub.channel,
                        aoi: action.payload.sub.aoi,
                        followClient: action.payload.sub.followClient,
                        clientId: action.payload.sub.clientID,
                        matcherId: action.payload.sub.hostID,
                    },
                },
            };
        
        case 'ADD_PUB_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'pub' } as TypedMessage, ...state.events],
            };
        case 'ADD_INFO_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'info' } as TypedMessage, ...state.events],
            };
        case 'ADD_SUB_DELETE_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'sub-delete' } as TypedMessage, ...state.events],
            };
        case 'ADD_CLIENT_LEAVE_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'client-leave' } as TypedMessage, ...state.events],
            };
        case 'ADD_CLIENT_JOIN_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'client-join' } as TypedMessage, ...state.events],
            };
        case 'ADD_CLIENT_MOVE_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'client-move' } as TypedMessage, ...state.events],
            };
        case 'ADD_SUB_NEW_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'sub-new' } as TypedMessage, ...state.events],
            };
        case 'ADD_DISSEMINATE_EVENT':
            return {
                ...state,
                events: [{ ...action.payload, type: 'dissemination' } as TypedMessage, ...state.events],
            };

        default:
            return state;
    }
}

// Context
interface InspectorContextValue {
    state: State;
    dispatch: React.Dispatch<Action>;
    addMatcher: (inspectorUrl: string) => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function useInspector() {
    const context = useContext(InspectorContext);
    if (!context) {
        throw new Error("useInspector must be used within Inspector");
    }
    return context;
}

export default function Inspector({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, {
        matchers: {},
        clients: {},
        subscriptions: {},
        events: [],
    });

    const addMatcher = (inspectorUrl: string) => {
        const source = new EventSource(inspectorUrl);
        source.addEventListener("message", (ev) => {
            const data = JSON.parse(ev.data);
            console.log("Inspector: Received message", data);

            const event = Reflect.get(data, "event");

            try {
                switch (event) {
                    case -1: // HELLO
                        const infoMessage = InfoMessageSchema.parse(data);
                        dispatch({ type: 'ADD_MATCHER', payload: infoMessage });
                        dispatch({ type: 'ADD_INFO_EVENT', payload: infoMessage });
                        break;
                    case 7: // SUB_DELETE
                        const subDeleteMessage = SubscriptionDeleteMessageSchema.parse(data);
                        dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: subDeleteMessage });
                        dispatch({ type: 'ADD_SUB_DELETE_EVENT', payload: subDeleteMessage });
                        break;
                    case 4: // CLIENT_LEAVE
                        const clientLeaveMessage = ClientLeaveMessageSchema.parse(data);
                        dispatch({ type: 'REMOVE_CLIENT', payload: clientLeaveMessage });
                        dispatch({ type: 'ADD_CLIENT_LEAVE_EVENT', payload: clientLeaveMessage });
                        break;
                    case 2: // CLIENT_JOIN
                        const clientJoinMessage = ClientJoinMessageSchema.parse(data);
                        dispatch({ type: 'ADD_CLIENT', payload: clientJoinMessage });
                        dispatch({ type: 'ADD_CLIENT_JOIN_EVENT', payload: clientJoinMessage });
                        break;
                    case 3: // CLIENT_MOVE
                        const clientMoveMessage = ClientMoveMessageSchema.parse(data);
                        dispatch({ type: 'MOVE_CLIENT', payload: clientMoveMessage });
                        dispatch({ type: 'ADD_CLIENT_MOVE_EVENT', payload: clientMoveMessage });
                        break;
                    case 5: // SUB_NEW
                        const subNewMessage = SubscriptionNewMessageSchema.parse(data);
                        dispatch({ type: 'ADD_SUBSCRIPTION', payload: subNewMessage });
                        dispatch({ type: 'ADD_SUB_NEW_EVENT', payload: subNewMessage });
                        break;
                    case 8: // PUB
                        const pubMessage = PubMessageSchema.parse(data);
                        dispatch({ type: 'ADD_PUB_EVENT', payload: pubMessage });
                        break;
                    case 10: // DISSEMINATE
                        const disseminateMessage = DisseminationMessageSchema.parse(data);
                        dispatch({ type: 'ADD_DISSEMINATE_EVENT', payload: disseminateMessage });
                        break;
                }
            } catch (error) {
                console.error("Failed to handle message", error);
            }
        });
    };

    const value = useMemo(() => ({
        state,
        dispatch,
        addMatcher,
    }), [state]);

    return (
        <InspectorContext.Provider value={value}>
            {children}
        </InspectorContext.Provider>
    );
}