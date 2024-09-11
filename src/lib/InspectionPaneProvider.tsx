import { createContext, useCallback, useContext, useState } from "react";
import { PubMessage } from "./messages";

export interface InspectionPaneController {
    currentPublicationInspection?: PubMessage;
    inspectPublication: (pub: PubMessage) => void;
    clear: () => void;
}

const InspectionPaneContext = createContext<InspectionPaneController | null>(null);

export function useInspectionPane() {
    const context = useContext(InspectionPaneContext);
    if (!context) {
        throw new Error("useInspectionPane must be used within an InspectionPaneProvider");
    }
    return context;
}

export function InspectionPaneProvider({
    children
}: {
    children: React.ReactNode
}) {
    const [currentPublicationInspection, setCurrentPublicationInspection] = useState<PubMessage>();

    const inspectPublication = useCallback((id: PubMessage) => {
        setCurrentPublicationInspection(id);
    }, []);

    const clear = useCallback(() => {
        setCurrentPublicationInspection(undefined);
    }, []);

    return (
        <InspectionPaneContext.Provider value={{
            currentPublicationInspection,
            inspectPublication,
            clear
        }}>
            {children}
        </InspectionPaneContext.Provider>
    );
}