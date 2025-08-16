export interface SmartAntsNode {
    title: string;
    symbol?: string;
}

export interface SmartAntsNodeCollection {
    [id: string]: SmartAntsNode;
}
