export default interface IChange {
    key: string;
    value: string;
    commit: IChangeCommit;
}
export interface IChangeCommit {
    nodeUrl: string;
    commit: boolean;
}
