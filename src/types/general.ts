export interface feature {
    displayName: string;
    description: string;
    enabled: boolean;
}

export interface loaderData {
    mounted: boolean;
    mount: (languagesGlobalIn: Map<string, { color: string }>, featureSet?: Map<string, feature>) => void;
    unmount: () => void;
}
