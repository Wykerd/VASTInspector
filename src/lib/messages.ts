import { z } from 'zod';

export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export type Point = z.infer<typeof PointSchema>;

export const PolygonRegionSchema = z.object({
    isPolygon: z.literal(true),
    points: z.array(PointSchema),
});

export type PolygonRegion = z.infer<typeof PolygonRegionSchema>;

export const CircularRegionSchema = z.object({
    isPolygon: z.literal(false),
    center: PointSchema,
    radius: z.number(),
});

export const RegionSchema = z.union([PolygonRegionSchema, CircularRegionSchema]);

export type Region = z.infer<typeof RegionSchema>;

export const ClientSchema = z.object({
    id: z.string(),
    pos: PointSchema,
    matcherID: z.number(),
});

export type Client = z.infer<typeof ClientSchema>;

export const SubscriptionSchema = z.object({
    aoi: RegionSchema,
    channel: z.string(),
    clientID: z.string(),
    followClient: z.boolean(),
    subID: z.string(),
    hostID: z.number(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const PublicationSchema = z.object({
    aoi: RegionSchema,
    channel: z.string(),
    clientID: z.string(),
    matcherID: z.number(),
    pubID: z.string(),
    payload: z.unknown(),
});

export type Publication = z.infer<typeof PublicationSchema>;

export const InfoMessageSchema = z.object({
    id: z.number(),
    pos: PointSchema,
    alias: z.string(),
    aoi: RegionSchema,
    clientList: z.array(ClientSchema),
    subscriptions: z.array(SubscriptionSchema),
    time: z.coerce.date(),
})

export type InfoMessage = z.infer<typeof InfoMessageSchema>;

export const SubscriptionDeleteMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    sub: SubscriptionSchema,
});

export type SubscriptionDeleteMessage = z.infer<typeof SubscriptionDeleteMessageSchema>;

export const SubscriptionNewMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    sub: SubscriptionSchema,
});

export type SubscriptionNewMessage = z.infer<typeof SubscriptionNewMessageSchema>;

export const ClientLeaveMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    client: ClientSchema,
});

export type ClientLeaveMessage = z.infer<typeof ClientLeaveMessageSchema>;

export const ClientJoinMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    client: ClientSchema,
});

export type ClientJoinMessage = z.infer<typeof ClientJoinMessageSchema>;

export const ClientMoveMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    client: ClientSchema,
});

export type ClientMoveMessage = z.infer<typeof ClientMoveMessageSchema>;

export const PubMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    pub: PublicationSchema,
});

export type PubMessage = z.infer<typeof PubMessageSchema>;

export const DisseminationMessageSchema = z.object({
    id: z.number(),
    time: z.coerce.date(),
    sub: SubscriptionSchema,
});

export type DisseminationMessage = z.infer<typeof DisseminationMessageSchema>;

export type Message = InfoMessage | SubscriptionDeleteMessage | SubscriptionNewMessage | ClientLeaveMessage | ClientJoinMessage | ClientMoveMessage | PubMessage | DisseminationMessage;

export type TypedMessage = {
    type: 'info' | 'sub-delete' | 'sub-new' | 'client-leave' | 'client-join' | 'client-move' | 'pub' | 'dissemination'
} & Message;
