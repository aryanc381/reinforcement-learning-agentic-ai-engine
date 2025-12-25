export interface ISTM {
    id: number;
    entity: "user" | "agent";
    payload: string;
}